from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
AI_EVALS_DIR = ROOT_DIR / "ai-evals"

if str(AI_EVALS_DIR) not in sys.path:
  sys.path.insert(0, str(AI_EVALS_DIR))

from fit_eval.config import load_runtime_config
from fit_eval.runner import SUITES, run_selected_suites
from fit_eval.supabase_store import SupabaseEvalStore

SUPPORTED_SUITES = ["all", *SUITES.keys()]


def _build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(
    description="Run fit Ragas benchmark suites locally or process queued Supabase runs.",
  )
  parser.add_argument(
    "--suite",
    choices=SUPPORTED_SUITES,
    default="all",
    help="Benchmark suite to execute.",
  )
  parser.add_argument(
    "--model",
    default=None,
    help="Override OpenRouter model id for judge/runtime calls.",
  )
  parser.add_argument(
    "--run-id",
    default=None,
    help="Explicit run id for a direct local run.",
  )
  parser.add_argument(
    "--queue",
    action="store_true",
    help="Process queued ai_eval_runs from Supabase.",
  )
  parser.add_argument(
    "--limit",
    type=int,
    default=3,
    help="How many queued runs to process in one pass.",
  )
  parser.add_argument(
    "--no-supabase",
    action="store_true",
    help="Do not read or write run state back to Supabase.",
  )
  return parser


def _print_json(payload: dict) -> None:
  if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
  print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))


def _run_direct(args: argparse.Namespace) -> int:
  config = load_runtime_config()
  result = run_selected_suites(
    suite=args.suite,
    config=config,
    model_override=args.model,
    run_id=args.run_id,
  )
  _print_json(result["summary"])
  return 0


def _run_queue(args: argparse.Namespace) -> int:
  config = load_runtime_config()
  store = SupabaseEvalStore(config)
  queued_runs = store.fetch_queued_runs(limit=args.limit)
  summaries: list[dict] = []

  for queued_run in queued_runs:
    run_id = str(queued_run["id"])
    run_suite = str((queued_run.get("summary") or {}).get("suite") or "all")
    if run_suite not in SUPPORTED_SUITES:
      run_suite = "all"
    model_id = args.model or queued_run.get("model_id")
    label = queued_run.get("label")

    try:
      store.mark_run_started(
        run_id=run_id,
        suite=run_suite,
        model_id=model_id,
        label=label,
      )
      result = run_selected_suites(
        suite=run_suite,
        config=config,
        model_override=model_id,
        run_id=run_id,
      )
      if not args.no_supabase:
        store.replace_metric_rows(run_id, result["metric_rows"])
        store.mark_run_completed(run_id, result["summary"])
      summaries.append(result["summary"])
    except Exception as error:
      failure_summary = {
        "error": str(error),
        "modelId": model_id,
        "runId": run_id,
        "suite": run_suite,
      }
      if not args.no_supabase:
        store.mark_run_failed(run_id, failure_summary)
      summaries.append(failure_summary)

  _print_json(
    {
      "processed": len(summaries),
      "runs": summaries,
    }
  )
  return 0


def main() -> int:
  parser = _build_parser()
  args = parser.parse_args()
  if args.queue:
    return _run_queue(args)
  return _run_direct(args)


if __name__ == "__main__":
  raise SystemExit(main())
