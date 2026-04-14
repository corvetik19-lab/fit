---
name: fit-pr-review
description: Use when Codex must review a fit repository diff, pull request, commit, or uncommitted change set and return prioritized findings. Trigger for local `/review`, PR-style review, change-risk triage, and manual `@codex review` follow-up. Do not use for generic implementation or security-only review without a broader code review request.
---

# fit PR Review

- Start from [AGENTS.md](/C:/fit/AGENTS.md), [code_review.md](/C:/fit/code_review.md), and the nearest domain `AGENTS.md`.
- Focus on behavior regressions, missing tests, rollout risk, contract drift, and developer-facing process breaks.
- For risky runtime changes, name the missing verification surface instead of vaguely asking for "more testing".
- Put findings first, ordered by severity, with file references and concise impact.
- If no findings are justified, say so explicitly and mention any residual gaps or external blockers.
