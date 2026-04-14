---
name: fit-security-review
description: Use when Codex must review fit for security regressions, secure-by-default behavior, privileged boundary drift, or manual `@codex review for security regressions`. Trigger for Next.js, Supabase, admin, billing, webhook, env, or AI-runtime changes where auth, RLS, secrets, or unsafe fallbacks may be at risk. Do not use for general non-security review.
---

# fit Security Review

- Start with the repo-local checklist in [references/fit-security-checklist.md](references/fit-security-checklist.md).
- Inspect both frontend and backend surfaces touched by the change; do not stop at a single file if the boundary crosses route handlers, lib code, RLS, or admin UI.
- Prioritize auth bypass, RLS drift, secret exposure, unsafe service-role use, webhook/provider trust issues, and proposal-first violations.
- Report only evidence-backed findings and include file references plus impact.
- If the task asks for a broader report and the global `security-best-practices` skill is available, use it only as a supplement to this repo-local checklist, not as a replacement.
