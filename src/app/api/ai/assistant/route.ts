import {
  convertToModelMessages,
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
  AI_AGENT_INTENTS,
  AI_AGENT_SOURCE_ROUTES,
} from "@/lib/ai/agent-intents";
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
  readPlatformAdminRoleOrNull,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

export const runtime = "nodejs";
export const maxDuration = 30;

const ASSISTANT_CONTEXT_TIMEOUT_MS = 10_000;
const ASSISTANT_KNOWLEDGE_TIMEOUT_MS = 8_000;

const assistantRequestSchema = z.object({
  allowWebSearch: z.boolean().optional(),
  contextPayload: z.record(z.string(), z.string()).optional(),
  intent: z.enum(AI_AGENT_INTENTS).optional(),
  messages: z.array(z.custom<UIMessage>()),
  sessionId: z.string().uuid().optional(),
  sourceRoute: z.enum(AI_AGENT_SOURCE_ROUTES).optional(),
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
  return /(plan|proposal|approve|apply|draft|meal plan|workout plan|recent proposals|рацион|план|черновик|подтвер|примен|питани|трениров|составь\s+план|покажи\s+черновик|последние\s+предложения)/i.test(
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
    const user = await readServerUserOrNull(supabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: AI_ASSISTANT_UNAUTHORIZED_MESSAGE,
      });
    }

    let platformAdminRole = null;
    try {
      platformAdminRole = await readPlatformAdminRoleOrNull(
        createAdminSupabaseClient(),
        user.id,
      );
    } catch (error) {
      logger.warn("ai assistant admin role lookup skipped", {
        error,
        userId: user.id,
      });
    }

    const access = await withTransientRetry(
      async () =>
        await readUserBillingAccessOrFallback(supabase, user.id, {
          email: user.email,
          role: platformAdminRole,
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
    try {
      await withTransientRetry(
        async () =>
          await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.aiChat),
        {
          attempts: 3,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (error) {
      logger.warn("ai assistant usage increment skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
    }

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
      const result = streamText({
        maxOutputTokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
        model: models.chat,
        messages: convertToModelMessages(body.messages),
        onError: ({ error }) => {
          logger.warn("ai assistant compact stream failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
        system: buildCompactSportsCoachPrompt({
          allowWebSearch: false,
          context,
          knowledge,
        }),
      });

      result.consumeStream({
        onError: (error) => {
          logger.warn("ai assistant compact stream consumption failed", {
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
