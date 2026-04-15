import { generateText } from "ai";
import { z } from "zod";

import {
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
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CHAT_CONTEXT_TIMEOUT_MS = 10_000;
const CHAT_KNOWLEDGE_TIMEOUT_MS = 8_000;
const CHAT_AI_TIMEOUT_MS = 12_000;

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
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: AI_CHAT_NOT_CONFIGURED_MESSAGE,
      });
    }

    const body = chatRequestSchema.parse(await request.json());
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
        message: AI_CHAT_UNAUTHORIZED_MESSAGE,
      });
    }

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
    const feature = access.features[BILLING_FEATURE_KEYS.aiChat];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const session = await ensureAiChatSession(
      supabase,
      user.id,
      body.sessionId,
      body.message,
    );

    await touchAiChatSession(supabase, user.id, session.id);
    await withTransientRetry(
      async () =>
        await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.aiChat),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );

    const userMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "user",
      content: body.message,
    });

    if (hasRiskyIntent(body.message)) {
      const safeReply = buildAiChatSafetyFallback();
      const assistantMessage = await createAiChatMessage(supabase, {
        userId: user.id,
        sessionId: session.id,
        role: "assistant",
        content: safeReply,
      });

      await supabase.from("ai_safety_events").insert({
        user_id: user.id,
        route_key: "ai_chat",
        action: "blocked_risky_prompt",
        prompt_excerpt: body.message.slice(0, 300),
        payload: {
          sessionId: session.id,
        },
      });

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
      const assistantMessage = await createAiChatMessage(supabase, {
        userId: user.id,
        sessionId: session.id,
        role: "assistant",
        content: guardrail.response,
      });

      await supabase.from("ai_safety_events").insert({
        user_id: user.id,
        route_key: "ai_chat",
        action: guardrail.kind,
        prompt_excerpt: body.message.slice(0, 300),
        payload: {
          sessionId: session.id,
        },
      });

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

    const [retrievedKnowledge, userContext, recentMessages] = await Promise.all([
      loadChatKnowledge(supabase, user.id, body.message),
      loadChatContext(supabase, user.id),
      listAiChatMessages(supabase, user.id, session.id, 12),
    ]);
    const finalKnowledge = await ensureExactKnowledgeSources({
      knowledge: retrievedKnowledge,
      limit: 6,
      message: body.message,
      supabase,
      userId: user.id,
    });

    const promptBuilder =
      recentMessages.length > 4 ? buildSportsDomainSystemPrompt : buildCompactSportsCoachPrompt;
    let assistantContent: string;

    try {
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
      assistantContent = result.text;
    } catch (error) {
      logger.warn("ai chat is using deterministic fallback reply", {
        error,
        sessionId: session.id,
        userId: user.id,
      });
      assistantContent = buildDeterministicChatReply({
        knowledge: finalKnowledge,
        message: body.message,
      });
    }

    const assistantMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "assistant",
      content: assistantContent,
    });

    await touchAiChatSession(supabase, user.id, session.id);

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

    return createApiErrorResponse({
      status: isAiProviderConfigurationFailure(error) ? 503 : 502,
      code: isAiProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "AI_CHAT_FAILED",
      message: buildAiChatProviderErrorMessage(error),
    });
  }
}
