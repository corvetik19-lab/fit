import type { AiUserContext } from "@/lib/ai/user-context";

type AiStructuredKnowledgeSource = Omit<AiUserContext, "structuredKnowledge">;

export type AiStructuredKnowledgePriority = "high" | "medium" | "baseline";

export type AiStructuredKnowledgeTopic =
  | "profile"
  | "workout"
  | "recovery"
  | "nutrition"
  | "meal_patterns"
  | "strategy";

export type AiStructuredKnowledgeFact = {
  id: string;
  topic: AiStructuredKnowledgeTopic;
  priority: AiStructuredKnowledgePriority;
  title: string;
  summary: string;
  action: string | null;
  evidence: string[];
};

export type AiStructuredKnowledgeSnapshot = {
  generatedAt: string;
  facts: AiStructuredKnowledgeFact[];
};

function formatNumber(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatGoal(goalType: string | null) {
  switch (goalType) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "рост спортивной формы";
    case "maintenance":
      return "поддержание формы";
    default:
      return "цель не указана";
  }
}

function signalPriority(status: "positive" | "watch" | "attention") {
  switch (status) {
    case "attention":
      return "high" as const;
    case "watch":
      return "medium" as const;
    default:
      return "baseline" as const;
  }
}

function strategyPriority(priority: "high" | "medium" | "keep") {
  switch (priority) {
    case "high":
      return "high" as const;
    case "medium":
      return "medium" as const;
    default:
      return "baseline" as const;
  }
}

function pushFact(
  facts: AiStructuredKnowledgeFact[],
  fact: AiStructuredKnowledgeFact | null,
  limit = 8,
) {
  if (!fact || facts.length >= limit) {
    return;
  }

  if (facts.some((existing) => existing.id === fact.id)) {
    return;
  }

  facts.push(fact);
}

function sortFacts(facts: AiStructuredKnowledgeFact[]) {
  const priorityOrder: Record<AiStructuredKnowledgePriority, number> = {
    high: 0,
    medium: 1,
    baseline: 2,
  };

  return [...facts].sort((left, right) => {
    const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.id.localeCompare(right.id, "ru");
  });
}

function buildProfileFact(
  context: AiStructuredKnowledgeSource,
): AiStructuredKnowledgeFact {
  return {
    id: "profile-anchor",
    topic: "profile",
    priority: "baseline",
    title: "Профиль и цель пользователя",
    summary: `${context.profile.fullName ?? "Пользователь"} работает на цель "${formatGoal(
      context.goal.goalType,
    )}" и ведет платформу как единый трек тренировок, питания и веса тела.`,
    action: null,
    evidence: [
      `цель: ${formatGoal(context.goal.goalType)}`,
      `тренировок в неделю: ${context.goal.weeklyTrainingDays ?? "не указано"}`,
      `вес: ${context.latestBodyMetrics.weightKg ?? context.onboarding.weightKg ?? "не указан"} кг`,
      `калории: ${context.nutritionTargets.kcalTarget ?? "не указаны"}`,
      `белок: ${context.nutritionTargets.proteinTarget ?? "не указан"}`,
    ],
  };
}

function buildWorkoutLoadFact(
  context: AiStructuredKnowledgeSource,
): AiStructuredKnowledgeFact | null {
  const { tonnageLast28Kg, bestSetWeightKg, bestEstimatedOneRmKg, avgActualWeightKg } =
    context.workoutInsights;

  if (
    tonnageLast28Kg === null &&
    bestSetWeightKg === null &&
    bestEstimatedOneRmKg === null &&
    avgActualWeightKg === null
  ) {
    return null;
  }

  return {
    id: "workout-load-anchor",
    topic: "workout",
    priority: "medium",
    title: "Есть база по реальной силовой нагрузке",
    summary:
      "История тренировок уже включает рабочие веса и объем, поэтому рекомендации можно строить по фактической силовой динамике, а не только по числу повторов.",
    action:
      "При коррекции плана опирайся на лучший рабочий вес, тоннаж и переносимость текущего объема, а не меняй сразу все параметры нагрузки.",
    evidence: [
      `тоннаж 28 дней: ${formatNumber(tonnageLast28Kg)} кг`,
      `средний рабочий вес: ${formatNumber(avgActualWeightKg)} кг`,
      `лучший вес: ${formatNumber(bestSetWeightKg)} кг`,
      `лучшая оценка 1ПМ: ${formatNumber(bestEstimatedOneRmKg)} кг`,
    ],
  };
}

