# Документация проекта `fit`

Эта папка — рабочая handoff-поверхность проекта. Здесь лежит не только справочная информация, но и текущий production-hardening backlog, на который должна опираться дальнейшая разработка.

## Главные файлы

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) — основной production-hardening план проекта и чеклист прогресса.
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) — хронологический журнал существенных изменений и проверок.
- [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) — отдельный execution doc по hybrid retrieval, reranking, chunking и retrieval eval для AI-слоя.
- [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md) — подробное пользовательское руководство по приложению.
- [AI_EXPLAINED.md](/C:/fit/docs/AI_EXPLAINED.md) — подробное объяснение AI-архитектуры: RAG, CAG, KAG, Ragas и рабочего AI-контура в `fit`.
- [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md) — Android/TWA handoff: package name, asset links, signing и Play metadata.
- [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) — релизный чеклист для merge, deploy и post-deploy smoke.
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md) — критерии production-ready состояния: automated gates, manual acceptance, env readiness и release blockers.
- [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md) — реестр известных допустимых build warnings и правила эскалации.
- [DB_AUDIT.md](/C:/fit/docs/DB_AUDIT.md) — актуальный аудит Supabase-схемы, RLS, RPC, advisors и индексных путей.
- [FRONTEND.md](/C:/fit/docs/FRONTEND.md) — состояние фронтенда, shell, UX-срезов и клиентских контрактов.
- [BACKEND.md](/C:/fit/docs/BACKEND.md) — backend-контракты, Supabase, маршруты, RLS и server-side потоки.
- [AI_STACK.md](/C:/fit/docs/AI_STACK.md) — технический стек AI, модели, runtime и retrieval-слой.

## Правила обновления

- После каждого существенного изменения обновлять [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
- Если изменение затрагивает отдельный контур, синхронизировать и профильный документ: `FRONTEND.md`, `BACKEND.md`, `AI_STACK.md`, `USER_GUIDE.md` или `RAG_V2_EXECUTION.md`.
- Перед релизом и после production deploy проходить [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md).
- Выполненные пункты в execution docs отмечать как `[x]`, незакрытые — как `[ ]`.
- Документация для разработчиков в этом проекте ведётся на русском языке.
- Секреты, реальные токены и приватные ключи в документацию не записывать.

## Рекомендуемый порядок чтения

1. Сначала открыть [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md).
2. Затем посмотреть последние записи в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
3. После этого перейти в профильный документ нужного контура.

Исключение: если задача пользовательская, сначала можно открыть [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md), а уже потом переходить к технической документации.
