import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  createAiChatMessage,
  ensureAiChatSession,
  isAiChatSessionError,
  touchAiChatSession,
} from "@/lib/ai/chat";
import {
  AI_ASSISTANT_EMPTY_MESSAGE,
  AI_ASSISTANT_GUARDRAIL_STREAM_SYSTEM,
  AI_ASSISTANT_INVALID_PAYLOAD_MESSAGE,
  AI_ASSISTANT_NOT_CONFIGURED_MESSAGE,
  AI_ASSISTANT_RISKY_STREAM_SYSTEM,
  AI_ASSISTANT_TOOL_DESCRIPTIONS,
  AI_ASSISTANT_UNAUTHORIZED_MESSAGE,
  buildAssistantAppliedProposalSummary,
  buildAssistantApprovedProposalSummary,
  buildAssistantFeatureUnavailableMessage,
  buildAssistantMealPlanApplyLabel,
  buildAssistantMealPlanDescription,
  buildAssistantProposalActionSummary,
  buildAssistantProposalListSummary,
  buildAssistantSafetyFallback,
  buildAssistantSearchWebSummary,
  buildAssistantStreamErrorMessage,
  buildAssistantWorkoutPlanApplyLabel,
} from "@/lib/ai/assistant-runtime-copy";
import {
  buildCompactSportsCoachPrompt,
  buildSportsDomainSystemPrompt,
  detectAssistantGuardrail,
} from "@/lib/ai/domain-policy";
import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { AI_ASSISTANT_MAX_OUTPUT_TOKENS } from "@/lib/ai/runtime-budgets";
import {
  applyAiPlanProposal,
  approveAiPlanProposal,
  listAiPlanProposalPreviews,
  resolveAiPlanProposalTarget,
} from "@/lib/ai/proposal-actions";
import {
  generateMealPlanProposalForUser,
  generateWorkoutPlanProposalForUser,
} from "@/lib/ai/plan-generation";
import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import { createEmptyAiUserContext, getAiRuntimeContext } from "@/lib/ai/user-context";
import { searchWebSnippets } from "@/lib/ai/web-search";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const ASSISTANT_CONTEXT_TIMEOUT_MS = 10_000;
const ASSISTANT_KNOWLEDGE_TIMEOUT_MS = 8_000;
const ASSISTANT_AI_TIMEOUT_MS = 18_000;

const assistantRequestSchema = z.object({
  allowWebSearch: z.boolean().optional(),
  messages: z.array(z.custom<UIMessage>()),
  sessionId: z.string().uuid().optional(),
});

type AssistantProposalOutput = {
  applyLabel: string;
  description: string;
  highlights: string[];
  proposalId: string;
  proposalType: "meal_plan" | "workout_plan";
  title: string;
};

type AssistantProposalListOutput = {
  count: number;
  items: Array<{
    createdAt: string;
    proposalId: string;
    proposalType: "meal_plan" | "workout_plan";
    requestSummary: string;
    status: string;
    timeline: string;
    title: string;
    updatedAt: string;
  }>;
};

type AssistantProposalActionOutput = {
  proposalId: string;
  proposalType: "meal_plan" | "workout_plan";
  status: string;
  summary: string;
  title: string;
};

function getLastUserText(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!lastUserMessage) {
    return "";
  }

  return lastUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function flattenUiMessageText(message: UIMessage) {
  return message.parts
    .flatMap((part) => {
      if (part.type === "text") {
        return [part.text.trim()];
      }

      if (part.type === "tool-createWorkoutPlan" && part.output) {
        const output = part.output as AssistantProposalOutput;
        return [`${output.title}. ${output.description}. ${output.highlights.join(" | ")}`.trim()];
      }

      if (part.type === "tool-createMealPlan" && part.output) {
        const output = part.output as AssistantProposalOutput;
        return [`${output.title}. ${output.description}. ${output.highlights.join(" | ")}`.trim()];
      }

      if (part.type === "tool-searchWeb" && part.output) {
        const output = part.output as {
          query: string;
          results: Array<{ title: string; url: string }>;
        };
        return [buildAssistantSearchWebSummary(output)];
      }

      if (part.type === "tool-listRecentProposals" && part.output) {
        const output = part.output as AssistantProposalListOutput;
        return [buildAssistantProposalListSummary(output)];
      }

      if (part.type === "tool-approveProposal" && part.output) {
        const output = part.output as AssistantProposalActionOutput;
        return [buildAssistantProposalActionSummary(output)];
      }

      if (part.type === "tool-applyProposal" && part.output) {
        const output = part.output as AssistantProposalActionOutput;
        return [buildAssistantProposalActionSummary(output)];
      }

      return [];
    })
    .filter((chunk) => chunk.length > 0)
    .join("\n\n");
}

