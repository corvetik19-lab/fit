---
name: fit-prompt-contracts
description: Use when Codex must create or update AGENTS instructions, reviewer contracts, skill prompts, or developer-facing workflow docs in the fit repository. Trigger for prompt-guidance hardening, output-contract revisions, verification-loop rules, and sync work across AGENTS, code_review.md, playbooks, and skills. Do not use for generic code changes unrelated to the agent layer.
---

# fit Prompt Contracts

- Start from the repo contract in [AGENTS.md](/C:/fit/AGENTS.md) and the templates in [references/prompt-contract-patterns.md](references/prompt-contract-patterns.md).
- Prefer short, enforceable contracts over long prose: define outputs, verification, dependency checks, missing-context gating, and action safety.
- Add repository-specific rules before increasing reasoning effort or adding more agent roles.
- Keep AGENTS, reviewer docs, skills, PR templates, and `verify:codex` synchronized in the same tranche.
- If a rule cannot be verified or operationalized, either simplify it or add the matching verification guard.
