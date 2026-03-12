import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiEvalSuite } from "@/lib/ai/eval-suites";

export type AiEvalRunRecord = {
  completed_at: string | null;
  created_at: string;
  id: string;
  label: string;
  model_id: string;
  started_at: string | null;
  status: string;
  summary?: Record<string, unknown> | null;
};

type QueueAiEvalRunParams = {
  dedupeWindowHours?: number;
  isScheduled?: boolean;
  label?: string | null;
  modelId: string;
  requestedBy?: string | null;
  suite: AiEvalSuite;
  trigger:
    | "manual_admin"
    | "scheduled_admin"
    | "scheduled_cron";
};

type QueueAiEvalRunResult =
  | {
      data: AiEvalRunRecord;
      skipped: false;
    }
  | {
      data: AiEvalRunRecord;
      skipped: true;
    };

function buildDefaultEvalLabel(
  suite: AiEvalSuite,
  trigger: QueueAiEvalRunParams["trigger"],
) {
  const isoDate = new Date().toISOString().slice(0, 10);
  const prefix = trigger === "manual_admin" ? "AI eval" : "Scheduled AI eval";
  return `${prefix} ${suite} ${isoDate}`;
}

export async function queueAiEvalRun(
  supabase: SupabaseClient,
  params: QueueAiEvalRunParams,
): Promise<QueueAiEvalRunResult> {
  const dedupeWindowHours = params.dedupeWindowHours ?? 24;

  if (params.isScheduled && dedupeWindowHours > 0) {
    const cutoffIso = new Date(
      Date.now() - dedupeWindowHours * 60 * 60 * 1000,
    ).toISOString();
    const { data: existingRun, error: existingRunError } = await supabase
      .from("ai_eval_runs")
      .select(
        "id, label, model_id, status, created_at, started_at, completed_at, summary",
      )
      .contains("summary", {
        isScheduled: true,
        suite: params.suite,
      })
      .eq("model_id", params.modelId)
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRunError) {
      throw existingRunError;
    }

    if (existingRun) {
      return {
        data: existingRun as AiEvalRunRecord,
        skipped: true,
      };
    }
  }

  const label =
    params.label?.trim() || buildDefaultEvalLabel(params.suite, params.trigger);
  const summary = {
    isScheduled: Boolean(params.isScheduled),
    queuedAt: new Date().toISOString(),
    suite: params.suite,
    trigger: params.trigger,
  };

  const { data, error } = await supabase
    .from("ai_eval_runs")
    .insert({
      label,
      model_id: params.modelId,
      requested_by: params.requestedBy ?? null,
      status: "queued",
      summary,
    })
    .select(
      "id, label, model_id, status, created_at, started_at, completed_at, summary",
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    data: data as AiEvalRunRecord,
    skipped: false,
  };
}
