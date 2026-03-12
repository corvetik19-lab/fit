import { generateText } from "ai";
import { z } from "zod";

import {
  createAiChatMessage,
  ensureAiChatSession,
  listAiChatMessages,
  toModelMessages,
  touchAiChatSession,
} from "@/lib/ai/chat";
import {
  buildSportsDomainSystemPrompt,
  detectAssistantGuardrail,
} from "@/lib/ai/domain-policy";
import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccess,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(2).max(2000),
});

function buildSafetyFallback() {
  return [
    "Я не помогаю с опасными или экстремальными рекомендациями.",
    "Если вопрос касается сильного дефицита, обезвоживания, выраженной боли или медицинских симптомов, безопаснее получить очную консультацию врача.",
    "Я могу помочь только с более безопасным и реалистичным планом по тренировкам, питанию и восстановлению.",
  ].join(" ");
}

function stringifyAiError(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function buildProviderErrorMessage(error: unknown) {
  const normalized = stringifyAiError(error).toLowerCase();

  if (
    normalized.includes("credit card") ||
    normalized.includes("customer_verification_required") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("payment required") ||
    normalized.includes("quota")
  ) {
    return "AI-чат временно недоступен: внешний AI-провайдер еще не активирован для live-запросов. История и профиль пользователя сохранены, но ответ сейчас сгенерировать нельзя.";
  }

  return "Не удалось получить ответ AI-чата.";
}

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "AI runtime не настроен для AI-чата.",
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
        message: "Нужно войти в аккаунт, чтобы открыть AI-чат.",
      });
    }

    const access = await readUserBillingAccess(supabase, user.id, {
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
      const safeReply = buildSafetyFallback();
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

    const [retrievedKnowledge, userContext] = await Promise.all([
      retrieveKnowledgeMatches(supabase, user.id, body.message, 6),
      getAiRuntimeContext(supabase, user.id).then((result) => result.context),
    ]);
    const recentMessages = await listAiChatMessages(
      supabase,
      user.id,
      session.id,
      12,
    );

    const result = await generateText({
      model: models.chat,
      system: buildSportsDomainSystemPrompt({
        allowWebSearch: false,
        context: userContext,
        knowledge: retrievedKnowledge,
      }),
      messages: toModelMessages(recentMessages),
    });

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
    logger.error("ai chat route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_INVALID_PAYLOAD",
        message: "Запрос к AI-чату заполнен некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 502,
      code: "AI_CHAT_FAILED",
      message: buildProviderErrorMessage(error),
    });
  }
}
