import { generateText } from "ai";
import { z } from "zod";

import {
  type AiChatMessageRow,
  createAiChatMessage,
  ensureAiChatSession,
  isAiChatSessionError,
  listAiChatMessages,
  toModelMessages,
  touchAiChatSession,
} from "@/lib/ai/chat";
import {
  buildCompactSportsCoachPrompt,
  buildSportsDomainSystemPrompt,
  detectAssistantGuardrail,
} from "@/lib/ai/domain-policy";
import {
  AI_CHAT_INVALID_PAYLOAD_MESSAGE,
  AI_CHAT_NOT_CONFIGURED_MESSAGE,
  AI_CHAT_UNAUTHORIZED_MESSAGE,
  buildAiChatProviderErrorMessage,
  buildAiChatSafetyFallback,
} from "@/lib/ai/chat-runtime-copy";
import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { isExactLookupToken, tokenizeSearchQuery, type RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";
import { AI_CHAT_MAX_OUTPUT_TOKENS } from "@/lib/ai/runtime-budgets";
import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";
import { createEmptyAiUserContext, getAiRuntimeContext } from "@/lib/ai/user-context";
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
import {
  isTransientRuntimeError,
  withTimeout,
  withTransientRetry,
} from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

export const runtime = "nodejs";

const CHAT_CONTEXT_TIMEOUT_MS = 8_000;
const CHAT_KNOWLEDGE_TIMEOUT_MS = 6_000;
const CHAT_AI_TIMEOUT_MS = 9_000;

function buildSyntheticChatMessage(input: {
  content: string;
  role: "assistant" | "user";
  sessionId: string;
}): AiChatMessageRow {
  return {
    id: crypto.randomUUID(),
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
    created_at: new Date().toISOString(),
  };
}

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(2).max(2000),
});

async function loadChatContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  try {
    const result = await withTimeout(
      withTransientRetry(() => getAiRuntimeContext(supabase, userId)),
      CHAT_CONTEXT_TIMEOUT_MS,
      "ai chat runtime context",
    );

    return result.context;
  } catch (error) {
    logger.warn("ai chat is using fallback runtime context", {
      error,
      userId,
    });
    return createEmptyAiUserContext();
  }
}

async function loadChatKnowledge(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  message: string,
) {
  try {
    return await withTimeout(
      withTransientRetry(() => retrieveKnowledgeMatches(supabase, userId, message, 6)),
      CHAT_KNOWLEDGE_TIMEOUT_MS,
      "ai chat knowledge retrieval",
    );
  } catch (error) {
    logger.warn("ai chat is using fallback knowledge context", {
      error,
      userId,
    });
    return [];
  }
}

// Kept temporarily to avoid a large encoding-only rewrite of this file.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildDeterministicChatReply(input: {
  knowledge: Awaited<ReturnType<typeof loadChatKnowledge>>;
  message: string;
}) {
  const topKnowledge = input.knowledge[0];
  const intro =
    "Сейчас живой AI-ответ недоступен, поэтому я даю резервный разбор по сохранённому контексту и истории.";
  const focus = `Запрос: ${input.message.trim()}`;

  if (!topKnowledge) {
    return [
      intro,
      focus,
      "В контексте сейчас нет достаточно свежих персональных фактов. Попробуй уточнить цель, приложить фото еды или попросить собрать черновик плана.",
    ].join("\n\n");
  }

  const excerpt =
    topKnowledge.content.length > 220
      ? `${topKnowledge.content.slice(0, 220)}...`
      : topKnowledge.content;

  return [
    intro,
    focus,
    `Опираюсь на сохранённый факт (${topKnowledge.sourceType}): ${excerpt}`,
    "Если нужно, я могу продолжить с этим контекстом и собрать более конкретный черновик по питанию или тренировкам.",
  ].join("\n\n");
}

