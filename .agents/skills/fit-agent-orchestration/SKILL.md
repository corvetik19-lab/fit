---
name: fit-agent-orchestration
description: Use when Codex must route a fit developer workflow through explicit discover -> route -> execute -> verify -> document orchestration instead of improvising. Trigger for multi-step agent-layer changes, cross-doc/process sync, and cookbook-style workflow assembly. Do not use for isolated product code edits whose target path is already obvious.
---

# fit Agent Orchestration

- Start from [AGENTS.md](/C:/fit/AGENTS.md), [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md),
  [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md) and
  [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md).
- Build a short pipeline before editing: discover the target surface, route ownership to the right role or skill, execute the slice, verify it, then sync docs and handoff.
- Prefer existing repo-local roles and skills over inventing new special-case process in the prompt.
- If the task touches the agent layer itself, record which scripts, docs, skills, and verification gates must stay synchronized.
- For difficult multi-step work, keep artifacts in `output/codex-runs/<slug>/<timestamp>/` or
  `output/codex-runs/agent-evolution/<timestamp>/`.
