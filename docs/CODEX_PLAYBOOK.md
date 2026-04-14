# Codex Playbook

Этот документ описывает, как Codex должен работать внутри репозитория `fit`.
Он адаптирует официальные идеи `AGENTS.md`, `Workflows`, `Iterate on difficult
problems` и `Codebase onboarding` к реальному устройству проекта.

## 1. Базовый порядок работы

1. Прочитать [AGENTS.md](/C:/fit/AGENTS.md) и вложенный `AGENTS.md` в текущем
   домене, если он есть.
2. Если задача про review, security или workflow drift, открыть
   [code_review.md](/C:/fit/code_review.md) до начала анализа diff.
3. Открыть [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и последние записи в
   [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
4. Если задача про новый срез репозитория, пройти сценарий из
   [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
5. Выбрать подходящую роль агента или skill, а не решать всё "голыми" общими
   инструкциями.
6. После реализации обновить docs, прогнать нужные проверки и зафиксировать факт
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
- `pr_reviewer` — read-only review по diff, commit или PR с findings-first
  результатом.
- `security_reviewer` — focused review на auth, RLS, privileged boundaries,
  secrets, billing и runtime safety.
- `prompt_contract_editor` — правки `AGENTS.md`, review docs, skills и
  prompt-guidance контрактов.
- `workflow_maintainer` — PR template, GitHub review flow, `verify:codex` и
  developer-facing process слой.

## 3. Когда использовать skills

- `fit-web-onboarding` — при входе в новый web-срез `src/app`, `src/components`,
  `src/lib`.
- `fit-ai-eval-ops` — когда меняются prompt/policy/retrieval/AI admin flow и
  нужен явный evaluator/artifact loop.
- `fit-release-verification` — когда нужно быстро понять минимальный пакет
  проверок под конкретный diff.
- `fit-pr-review` — когда нужен локальный `/review`, PR review или triage
  diff-рисков.
- `fit-security-review` — когда нужен security-focused review по Next.js,
  Supabase, admin, billing, webhook или AI/runtime слоям.
- `fit-prompt-contracts` — когда меняются инструкции агента, reviewer contract
  или developer-facing workflow docs.
- `fit-github-review-ops` — когда меняется GitHub-facing review process,
  PR template или `@codex review` workflow.
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

- Начинать с [code_review.md](/C:/fit/code_review.md) и ближайшего доменного
  `AGENTS.md`.
- По умолчанию review-фокус: регрессии поведения, ownership/RLS, safety,
  missing tests, rollout risk и docs/process drift.
- Для AI-среза отдельно проверять proposal-first contract, user isolation,
  evaluator coverage и provider fallback behavior.
- Для локального review использовать `/review` и `review_model`, а не
  импровизированный свободный prompt.
- Для GitHub-режима поддерживать два сценария:
  - automatic review как advisory-first;
  - manual follow-up через `@codex review` или
    `@codex review for security regressions`.

### Усилить prompt contract

- Для агентных workflow использовать короткие блоки:
  `output contract`, `verification loop`, `tool persistence rules`,
  `dependency checks`, `missing context gating`, `action safety`.
- Перед повышением reasoning effort сначала уточнять контракт результата и
  evaluator loop.
- Если workflow повторяется, сначала оформлять его как repo skill, а уже потом
  как GitHub или automation surface.

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

## 6. GitHub review contour

- Repo-side contract для GitHub review живёт в:
  - [AGENTS.md](/C:/fit/AGENTS.md)
  - [code_review.md](/C:/fit/code_review.md)
  - [PULL_REQUEST_TEMPLATE.md](/C:/fit/.github/PULL_REQUEST_TEMPLATE.md)
  - [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md)
- Автоматический review в `fit` трактуется как advisory-first и не заменяет
  quality gates.
- Ручные комментарии на PR должны задавать конкретный фокус, если нужен не
  общий review, а security/docs/AI/runtime follow-up.
- Любое изменение GitHub review process должно синхронно обновлять AGENTS,
  `code_review.md`, playbook, rollout-docs и `verify:codex`.

## 7. Definition of Done для Codex tranche

Изменение считается доведённым до конца, если:

- обновлён код или документация по задаче;
- обновлены [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md);
- обновлены профильные developer docs, если поменялся рабочий процесс;
- прогнан минимально достаточный verification пакет;
- явно зафиксировано, какие проверки зелёные, а какие упираются во внешний
  blocker.
