# Codex Operating System Rollout

Этот документ фиксирует состояние внутреннего agentic-контура разработки `fit`.
Он нужен, чтобы Codex, другие AI-агенты и разработчики работали по одному
операционному контракту, а ключевые правила не растворялись в истории чатов.

## Цель

- закрепить `AGENTS.md` и вложенные инструкции как реальный instruction-chain;
- сделать onboarding, role routing, verification и difficult-problem loop частью репозитория;
- держать developer-facing handoff в явных документах, а не в неформальных договорённостях;
- проверять этот контур через отдельный gate `verify:codex`.

## Текущее состояние rollout

### Волна 1. Документационный старт

- [x] Создан execution-doc [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md).
- [x] Созданы handoff-доки [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
- [x] Root-docs `README.md`, [docs/README.md](/C:/fit/docs/README.md), [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) синхронизированы с этим контуром.

### Волна 2. Instruction chain

- [x] Добавлены вложенные `AGENTS.md` для `src/app`, `src/lib/ai`, `supabase`, `ai-evals` и `android`.
- [x] Root [AGENTS.md](/C:/fit/AGENTS.md) переведён в evaluator-first режим и указывает на playbook/onboarding как на канонические источники процесса.
- [x] Конфигурация [.codex/config.toml](/C:/fit/.codex/config.toml) расширена под новые роли и больший instruction budget.

### Волна 3. Agent roles и skills

- [x] Добавлены роли `onboarding_mapper` и `eval_loop_driver`.
- [x] Существующие роли `explorer`, `docs_researcher`, `platform_verifier` привязаны к реальному workflow `fit`.
- [x] Добавлены repo-specific skills `fit-web-onboarding`, `fit-ai-eval-ops`, `fit-release-verification`.

### Волна 4. Workflow и onboarding

- [x] В playbook зафиксированы локальные аналоги официальных Codex workflows: onboarding, bugfix loop, docs work, review и difficult problems.
- [x] В onboarding-доке зафиксирован обязательный формат результата при входе в новый срез репозитория.
- [x] Для сложных задач формализован evaluator loop: `goal -> baseline -> evaluator -> artifacts -> stop condition -> escalation rule`.

### Волна 5. Verification и adoption

- [x] Добавлен [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) и npm-команда `npm run verify:codex`.
- [x] `verify:codex` включён в CI как обязательный developer-facing gate.
- [x] В документации закреплено, какие developer docs нужно обновлять после значимых tranche этого контура.

## Adoption follow-up на 2026-04-14

- [x] Difficult AI/runtime tranche по `OpenRouter`, text-only retrieval fallback и `CloudPayments` mock был проведён уже по новому evaluator-loop, а его результат зафиксирован одновременно в [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md), [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) и [docs/AI_STACK.md](/C:/fit/docs/AI_STACK.md).
- [x] Provider degradation теперь документируется как отдельный operational outcome: live embeddings blocker не маскируется под зелёный runtime, а фиксируется как внешний blocker с сохранением degrade-safe режима для продукта.
- [x] Для следующих сложных tranche разработчик обязан обновлять не только `MASTER_PLAN`, но и профильный contract-док: например, AI/runtime изменения должны отражаться в [docs/AI_STACK.md](/C:/fit/docs/AI_STACK.md), а agent/process изменения — в этом rollout-доке.

## Как использовать дальше

1. Начинать работу с [AGENTS.md](/C:/fit/AGENTS.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
2. Для повседневного operational flow использовать [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md).
3. Для сложных AI/UI/backend/release задач не пропускать evaluator loop и явно фиксировать baseline, артефакты и stop condition.
4. После каждого существенного tranche обновлять:
   - [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
   - [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
   - [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
   - профильные developer docs по затронутому домену

## Подтверждение контура

- `npm run verify:codex`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
