from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client

from .config import EvalRuntimeConfig, require_value


class SupabaseEvalStore:
  def __init__(self, config: EvalRuntimeConfig):
    supabase_url = require_value(config.supabase_url, "NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = require_value(
      config.supabase_service_role_key,
      "SUPABASE_SERVICE_ROLE_KEY",
    )
    self.client: Client = create_client(supabase_url, service_role_key)

  @staticmethod
  def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

  def fetch_queued_runs(self, limit: int = 5) -> list[dict[str, Any]]:
    response = (
      self.client.table("ai_eval_runs")
      .select("id, label, model_id, summary")
      .eq("status", "queued")
      .order("created_at")
      .limit(limit)
      .execute()
    )
    return list(response.data or [])

  def mark_run_started(
    self,
    run_id: str,
    suite: str,
    model_id: str,
    label: str | None = None,
  ) -> None:
    (
      self.client.table("ai_eval_runs")
      .update(
        {
          "status": "running",
          "started_at": self._now_iso(),
          "summary": {
            "suite": suite,
            "label": label,
            "model_id": model_id,
            "started_at": self._now_iso(),
          },
        }
      )
      .eq("id", run_id)
      .execute()
    )

  def replace_metric_rows(self, run_id: str, metric_rows: list[dict[str, Any]]) -> None:
    (
      self.client.table("ai_eval_results")
      .delete()
      .eq("run_id", run_id)
      .execute()
    )

    if metric_rows:
      self.client.table("ai_eval_results").insert(metric_rows).execute()

  def mark_run_completed(self, run_id: str, summary: dict[str, Any]) -> None:
    (
      self.client.table("ai_eval_runs")
      .update(
        {
          "status": "completed",
          "completed_at": self._now_iso(),
          "summary": summary,
        }
      )
      .eq("id", run_id)
      .execute()
    )

  def mark_run_failed(self, run_id: str, summary: dict[str, Any]) -> None:
    (
      self.client.table("ai_eval_runs")
      .update(
        {
          "status": "failed",
          "completed_at": self._now_iso(),
          "summary": summary,
        }
      )
      .eq("id", run_id)
      .execute()
    )
