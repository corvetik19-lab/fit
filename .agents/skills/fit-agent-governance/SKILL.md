---
name: fit-agent-governance
description: Use when Codex must enforce or update the governance rules for the fit self-evolving developer agent. Trigger for allowlists, kill switches, diff budgets, verification requirements, autonomous write policy, and audit-trail maintenance. Do not use for ordinary product implementation.
---

# fit Agent Governance

- Start from [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) and
  [references/agent-governance-guardrails.md](references/agent-governance-guardrails.md).
- Treat governance as executable policy: if a rule matters, it should appear in docs and in a verification or automation script.
- Keep allowlisted write surfaces narrow and agent-layer only.
- Any autonomous write must have a clean working tree, required gates, artifacts, and a deterministic rollback path.
- Prefer aborting or leaving a visible blocker over silently widening the autonomous write surface.
