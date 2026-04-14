# Codex Agent Autonomy Plan

Этот execution-doc переводит agent layer `fit` из просто хорошо описанного состояния
в управляемый self-evolving контур. Цель tranche: дать dev-агенту явный orchestration flow,
жёсткие governance guards, воспроизводимый inventory/registry слой и автономный mainline lane,
который может сам сохранять agent-layer улучшения в `main`, но только внутри allowlist и после
полного verification пакета.

## Целевое состояние

- orchestration `discover -> route -> execute -> verify -> document` закреплён не только в prose docs,
  но и в ролях, skills и scripts;
- prompt-contract, governance и self-evolving loop оформлены как repo-local knowledge, а не как устные договорённости;
- у agent layer есть детерминированный inventory и синхронизируемый registry-doc;
- автономные write-runs ограничены allowlist-поверхностью agent layer, имеют kill switch, diff budget,
  обязательные проверки и audit artifacts;
- GitHub workflow умеет делать scheduled governance sweep и, при включённом флаге, direct-to-main agent evolution.

## Checklist

### Волна 1. План и execution-doc

- [x] Создан [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md) с чекбоксами прогресса.
- [x] Новый tranche связан с [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md),
  [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

### Волна 2. Orchestration и prompt system

- [x] В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлены роли `orchestrator`,
  `autonomy_guardian` и `evolution_driver`.
- [x] В `.agents/skills/` добавлены repo-local навыки `fit-agent-orchestration`,
  `fit-agent-governance` и `fit-agent-evolution`.
- [x] [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) расширен cookbook-паттернами:
  tool orchestration, prompting discipline, self-evolving loop, modernization и governance.

### Волна 3. Governance-as-code

- [x] Создан [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) с allowlist,
  denied surfaces, budget-ограничениями, required gates, stop conditions и rollback recipe.
- [x] Добавлен исполняемый governance-source [agent-governance-config.mjs](/C:/fit/scripts/agent-governance-config.mjs),
  который используется verification- и evolution-скриптами.
- [x] Добавлен новый gate `npm run verify:agent-governance`.

### Волна 4. Inventory, registry и self-evolving loop

- [x] Добавлен inventory-скрипт [agent-inventory.mjs](/C:/fit/scripts/agent-inventory.mjs).
- [x] Добавлен registry-sync [sync-codex-agent-registry.mjs](/C:/fit/scripts/sync-codex-agent-registry.mjs)
  и generated-doc [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md).
- [x] Добавлен автономный driver [agent-evolve.mjs](/C:/fit/scripts/agent-evolve.mjs) и команды
  `agent:evaluate`, `agent:evolve`, `agent:evolve:push`.

### Волна 5. CI и mainline lane

- [x] [quality.yml](/C:/fit/.github/workflows/quality.yml) теперь дополнительно прогоняет `npm run verify:agent-governance`.
- [x] Добавлен workflow [agent-autonomy.yml](/C:/fit/.github/workflows/agent-autonomy.yml) для scheduled/manual governance sweep и optional direct-to-main write lane.
- [ ] Для fully automatic push-run в GitHub остаётся внешний операционный шаг: включить repo variable `CODEX_AGENT_AUTONOMY_ENABLED=1`, если команда действительно хочет активировать scheduled direct-to-main lane.

## Пакет подтверждения

- `npm run agent:sync-registry`
- `npm run agent:evaluate`
- `npm run verify:codex`
- `npm run verify:agent-governance`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
