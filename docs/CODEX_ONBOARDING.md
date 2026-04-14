# Codex Onboarding

Этот документ задаёт обязательный onboarding-поток для Codex и разработчиков,
которые заходят в новый срез репозитория `fit`.

## 1. Стартовый порядок чтения

1. [AGENTS.md](/C:/fit/AGENTS.md)
2. Если задача связана с review или security, [code_review.md](/C:/fit/code_review.md)
3. [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
4. Последние записи в [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
5. [docs/README.md](/C:/fit/docs/README.md)
6. Профильный документ домена

## 2. Домены и стартовые точки

### Web shell и App Router

- Стартовые точки: `src/app`, `src/components`, `src/lib`.
- Обязательно понять:
  - route segment и layout chain;
  - server/client boundary;
  - state owner;
  - где живут side effects и data fetching;
  - existing smoke/e2e coverage.

### AI и retrieval

- Стартовые точки:
  [AI_STACK.md](/C:/fit/docs/AI_STACK.md),
  [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md),
  `src/lib/ai`, `src/app/api/ai`, `ai-evals`.
- Обязательно понять:
  - proposal-first flow;
  - user-scoped retrieval;
  - evaluator surface;
  - provider/runtime blockers.

### Supabase и RLS

- Стартовые точки: `supabase/migrations`, [DB_AUDIT.md](/C:/fit/docs/DB_AUDIT.md),
  [BACKEND.md](/C:/fit/docs/BACKEND.md).
- Обязательно понять:
  - owner-only контур;
  - что идёт через service-role;
  - как подтверждается migration discipline;
  - какие route handlers завязаны на RLS.

### Admin и operator surfaces

- Стартовые точки: `src/app/admin`, `src/components/admin-*`,
  [FRONTEND.md](/C:/fit/docs/FRONTEND.md).
- Обязательно понять:
  - operator entrypoints;
  - какие действия должны audit-логироваться;
  - где sensitive data и admin-only gates;
  - как это проверяется в e2e.

### Android / TWA

- Стартовые точки: `android/`,
  [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md),
  repo skills `fit-android-*`.
- Обязательно понять:
  - что приходит из PWA shell;
  - какие deep links и packaging assumptions зафиксированы;
  - какие verify-команды обязательны.

### AI eval workspace

- Стартовые точки: `ai-evals/README.md`, `ai-evals/fit_eval`,
  `ai-evals/datasets`.
- Обязательно понять:
  - suite names;
  - metric gates;
  - provider requirements;
  - где лежат output artifacts.

## 3. Формат результата после onboarding

После первичного анализа агент обязан вернуть:

1. краткую карту среза;
2. список ключевых модулей и их responsibility;
3. data flow / request flow;
4. risky spots и hidden constraints;
5. какие файлы читать следующими;
6. минимальный verification plan для изменений в этом срезе.
7. какой reviewer skill или role нужен, если задача дальше переходит в review
   или security-аудит.

Если этих пунктов нет, onboarding считается незавершённым.

## 4. Когда onboarding обязателен

- новый домен, в котором агент ещё не работал в текущем tranche;
- большой refactor в незнакомой части репозитория;
- high-risk AI/backend/RLS работа;
- bugfix, где причина не очевидна из одного файла.
- review/security задача, где diff пересекает несколько ownership boundaries.

Если задача локальная и ownership уже понятен, можно сразу переходить к
реализации.