function buildDeterministicChatReplyClean(input: {
  knowledge: Awaited<ReturnType<typeof loadChatKnowledge>>;
  message: string;
}) {
  const topKnowledge = input.knowledge[0];
  const intro =
    "Сейчас живой AI-ответ недоступен, поэтому я даю резервный разбор по сохранённому контексту и истории.";
  const focus = `Запрос: ${input.message.trim()}`;

  if (!topKnowledge) {
    return [
      intro,
      focus,
      "В контексте сейчас нет достаточно свежих персональных фактов. Попробуй уточнить цель, приложить фото еды или попросить собрать черновик плана.",
    ].join("\n\n");
  }

  const excerpt =
    topKnowledge.content.length > 220
      ? `${topKnowledge.content.slice(0, 220)}...`
      : topKnowledge.content;

  return [
    intro,
    focus,
    `Опираюсь на сохранённый факт (${topKnowledge.sourceType}): ${excerpt}`,
    "Если нужно, я могу продолжить с этим контекстом и собрать более конкретный черновик по питанию или тренировкам.",
  ].join("\n\n");
}

function normalizeAssistantReply(content: string) {
  return content.replace(/\u0000/g, "").trim();
}

function isLikelyIncompleteAssistantReply(input: {
  content: string;
  finishReason?: string | null;
}) {
  const normalized = normalizeAssistantReply(input.content);

  if (!normalized) {
    return true;
  }

  const finishReason = (input.finishReason ?? "").toLowerCase();

  if (finishReason === "length") {
    return true;
  }

  if (normalized.length < 120) {
    return false;
  }

  const lastLine = normalized.split(/\r?\n/).at(-1)?.trim() ?? normalized;

  if (!lastLine) {
    return true;
  }

  if (/[,:;\-–—]$/.test(lastLine)) {
    return true;
  }

  if (/[.!?…)]$/.test(lastLine)) {
    return false;
  }

  if (/^(?:[-•]|\d+[.)])\s/.test(lastLine)) {
    return false;
  }

  return true;
}