async function recordSafetyEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  action: string,
  prompt: string,
  payload: Record<string, unknown>,
) {
  await supabase.from("ai_safety_events").insert({
    user_id: userId,
    route_key: "ai_assistant",
    action,
    prompt_excerpt: prompt.slice(0, 300),
    payload,
  });
}

function toMealProposalToolResult(proposal: {
  id: string;
  payload: Record<string, unknown>;
}) {
  const parsed = mealPlanSchema.parse((proposal.payload as { proposal?: unknown }).proposal);

  return {
    applyLabel: buildAssistantMealPlanApplyLabel(),
    description: buildAssistantMealPlanDescription({
      caloriesTarget: parsed.caloriesTarget,
      mealsCount: parsed.meals.length,
    }),
    highlights: parsed.meals.map((meal) => `${meal.name}: ${meal.kcal} ккал`),
    proposalId: proposal.id,
    proposalType: "meal_plan" as const,
    title: parsed.title,
  };
}

function toWorkoutProposalToolResult(proposal: {
  id: string;
  payload: Record<string, unknown>;
}) {
  const parsed = workoutPlanSchema.parse((proposal.payload as { proposal?: unknown }).proposal);

  return {
    applyLabel: buildAssistantWorkoutPlanApplyLabel(),
    description: parsed.summary,
    highlights: parsed.days.map((day) => `${day.day}: ${day.focus}`),
    proposalId: proposal.id,
    proposalType: "workout_plan" as const,
    title: parsed.title,
  };
}

async function persistAssistantReply(input: {
  responseMessage: UIMessage;
  sessionId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
}) {
  const content = flattenUiMessageText(input.responseMessage);

  if (!content.trim()) {
    return;
  }

  await createAiChatMessage(input.supabase, {
    userId: input.userId,
    sessionId: input.sessionId,
    role: "assistant",
    content,
  });

  await touchAiChatSession(input.supabase, input.userId, input.sessionId);
}

function shouldUseAssistantTools(message: string, allowWebSearch: boolean) {
  if (allowWebSearch) {
    return true;
  }

  // Tool mode is needed only for explicit plan/proposal actions. Generic
  // coaching questions should stay on the compact prompt so the assistant
  // responds faster and does not burn the output budget on unnecessary
  // tool orchestration.
  return /(plan|proposal|approve|apply|draft|meal plan|workout plan|recent proposals|рацион|план|черновик|подтвер|примен|составь\s+план|покажи\s+черновик|последние\s+предложения)/i.test(
    message,
  );
}

async function loadAssistantContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  try {
    const result = await withTimeout(
      withTransientRetry(() => getAiRuntimeContext(supabase, userId)),
      ASSISTANT_CONTEXT_TIMEOUT_MS,
      "ai assistant runtime context",
    );

    return result.context;
  } catch (error) {
    logger.warn("ai assistant is using fallback runtime context", {
      error,
      userId,
    });
    return createEmptyAiUserContext();
  }
}

async function loadAssistantKnowledge(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  message: string,
) {
  try {
    return await withTimeout(
      withTransientRetry(() => retrieveKnowledgeMatches(supabase, userId, message, 6)),
      ASSISTANT_KNOWLEDGE_TIMEOUT_MS,
      "ai assistant knowledge retrieval",
    );
  } catch (error) {
    logger.warn("ai assistant is using fallback knowledge context", {
      error,
      userId,
    });
    return [];
  }
}

function roundDelta(value: number) {
  return Math.round(Math.abs(value));
}

