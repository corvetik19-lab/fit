---
name: fit-ai-eval-ops
description: Use when Codex changes prompts, retrieval, guardrails, AI admin flows, eval thresholds, or other AI behavior in the fit repository and needs an explicit evaluator/artifact loop. Trigger for difficult AI problems, release gates, provider blocker analysis, and ai-evals maintenance. Do not use for generic UI-only work or simple docs updates with no AI behavior change.
---

# fit AI Eval Ops

- Define the loop explicitly: `goal`, `baseline`, `evaluator`, `artifacts`, `stop condition`, `escalation rule`.
- Prefer `ai-evals`, `tests/ai-gate`, `test:retrieval-gate`, `verify:retrieval-release`, and provider preflight scripts over subjective checks.
- Treat provider access failures and missing credits as external blockers, not silent passes.
- Store artifacts in `ai-evals/output/` for suite runs and `output/codex-runs/` for broader iterative work.
- After substantial AI/eval changes, sync `docs/AI_STACK.md`, `docs/CODEX_ROLLOUT_PLAN.md`, `docs/MASTER_PLAN.md`, and `docs/AI_WORKLOG.md`.
