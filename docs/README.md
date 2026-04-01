# Документация проекта `fit`

Эта папка — рабочая handoff-поверхность проекта. Здесь лежат не только справочные материалы, но и живые execution-docs, по которым ведётся разработка и фиксируется прогресс.

## Главные файлы

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) — основной production-план проекта и чеклист общего прогресса.
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) — журнал существенных tranche, проверок и release-срезов.
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) — execution-doc по premium fitness-редизайну web/PWA.
- [NUTRITION_CAPTURE_OFF_PLAN.md](/C:/fit/docs/NUTRITION_CAPTURE_OFF_PLAN.md) — завершённый execution-doc по камере еды, barcode flow и Open Food Facts.
- [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) — execution-doc по hybrid retrieval, reranking, chunking и retrieval quality gate.
- [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md) — подробное пользовательское руководство.

## Архитектурные и handoff-документы

- [FRONTEND.md](/C:/fit/docs/FRONTEND.md) — shell, workspace-паттерны, UX-контракты и клиентские правила.
- [BACKEND.md](/C:/fit/docs/BACKEND.md) — маршруты, server-side контракты, Supabase и backend-потоки.
- [AI_STACK.md](/C:/fit/docs/AI_STACK.md) — runtime AI, retrieval, proposals, evals и quality gate.
- [AI_EXPLAINED.md](/C:/fit/docs/AI_EXPLAINED.md) — расширённое объяснение AI-архитектуры и терминов.
- [DB_AUDIT.md](/C:/fit/docs/DB_AUDIT.md) — актуальный аудит схемы, RLS, RPC, advisors и индексов.
- [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md) — handoff по Android/TWA wrapper, asset links, signing и release.

## Release и production readiness

- [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) — release-процедура перед merge/deploy и post-deploy smoke.
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md) — критерии production-ready состояния.
- [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md) — точный handoff по Vercel env, CloudPayments, Sentry и live runtime-проверкам.
- [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md) — допустимые build warnings и правила эскалации.

## Правила обновления

- После каждого существенного tranche нужно обновлять [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
- Если меняется отдельный контур, нужно синхронизировать и профильный execution-doc или handoff-документ.
- Во всех execution-docs прогресс ведётся через `[ ]` и `[x]`.
- Документация для разработчиков в этом проекте ведётся на русском языке.
- Секреты, реальные токены и приватные ключи в документацию не записываются.

## Рекомендуемый порядок чтения

1. Сначала открыть [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md).
2. Затем посмотреть последние записи в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
3. После этого перейти в профильный document flow:
   - UI и UX — [FRONTEND.md](/C:/fit/docs/FRONTEND.md)
   - backend и Supabase — [BACKEND.md](/C:/fit/docs/BACKEND.md)
   - AI и retrieval — [AI_STACK.md](/C:/fit/docs/AI_STACK.md), [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md)
   - release и readiness — [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md)

Если задача пользовательская, можно начать с [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md), а затем уже переходить к инженерной документации.