function buildDeterministicAssistantReply(input: {
  context: Awaited<ReturnType<typeof loadAssistantContext>>;
  fallbackReason: "provider" | "timeout" | "runtime";
  knowledge: Awaited<ReturnType<typeof loadAssistantKnowledge>>;
}) {
  const { context, fallbackReason, knowledge } = input;
  const avgKcal = context.nutritionInsights.avgKcalLast7;
  const kcalTarget = context.nutritionTargets.kcalTarget;
  const avgProtein = context.nutritionInsights.avgProteinLast7;
  const proteinTarget = context.nutritionTargets.proteinTarget;
  const completedDays = context.workoutInsights.completedDaysLast28;
  const hardSetShare = context.workoutInsights.hardSetShareLast28;

  const intro =
    fallbackReason === "provider"
      ? "Сейчас живой AI-провайдер отвечает нестабильно, поэтому я даю резервный разбор по твоим текущим данным."
      : fallbackReason === "timeout"
        ? "Сейчас живой ответ ассистента занял слишком много времени, поэтому я даю резервный разбор по твоим текущим данным."
        : "Сейчас я даю резервный разбор по сохранённым данным профиля, питания и тренировок.";

  const findings: string[] = [];

  if (typeof avgKcal === "number" && typeof kcalTarget === "number") {
    const kcalGap = kcalTarget - avgKcal;
    if (Math.abs(kcalGap) >= 250) {
      findings.push(
        kcalGap > 0
          ? `По питанию есть недобор примерно ${roundDelta(kcalGap)} ккал в день относительно цели.`
          : `По питанию есть перебор примерно ${roundDelta(kcalGap)} ккал в день относительно цели.`,
      );
    }
  }

  if (typeof avgProtein === "number" && typeof proteinTarget === "number") {
    const proteinGap = proteinTarget - avgProtein;
    if (Math.abs(proteinGap) >= 15) {
      findings.push(
        proteinGap > 0
          ? `Белок отстаёт от цели примерно на ${roundDelta(proteinGap)} г в день.`
          : `Белок выше цели примерно на ${roundDelta(proteinGap)} г в день.`,
      );
    }
  }

  if (typeof completedDays === "number" && completedDays <= 2) {
    findings.push("Тренировочный объём за последние недели выглядит заниженным, поэтому важно сначала стабилизировать режим, а не резко добавлять нагрузку.");
  } else if (typeof hardSetShare === "number" && hardSetShare >= 0.45) {
    findings.push("Доля тяжёлых сетов высокая, поэтому восстановление сейчас важнее, чем попытка форсировать прогресс.");
  }

  const summary =
    findings[0] ??
    "По текущим данным я не вижу основания резко менять программу, поэтому лучший ход — стабилизировать питание, сон и тренировочный ритм.";

  const steps: string[] = [];

  if (typeof kcalTarget === "number" && typeof proteinTarget === "number") {
    steps.push(
      `1. На ближайшую неделю держи ориентир около ${Math.round(kcalTarget)} ккал и не опускай белок ниже ${Math.round(proteinTarget)} г в сутки.`,
    );
  } else {
    steps.push(
      "1. На ближайшую неделю выровняй режим: регулярное питание, вода, сон и без резких ограничений по калориям.",
    );
  }

  steps.push(
    "2. Оставь рабочий тренировочный объём стабильным: без отказных подходов подряд и с как минимум 1-2 полноценными днями восстановления.",
  );

  if (knowledge.length > 0) {
    steps.push(
      "3. Я вижу личную историю в контексте, поэтому дальше лучше опираться на неё: можно попросить меня собрать конкретный план тренировки или питания и вынести его на подтверждение.",
    );
  } else {
    steps.push(
      "3. Если хочешь, я могу сразу собрать черновик плана тренировок или питания и вынести его на подтверждение внутри приложения.",
    );
  }

  return [intro, summary, steps.join("\n")].join("\n\n");
}

