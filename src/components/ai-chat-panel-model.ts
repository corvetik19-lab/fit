import type { UIMessage } from "ai";

import type { AiChatSessionRow } from "@/lib/ai/chat";
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
  mealPhotoAccess: FeatureAccessSnapshot;
  onSessionTouched?: (session: AiChatSessionRow) => void;
};

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

export function buildMealPhotoMarkdown(result: MealPhotoAnalysis) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} · ${item.portion} · уверенность ${formatConfidence(item.confidence)}`,
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
    `Белки: **${result.macros.protein} г** · Жиры: **${result.macros.fat} г** · Углеводы: **${result.macros.carbs} г**`,
    "",
    "Что видно на фото:",
    items,
    "",
    "Что можно сделать дальше:",
    suggestions,
  ].join("\n");
}