export function buildStructuredKnowledgeFromContext(
  context: AiStructuredKnowledgeSource,
): AiStructuredKnowledgeSnapshot {
  const facts: AiStructuredKnowledgeFact[] = [];

  pushFact(facts, buildProfileFact(context));
  pushFact(facts, buildWorkoutLoadFact(context));

  for (const signal of context.workoutInsights.coachingSignals.slice(0, 3)) {
    pushFact(facts, {
      id: `workout-signal-${signal.key}`,
      topic: signal.key === "recovery" ? "recovery" : "workout",
      priority: signalPriority(signal.status),
      title: signal.title,
      summary: signal.summary,
      action: signal.action,
      evidence: [signal.metric],
    });
  }

  for (const signal of context.nutritionInsights.coachingSignals.slice(0, 3)) {
    pushFact(facts, {
      id: `nutrition-signal-${signal.key}`,
      topic: "nutrition",
      priority: signalPriority(signal.status),
      title: signal.title,
      summary: signal.summary,
      action: signal.action,
      evidence: [signal.metric],
    });
  }

  for (const pattern of context.nutritionInsights.mealPatterns.patterns.slice(0, 2)) {
    pushFact(facts, {
      id: `meal-pattern-${pattern.key}`,
      topic: "meal_patterns",
      priority: signalPriority(pattern.status),
      title: pattern.title,
      summary: pattern.summary,
      action: pattern.action,
      evidence: [pattern.metric],
    });
  }

  for (const recommendation of context.nutritionInsights.strategy.slice(0, 2)) {
    pushFact(facts, {
      id: `nutrition-strategy-${recommendation.key}`,
      topic: "strategy",
      priority: strategyPriority(recommendation.priority),
      title: recommendation.title,
      summary: recommendation.summary,
      action: recommendation.action,
      evidence: [`приоритет: ${recommendation.priority}`],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    facts: sortFacts(facts).slice(0, 8),
  };
}

export function formatStructuredKnowledgeForPrompt(
  snapshot: AiStructuredKnowledgeSnapshot,
) {
  if (!snapshot.facts.length) {
    return "Структурированные факты по пользователю пока не сформированы.";
  }

  return snapshot.facts
    .map((fact, index) => {
      const evidence =
        fact.evidence.length > 0 ? ` Факты: ${fact.evidence.join("; ")}.` : "";
      const action = fact.action ? ` Следующий шаг: ${fact.action}` : "";
      return `${index + 1}. [${fact.priority}/${fact.topic}] ${fact.title}. ${fact.summary}${evidence}${action}`;
    })
    .join("\n");
}

export function formatStructuredKnowledgeForDocument(
  snapshot: AiStructuredKnowledgeSnapshot,
) {
  if (!snapshot.facts.length) {
    return "Структурированные знания по пользователю пока не сформированы.";
  }

  return snapshot.facts
    .map((fact, index) => {
      const evidence = fact.evidence.length ? ` Основания: ${fact.evidence.join("; ")}.` : "";
      const action = fact.action ? ` Следующий шаг: ${fact.action}` : "";
      return `${index + 1}. ${fact.title} [${fact.topic}/${fact.priority}]. ${fact.summary}${evidence}${action}`;
    })
    .join("\n");
}

export function buildStructuredKnowledgeSignature(
  snapshot: AiStructuredKnowledgeSnapshot,
) {
  if (!snapshot.facts.length) {
    return "нет структурированных фактов";
  }

  return snapshot.facts
    .map((fact) => `${fact.title} (${fact.topic}/${fact.priority})`)
    .join(", ");
}
