import { generateText } from "ai";
import { z } from "zod";

import {
  createAiChatMessage,
  ensureAiChatSession,
  listAiChatMessages,
  toModelMessages,
  touchAiChatSession,
} from "@/lib/ai/chat";
import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiGatewayEnv } from "@/lib/env";
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
    "Я не могу помогать с опасными или экстремальными рекомендациями.",
    "Если вопрос касается сильного дефицита калорий, жёсткого ограничения питания или медицинских симптомов, лучше обратиться к врачу или спортивному специалисту.",
    "Я могу помочь составить более безопасный и реалистичный план в рамках тренировок, питания и восстановления.",
  ].join(" ");
}

function buildSystemPrompt(knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>) {
  const knowledgeText = knowledge.length
    ? knowledge
        .map(
          (item, index) =>
            `[${index + 1}] ${item.sourceType}: ${item.content}`,
        )
        .join("\n\n")
    : "Контекст из knowledge base пока пустой. Отвечай аккуратно и явно отмечай нехватку данных.";

  return `Ты — AI-коуч внутри приложения fit. Отвечай только по-русски.

Твои правила:
- давай practical, calm и безопасные рекомендации по тренировкам, питанию и восстановлению;
- не ставь медицинские диагнозы и не заменяй врача;
- не предлагай экстремальные дефициты, обезвоживание, голодание, травмоопасные перегрузки;
- если данных не хватает, честно скажи об этом;
- опирайся только на пользовательский контекст и извлечённые знания ниже;
- не упоминай чужие данные и не выдумывай показатели, которых нет.

Извлечённый контекст:
${knowledgeText}

В ответах:
- сначала дай короткий вывод;
- затем дай 2-5 конкретных шагов;
- если уместно, предложи следующий безопасный шаг внутри приложения fit.`;
}

export async function POST(request: Request) {
  try {
    if (!hasAiGatewayEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_GATEWAY_NOT_CONFIGURED",
        message: "AI Gateway не настроен для AI-чата.",
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

    const session = await ensureAiChatSession(
      supabase,
      user.id,
      body.sessionId,
      body.message,
    );

    await touchAiChatSession(supabase, user.id, session.id);

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

    const retrievedKnowledge = await retrieveKnowledgeMatches(
      supabase,
      user.id,
      body.message,
      6,
    );

    const recentMessages = await listAiChatMessages(
      supabase,
      user.id,
      session.id,
      12,
    );

    const result = await generateText({
      model: models.chat,
      system: buildSystemPrompt(retrievedKnowledge),
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
      status: 500,
      code: "AI_CHAT_FAILED",
      message: "Не удалось получить ответ AI-чата.",
    });
  }
}