async function generateCompactAssistantReply(input: {
  context: Awaited<ReturnType<typeof loadAssistantContext>>;
  knowledge: Awaited<ReturnType<typeof loadAssistantKnowledge>>;
  messages: UIMessage[];
  sessionId: string;
  userId: string;
}) {
  const { context, knowledge, messages, sessionId, userId } = input;

  try {
    const result = await withTimeout(
      withTransientRetry(() =>
        generateText({
          maxOutputTokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
          model: models.chat,
          messages: convertToModelMessages(messages),
          system: buildCompactSportsCoachPrompt({
            allowWebSearch: false,
            context,
            knowledge,
          }),
        }),
      ),
      ASSISTANT_AI_TIMEOUT_MS,
      "ai assistant compact generation",
    );

    const text = result.text.trim();

    if (text.length >= 60) {
      return text;
    }

    logger.warn("ai assistant is using deterministic fallback after short reply", {
      responseLength: text.length,
      sessionId,
      userId,
    });

    return buildDeterministicAssistantReply({
      context,
      fallbackReason: "runtime",
      knowledge,
    });
  } catch (error) {
    logger.warn("ai assistant is using deterministic fallback", {
      error,
      sessionId,
      userId,
    });

    return buildDeterministicAssistantReply({
      context,
      fallbackReason: isAiProviderConfigurationFailure(error) ? "provider" : "timeout",
      knowledge,
    });
  }
}

