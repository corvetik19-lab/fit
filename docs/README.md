# Документация проекта `fit`

Эта папка — рабочая handoff-поверхность проекта. Здесь лежат не только
справочные материалы, но и живые execution-docs, по которым ведётся разработка и
фиксируется прогресс.

## Главные файлы

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) — основной production-план и
  source of truth по прогрессу.
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) — журнал реализованных tranche,
  проверок и release-срезов.
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) — план
  premium fitness-редизайна.
- [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) —
  execution-doc по полному visual refactor под reference pack `stitch_`.
- [NUTRITION_CAPTURE_OFF_PLAN.md](/C:/fit/docs/NUTRITION_CAPTURE_OFF_PLAN.md) —
  camera, barcode и Open Food Facts flow.
- [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) — hybrid retrieval,
  reranking, chunking и quality gate.
- [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md) — пользовательское руководство.

## Архитектурные и handoff-документы

- [FRONTEND.md](/C:/fit/docs/FRONTEND.md) — shell, workspace-паттерны,
  UI-контракты и frontend reliability.
- [BACKEND.md](/C:/fit/docs/BACKEND.md) — route handlers, server-side контракты
  и Supabase-потоки.
- [AI_STACK.md](/C:/fit/docs/AI_STACK.md) — AI runtime, retrieval, proposals,
  evals и release-gates.
- [DB_AUDIT.md](/C:/fit/docs/DB_AUDIT.md) — RLS, advisors, индексы и схема.
- [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md) — Android/TWA wrapper, asset
  links, signing и release.
- [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md) — точный env
  handoff для Vercel, CloudPayments, Sentry и AI runtime.

## Пакет для дизайнера

- [design-handoff/README.md](/C:/fit/docs/design-handoff/README.md) — входная
  точка в отдельный дизайнерский пакет.
- [design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md)
  — подробный экранный бриф по всем user/admin screens.

## Release и production readiness

- [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) — merge/deploy
  checklist и post-deploy smoke.
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md) — что считается production-ready
  состоянием проекта.
- [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md) — допустимые build
  warnings и правила эскалации.
- [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md)
  — миграция billing-слоя на российского провайдера.

## Правила обновления

- После каждого существенного tranche нужно обновлять
  [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
- Если меняется отдельный контур, нужно синхронизировать и его профильный
  execution-doc.
- Во всех execution-docs прогресс ведётся через `[ ]` и `[x]`.
- Developer-facing документация в проекте ведётся на русском языке.
- Секреты, реальные токены и приватные ключи в документацию не записываются.

## Рекомендуемый порядок чтения

1. Открыть [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md).
2. Посмотреть последние записи в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
3. Перейти в профильный поток:
   - UI и UX — [FRONTEND.md](/C:/fit/docs/FRONTEND.md)
   - backend и Supabase — [BACKEND.md](/C:/fit/docs/BACKEND.md)
   - AI и retrieval — [AI_STACK.md](/C:/fit/docs/AI_STACK.md),
     [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md)
   - release и readiness —
     [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md),
     [PROD_READY.md](/C:/fit/docs/PROD_READY.md)

Если задача дизайнерская, начинать лучше с
[design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md)
и [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md).
