import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createDashboardRuntimeSnapshotPayload,
  parseDashboardRuntimeSnapshotPayload,
  type DashboardRuntimeSnapshotConfig,
  type DashboardRuntimeSnapshotPayload,
} from "@/lib/dashboard/dashboard-snapshot";
import { getDashboardRuntimeFreshnessCursor } from "@/lib/dashboard/dashboard-aggregate";
import type {
  DashboardRuntimeMetrics,
  DashboardRuntimeMetricsResult,
} from "@/lib/dashboard/metrics";

type DashboardRuntimeSnapshotRow = {
  created_at: string;
  id: string;
  payload:
    | DashboardRuntimeSnapshotPayload<DashboardRuntimeMetrics>
    | Record<string, unknown>;
  snapshot_reason: string;
};

export async function persistDashboardRuntimeSnapshot(
  supabase: SupabaseClient,
  userId: string,
  metrics: DashboardRuntimeMetrics,
  config: DashboardRuntimeSnapshotConfig,
  snapshotReason: string,
) {
  const payload = createDashboardRuntimeSnapshotPayload(metrics, config);

  const { data, error } = await supabase
    .from("user_context_snapshots")
    .insert({
      user_id: userId,
      snapshot_reason: snapshotReason,
      payload,
    })
    .select("id, snapshot_reason, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    createdAt: data.created_at,
    generatedAt: payload.generatedAt,
    snapshotId: data.id,
    snapshotReason: data.snapshot_reason,
  };
}

export async function getCachedDashboardRuntimeMetrics(
  supabase: SupabaseClient,
  userId: string,
  options: {
    config: DashboardRuntimeSnapshotConfig;
    maxAgeMs: number;
    snapshotReason: string;
  },
): Promise<DashboardRuntimeMetricsResult | null> {
  const { data, error } = await supabase
    .from("user_context_snapshots")
    .select("id, snapshot_reason, payload, created_at")
    .eq("user_id", userId)
    .eq("snapshot_reason", options.snapshotReason)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = parseDashboardRuntimeSnapshotPayload<DashboardRuntimeMetrics>(
    (data as DashboardRuntimeSnapshotRow).payload,
  );
  const ageMs = Date.now() - new Date(data.created_at).getTime();
  let hasNewerUserData = false;

  try {
    const freshnessCursor = await getDashboardRuntimeFreshnessCursor(
      supabase,
      userId,
    );
    hasNewerUserData =
      typeof freshnessCursor === "string" &&
      new Date(freshnessCursor).getTime() > new Date(data.created_at).getTime();
  } catch {
    hasNewerUserData = false;
  }

  if (
    !parsed ||
    parsed.config.weeks !== options.config.weeks ||
    parsed.config.days !== options.config.days ||
    parsed.config.periodDays !== options.config.periodDays ||
    parsed.config.baselineDays !== options.config.baselineDays ||
    !Number.isFinite(ageMs) ||
    ageMs > options.maxAgeMs ||
    hasNewerUserData
  ) {
    return null;
  }

  return {
    cache: {
      generatedAt: parsed.generatedAt,
      snapshotCreatedAt: data.created_at,
      snapshotId: data.id,
      snapshotReason: data.snapshot_reason,
      source: "snapshot",
    },
    metrics: parsed.metrics,
  };
}