async function ensureExactKnowledgeSources(input: {
  knowledge: RetrievedKnowledgeItem[];
  limit: number;
  message: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
}) {
  const lookupTokens = tokenizeSearchQuery(input.message).filter((token) =>
    isExactLookupToken(token),
  );

  if (!lookupTokens.length) {
    return input.knowledge;
  }

  const existingExactMatch = input.knowledge.some((item) => {
    const haystack = `${item.sourceType} ${item.sourceId ?? ""} ${item.content}`.toLowerCase();
    return lookupTokens.some((token) => haystack.includes(token));
  });

  if (existingExactMatch) {
    return input.knowledge;
  }

  try {
    const { data, error } = await input.supabase
      .from("user_memory_facts")
      .select("id, fact_type, content, created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      throw error;
    }

    const matchedFacts =
      (data ?? [])
        .filter((fact) =>
          lookupTokens.some((token) => fact.content.toLowerCase().includes(token)),
        )
        .map((fact) => ({
          id: fact.id,
          sourceType: "user_memory_fact",
          sourceId: fact.id,
          content: fact.content,
          metadata: {
            factType: fact.fact_type,
            createdAt: fact.created_at,
          },
          similarity: 999,
        })) satisfies RetrievedKnowledgeItem[];

    if (!matchedFacts.length) {
      return input.knowledge;
    }

    return [...matchedFacts, ...input.knowledge]
      .filter(
        (item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index,
      )
      .slice(0, input.limit);
  } catch (error) {
    logger.warn("ai chat exact lookup fallback failed", {
      error,
      userId: input.userId,
    });
    return input.knowledge;
  }
}

export async function POST(request: Request) {
  let fallbackMessage: string | null = null;

  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: AI_CHAT_NOT_CONFIGURED_MESSAGE,
      });
    }

    const body = chatRequestSchema.parse(await request.json());
    fallbackMessage = body.message;
    const supabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(supabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: AI_CHAT_UNAUTHORIZED_MESSAGE,
      });
    }

    const adminSupabase = createAdminSupabaseClient();

    if (!body.sessionId && hasRiskyIntent(body.message)) {
      return Response.json({
        data: {
          sessionId: null,
          sessionTitle: null,
          blocked: true,
          userMessage: null,
          assistantMessage: {
            id: crypto.randomUUID(),
            session_id: "",
            role: "assistant",
            content: buildAiChatSafetyFallback(),
            created_at: new Date().toISOString(),
          },
          sources: [],
        },
      });
    }

    let platformAdminRole = null;
    try {
      platformAdminRole = await readPlatformAdminRoleOrNull(adminSupabase, user.id);
    } catch (error) {
      logger.warn("ai chat admin role lookup skipped", {
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
    const feature = access.features[BILLING_FEATURE_KEYS.aiChat];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const session = await withTransientRetry(
      async () =>
        await ensureAiChatSession(
          adminSupabase,
          user.id,
          body.sessionId,
          body.message,
        ),
      {
        attempts: 4,
        delaysMs: [500, 1_500, 3_000],
      },
    );

    try {
      await withTransientRetry(
        async () => await touchAiChatSession(adminSupabase, user.id, session.id),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (error) {
      logger.warn("ai chat initial session touch skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
    }
    try {
      await withTransientRetry(
        async () =>
          await incrementFeatureUsage(adminSupabase, user.id, BILLING_FEATURE_KEYS.aiChat),
        {
          attempts: 3,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (error) {
      logger.warn("ai chat usage increment skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
    }

    let userMessage: AiChatMessageRow;
    let didPersistUserMessage = true;
    try {
      userMessage = await createAiChatMessage(adminSupabase, {
        userId: user.id,
        sessionId: session.id,
        role: "user",
        content: body.message,
      });
    } catch (error) {
      didPersistUserMessage = false;
      logger.warn("ai chat user message persistence skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
      userMessage = buildSyntheticChatMessage({
        sessionId: session.id,
        role: "user",
        content: body.message,
      });
    }

    if (hasRiskyIntent(body.message)) {
      const safeReply = buildAiChatSafetyFallback();
      let assistantMessage: AiChatMessageRow;
      try {
        assistantMessage = await createAiChatMessage(adminSupabase, {
          userId: user.id,
          sessionId: session.id,
          role: "assistant",
          content: safeReply,
        });
      } catch (error) {
        logger.warn("ai chat safety assistant persistence skipped", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
        assistantMessage = buildSyntheticChatMessage({
          sessionId: session.id,
          role: "assistant",
          content: safeReply,
        });
      }

      try {
        await withTransientRetry(
          async () =>
            await adminSupabase.from("ai_safety_events").insert({
              user_id: user.id,
              route_key: "ai_chat",
              action: "blocked_risky_prompt",
              prompt_excerpt: body.message.slice(0, 300),
              payload: {
                sessionId: session.id,
              },
            }),
          {
            attempts: 3,
            delaysMs: [500, 1_500, 3_000],
          },
        );
      } catch (error) {
        logger.warn("ai chat safety event persistence skipped", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
      }

      return Response.json({
        data: {
          sessionId: session.id,
          sessionTitle: session.title,
          blocked: true,
          userMessage,
          assistantMessage,
          sources: [],
        },
      });
    }

    const guardrail = detectAssistantGuardrail(body.message);

    if (guardrail) {
      let assistantMessage: AiChatMessageRow;
      try {
        assistantMessage = await createAiChatMessage(adminSupabase, {
          userId: user.id,
          sessionId: session.id,
          role: "assistant",
          content: guardrail.response,
        });
      } catch (error) {
        logger.warn("ai chat guardrail assistant persistence skipped", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
        assistantMessage = buildSyntheticChatMessage({
          sessionId: session.id,
          role: "assistant",
          content: guardrail.response,
        });
      }

      try {
        await withTransientRetry(
          async () =>
            await adminSupabase.from("ai_safety_events").insert({
              user_id: user.id,
              route_key: "ai_chat",
              action: guardrail.kind,
              prompt_excerpt: body.message.slice(0, 300),
              payload: {
                sessionId: session.id,
              },
            }),
          {
            attempts: 3,
            delaysMs: [500, 1_500, 3_000],
          },
        );
      } catch (error) {
        logger.warn("ai chat guardrail event persistence skipped", {
          error,
          sessionId: session.id,
          userId: user.id,
        });
      }

      return Response.json({
        data: {
          sessionId: session.id,
          sessionTitle: session.title,
          blocked: true,
          userMessage,
          assistantMessage,
          sources: [],
        },
      });
    }

    const [retrievedKnowledge, userContext, persistedRecentMessages] = await Promise.all([
      loadChatKnowledge(adminSupabase, user.id, body.message),
      loadChatContext(adminSupabase, user.id),
      listAiChatMessages(adminSupabase, user.id, session.id, 12),
    ]);
    const recentMessages = didPersistUserMessage
      ? persistedRecentMessages
      : [
          ...persistedRecentMessages,
          {
            id: userMessage.id,
            session_id: session.id,
            role: "user" as const,
            content: body.message,
            created_at: userMessage.created_at,
          },
        ];
    const finalKnowledge = await ensureExactKnowledgeSources({
      knowledge: retrievedKnowledge,
      limit: 6,
      message: body.message,
      supabase: adminSupabase,
      userId: user.id,
    });

    const promptBuilder =
      recentMessages.length > 4 ? buildSportsDomainSystemPrompt : buildCompactSportsCoachPrompt;
    let assistantContent: string;

    try {
      let generatedContent = "";
      let generationFinishReason: string | null = null;

      for (let attempt = 0; attempt < 1; attempt += 1) {
        const result = await withTimeout(
          withTransientRetry(() =>
            generateText({
              maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
              model: models.chat,
              system: promptBuilder({
                allowWebSearch: false,
                context: userContext,
                knowledge: finalKnowledge,
              }),
              messages: toModelMessages(recentMessages),
            }),
          ),
          CHAT_AI_TIMEOUT_MS,
          "ai chat generation",
        );

        generatedContent = normalizeAssistantReply(result.text);
        generationFinishReason = String(result.finishReason ?? "");

        if (
          !isLikelyIncompleteAssistantReply({
            content: generatedContent,
            finishReason: generationFinishReason,
          })
        ) {
          break;
        }

        logger.warn("ai chat received incomplete provider reply", {
          attempt: attempt + 1,
          finishReason: generationFinishReason,
          sessionId: session.id,
          userId: user.id,
        });

        if (attempt === 0) {
          throw new Error("AI_CHAT_INCOMPLETE_RESPONSE");
        }
      }

      assistantContent = generatedContent;
    } catch (error) {
      logger.warn("ai chat is using deterministic fallback reply", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
      assistantContent = buildDeterministicChatReplyClean({
        knowledge: finalKnowledge,
        message: body.message,
      });
    }

    let assistantMessage: AiChatMessageRow;
    try {
      assistantMessage = await createAiChatMessage(adminSupabase, {
        userId: user.id,
        sessionId: session.id,
        role: "assistant",
        content: assistantContent,
      });
    } catch (error) {
      logger.warn("ai chat assistant message persistence skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
      assistantMessage = buildSyntheticChatMessage({
        sessionId: session.id,
        role: "assistant",
        content: assistantContent,
      });
    }

    try {
      await withTransientRetry(
        async () => await touchAiChatSession(adminSupabase, user.id, session.id),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (error) {
      logger.warn("ai chat final session touch skipped", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
    }

    return Response.json({
      data: {
        sessionId: session.id,
        sessionTitle: session.title,
        blocked: false,
        userMessage,
        assistantMessage,
        sources: finalKnowledge.map((item) => ({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          similarity: Number(item.similarity.toFixed(4)),
          contentPreview:
            item.content.length > 220
              ? `${item.content.slice(0, 220)}...`
              : item.content,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_INVALID_PAYLOAD",
        message: AI_CHAT_INVALID_PAYLOAD_MESSAGE,
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

    logger.error("ai chat route failed", { error });

    if (fallbackMessage && isTransientRuntimeError(error)) {
      const fallbackContent = hasRiskyIntent(fallbackMessage)
        ? buildAiChatSafetyFallback()
        : buildDeterministicChatReplyClean({
            knowledge: [],
            message: fallbackMessage,
          });

      return Response.json({
        data: {
          sessionId: null,
          sessionTitle: null,
          blocked: hasRiskyIntent(fallbackMessage),
          userMessage: null,
          assistantMessage: buildSyntheticChatMessage({
            sessionId: "",
            role: "assistant",
            content: fallbackContent,
          }),
          sources: [],
        },
      });
    }

    return createApiErrorResponse({
      status: isAiProviderConfigurationFailure(error) ? 503 : 502,
      code: isAiProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "AI_CHAT_FAILED",
      message: buildAiChatProviderErrorMessage(error),
    });
  }
}
