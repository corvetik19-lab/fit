# Codex Playbook

Этот документ описывает, как Codex должен работать внутри репозитория `fit`.
Он адаптирует официальные идеи `AGENTS.md`, `Workflows`, `Iterate on difficult
problems` и `Codebase onboarding` к реальному устройству проекта.

## 1. Базовый порядок работы

1. Прочитать [AGENTS.md](/C:/fit/AGENTS.md) и вложенный `AGENTS.md` в текущем
   домене, если он есть.
2. Открыть [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и последние записи в
   [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
3. Если задача про новый срез репозитория, пройти сценарий из
   [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
4. Выбрать подходящую роль агента или skill, а не решать всё "голыми" общими
   инструкциями.
5. После реализации обновить docs, прогнать нужные проверки и зафиксировать факт
   выполнения в `MASTER_PLAN` и `AI_WORKLOG`.

## 2. Роли агентов

- `explorer` — read-only карта веб-среза: маршруты, state owners, route handlers,
  server/client seams, Supabase ownership, existing tests.
- `onboarding_mapper` — углублённый onboarding-режим для незнакомых доменов:
  должен возвращать карту модулей, risky spots, следующие файлы и минимальный
  verification plan.
- `worker` — минимальные кодовые изменения после того, как целевой срез уже
  понятен.
- `docs_researcher` — version-sensitive research по Next.js, React, Supabase,
  Vercel, AI SDK и Codex/OpenAI/MCP.
- `platform_verifier` — локальные и CI-проверки: `lint`, `typecheck`, `build`,
  `verify:*`, targeted tests.
- `browser_debugger` — Playwright/browser reproduction и capture evidence.
- `eval_loop_driver` — сложные задачи, где нужно не одно исправление, а цикл
  "измерить -> изменить -> измерить снова".

## 3. Когда использовать skills

- `fit-web-onboarding` — при входе в новый web-срез `src/app`, `src/components`,
  `src/lib`.
- `fit-ai-eval-ops` — когда меняются prompt/policy/retrieval/AI admin flow и
  нужен явный evaluator/artifact loop.
- `fit-release-verification` — когда нужно быстро понять минимальный пакет
  проверок под конкретный diff.
- Android-навыки из `.agents/skills/` использовать только для `android/` и
  связанных PWA/TWA seams.

## 4. Локальные аналоги официальных workflow

### Объяснить кодовую базу

- Сначала использовать `onboarding_mapper` или `explorer`.
- В ответе всегда требовать:
  - зону ответственности модулей;
  - где живут validation, side effects и ownership;
  - risky spots;
  - какие файлы читать следующими.

### Исправить баг

- Зафиксировать reproducible recipe.
- Найти минимальный ownership boundary.
- После фикса запускать не "всё подряд", а самый узкий доказательный verification
  пакет плюс базовые `lint`, `typecheck`, `build`, если затронут runtime-код.

### Обновить документацию

- Документация для разработчиков в `fit` ведётся на русском.
- После изменения operational flow обязательно синхронизировать
  [docs/README.md](/C:/fit/docs/README.md), а если меняется execution-срез —
  также `MASTER_PLAN` и `AI_WORKLOG`.

### Сделать review

- По умолчанию review-фокус: регрессии поведения, ownership/RLS, safety,
  missing tests и rollout risk.
- Для AI-среза отдельно проверять proposal-first contract и user isolation.

### Итерироваться по сложной задаче

Использовать явный loop:

1. `goal` — что именно должно улучшиться.
2. `baseline` — текущее состояние и наблюдаемый дефект.
3. `evaluator` — чем измеряем: `ai-evals`, `verify:*`, targeted Playwright,
   regression suite, logs.
4. `artifacts` — куда складываются результаты:
   `ai-evals/output/` или `output/codex-runs/<slug>/<timestamp>/`.
5. `stop condition` — когда считаем задачу закрытой.
6. `escalation rule` — что считается внешним blocker, а не кодовой деградацией.

## 5. Порядок использования документации и MCP

- OpenAI/Codex/MCP вопросы — через `openaiDeveloperDocs`.
- Third-party framework docs — через Context7 или официальную документацию.
- Supabase-задачи по `fit` — через `mcp__supabase_mcp_server__*`, затем
  локальные verify-команды.
- Browser-проверки — через Playwright.
- Vercel/runtime/env — через Vercel tooling и профильные `verify:*`.

## 6. Definition of Done для Codex tranche

Изменение считается доведённым до конца, если:

- обновлён код или документация по задаче;
- обновлены [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md);
- обновлены профильные developer docs, если поменялся рабочий процесс;
- прогнан минимально достаточный verification пакет;
- явно зафиксировано, какие проверки зелёные, а какие упираются во внешний
  blocker.
