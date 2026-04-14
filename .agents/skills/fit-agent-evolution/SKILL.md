---
name: fit-agent-evolution
description: Use when Codex must run or improve the self-evolving loop for the fit developer agent. Trigger for inventory-driven hardening, registry synchronization, autonomous dry-runs, and direct-to-main governance lane work. Do not use for product AI runtime changes or user-facing feature work.
---

# fit Agent Evolution

- Start from [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md),
  [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) and
  [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md).
- Treat each evolution tranche as one narrow improvement with explicit artifacts and verification.
- Use `npm run agent:inventory` to snapshot the current agent layer, `npm run agent:sync-registry` to sync the registry, and `npm run verify:agent-governance` before claiming the layer is consistent.
- In autonomous write mode, change only allowlisted agent-layer files and never mask skipped verification as success.
- If the self-evolving loop wants to touch product code, migrations, env files, or secrets, stop and treat it as a governance failure.