function createStaticAssistantStreamResponse(input: {
  messages: UIMessage[];
  sessionId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  text: string;
  userId: string;
}) {
  const { messages, sessionId, supabase, text, userId } = input;

  const stream = createUIMessageStream({
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      await persistAssistantReply({
        responseMessage,
        sessionId,
        supabase,
        userId,
      });
    },
    execute: ({ writer }) => {
      writer.write({
        type: "start",
        messageId: crypto.randomUUID(),
      });
      writer.write({ type: "start-step" });
      writer.write({
        type: "text-start",
        id: "txt-0",
      });
      writer.write({
        type: "text-delta",
        id: "txt-0",
        delta: text,
      });
      writer.write({
        type: "text-end",
        id: "txt-0",
      });
      writer.write({ type: "finish-step" });
      writer.write({
        type: "finish",
        finishReason: "stop",
      });
    },
    onError: (error) => buildAssistantStreamErrorMessage(error),
    generateId: () => crypto.randomUUID(),
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: AI_ASSISTANT_NOT_CONFIGURED_MESSAGE,
      });
    }

    const body = assistantRequestSchema.parse(await request.json());
    const allowWebSearch = body.allowWebSearch ?? false;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withTransientRetry(async () => await supabase.auth.getUser(), {
      attempts: 4,
      delaysMs: [500, 1_500, 3_000, 5_000],
    });

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: AI_ASSISTANT_UNAUTHORIZED_MESSAGE,
      });
    }

    const access = await withTransientRetry(
      async () =>
        await readUserBillingAccessOrFallback(supabase, user.id, {
          email: user.email,
        }),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
    const chatAccess = access.features[BILLING_FEATURE_KEYS.aiChat];
    const lastUserText = getLastUserText(body.messages);

    if (!chatAccess.allowed) {
      return createFeatureAccessDeniedResponse(chatAccess);
    }

    if (!lastUserText) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_ASSISTANT_EMPTY_MESSAGE",
        message: AI_ASSISTANT_EMPTY_MESSAGE,
      });
    }

    const session = await ensureAiChatSession(supabase, user.id, body.sessionId, lastUserText);

    await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "user",
      content: lastUserText,
    });
    await touchAiChatSession(supabase, user.id, session.id);
    await withTransientRetry(
      async () =>
        await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.aiChat),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );

    const guardrail = detectAssistantGuardrail(lastUserText);

    if (guardrail) {
      await recordSafetyEvent(supabase, user.id, `blocked_${guardrail.kind}`, lastUserText, {
        sessionId: session.id,
      });

      const result = streamText({
        maxOutputTokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
        model: models.chat,
        onError: ({ error }) => {
          logger.warn("ai assistant stream failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
        system: AI_ASSISTANT_GUARDRAIL_STREAM_SYSTEM,
        prompt: guardrail.response,
      });

      result.consumeStream({
        onError: (error) => {
          logger.warn("ai assistant stream consumption failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
      });

      return result.toUIMessageStreamResponse({
        generateMessageId: () => crypto.randomUUID(),
        onError: (error) => buildAssistantStreamErrorMessage(error),
        onFinish: async ({ responseMessage }) => {
          await persistAssistantReply({
            responseMessage,
            sessionId: session.id,
            supabase,
            userId: user.id,
          });
        },
        originalMessages: body.messages,
      });
    }

    if (hasRiskyIntent(lastUserText)) {
      await recordSafetyEvent(supabase, user.id, "blocked_risky_prompt", lastUserText, {
        sessionId: session.id,
      });

      const result = streamText({
        maxOutputTokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
        model: models.chat,
        onError: ({ error }) => {
          logger.warn("ai assistant stream failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
        system: AI_ASSISTANT_RISKY_STREAM_SYSTEM,
        prompt: buildAssistantSafetyFallback(),
      });

      result.consumeStream({
        onError: (error) => {
          logger.warn("ai assistant stream consumption failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
      });

      return result.toUIMessageStreamResponse({
        generateMessageId: () => crypto.randomUUID(),
        onError: (error) => buildAssistantStreamErrorMessage(error),
        onFinish: async ({ responseMessage }) => {
          await persistAssistantReply({
            responseMessage,
            sessionId: session.id,
            supabase,
            userId: user.id,
          });
        },
        originalMessages: body.messages,
      });
    }

    const [knowledge, context] = await Promise.all([
      loadAssistantKnowledge(supabase, user.id, lastUserText),
      loadAssistantContext(supabase, user.id),
    ]);
    const useAssistantTools = shouldUseAssistantTools(lastUserText, allowWebSearch);

    if (!useAssistantTools) {
      const assistantText = await generateCompactAssistantReply({
        context,
        knowledge,
        messages: body.messages,
        sessionId: session.id,
        userId: user.id,
      });

      return createStaticAssistantStreamResponse({
        messages: body.messages,
        sessionId: session.id,
        supabase,
        text: assistantText,
        userId: user.id,
      });
    }

    const tools = {
      createWorkoutPlan: tool({
        description: AI_ASSISTANT_TOOL_DESCRIPTIONS.createWorkoutPlan,
        inputSchema: z.object({
          daysPerWeek: z.number().int().min(2).max(7).optional(),
          focus: z.string().min(2).max(240).optional(),
          goal: z.string().min(2).max(80).optional(),
        }),
        execute: async ({ daysPerWeek, focus, goal }) => {
          const feature = access.features[BILLING_FEATURE_KEYS.workoutPlan];

          if (!feature.allowed) {
            throw new Error(
              feature.reason ?? buildAssistantFeatureUnavailableMessage("workout"),
            );
          }

          const proposal = await generateWorkoutPlanProposalForUser(supabase, user.id, {
            goal: goal ?? null,
            daysPerWeek: daysPerWeek ?? null,
            focus: focus ?? null,
          });

          await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.workoutPlan);

          return toWorkoutProposalToolResult(proposal);
        },
      }),
      createMealPlan: tool({
        description: AI_ASSISTANT_TOOL_DESCRIPTIONS.createMealPlan,
        inputSchema: z.object({
          dietaryNotes: z.string().min(2).max(280).optional(),
          goal: z.string().min(2).max(80).optional(),
          kcalTarget: z.number().int().min(1000).max(6000).optional(),
          mealsPerDay: z.number().int().min(2).max(8).optional(),
        }),
        execute: async ({ dietaryNotes, goal, kcalTarget, mealsPerDay }) => {
          const feature = access.features[BILLING_FEATURE_KEYS.mealPlan];

          if (!feature.allowed) {
            throw new Error(
              feature.reason ?? buildAssistantFeatureUnavailableMessage("meal"),
            );
          }

          const proposal = await generateMealPlanProposalForUser(supabase, user.id, {
            goal: goal ?? null,
            kcalTarget: kcalTarget ?? null,
            dietaryNotes,
            mealsPerDay: mealsPerDay ?? null,
          });

          await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.mealPlan);

          return toMealProposalToolResult(proposal);
        },
      }),
      listRecentProposals: tool({
        description: AI_ASSISTANT_TOOL_DESCRIPTIONS.listRecentProposals,
        inputSchema: z.object({
          limit: z.number().int().min(1).max(8).optional(),
          proposalType: z.enum(["meal_plan", "workout_plan"]).optional(),
          status: z.enum(["draft", "approved", "applied"]).optional(),
        }),
        execute: async ({ limit, proposalType, status }) => {
          const items = await listAiPlanProposalPreviews(supabase, user.id, {
            limit: limit ?? 5,
            proposalType,
            status,
          });

          return {
            count: items.length,
            items,
          };
        },
      }),
      approveProposal: tool({
        description: AI_ASSISTANT_TOOL_DESCRIPTIONS.approveProposal,
        inputSchema: z.object({
          proposalId: z.string().uuid().optional(),
          proposalType: z.enum(["meal_plan", "workout_plan"]).optional(),
        }),
        execute: async ({ proposalId, proposalType }) => {
          const target = await resolveAiPlanProposalTarget(supabase, {
            userId: user.id,
            proposalId,
            proposalType,
          });
          const featureKey =
            target.proposal_type === "meal_plan"
              ? BILLING_FEATURE_KEYS.mealPlan
              : BILLING_FEATURE_KEYS.workoutPlan;
          const feature = access.features[featureKey];

          if (!feature.allowed) {
            throw new Error(
              feature.reason ?? buildAssistantFeatureUnavailableMessage("proposal"),
            );
          }

          const approved = await approveAiPlanProposal(supabase, {
            userId: user.id,
            proposalId: target.id,
          });

          return {
            proposalId: approved.proposal.id,
            proposalType: approved.proposal.proposal_type,
            status: approved.proposal.status,
            summary: buildAssistantApprovedProposalSummary(),
            title: approved.preview.title,
          };
        },
      }),
      applyProposal: tool({
        description: AI_ASSISTANT_TOOL_DESCRIPTIONS.applyProposal,
        inputSchema: z.object({
          proposalId: z.string().uuid().optional(),
          proposalType: z.enum(["meal_plan", "workout_plan"]).optional(),
        }),
        execute: async ({ proposalId, proposalType }) => {
          const target = await resolveAiPlanProposalTarget(supabase, {
            userId: user.id,
            proposalId,
            proposalType,
          });
          const featureKey =
            target.proposal_type === "meal_plan"
              ? BILLING_FEATURE_KEYS.mealPlan
              : BILLING_FEATURE_KEYS.workoutPlan;
          const feature = access.features[featureKey];

          if (!feature.allowed) {
            throw new Error(
              feature.reason ?? buildAssistantFeatureUnavailableMessage("proposal"),
            );
          }

          const applied = await applyAiPlanProposal(supabase, {
            userId: user.id,
            proposalId: target.id,
          });
          const summary = buildAssistantAppliedProposalSummary(
            applied.proposal.proposal_type,
          );

          return {
            proposalId: applied.proposal.id,
            proposalType: applied.proposal.proposal_type,
            status: applied.proposal.status,
            summary,
            title: applied.preview.title,
          };
        },
      }),
      ...(allowWebSearch
        ? {
            searchWeb: tool({
              description: AI_ASSISTANT_TOOL_DESCRIPTIONS.searchWeb,
              inputSchema: z.object({
                query: z.string().min(2).max(200),
              }),
              execute: async ({ query }) => {
                const results = await searchWebSnippets(query);

                return {
                  query,
                  results,
                };
              },
            }),
          }
        : {}),
    };

    const result = streamText({
      maxOutputTokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
      model: models.chat,
      messages: convertToModelMessages(body.messages),
      onError: ({ error }) => {
        logger.warn("ai assistant stream failed", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
      },
      ...(useAssistantTools
        ? {
            stopWhen: stepCountIs(5),
            system: buildSportsDomainSystemPrompt({
              allowWebSearch,
              context,
              knowledge,
            }),
            tools,
          }
        : {
            system: buildCompactSportsCoachPrompt({
              allowWebSearch,
              context,
              knowledge,
            }),
          }),
    });

    result.consumeStream({
      onError: (error) => {
        logger.warn("ai assistant stream consumption failed", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
      },
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: () => crypto.randomUUID(),
      onError: (error) => buildAssistantStreamErrorMessage(error),
      onFinish: async ({ responseMessage }) => {
        await persistAssistantReply({
          responseMessage,
          sessionId: session.id,
          supabase,
          userId: user.id,
        });
      },
      originalMessages: body.messages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_ASSISTANT_INVALID_PAYLOAD",
        message: AI_ASSISTANT_INVALID_PAYLOAD_MESSAGE,
        details: error.flatten(),
      });
    }

    if (isAiChatSessionError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    logger.error("ai assistant route failed", { error });

    return createApiErrorResponse({
      status: isAiProviderConfigurationFailure(error) ? 503 : 502,
      code: isAiProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "AI_ASSISTANT_FAILED",
      message: buildAssistantStreamErrorMessage(error),
    });
  }
}
