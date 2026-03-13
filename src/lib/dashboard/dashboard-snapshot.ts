import { isRecord } from "@/lib/dashboard/dashboard-utils";

export type DashboardRuntimeSnapshotConfig = {
  baselineDays: number;
  days: number;
  periodDays: number;
  weeks: number;
};

export type DashboardRuntimeSnapshotPayload<TMetrics> = {
  config: DashboardRuntimeSnapshotConfig;
  generatedAt: string;
  kind: "dashboard_runtime";
  metrics: TMetrics;
  version: 1;
};

export type DashboardAggregateSnapshotPayload<TBundle> = {
  bundle: TBundle;
  generatedAt: string;
  kind: "dashboard_aggregate";
  version: 1;
};

export function createDashboardRuntimeSnapshotPayload<TMetrics>(
  metrics: TMetrics,
  config: DashboardRuntimeSnapshotConfig,
): DashboardRuntimeSnapshotPayload<TMetrics> {
  return {
    config,
    generatedAt: new Date().toISOString(),
    kind: "dashboard_runtime",
    metrics,
    version: 1,
  };
}

export function parseDashboardRuntimeSnapshotPayload<TMetrics>(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (value.kind !== "dashboard_runtime" || value.version !== 1) {
    return null;
  }

  if (typeof value.generatedAt !== "string") {
    return null;
  }

  if (!isRecord(value.config) || !isRecord(value.metrics)) {
    return null;
  }

  const config = value.config;

  if (
    typeof config.weeks !== "number" ||
    typeof config.days !== "number" ||
    typeof config.periodDays !== "number" ||
    typeof config.baselineDays !== "number"
  ) {
    return null;
  }

  return {
    config: {
      weeks: config.weeks,
      days: config.days,
      periodDays: config.periodDays,
      baselineDays: config.baselineDays,
    },
    generatedAt: value.generatedAt,
    kind: "dashboard_runtime" as const,
    metrics: value.metrics as TMetrics,
    version: 1 as const,
  };
}

export function createDashboardAggregateSnapshotPayload<TBundle>(
  bundle: TBundle,
): DashboardAggregateSnapshotPayload<TBundle> {
  return {
    bundle,
    generatedAt: new Date().toISOString(),
    kind: "dashboard_aggregate",
    version: 1,
  };
}

export function parseDashboardAggregateSnapshotPayload<TBundle>(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (value.kind !== "dashboard_aggregate" || value.version !== 1) {
    return null;
  }

  if (typeof value.generatedAt !== "string" || !isRecord(value.bundle)) {
    return null;
  }

  const bundle = value.bundle;

  if (
    typeof bundle.lookbackDays !== "number" ||
    !Array.isArray(bundle.days) ||
    !bundle.days.every((day) => isRecord(day) && typeof day.date === "string")
  ) {
    return null;
  }

  return {
    bundle: bundle as TBundle,
    generatedAt: value.generatedAt,
    kind: "dashboard_aggregate" as const,
    version: 1 as const,
  };
}
