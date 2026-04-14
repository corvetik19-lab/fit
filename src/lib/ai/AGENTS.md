# AI Domain Guidance

- Keep all AI work proposal-first. Never introduce silent user data mutations.
- Treat user isolation, retrieval ownership, and admin auditability as non-negotiable.
- For prompt, policy, retrieval, or eval changes, define an explicit evaluator before editing.
- Use `ai-evals` or existing `verify:*` and `tests/ai-gate` surfaces instead of anecdotal checks.
- For review, treat proposal-first violations, cross-user retrieval risk, unsafe provider fallback, and missing eval coverage as reportable.
- After substantial AI changes, sync `docs/AI_STACK.md`, `docs/MASTER_PLAN.md`, and
  `docs/AI_WORKLOG.md`.
