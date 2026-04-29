import type { UIMessage } from "ai";

import type { AiChatSessionRow } from "@/lib/ai/chat";
import type { AiAgentLaunchContext } from "@/lib/ai/agent-intents";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type MealPhotoAnalysis = {
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  estimatedKcal: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  items: Array<{
    name: string;
    portion: string;
    confidence: "low" | "medium" | "high";
  }>;
  suggestions: string[];
};

export type AssistantProposalType = "meal_plan" | "workout_plan";

export type AssistantProposalOutput = {
  applyLabel: string;
  description: string;
  highlights: string[];
  proposalId: string;
  proposalType: AssistantProposalType;
  title: string;
};

export type AssistantSearchOutput = {
  query: string;
  results: Array<{
    snippet: string;
    title: string;
    url: string;
  }>;
};

export type AssistantProposalListOutput = {
  count: number;
  items: Array<{
    createdAt: string;
    proposalId: string;
    proposalType: AssistantProposalType;
    requestSummary: string;
    status: string;
    timeline: string;
    title: string;
    updatedAt: string;
  }>;
};

export type AssistantProposalActionOutput = {
  proposalId: string;
  proposalType: AssistantProposalType;
  status: string;
  summary: string;
  title: string;
};

export type AssistantProposalTarget = {
  proposalId: string;
  proposalType: AssistantProposalType;
};

export type MealPhotoResponse = {
  data?: MealPhotoAnalysis;
  message?: string;
  messages?: {
    assistant?: ChatMessage;
    user?: ChatMessage;
  };
  session?: {
    id: string;
    title: string | null;
  };
};

export type AssistantToolPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-createWorkoutPlan";
      output?: AssistantProposalOutput;
      state: string;
    }
  | {
      type: "tool-createMealPlan";
      output?: AssistantProposalOutput;
      state: string;
    }
  | {
      type: "tool-searchWeb";
      output?: AssistantSearchOutput;
      state: string;
    }
  | {
      type: "tool-listRecentProposals";
      output?: AssistantProposalListOutput;
      state: string;
    }
  | {
      type: "tool-approveProposal";
      output?: AssistantProposalActionOutput;
      state: string;
    }
  | {
      type: "tool-applyProposal";
      output?: AssistantProposalActionOutput;
      state: string;
    }
  | {
      type: "tool-call";
      toolName: string;
    }
  | {
      type: "tool-result";
    };

export type AiChatPanelProps = {
  access: FeatureAccessSnapshot;
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  initialMessages: ChatMessage[];
  launchContext?: AiAgentLaunchContext | null;
  mealPhotoAccess: FeatureAccessSnapshot;
  onSessionTouched?: (session: AiChatSessionRow) => void;
};

export type AiSurfaceNoticeKind = "success" | "info" | "provider" | "runtime";

export type AiSurfaceNotice = {
  kind: AiSurfaceNoticeKind;
  message: string;
};

const providerConfigurationMarkers = [
  "внешний ии-провайдер",
  "провайдер не активирован",
  "не настроен для чата",
  "не настроен для ассистента",
  "не настроен для анализа фото",
  "обработка изображений временно выключена",
  "сервис ии временно недоступен",
  "анализ фото временно недоступен",
  "ai_provider_unavailable",
  "ai_runtime_not_configured",
];

export function createAiSurfaceNotice(
  kind: AiSurfaceNoticeKind,
  message: string,
): AiSurfaceNotice {
  return { kind, message };
}

export function classifyAiSurfaceErrorMessage(
  message: string | null,
): AiSurfaceNotice | null {
  if (!message?.trim()) {
    return null;
  }

  const normalized = message.toLowerCase();
  const kind = providerConfigurationMarkers.some((marker) =>
    normalized.includes(marker),
  )
    ? "provider"
    : "runtime";

  return createAiSurfaceNotice(kind, message);
}

export const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatConfidence(value: MealPhotoAnalysis["confidence"]) {
  switch (value) {
    case "high":
      return "высокая";
    case "medium":
      return "средняя";
    default:
      return "низкая";
  }
}

export function formatProposalStatus(status: string) {
  if (status === "applied") {
    return "применено";
  }

  if (status === "approved") {
    return "подтверждено";
  }

  return "черновик";
}

export function formatProposalType(proposalType: AssistantProposalType) {
  return proposalType === "workout_plan" ? "тренировки" : "питание";
}

export function toUiTextMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  };
}

export function dedupeUiMessages<T extends { id: string }>(messages: T[]): T[] {
  const lastIndexById = new Map<string, number>();

  messages.forEach((message, index) => {
    lastIndexById.set(message.id, index);
  });

  return messages.filter(
    (message, index) => lastIndexById.get(message.id) === index,
  );
}

function getUiMessageText(message: UIMessage) {
  return message.parts
    .flatMap((part) => {
      if (part.type === "text") {
        return [part.text];
      }

      if ("output" in part && typeof part.output === "string") {
        return [part.output];
      }

      return [];
    })
    .join(" ")
    .trim();
}

export function hasRenderableAssistantReply(messages: UIMessage[]) {
  const lastUserIndex = [...messages]
    .map((message, index) => ({ index, role: message.role }))
    .reverse()
    .find((entry) => entry.role === "user")?.index;

  if (typeof lastUserIndex !== "number") {
    return messages.some(
      (message) =>
        message.role === "assistant" && getUiMessageText(message).length > 0,
    );
  }

  return messages
    .slice(lastUserIndex + 1)
    .some(
      (message) =>
        message.role === "assistant" && getUiMessageText(message).length > 0,
    );
}

export function buildMealPhotoMarkdown(result: MealPhotoAnalysis) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} | ${item.portion} | уверенность ${formatConfidence(item.confidence)}`,
          )
          .join("\n")
      : "- Точный состав определить не удалось.";

  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions.map((item) => `- ${item}`).join("\n")
      : "- Можно уточнить рецепт, замену продуктов или попросить план питания.";

  return [
    `### ${result.title}`,
    result.summary,
    "",
    `Оценка: **${result.estimatedKcal} ккал**`,
    `Белки: **${result.macros.protein} г** | Жиры: **${result.macros.fat} г** | Углеводы: **${result.macros.carbs} г**`,
    "",
    "Что видно на фото:",
    items,
    "",
    "Что можно сделать дальше:",
    suggestions,
  ].join("\n");
}
