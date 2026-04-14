---
name: fit-web-onboarding
description: Use when Codex needs to enter an unfamiliar web slice of the fit app and produce a concrete module map, request/data flow, risky spots, and next-file recommendations before editing. Trigger for App Router, frontend, admin, backend-web, and cross-cutting Next.js onboarding tasks. Do not use for Android-only work or for tasks where the target files are already clearly known.
---

# fit Web Onboarding

- Start with `AGENTS.md`, `docs/MASTER_PLAN.md`, `docs/AI_WORKLOG.md`, and the relevant profile doc in `docs/`.
- Map the route segment, layout chain, server/client boundary, state owner, and verification surface.
- Name which modules own business logic, persistence, transport, and UI.
- Call out risky spots before implementation: auth redirects, owner-only data, cached state, hidden side effects, and existing regressions.
- End with the next files to read and the minimum checks required after changes.
