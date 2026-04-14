# Agent Governance Guardrails for `fit`

- Self-evolving automation относится только к developer-facing agent layer.
- Allowlisted surfaces и denied surfaces должны быть одинаково зафиксированы в docs и scripts.
- Direct-to-main разрешён только после полного verification пакета и только при enable-флаге.
- Kill switch обязан останавливать write-run до commit и push.
- Registry должен быть детерминированным: никакой случайной метки времени или run-specific данных в tracked doc.
- Любой drift между `AGENTS.md`, `.codex`, skills, docs, workflows и verification — это реальная проблема handoff-контракта.
