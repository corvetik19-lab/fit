# AI Evals Guidance

- This workspace exists for internal AI evaluation and not for runtime application code.
- Keep suites, thresholds, dataset contracts, and output artifacts explicit.
- For difficult problems, define `goal`, `baseline`, `evaluator`, `artifacts`, and `stop condition`.
- Write shared run artifacts to `ai-evals/output/` or `output/codex-runs/` with stable names.
- After substantial eval changes, sync `ai-evals/README.md`, `docs/AI_STACK.md`,
  `docs/MASTER_PLAN.md`, and `docs/AI_WORKLOG.md`.
