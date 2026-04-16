# Документация проекта `fit`

Эта папка — рабочая handoff-поверхность проекта. Здесь лежат не только справочные
материалы, но и живые execution-docs, по которым ведётся разработка и фиксируется прогресс.

## Главные файлы

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) — основной production-план и source of truth по прогрессу.
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) — журнал реализованных tranche, проверок и release-срезов.
- [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md) — пользовательское руководство.
- [AI_EXPLAINED.md](/C:/fit/docs/AI_EXPLAINED.md) — локальный explanatory-документ по AI-контуру.

## Архитектурные и handoff-документы

- [FRONTEND.md](/C:/fit/docs/FRONTEND.md) — активный frontend source of truth.
- [BACKEND.md](/C:/fit/docs/BACKEND.md) — route handlers, server-side контракты и Supabase-потоки.
- [AI_STACK.md](/C:/fit/docs/AI_STACK.md) — AI runtime, retrieval, proposals, evals и release-gates.
- [DB_AUDIT.md](/C:/fit/docs/DB_AUDIT.md) — RLS, advisors, индексы и схема.
- [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md) — Android/TWA wrapper, signing, assets и release-поток.
- [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md) — точный env-handoff для billing, Sentry, AI runtime и Android rollout.

## Активные execution-docs

- [LIGHT_COMPACT_REDESIGN_EXECUTION.md](/C:/fit/docs/LIGHT_COMPACT_REDESIGN_EXECUTION.md) — новый светлый compact mobile-first redesign.
- [NUTRITION_CAPTURE_OFF_PLAN.md](/C:/fit/docs/NUTRITION_CAPTURE_OFF_PLAN.md) — camera, barcode и Open Food Facts flow.
- [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) — hybrid retrieval, reranking, chunking и AI quality gate.
- [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) — миграция billing-слоя на российского провайдера.

## Исторические execution-docs

- [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md) — закрытый предыдущий dark utility redesign-срез.
- [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) — закрытый предыдущий redesign-срез.
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) — закрытый premium redesign baseline.

## Codex operating system

- [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
- [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md)
- [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md)
- [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md)
- [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md)
- [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md)
- [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md)
- [code_review.md](/C:/fit/code_review.md)

## Пакет для дизайнера

- [design-handoff/README.md](/C:/fit/docs/design-handoff/README.md)
- [design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md)
- [design-handoff/DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md)
- [design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md)

## Release и production readiness

- [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md)
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md)
- [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md)

## Правила обновления

- После каждого существенного tranche обновлять [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
- Если меняется отдельный контур, синхронизировать и его профильный execution-doc.
- Во всех execution-docs прогресс вести через `[ ]` и `[x]`.
- Developer-facing документация ведётся на русском языке.
- Для пользовательского статуса по плану использовать `npm run report:master-progress`.

## 2026-04-16 UI consistency

- Активный execution-doc по мобильной UI-санации: [UI_CONSISTENCY_MOBILE_EXECUTION.md](/C:/fit/docs/UI_CONSISTENCY_MOBILE_EXECUTION.md)
- Основные артефакты текущего tranche: вход, shell, PageWorkspace и `/nutrition`.

## 2026-04-16 Mobile style refinement

- Активный follow-up execution-doc по следующей волне мобильной доводки: [MOBILE_STYLE_REFINEMENT_EXECUTION.md](/C:/fit/docs/MOBILE_STYLE_REFINEMENT_EXECUTION.md)
- Основные артефакты: `output/mobile-login-refined.png`, `output/mobile-dashboard-refined.png`, `output/mobile-nutrition-refined.png`, `output/mobile-ai-refined.png`, `output/mobile-settings-refined.png`
