export type KnowledgeChunkSourceFamily =
  | "fallback"
  | "memory"
  | "nutrition"
  | "profile"
  | "structured"
  | "workout";

export type KnowledgeChunkPolicy = {
  family: KnowledgeChunkSourceFamily;
  importanceWeight: number;
  recencyKeys: string[];
};

const DEFAULT_POLICY: KnowledgeChunkPolicy = {
  family: "memory",
  importanceWeight: 0.5,
  recencyKeys: ["createdAt", "updatedAt"],
};

const CHUNK_POLICIES: Record<string, KnowledgeChunkPolicy> = {
  fallback_context: {
    family: "fallback",
    importanceWeight: 0.2,
    recencyKeys: [],
  },
  user_profile: {
    family: "profile",
    importanceWeight: 0.75,
    recencyKeys: ["updatedAt", "createdAt"],
  },
  body_metrics_overview: {
    family: "profile",
    importanceWeight: 0.72,
    recencyKeys: ["measuredAt"],
  },
  body_metric_entry: {
    family: "profile",
    importanceWeight: 0.68,
    recencyKeys: ["measuredAt"],
  },
  nutrition_overview: {
    family: "nutrition",
    importanceWeight: 0.72,
    recencyKeys: ["summaryDate", "generatedAt"],
  },
  nutrition_day: {
    family: "nutrition",
    importanceWeight: 0.7,
    recencyKeys: ["summaryDate"],
  },
  nutrition_meal_patterns: {
    family: "nutrition",
    importanceWeight: 0.73,
    recencyKeys: ["generatedAt"],
  },
  nutrition_strategy: {
    family: "nutrition",
    importanceWeight: 0.76,
    recencyKeys: ["generatedAt"],
  },
  meal_log: {
    family: "nutrition",
    importanceWeight: 0.67,
    recencyKeys: ["eatenAt"],
  },
  user_memory: {
    family: "memory",
    importanceWeight: 0.7,
    recencyKeys: ["createdAt"],
  },
  context_snapshot: {
    family: "memory",
    importanceWeight: 0.72,
    recencyKeys: ["createdAt"],
  },
  workout_overview: {
    family: "workout",
    importanceWeight: 0.74,
    recencyKeys: ["updatedAt"],
  },
  weekly_program: {
    family: "workout",
    importanceWeight: 0.75,
    recencyKeys: ["weekEndDate", "weekStartDate"],
  },
  workout_day: {
    family: "workout",
    importanceWeight: 0.78,
    recencyKeys: ["updatedAt"],
  },
  exercise_history: {
    family: "workout",
    importanceWeight: 0.76,
    recencyKeys: ["updatedAt"],
  },
  structured_fact_sheet: {
    family: "structured",
    importanceWeight: 0.82,
    recencyKeys: ["generatedAt"],
  },
  structured_fact: {
    family: "structured",
    importanceWeight: 0.8,
    recencyKeys: ["generatedAt"],
  },
};

export function resolveKnowledgeChunkPolicy(sourceType: string) {
  return CHUNK_POLICIES[sourceType] ?? DEFAULT_POLICY;
}
