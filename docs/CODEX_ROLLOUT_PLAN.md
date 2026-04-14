# Codex Operating System Rollout

Этот документ фиксирует внедрение внутреннего agentic-контура для разработки `fit`.
Он нужен, чтобы Codex, другие AI-агенты и разработчики работали по одному и тому же
операционному контракту, а прогресс был виден через явные `[ ]` и `[x]`.

## Цель

- сделать `AGENTS.md` и вложенные инструкции реальным instruction-chain, а не
  одиночным root-файлом;
- закрепить роли агентов, skills, onboarding-поток и eval-driven workflow в
  репозитории;
- перевести Codex-практики из "знаний в чате" в проверяемую документацию и
  automation-friendly файлы;
- добавить минимальный quality gate, который защищает этот контур от деградации.

## Статус выполнения

### Волна 1. Документационный старт

- [x] Создан этот execution-doc как отдельный source of truth по внедрению Codex
  operating system.
- [x] Созданы developer-facing документы
  [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и
  [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
- [x] `README.md`, [docs/README.md](/C:/fit/docs/README.md),
  [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) синхронизированы с этим
  rollout-документом.

### Волна 2. Instruction chain

- [x] Добавлены вложенные `AGENTS.md` для `src/app`, `src/lib/ai`, `supabase`,
  `ai-evals` и `android`.
- [x] Root [AGENTS.md](/C:/fit/AGENTS.md) синхронизирован с новым Codex-потоком:
  playbook, onboarding и evaluator-first loop теперь зафиксированы прямо в
  инструкции репозитория.
- [x] В `.codex/config.toml` увеличен лимит на project instructions и добавлены
  новые agent roles для onboarding и сложных итерационных задач.

### Волна 3. Agent roles и skills

- [x] Добавлены роли `onboarding_mapper` и `eval_loop_driver` с отдельными
  конфигами в `agents/`.
- [x] Актуализированы существующие роли `explorer`, `docs_researcher`,
  `platform_verifier` под Codex workflows для `fit`.
- [x] Добавлены repo-specific skills:
  `fit-web-onboarding`, `fit-ai-eval-ops`, `fit-release-verification`.

### Волна 4. Workflow и onboarding

- [x] В playbook зафиксированы локальные аналоги официальных Codex workflows:
  объяснение кодовой базы, bugfix loop, docs update, code review и difficult
  problems.
- [x] В onboarding-доке зафиксирован обязательный формат результата при
  исследовании нового среза репозитория.
- [x] Для сложных задач закреплён evaluator/artifact loop:
  цель -> baseline -> evaluator -> артефакты -> stop condition.

### Волна 5. Verification и adoption

- [x] Добавлен скрипт [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) и npm
  команда `npm run verify:codex`.
- [x] `verify:codex` включён в CI workflow как обязательный developer-facing gate.
- [x] В документации описано, какие developer docs нужно обновлять после
  существенных tranche этого контура.

## Как использовать дальше

1. Начинать с [AGENTS.md](/C:/fit/AGENTS.md) и
   [docs/CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
2. Для operational flow использовать
   [docs/CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md).
3. После существенных изменений этого контура обновлять:
   - [docs/CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
   - [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
   - [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
   - профильные developer docs, если затронуты `AGENTS.md`, роли, skills,
     verification или onboarding.

## Подтверждение tranche

- `npm run verify:codex`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
