---
name: fit-github-review-ops
description: Use when Codex must maintain or execute the GitHub-facing review workflow for the fit repository. Trigger for PR review process changes, advisory review rollout, `@codex review` usage, PR template updates, and keeping AGENTS/code_review/docs aligned for GitHub review. Do not use for generic product implementation.
---

# fit GitHub Review Ops

- Treat GitHub review in `fit` as advisory-first unless the repository explicitly upgrades it to blocking.
- Keep [AGENTS.md](/C:/fit/AGENTS.md), [code_review.md](/C:/fit/code_review.md), [docs/CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md), and [PULL_REQUEST_TEMPLATE.md](/C:/fit/.github/PULL_REQUEST_TEMPLATE.md) in sync.
- Support both automatic review and manual PR comments such as `@codex review`, `@codex review for security regressions`, and targeted docs/runtime follow-up.
- When changing the GitHub review process, also update `docs/CODEX_AGENT_HARDENING_PLAN.md`, `docs/CODEX_ROLLOUT_PLAN.md`, `docs/MASTER_PLAN.md`, and `docs/AI_WORKLOG.md`.
- If a step depends on external GitHub-side enablement, record it explicitly as an operational follow-up instead of pretending the repo already enforces it.
