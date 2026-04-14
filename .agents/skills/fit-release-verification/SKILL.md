---
name: fit-release-verification
description: Use when Codex must choose and run the minimum defensible verification package for a fit repository change. Trigger for release-oriented work, pre-merge checks, production hardening slices, and when the touched area spans multiple verification surfaces. Do not use for pure implementation planning with no need to decide checks.
---

# fit Release Verification

- Always start from the touched surface and choose the narrowest proof, then add baseline gates when runtime code changed.
- Typical baseline for web runtime changes: `npm run lint`, `npm run typecheck`, `npm run build`.
- Add profile gates only when relevant:
  - `npm run verify:migrations`, `npm run verify:advisors` for DB changes;
  - `npm run test:smoke`, `npm run test:e2e:auth`, `npm run test:rls` for auth/app flow work;
  - `npm run test:retrieval-gate`, `npm run verify:retrieval-release` for AI/retrieval work;
  - `npm run verify:android-twa` for Android/TWA changes;
  - `npm run verify:codex` when touching AGENTS, skills, `.codex`, docs playbooks, or agent configs.
- If the slice affects preview/production rollout, do not stop at local checks: wait for the Vercel deployment to finish cleanly via Vercel MCP first, or fall back to `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- Report which checks passed, which were skipped, and which are blocked externally.
