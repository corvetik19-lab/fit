# fit Operating Contract

## Project identity
- This repository hosts the production code for `fit`, a Vercel-hosted web-first fitness platform.
- Primary stack: Next.js 16, App Router, React 19, TypeScript strict mode, npm.
- Primary surfaces: responsive PWA, admin panel, AI evaluation workspace, and a future Android wrapper built on the PWA.
- Data plane: Supabase Auth, Postgres, pgvector, RLS, SQL migrations.
- AI plane: Vercel AI Gateway with Gemini for generation and Voyage for embeddings.

## Product priorities
- Build workout, nutrition, dashboard, admin, and AI systems in incremental slices.
- Keep the runtime app offline-capable for core flows. AI features are online-only.
- Treat user-level isolation and auditability as non-negotiable.
- Keep AI actions proposal-first. Do not auto-write user plans without explicit confirmation.

## Engineering posture
- Explore first and preserve momentum with narrow, shippable slices.
- Prefer explicit data contracts, small server utilities, and composable route handlers.
- Do not guess library APIs or infra behavior when current docs are available.
- Keep service-role operations server-only and log every privileged admin action.
- After every substantial change, update `docs/AI_WORKLOG.md`, `docs/MASTER_PLAN.md`, and the relevant topical docs in `docs/`.
- `docs/MASTER_PLAN.md` is the source of truth for delivery progress. After each substantial change, the agent must explicitly update its checklist items, switching completed items from `[ ]` to `[x]` where appropriate.
- `docs/AI_WORKLOG.md` must receive a short Russian entry for every substantial implemented slice, including what changed and what was verified.
- All developer-facing project documentation should be written in Russian unless a file explicitly needs another language.

## Data and security rules
- All business data is user-scoped by default through `user_id`.
- Every business table must have RLS enabled.
- Schema changes happen only through SQL migrations inside `supabase/migrations`.
- Admin access is separate from normal user access and must be audited.
- Never commit secrets. Use env files locally and project environment variables remotely.

## Tooling expectations
- Use local shell for repo work, npm, testing, and git.
- Use Supabase MCP or CLI for project/database operations when available.
- Use Vercel tooling for project/env/deploy setup when available.
- Use Playwright for browser verification flows.

## Current repository state
- The repo started as an empty bootstrap target and is now being converted into the web platform described above.
- When a feature is only partially scaffolded, prefer extending the existing slice over creating a parallel implementation.
- The `docs/` folder is the persistent handoff surface for future developers and AI agents.
