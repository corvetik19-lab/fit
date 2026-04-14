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
    } = await supabase.auth.getUser();

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

    const access = await readUserBillingAccessOrFallback(supabase, user.id, {
      email: user.email,
    });
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
    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.aiChat);

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

    const promptBuilder =
      recentMessages.length > 4 ? buildSportsDomainSystemPrompt : buildCompactSportsCoachPrompt;
    const result = await withTransientRetry(() =>
      generateText({
        maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
        model: models.chat,
        system: promptBuilder({
          allowWebSearch: false,
          context: userContext,
          knowledge: retrievedKnowledge,
        }),
        messages: toModelMessages(recentMessages),
      }),
    );

    const assistantMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "assistant",
      content: result.text,
    });

    await touchAiChatSession(supabase, user.id, session.id);

    return Response.json({
      data: {
        sessionId: session.id,
        sessionTitle: session.title,
        blocked: false,
        userMessage,
        assistantMessage,
        sources: retrievedKnowledge.map((item) => ({
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
