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
  buildSportsDomainSystemPrompt,
  detectAssistantGuardrail,
} from "@/lib/ai/domain-policy";
import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
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
import { getAiRuntimeContext } from "@/lib/ai/user-context";
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
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

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

function buildSafetyFallback() {
  return [
    "Я не помогаю с опасными или экстремальными схемами.",
    "Если вопрос касается жёсткого дефицита, обезвоживания, боли, резкого ухудшения самочувствия или других медицинских симптомов, лучше обратиться к врачу.",
    "Я могу помочь собрать более безопасный план по тренировкам, питанию и восстановлению.",
  ].join(" ");
}

function isAssistantProviderConfigurationFailure(error: unknown) {
  return isAiProviderConfigurationFailure(error);
}

function buildAssistantStreamErrorMessage(error: unknown) {
  return isAssistantProviderConfigurationFailure(error)
    ? "Сервис ИИ временно недоступен. Провайдер не активирован для ассистента и живых ответов."
    : "Сервис ИИ временно не ответил. Попробуй ещё раз немного позже.";
}

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
        return [
          `Поиск в интернете по запросу "${output.query}": ${output.results
            .slice(0, 4)
            .map((result) => `${result.title} (${result.url})`)
            .join("; ")}`,
        ];
      }

      if (part.type === "tool-listRecentProposals" && part.output) {
        const output = part.output as AssistantProposalListOutput;
        return [
          `Найдено AI-предложений: ${output.count}. ${output.items
            .slice(0, 4)
            .map((item) => `${item.title} [${item.proposalType}/${item.status}]`)
            .join(" | ")}`,
        ];
      }

      if (part.type === "tool-approveProposal" && part.output) {
        const output = part.output as AssistantProposalActionOutput;
        return [`${output.title}. Статус: ${output.status}. ${output.summary}`];
      }

      if (part.type === "tool-applyProposal" && part.output) {
        const output = part.output as AssistantProposalActionOutput;
        return [`${output.title}. Статус: ${output.status}. ${output.summary}`];
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
    applyLabel: "Добавить в питание",
    description: `Цель ${parsed.caloriesTarget} ккал, ${parsed.meals.length} приёмов пищи.`,
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
    applyLabel: "Добавить в тренировки",
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

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "Сервис ИИ временно недоступен. Контур ассистента ещё не настроен.",
      });
    }

    const body = assistantRequestSchema.parse(await request.json());
    const allowWebSearch = body.allowWebSearch ?? false;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Нужно войти в аккаунт, чтобы открыть ИИ-ассистента.",
      });
    }

    const access = await readUserBillingAccessOrFallback(supabase, user.id, {
      email: user.email,
    });
    const chatAccess = access.features[BILLING_FEATURE_KEYS.aiChat];
    const lastUserText = getLastUserText(body.messages);

    if (!chatAccess.allowed) {
      return createFeatureAccessDeniedResponse(chatAccess);
    }

    if (!lastUserText) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_ASSISTANT_EMPTY_MESSAGE",
        message: "Для ответа нужен текстовый запрос.",
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
    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.aiChat);

    const guardrail = detectAssistantGuardrail(lastUserText);

    if (guardrail) {
      await recordSafetyEvent(supabase, user.id, `blocked_${guardrail.kind}`, lastUserText, {
        sessionId: session.id,
      });

      const result = streamText({
        model: models.chat,
        onError: ({ error }) => {
          logger.warn("ai assistant stream failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
        system:
          "Ответь кратко, строго по-русски, без markdown, не раскрывай внутренние детали и не добавляй ничего сверх смысла сообщения.",
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
        model: models.chat,
        onError: ({ error }) => {
          logger.warn("ai assistant stream failed", {
            error,
            sessionId: session.id,
            userId: user.id,
          });
        },
        system: "Повтори ответ кратко и безопасно на русском языке, без лишних деталей.",
        prompt: buildSafetyFallback(),
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
      retrieveKnowledgeMatches(supabase, user.id, lastUserText, 8),
      getAiRuntimeContext(supabase, user.id).then((result) => result.context),
    ]);

    const tools = {
      createWorkoutPlan: tool({
        description: "Создать черновик недельной программы тренировок внутри приложения.",
        inputSchema: z.object({
          daysPerWeek: z.number().int().min(2).max(7).optional(),
          focus: z.string().min(2).max(240).optional(),
          goal: z.string().min(2).max(80).optional(),
        }),
        execute: async ({ daysPerWeek, focus, goal }) => {
          const feature = access.features[BILLING_FEATURE_KEYS.workoutPlan];

          if (!feature.allowed) {
            throw new Error(
              feature.reason ?? "План тренировок сейчас недоступен для текущего доступа.",
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
        description: "Создать черновик плана питания внутри приложения.",
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
              feature.reason ?? "План питания сейчас недоступен для текущего доступа.",
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
        description: "Показать последние AI-черновики и уже подтверждённые предложения.",
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
        description: "Подтвердить уже созданное AI-предложение.",
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
              feature.reason ?? "Это предложение сейчас недоступно для текущего доступа.",
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
            summary: "Черновик подтверждён и готов к применению.",
            title: approved.preview.title,
          };
        },
      }),
      applyProposal: tool({
        description: "Применить уже созданное AI-предложение в приложение.",
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
              feature.reason ?? "Это предложение сейчас недоступно для текущего доступа.",
            );
          }

          const applied = await applyAiPlanProposal(supabase, {
            userId: user.id,
            proposalId: target.id,
          });
          const summary =
            applied.proposal.proposal_type === "meal_plan"
              ? "План применён: шаблоны питания уже добавлены в приложение."
              : "План применён: создан новый недельный черновик тренировок.";

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
              description:
                "Найти свежую спортивную, нутриционную или восстановительную информацию в интернете и вернуть короткую подборку ссылок.",
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
      model: models.chat,
      messages: convertToModelMessages(body.messages),
      onError: ({ error }) => {
        logger.warn("ai assistant stream failed", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
      },
      stopWhen: stepCountIs(5),
      system: buildSportsDomainSystemPrompt({
        allowWebSearch,
        context,
        knowledge,
      }),
      tools,
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
        message: "Запрос к ассистенту заполнен некорректно.",
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
      status: isAssistantProviderConfigurationFailure(error) ? 503 : 502,
      code: isAssistantProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "AI_ASSISTANT_FAILED",
      message: buildAssistantStreamErrorMessage(error),
    });
  }
}
