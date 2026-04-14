# Codex Agent Governance

Этот документ задаёт жёсткие правила для self-evolving dev-агента внутри `fit`.
Он не распространяется на продуктовый runtime, бизнес-данные или обычные feature-tranche.

Исполняемый источник правды для automation-режима находится в
[agent-governance-config.mjs](/C:/fit/scripts/agent-governance-config.mjs).
Если prose-док и скрипт расходятся, исправлять нужно оба в одном tranche и подтверждать это через
`npm run verify:agent-governance`.

## Область действия

- Governance-контур относится только к developer-facing agent layer.
- Цель автономии — улучшать orchestration, docs, registry, skills и governance самого агента.
- Этот контур не имеет права тихо менять пользовательский продукт, данные, schema migrations,
  provider runtime или env secrets.

## Allowlisted write surfaces

- `AGENTS.md`
- `.codex/config.toml`
- `agents/*.toml`
- `.agents/skills/**`
- `code_review.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/workflows/agent-autonomy.yml`
- `docs/CODEX_AGENT_AUTONOMY_PLAN.md`
- `docs/CODEX_AGENT_GOVERNANCE.md`
- `docs/CODEX_AGENT_REGISTRY.md`
- `docs/CODEX_PLAYBOOK.md`
- `docs/CODEX_ONBOARDING.md`
- `docs/CODEX_ROLLOUT_PLAN.md`
- `docs/README.md`
- `README.md`
- `scripts/agent-governance-config.mjs`
- `scripts/agent-inventory.mjs`
- `scripts/sync-codex-agent-registry.mjs`
- `scripts/verify-agent-governance.mjs`
- `scripts/agent-evolve.mjs`
- `scripts/verify-codex.mjs`

## Denied surfaces

- `src/**`
- `supabase/migrations/**`
- `tests/**`
- `public/**`
- `.env*`
- `package-lock.json`
- `node_modules/**`
- любые secrets, publishable keys, service-role keys, webhook secrets, provider tokens

## Бюджеты и стоп-условия

- Максимум `24` изменённых файлов в одном autonomous write-run.
- Максимум `600` строк diff и `120000` байт patch на один run.
- Любая попытка выйти за allowlist или зайти в denied surface должна останавливать run до commit.
- Если working tree не чистый, autonomous write-run должен завершаться abort, а не смешивать свои правки с чужими.
- Direct-to-main push разрешён только с `main` и только при явном enable-флаге.

## Required gates

Перед любым autonomous write-run обязательны:

- `npm run verify:codex`
- `npm run verify:agent-governance`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Для dry-run governance sweep достаточно:

- `npm run verify:codex`
- `npm run verify:agent-governance`

## Kill switch и enable flags

- Локальный kill switch: `FIT_CODEX_AUTONOMY_KILL_SWITCH=1`
- Локальный/CI enable для push-режима: `FIT_CODEX_AUTONOMY_ENABLED=1`
- GitHub-side enable для scheduled direct-to-main lane: repo variable `CODEX_AGENT_AUTONOMY_ENABLED=1`

Если kill switch активен, automation имеет право только оставить artifacts и завершиться без записи в репозиторий.

## Артефакты и audit trail

Каждый evolution-run обязан писать bundle в:

- `output/codex-runs/agent-evolution/<timestamp>/agent-inventory.json`
- `output/codex-runs/agent-evolution/<timestamp>/registry-preview.md`
- `output/codex-runs/agent-evolution/<timestamp>/summary.json`
- `output/codex-runs/agent-evolution/<timestamp>/summary.md`

Если run затрагивает deploy/runtime rollout, в summary дополнительно должен быть зафиксирован
deployment target и факт того, что rollout не считался завершённым до статуса без ошибок.

Для существенных пользовательских статусов и финального handoff агент обязан показывать текущий
прогресс из `docs/MASTER_PLAN.md` в формате `done / total (percent%)`.

Для repo-tracked handoff после substantial tranche дополнительно обновляются:

- [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md)
- [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)

## Rollback

Rollback recipe для agent-autonomy изменений всегда должен быть детерминированным:

1. найти последний autonomous commit по префиксу `chore(agent-evolution):`;
2. сравнить его с предыдущим registry/doc state;
3. откатить только allowlisted agent-layer изменения обычным обратным commit, а не `reset --hard`;
4. повторно прогнать `npm run verify:codex`, `npm run verify:agent-governance`, `npm run lint`, `npm run typecheck`, `npm run build`.
