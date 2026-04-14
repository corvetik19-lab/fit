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
- Use `docs/CODEX_PLAYBOOK.md` and `docs/CODEX_ONBOARDING.md` as the canonical workflow and onboarding contracts for Codex work in this repository.
- Use `docs/CODEX_AGENT_AUTONOMY_PLAN.md`, `docs/CODEX_AGENT_GOVERNANCE.md`, and `docs/CODEX_AGENT_REGISTRY.md` when the task touches the agent layer itself.
- Use `code_review.md` as the canonical detailed review contract for local and GitHub review behavior.
- For difficult AI, UI, backend, or release problems, require an explicit evaluator loop: goal -> baseline -> evaluator -> artifacts -> stop condition.
- For deploy-affecting work, do not claim rollout success until the Vercel deployment itself reaches a clean terminal state: use Vercel MCP first or fall back to `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- For self-evolving or autonomous agent-layer work, require the narrower governance loop: allowlist -> required gates -> artifacts -> commit/push policy.
- Keep service-role operations server-only and log every privileged admin action.
- After every substantial change, update `docs/AI_WORKLOG.md`, `docs/MASTER_PLAN.md`, and the relevant topical docs in `docs/`.
- `docs/MASTER_PLAN.md` is the source of truth for delivery progress. After each substantial change, the agent must explicitly update its checklist items, switching completed items from `[ ]` to `[x]` where appropriate.
- `docs/AI_WORKLOG.md` must receive a short Russian entry for every substantial implemented slice, including what changed and what was verified.
- All developer-facing project documentation should be written in Russian unless a file explicitly needs another language.
- The current agent hardening tranche is tracked in `docs/CODEX_AGENT_HARDENING_PLAN.md`.

## Execution mode
- Work continuously tranche-by-tranche until `docs/MASTER_PLAN.md` is fully closed or a real external blocker appears.
- Do not pause between slices to ask for confirmation when the next step is already defined in the plan and can be discovered from the repository state.
- The default loop is: implement the next open tranche -> verify -> update `docs/MASTER_PLAN.md` and `docs/AI_WORKLOG.md` -> commit -> push -> immediately continue with the next open tranche.
- Only stop and surface a blocker when progress is genuinely blocked by missing access, missing env/secrets, paid provider limitations, or an external service outage.

## Review guidelines
- Follow `code_review.md` for detailed local `/review`, GitHub review, and manual `@codex review` behavior.
- Default review focus: bugs, regressions, user isolation, RLS, privileged boundary drift, missing tests, rollout risk, and docs/process drift.
- Automatic GitHub review in this repository is advisory-first. Manual PR comments may narrow focus, for example `@codex review for security regressions`.
- Apply the closest nested `AGENTS.md` to each changed file when extra scrutiny is needed for `src/app`, `src/lib/ai`, `supabase`, `ai-evals`, or `android`.

## Prompt contract
- For implementation tasks, the result must name what changed, which checks ran, and which external blockers remain.
- For every substantial status update and final handoff, include the current `MASTER_PLAN` progress in `done / total (percent%)` format; use `npm run report:master-progress` when in doubt.
- For review tasks, return prioritized findings first with file references and concise impact; do not hide findings behind a summary.
- Before increasing reasoning effort or adding more process, prefer a clearer output contract, verification loop, tool persistence rule, and dependency check.
- When context is missing, explore the repository and official docs first. Stop only on a real external blocker, not on ordinary repo discovery work.
- Do not mask provider degradation, permission gaps, or skipped verification as success.
- Autonomous writes may touch only the agent-layer allowlist from `docs/CODEX_AGENT_GOVERNANCE.md` and must keep artifacts in `output/codex-runs/agent-evolution/`.

## Data and security rules
- All business data is user-scoped by default through `user_id`.
- Every business table must have RLS enabled.
- Schema changes happen only through SQL migrations inside `supabase/migrations`.
- Admin access is separate from normal user access and must be audited.
- Never commit secrets. Use env files locally and project environment variables remotely.

## Tooling expectations
- Use local shell for repo work, npm, testing, and git.
- For any Supabase-related work in this repository, prefer Supabase MCP first and treat it as the default path.
- The canonical Supabase MCP target for this repo is `mcp__supabase-mcp-server__*` on project `nactzaxrjzsdkyfqwecf` (`https://nactzaxrjzsdkyfqwecf.supabase.co`).
- The separate Supabase MCP server `mcp__supabase-finappka__*` is reserved for project `gwqvolspdzhcutvzsdbo` (`finappka`) and must not be used for `fit` tasks.
- Before applying migrations or writing data through MCP, verify the active project with `get_project_url` if there is any doubt about server targeting.
- Use Supabase CLI only as a fallback when MCP is unavailable or cannot complete the required action.
- Use Vercel tooling for project/env/deploy setup when available.
- For deploy status and rollout confirmation, prefer Vercel MCP. If MCP is unavailable, use `vercel inspect <deployment-url-or-id> --wait` via `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- Use Playwright for browser verification flows.

## Current repository state
- The repo started as an empty bootstrap target and is now being converted into the web platform described above.
- When a feature is only partially scaffolded, prefer extending the existing slice over creating a parallel implementation.
- The `docs/` folder is the persistent handoff surface for future developers and AI agents.
- The Codex operating system rollout is tracked in `docs/CODEX_ROLLOUT_PLAN.md`.
- The agent hardening tranche for review/security/prompt-contract work is tracked in `docs/CODEX_AGENT_HARDENING_PLAN.md`.
- The orchestration/governance/autonomy tranche for the agent layer is tracked in `docs/CODEX_AGENT_AUTONOMY_PLAN.md`.
