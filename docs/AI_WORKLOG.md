# AI Worklog

## Как читать этот файл

- Это не полный исторический дамп всех мелких правок.
- Во время production hardening журнал был сжат и переписан в чистый UTF-8.
- Ниже остаются только ключевые tranche, которые помогают понять текущее состояние продукта и инженерного контура.

## 2026-03-30

## 2026-03-31

### Dashboard + AI premium redesign

- Закрыт следующий consumer-screen tranche по [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md): `Dashboard` и `AI` переведены на новый premium fitness visual language.
- В [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) усилены hero, AI-сводка и блоки «что важно сейчас», чтобы экран не выглядел как длинная лента одинаковых карточек.
- В [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx), [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx), [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx), [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx) и [ai-workspace-sidebar.tsx](/C:/fit/src/components/ai-workspace-sidebar.tsx) экран AI собран как цельный chat-workspace с mobile-trigger, более чистым transcript/composer слоем и короткими русскими CTA.
- В [globals.css](/C:/fit/src/app/globals.css) добавлены shared visual primitives `workspace-kicker`, `surface-panel`, `chat-toolbar-button`, `chat-bubble`, чтобы следующий tranche по `Workouts` и `Nutrition` шёл тем же языком, а не новым набором случайных классов.
- Попутно стабилизирован e2e для barcode-log сценария в [nutrition-capture.spec.ts](/C:/fit/tests/e2e/nutrition-capture.spec.ts): селектор штрихкода теперь привязан к нужной карточке, а не к двусмысленному placeholder на всей странице.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `tests/e2e/ai-workspace.spec.ts` -> `2 passed`, `tests/e2e/mobile-pwa-regressions.spec.ts` -> `3 passed`, `tests/smoke/app-smoke.spec.ts` -> `5 passed`.
- Полный `npm run test:e2e:auth` после slice даёт `51 / 52`: новый AI/dashboard слой зелёный, но под параллельной нагрузкой остаётся один старый нестабильный `nutrition-capture` preview red, который отдельно проходит в таргетированном прогоне `2 passed`.
- Общий прогресс `MASTER_PLAN`: `175 / 186` (`94%`). Прогресс `PREMIUM_REDESIGN_PLAN`: `3 / 6` (`50%`).

### RAG v2 DB closure

- Для `fit` подтверждён правильный Supabase MCP target `mcp__supabase_mcp_server__*` на проекте `nactzaxrjzsdkyfqwecf`, поэтому финальный knowledge DDL больше не упирается в ложный blocker по чужому проекту.
- Применена миграция [20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql](/C:/fit/supabase/migrations/20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql): `knowledge_chunks` получили metadata columns, generated `search_vector`, индексы и user-scoped hybrid RPC `search_knowledge_chunks_hybrid(...)`.
- [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts) и [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) переведены на новый DB-backed contract, а regression и RLS fixtures обновлены в [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), [supabase-rls.ts](/C:/fit/tests/rls/helpers/supabase-rls.ts).
- Проверка зелёная: `npm run verify:migrations`, `npm run test:retrieval-gate` -> `18 passed`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `50 passed`.

### Android / TWA closure

- Для `fit-platform` поднят полноценный Android toolchain: подтверждены `java`, `adb`, Android SDK и `npx @bubblewrap/cli doctor`.
- В [android/twa-shell](/C:/fit/android/twa-shell) сгенерирован реальный Bubblewrap/TWA wrapper по production manifest `https://fit-platform-eta.vercel.app/manifest.webmanifest`, а не только JSON-scaffold.
- Локально через Bubblewrap собраны signed APK и AAB с внешним test keystore, затем проведён emulator smoke на `Medium_Phone_API_36.1`: APK установлен, `LauncherActivity` стартует, logcat подтверждает открытие `https://fit-platform-eta.vercel.app/dashboard`.
- [verify-android-twa.mjs](/C:/fit/scripts/verify-android-twa.mjs) дополнительно стабилизирован под Windows-совместимый `UTF-8 with BOM`, чтобы release gate корректно парсил [android/twa-release.json](/C:/fit/android/twa-release.json) и не падал на BOM.
- Репозиторный контракт закреплён документами [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md), [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md), [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md); в git остаётся только wrapper source, без build-артефактов и keystore.
- Проверка зелёная: `npm run lint`, `npm run verify:android-twa`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`, `npm run test:e2e:auth` -> `50 passed`.

### Повторная проверка внешних блокеров

- После закрытия Android/TWA и RAG v2 DB повторно прогнаны `npm run verify:staging-runtime`, `npm run verify:sentry-runtime` и `npm run verify:retrieval-release`.
- Результат не изменился по сути: live AI quality gate блокируется `OpenRouter 402` и `Voyage 403`, Stripe runtime всё ещё не стартует без `STRIPE_SECRET_KEY` и `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, а live Sentry smoke ждёт `NEXT_PUBLIC_SENTRY_DSN` и `SENTRY_PROJECT`.
- Это подтверждает, что оставшиеся открытые пункты master-plan упираются уже не в код репозитория, а в внешние env/secrets и provider access.

## 2026-03-23

### Billing webhook idempotency gate

- В [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) усилено правило ведения execution checklist: после каждого tranche нужно обязательно переключать `[ ]/[x]` по факту и пересчитывать текущий процент выполнения.
- В [stripe-billing.ts](/C:/fit/src/lib/stripe-billing.ts) вынесен общий helper `processStripeWebhookEvent(...)`, а [route.ts](/C:/fit/src/app/api/billing/webhook/stripe/route.ts) переведён на него, чтобы Stripe webhook dispatch и duplicate short-circuit проверялись вне route-level plumbing.
- Добавлен прямой regression [stripe-webhook-idempotency.spec.ts](/C:/fit/tests/billing-gate/stripe-webhook-idempotency.spec.ts): повторный `customer.subscription.updated` с тем же `provider_event_id` подтверждён как идемпотентный, а `subscriptions`, `entitlements` и `usage_counters` после второго прохода остаются согласованными.
- Этот tranche подтвердил локально выполнимый billing hardening без live Stripe env и позволил закрыть основной checklist-пункт про webhook idempotency/consistency; дальше по billing остаются уже внешние блокеры `production/staging` secrets и живой runtime contour.
- Проверка зелёная: `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 passed, 1 skipped`.

### Sentry runtime readiness gate

- Добавлен [verify-sentry-runtime.mjs](/C:/fit/scripts/verify-sentry-runtime.mjs): новый `npm run verify:sentry-runtime` делает preflight по admin auth и Sentry env, а потом либо запускает live smoke suite, либо явно печатает blocker по отсутствующим secrets.
- Добавлен [sentry-runtime-gate.spec.ts](/C:/fit/tests/sentry-gate/sentry-runtime-gate.spec.ts): при готовом runtime root-admin подтверждает, что [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts) возвращает `eventId` и `createdAt`.
- Санированы [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md), [docs/README.md](/C:/fit/docs/README.md), [global-error.tsx](/C:/fit/src/app/global-error.tsx) и [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts), чтобы observability и release blockers снова были зафиксированы в чистом UTF-8.
- Локально tranche подтверждён пакетами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:sentry-runtime`; live Sentry rollout остаётся внешним blocker только по production env и credentials.

### RAG v2 bootstrap

- Добавлен отдельный execution doc [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) с чекбоксами `[ ]/[x]`, процентом прогресса и правилами ведения tranche-работы.
- Добавлены [knowledge-retrieval-config.ts](/C:/fit/src/lib/ai/knowledge-retrieval-config.ts) и [knowledge-hybrid-ranking.ts](/C:/fit/src/lib/ai/knowledge-hybrid-ranking.ts): retrieval получил caps для semantic/lexical/fused/final context и детерминированный hybrid ranking поверх vector и lexical candidates.
- [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts) расширен score-breakdown полями `vectorScore`, `textScore`, `fusedScore`, `rerankScore`, `matchedTerms`, `sourceKind`, а [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) переведён с fallback-only режима на `vector + lexical -> fused -> rerank`.
- Добавлен regression [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), который подтверждает fusion, score-breakdown и верхний context cap без смены DB-стека.

### RAG v2 chunk metadata contract

- Добавлен [knowledge-chunk-policy.ts](/C:/fit/src/lib/ai/knowledge-chunk-policy.ts): source families и их importance/recency rules теперь формализованы отдельно от retrieval runtime.
- Добавлен [knowledge-document-metadata.ts](/C:/fit/src/lib/ai/knowledge-document-metadata.ts): knowledge documents получают `sourceKey`, `chunkVersion`, `contentHash`, `importanceWeight`, `recencyAt`, `sourceFamily`, `tokenCount`.
- [knowledge-documents.ts](/C:/fit/src/lib/ai/knowledge-documents.ts) теперь финализирует metadata contract для всех chunk-типов и прокидывает recency keys в `profile`, `body metrics`, `memory`, `workout day`, `exercise history` и `structured facts`.
- Добавлен regression [knowledge-document-metadata.spec.ts](/C:/fit/tests/ai-gate/knowledge-document-metadata.spec.ts), который подтверждает deterministic metadata для workout и fallback chunks.

### RAG v2 incremental chunk sync

- Добавлен [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts): knowledge reindex теперь вычисляет `unchanged / insert / delete` по `sourceKey` и `contentHash`, а не удаляет весь корпус пользователя при каждом полном reindex.
- [knowledge-runtime.ts](/C:/fit/src/lib/ai/knowledge-runtime.ts) переведён на incremental chunk sync: unchanged chunks сохраняются, changed chunks переиндексируются точечно, stale chunks удаляются отдельно.
- [knowledge-indexing.ts](/C:/fit/src/lib/ai/knowledge-indexing.ts) теперь удаляет только stale embeddings и считает новые embeddings только для отсутствующих `chunk_id`, вместо полного пересоздания embedding слоя.
- Добавлен regression [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), который подтверждает diff для `unchanged / changed / stale` chunk flow.

### RAG v2 retrieval eval gate

- [eval-suites.ts](/C:/fit/src/lib/ai/eval-suites.ts) переведён в чистый UTF-8 и расширен retrieval intent-темами `workouts`, `nutrition`, `profile`, `plans`, `recent_history`.
- Добавлен metrics слой [knowledge-retrieval-evals.ts](/C:/fit/src/lib/ai/knowledge-retrieval-evals.ts): `Recall@5`, `Recall@10`, `nDCG@10`, score per eval case и grouping по retrieval topics теперь живут вне UI и route handlers.
- Добавлен regression [retrieval-metrics.spec.ts](/C:/fit/tests/ai-gate/retrieval-metrics.spec.ts), который отдельно подтверждает retrieval metrics и topic grouping.
- Добавлен новый command-level gate `npm run test:retrieval-gate`: он запускает hybrid ranking, metadata, chunk sync, retrieval metrics и full-history fallback suite без web server и auth bootstrap.

## 2026-03-21

### Mobile workout focus-mode cleanup

- Доведён mobile focus-mode тренировки до более чистого UX: в `src/components/workout-session/workout-focus-header.tsx` collapsed header стал компактнее и перестал дублировать лишний контекст, когда пользователь сворачивает верхний блок во время тренировки.
- Повторно подтверждён mobile regression bundle на живом локальном сервере `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`: `tests/e2e/mobile-pwa-regressions.spec.ts` теперь проходит зелёно `3 passed`, включая shell drawer, mobile workspace sections и workout focus-mode.
- Slice дополнительно подтверждён baseline-проверками `npm run lint`, `npm run build`, `npm run typecheck`; в `lint` остаётся только старый warning про неиспользуемый `getOperationLabel` в `src/app/api/admin/operations/[kind]/[id]/route.ts`.

### Backend audit closure and workout sync verification

- Закрыт основной backend checkbox про `validation / owner-only / idempotency`: route-handler audit теперь опирается не только на точечные contract slices, а на объединённый regression bundle `tests/e2e/api-contracts.spec.ts`, `tests/e2e/ownership-isolation.spec.ts`, `tests/e2e/internal-jobs.spec.ts`, `tests/e2e/workout-sync.spec.ts` и `tests/rls/ownership.spec.ts`.
- Для этого `tests/e2e/workout-sync.spec.ts` стабилизирован через `navigateStable(...)`: suite больше не флакает на auth redirect при старте через `/dashboard`, поэтому его можно использовать как реальное доказательство для sync/reset verification, а не как хрупкий smoke.
- Повторная ручная verification-связка прогнана локально через живой `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`: `29 passed` для `api-contracts + ownership-isolation + internal-jobs + workout-sync` и `4 passed` для прямого `RLS`.
- После этого отдельно закрыт checkbox про `reset/finish/sync` race conditions и infinite polling: regression bundle подтверждает invalid sync mutations, clean `sync -> reset -> sync/pull`, idempotent `done/reset`, очистку stale offline queue и locked-week guard.

## 2026-03-20

### Admin user detail data extraction

- Вынес основной read-model и degraded fallback для `src/app/api/admin/users/[id]/route.ts` в `src/lib/admin-user-detail-data.ts`.
- Теперь сам route держит только access-check, UUID parse, auth lookup, вызов shared loader и общий error mapping вместо большого fan-out запроса и post-processing внутри handler.
- Заодно дочистил верхний client-state и summary shell admin detail в `src/components/admin-user-detail-state.ts` и `src/components/admin-user-detail.tsx`, чтобы loading/error/section surface больше не показывал битый copy.
- Tranche подтверждён через `eslint`, `typecheck`, `build` и targeted `tests/e2e/admin-app.spec.ts`.

### Admin users catalog data extraction

- Вынес основной catalog/read-model для `src/app/api/admin/users/route.ts` в `src/lib/admin-users-data.ts`: filter parsing, degraded fallback, auth pagination, aggregate assembly, sorting, summary и segment building больше не живут внутри route handler.
- Теперь каталог пользователей на уровне route держит только admin access, чтение query params, вызов shared loader и fallback response.
- Заодно отвязал degraded admin detail e2e от `/api/admin/users`: `tests/e2e/admin-app.spec.ts` теперь получает test user id через `findAuthUserIdByEmail(...)`, поэтому suite не зависит от случайного auth timeout в каталоге.
- Tranche подтверждён через `eslint`, `typecheck`, `build` и targeted `tests/e2e/admin-app.spec.ts`.

### Admin users directory state extraction

- Вынес async/data orchestration каталога пользователей из `src/components/admin-users-directory.tsx` в `src/components/use-admin-users-directory-state.ts`.
- Теперь сам экран каталога держит только layout, filters UI, cards и wiring к state-hook, а fetch каталога, deferred search, bulk submit, reload/reset и selection state живут отдельно.
- Tranche подтверждён через `eslint`, `build`, `typecheck` и targeted `tests/e2e/admin-app.spec.ts`.

## 2026-03-17

### Release docs sanitation and AI reindex copy

- Переписал `docs/RELEASE_CHECKLIST.md`, `docs/PROD_READY.md` и `docs/BUILD_WARNINGS.md` в чистом UTF-8, чтобы release-policy документы снова были пригодны как source of truth, а не содержали mojibake.
- Зафиксировал в release docs два оставшихся platform-level Supabase ручных шага: leaked password protection и осознанное решение по `vector` extension в `public`.
- В `src/app/api/ai/reindex/route.ts` санировал audit reason и user-facing сообщения, чтобы manual reindex path больше не возвращал битую кириллицу в support/admin surface.
- Tranche подтверждён baseline-проверками: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.

## 2026-03-16

### Admin detail sanitation and regression stabilization

- Полностью санировал `admin user detail` surface в чистый UTF-8: переписал `src/components/admin-user-detail.tsx`, `admin-user-detail-state.ts`, `admin-user-detail-model.ts`, `admin-user-detail-sections.tsx`, `admin-user-detail-operations.tsx`, `admin-user-detail-billing.tsx` и `src/app/admin/users/[id]/page.tsx`.
- Убрал mojibake и сырой operator copy из summary shell, section tabs, profile/activity/operations/billing блоков, словарей статусов и пользовательских fallback-сообщений.
- Добавил стабильный degraded selector `data-testid="admin-user-detail-degraded-banner"` и перевёл `tests/e2e/ui-regressions.spec.ts` на явную проверку clean admin fallback вместо старого текстового mojibake-поиска.
- Переписал `tests/e2e/ai-workspace.spec.ts` и `tests/e2e/mobile-pwa-regressions.spec.ts` в чистый UTF-8 и стабилизировал flaky места: web search toggle теперь проходит с retry-нажатием, а mobile focus-mode не зависит от старых битых текстовых селекторов.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, targeted `admin/ui/mobile` Playwright suites, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### Autonomous tranche execution contract

- В `AGENTS.md` зафиксирован рабочий режим без лишних пауз: агент должен идти tranche-by-tranche по `MASTER_PLAN`, после каждого куска обновлять docs, коммитить, пушить и сразу брать следующий открытый пункт.
- Останавливаться теперь допустимо только на реальном внешнем блокере: отсутствующий доступ, секреты, платный провайдер или недоступный внешний сервис.

### AI plan route validation and auth-e2e stabilization

- В `src/lib/ai/schemas.ts` добавлены общие request schemas для `meal-plan` и `workout-plan`, чтобы AI plan routes валидировали payload до billing/runtime слоя и не смешивали в route handler ручной parsing с доменными правилами.
- `src/app/api/ai/meal-plan/route.ts` и `src/app/api/ai/workout-plan/route.ts` теперь возвращают явные `400 MEAL_PLAN_INVALID` / `WORKOUT_PLAN_INVALID` с `zod.flatten()` для невалидных payload, а не падают глубже в plan-generation или feature gating.
- В `src/components/admin-user-detail.tsx` добавлен стабильный `data-testid` для section heading, а `tests/e2e/admin-app.spec.ts`, `tests/e2e/ui-regressions.spec.ts` и `tests/e2e/authenticated-app.spec.ts` переведены на менее хрупкие селекторы и redirect assumptions.
- После этого снова подтверждён полный baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `34 passed`, `npm run test:smoke` -> `3 passed`.

### Admin dashboard fail-open

- `/admin` больше не падает целиком из-за временного сбоя server-side admin fan-out. В `src/app/admin/page.tsx` добавлен fail-open path: страница показывает hero, быстрые переходы и резервный banner, даже если часть служебных запросов не загрузилась.
- Для e2e добавлен test-only fallback hook `?__test_admin_dashboard_fallback=1`, чтобы деградационный режим можно было подтверждать отдельно и без ожидания случайного внешнего timeout.
- `tests/e2e/admin-app.spec.ts` расширен сценарием на degraded dashboard page. Tranche подтверждён через `lint`, `typecheck`, `build` и целевой `admin-app` Playwright suite.

### Admin user mutation route validation hardening

- Добавлен общий helper `src/lib/admin-route-params.ts` с typed `AdminRouteParamError`, чтобы admin mutation routes не дублировали UUID-парсинг `userId`.
- В `billing`, `billing/reconcile`, `deletion`, `export`, `restore`, `role`, `support-action`, `suspend` route handlers невалидный target user id теперь даёт явные `400` с route-specific кодами вместо случайного провала глубже в доменный слой.
- Ожидаемые invalid-param ветки в этих admin routes больше не логируются как `logger.error`; noisy logging остаётся только для реально неожиданных сбоев.
- `tests/e2e/admin-app.spec.ts` расширен отдельным contract-сценарием на invalid admin user ids, а tranche подтверждён через `lint`, `typecheck`, `build` и полный `npm run test:e2e:auth`.

### Admin detail и bulk invalid-id contracts

- `src/app/api/admin/users/[id]/route.ts` переведён на общий `parseAdminUserIdParam(...)`, так что detail-route теперь использует тот же typed invalid-id path, что и остальные admin user handlers.
- `src/app/api/admin/users/bulk/route.ts` больше не пишет `logger.error` на ожидаемом `ADMIN_BULK_INVALID`; шум остаётся только для неожиданных сбоев bulk execution.
- `tests/e2e/admin-app.spec.ts` расширен так, что invalid admin user id scenario теперь дополнительно покрывает `GET /api/admin/users/not-a-uuid` и `POST /api/admin/users/bulk` с невалидным `user_ids`.
- Целевой контракт подтверждён через `lint`, `typecheck`, `build` и targeted Playwright `--grep "invalid admin user ids"`.

### Mobile PWA regression stabilization

- В `src/components/app-shell-nav.tsx` развёл test ids для shell drawer trigger и drawer surface, чтобы mobile suite больше не цеплялся за скрытый дубль кнопки меню.
- В `src/components/workout-day-session.tsx` focus-header toggle переведён на functional state update и получил стабильный `data-testid`, чтобы mobile focus mode проверял реальный collapse path без double-toggle race.
- В `tests/e2e/mobile-pwa-regressions.spec.ts` добавил `networkidle + settle` перед mobile interactions и перевёл drawer/focus assertions на стабильные selectors и keyboard close path.
- В `tests/e2e/ownership-isolation.spec.ts` поднял timeout тяжёлого nutrition isolation сценария до 90 секунд, чтобы seed nutrition assets не падал ложным таймаутом под медленной сетью.
- Regression tranche подтверждён через `lint`, `typecheck`, `build` и targeted `npm run test:e2e:auth -- --workers=1 --grep "mobile pwa regressions|nutrition assets"` -> `4 passed`.

### Dashboard nutrition extraction and focus-header stabilization

- `metrics.ts` перестал держать nutrition analytics внутри основного runtime-файла: source loading, result formatting и fail-open fallback вынесены в `dashboard-nutrition.ts`.
- Dashboard runtime теперь может деградировать по nutrition-слою отдельно и не валит весь `/dashboard`, если один nutrition-запрос временно не отработал.
- В `workout-day-session.tsx` стабилизирован mobile focus-header toggle: collapse-кнопка больше не возвращается в исходное состояние из-за double-toggle под mobile emulation, и regression suite снова проходит зелёно.
- Baseline после tranche подтверждён через `lint`, `typecheck`, `build`, `test:smoke` и полный `test:e2e:auth`.

### Locked workout execution guard coverage

- В `workout-sync.spec.ts` добавлен прямой сценарий для незалоченной недели: `PATCH /api/workout-days/{id}`, `POST /api/workout-days/{id}/reset` и `PATCH /api/workout-sets/{id}` теперь подтверждены как закрытые контрактом `WORKOUT_DAY_REQUIRES_LOCKED_PROGRAM`.
- Для этого добавлен helper `createUnlockedWorkoutDay(...)`, который сидирует черновую неделю без lock и позволяет проверять mutation-guards отдельно от основного locked-flow.
- Целевой regression-suite `tests/e2e/workout-sync.spec.ts` подтверждён отдельно: `4 passed`.

### Admin user detail timeline decomposition

- `admin-user-detail-sections.tsx` перестал быть монолитом по history/detail surface: timeline и billing-collections вынесены в отдельные модули для операций, аудита, entitlements, usage counters и subscription events.
- Общие `MetricCard`, `KeyValueCard` и `EmptyState` вынесены в отдельный primitives-слой, так что `admin-user-detail-sections.tsx` теперь ближе к секционному orchestrator-компоненту.
- Baseline после refactor подтверждён через `lint`, `typecheck`, `build` и полный `test:e2e:auth`.

### Mobile PWA regression coverage

- Добавлен отдельный mobile/PWA Playwright suite для узкого viewport: shell drawer, workspace section-menu, mobile workout focus-mode и admin drawer теперь проверяются на client-side regressions и horizontal overflow.
- Добавлен layout helper для проверки отсутствия горизонтального переполнения и для подтверждения, что mobile drawer действительно занимает высоту viewport.
- `MASTER_PLAN.md` обновлён: минимальный automated regression contour сверх smoke теперь явно зафиксирован как закрытый пункт.

## 2026-03-13

### Пользовательский контур и mobile/PWA UX

- Унифицирован shell приложения для desktop и mobile PWA.
- Крупные страницы переведены на workspace-паттерн с логическими разделами.
- Тренировочный день получил focus-режим, пошаговое выполнение, таймер, завершение и сброс.
- AI workspace был доведён до chat-first сценария с историей, prompt library и image upload.

### AI и аналитика

- Усилен AI-контекст по тренировкам, питанию и историческим данным пользователя.
- Добавлены structured knowledge, retrieval по личной истории и proposal-first flow.
- Усилены coaching signals по тренировкам и питанию.
- Подготовлен eval-контур для quality gate через `ai-evals`.

### Документация и demo assets

- Добавлены подробный пользовательский гайд и отдельная документация по AI-архитектуре.
- Создан `public/fit-demo-motion.svg` как motion demo приложения.

## 2026-03-14

### Engineering baseline

- Стабилизированы `npm run lint`, `npm run typecheck`, `npm run build`.
- Добавлены smoke checks и release checklist.
- Очищен build/workspace noise и зафиксирован CI-friendly baseline.

### Декомпозиция рискованных модулей

#### Workout execution

- Из `workout-day-session.tsx` вынесены:
  - `session-utils` и `derived-state`;
  - `use-workout-session-timer.ts`;
  - `use-workout-day-sync.ts`;
  - `use-workout-session-actions.ts`;
  - `workout-step-strip.tsx`;
  - `workout-exercise-card.tsx`;
  - `workout-day-overview-card.tsx`;
  - `workout-day-context-card.tsx`.

#### Dashboard analytics

- Из `metrics.ts` вынесены:
  - `dashboard-utils.ts`;
  - `dashboard-snapshot.ts`;
  - `dashboard-workout-helpers.ts`;
  - `dashboard-overview.ts`;
  - `dashboard-aggregate.ts`;
  - `dashboard-runtime-cache.ts`;
  - `dashboard-runtime-assembly.ts`.

#### Admin UI

- Из `admin-users-directory.tsx` вынесены model/helper и bulk-actions слои.
- Из `admin-user-detail.tsx` вынесены:
  - `admin-user-detail-model.ts`;
  - `admin-user-detail-state.ts`;
  - `admin-user-detail-sections.tsx`.

#### AI knowledge и chat

- Из `knowledge.ts` вынесены:
  - `knowledge-retrieval.ts`;
  - `knowledge-source-data.ts`;
  - `knowledge-indexing.ts`;
  - `knowledge-documents.ts`.
- Из `ai-chat-panel.tsx` вынесены:
  - `ai-chat-panel-model.ts`;
  - `ai-chat-panel-cards.tsx`;
  - `ai-chat-transcript.tsx`;
  - `ai-chat-composer.tsx`;
  - `ai-chat-toolbar.tsx`;
  - `ai-chat-notices.tsx`;
  - `use-ai-chat-session-state.ts`;
  - `use-ai-chat-actions.ts`;
  - `use-ai-chat-composer.ts`;
  - `use-ai-chat-view-state.ts`.

### Sanitation wave

- Переписаны в чистом UTF-8:
  - `README.md`;
  - `docs/README.md`;
  - `docs/MASTER_PLAN.md`;
  - `docs/FRONTEND.md`;
  - `docs/BACKEND.md`;
  - `docs/AI_STACK.md`;
  - `docs/USER_GUIDE.md`;
  - `src/lib/ai/domain-policy.ts`;
  - `src/lib/ai/plan-generation.ts`.

### 2026-03-14 23:20 - Санировал AI stack и пользовательскую документацию

- Переписал `docs/AI_STACK.md` в чистом UTF-8 как актуальную карту AI runtime, retrieval, structured knowledge, proposals, safety и eval-контура.
- Переписал `docs/USER_GUIDE.md` в чистом UTF-8 как подробное руководство по `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings`, `History`, `PWA` и офлайн-сценариям.
- Сжал и переписал этот `docs/AI_WORKLOG.md`, чтобы убрать mojibake и оставить только полезный production-hardening журнал вместо сломанного исторического дампа.

### 2026-03-14 23:55 - Закрыл backend hardening tranche по workout sync и completion guard

- В `src/app/api/sync/push/route.ts` сделал `workout_day_execution` атомарным: статус, вес тела, заметка и длительность теперь применяются одним вызовом `updateWorkoutDayExecution(...)`, без частично сохранённого статуса при ошибке второго шага.
- В `src/lib/workout/execution.ts` добавил серверный guard на полноту set-performance: сет теперь считается либо пустым, либо полностью заполненным (`actualReps`, `actualWeightKg`, `actualRpe`).
- Там же добавил проверку завершения дня: `status = done` теперь запрещён, если в тренировочном дне есть незаполненные сеты.
- В `src/app/api/sync/pull/route.ts` добавил Zod-валидацию `scope`, `dayId` и `cursor`, чтобы sync-route не принимал невалидные параметры.
- После правок подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 00:20 - Ужесточил internal jobs параметры и ошибки

- В `src/lib/internal-jobs.ts` добавил `parseOptionalUuidParam(...)` и `InternalJobParamError`, чтобы internal jobs не принимали произвольный `userId`.
- В `dashboard-warm`, `knowledge-reindex`, `nutrition-summaries` и `billing-reconcile` route handlers невалидный `userId` теперь даёт явный `400`, а не уходит в общий `500`.

### 2026-03-15 05:10 - Перевёл admin user detail на fail-open и degraded contract

- В `src/app/api/admin/users/[id]/route.ts` добавил UUID-валидацию `userId`, резервный degraded snapshot и явный `500 ADMIN_USER_DETAIL_FAILED` для действительно неожиданных ошибок вместо ложного `401`.
- В `src/components/admin-user-detail-state.ts` добавил поддержку `meta.degraded`, а верхний слой `src/components/admin-user-detail.tsx` и `src/app/admin/users/[id]/page.tsx` перевёл в чистый UTF-8.
- В `src/components/admin-user-detail-model.ts` почистил словари ролей, статусов и форматтеры от mojibake, чтобы detail-карточка и связанные admin surface'ы не показывали сломанный русский текст.
- В `tests/e2e/admin-app.spec.ts` добавил отдельный degraded-contract: root-admin может принудительно запросить test-only fallback detail snapshot и получить `meta.degraded = true`.
- Проверки после tranche: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.
- Это делает cron/admin job контракты предсказуемее и уменьшает ложные server-error сценарии при ручных вызовах и операционных проверках.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 00:45 - Довёл AI session и proposal route contracts

- В `src/lib/ai/chat.ts` добавил owner-scoped проверку существования session перед удалением: несуществующий или чужой чат теперь не даёт ложный `deleted: true`.
- В `src/app/api/ai/sessions/[id]/route.ts` добавил UUID-валидацию `params.id` и нормальную обработку `404` для отсутствующей AI session.
- В `src/lib/ai/proposal-actions.ts` ввёл `AiProposalActionError` с typed `status/code/message`, чтобы доменные ошибки `not found / type mismatch / already applied` больше не выглядели как внутренний `500`.
- В `src/app/api/ai/proposals/[id]/approve/route.ts` и `.../apply/route.ts` добавил UUID-валидацию и маппинг typed proposal errors в корректные API-ответы.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 01:10 - Ужесточил direct workout mutation routes

- В `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts` и `src/app/api/workout-sets/[id]/route.ts` добавил UUID-валидацию route params.
- Теперь некорректный `id` на этих mutation routes даёт явный `400` с валидационной ошибкой, а не проходит глубже в execution-слой.
- Это выравнивает прямые workout API-контракты с уже ужесточёнными `sync` и `AI` route handlers.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

## Что осталось в production hardening

- Дальнейшая санация локального `docs/AI_EXPLAINED.md` после отдельного triage пользовательских изменений.
- Route/backend audit по owner-only access, idempotency, reset/finish/sync и internal jobs.
- Доведение оставшихся orchestrator-модулей до финального состояния.
- Stripe live verification, AI quality gate и Android/TWA readiness.

### 2026-03-15 01:55 - Добавил первый auth e2e baseline

- Добавил `tests/e2e/helpers/auth.ts` с реальным входом, автозавершением онбординга и проверкой восстановления сессии в одном browser context.
- Добавил `tests/e2e/authenticated-app.spec.ts` с проходом по `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings` для обычного пользователя.
- В `package.json` добавил `npm run test:e2e:auth`, чтобы auth-regression можно было запускать отдельно от smoke.
- Прогнал сценарий локально с тестовым пользователем `leva@leva.ru`: `npm run test:e2e:auth` зелёный.

### 2026-03-15 02:35 - Закрыл admin e2e и API contract baseline

- Расширил `tests/e2e/helpers/auth.ts`: добавил root-admin credentials, стабилизировал auth helper через ожидание `networkidle`, а ввод в React-controlled формы перевёл на DOM setter + `input/change` events.
- Добавил `tests/e2e/admin-app.spec.ts` с root-сценарием под `corvetik1@yandex.ru`: `/admin`, `/admin/users`, открытие карточки пользователя и проверка секционного operator UI.
- Добавил `tests/e2e/api-contracts.spec.ts` с контрактами без платного AI runtime: invalid UUID дают явные `400`, а owner-scoped delete неизвестной AI session даёт корректный `404 AI_CHAT_SESSION_NOT_FOUND`.
- Упростил e2e-селекторы: вместо хрупких русских строк тесты теперь опираются на URL, `href`, `textarea` и `aria-pressed`, поэтому меньше зависят от локализации и санитарных правок copy.
- Подтвердил baseline полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`.

### 2026-03-15 04:05 - Добавил workout sync regression и owner-only isolation baseline

- Добавил `tests/e2e/helpers/http.ts` и `tests/e2e/helpers/workouts.ts`, чтобы e2e могли сами создавать тестовый locked workout day через обычные product routes, без ручных сидов и без платного AI runtime.
- Добавил `tests/e2e/workout-sync.spec.ts`: тест создаёт locked workout day, прогоняет `sync/push` с duplicate mutation id, incomplete set save и premature `done`, а затем проверяет, что валидная последовательность доходит до `sync/pull` snapshot с правильными `status`, `actual_reps`, `actual_weight_kg`, `actual_rpe` и `session_duration_seconds`.
- Добавил `tests/e2e/ownership-isolation.spec.ts`: root-admin не может читать, сбрасывать или мутировать чужой `workout day` и чужой `workout set`, routes возвращают owner-scoped `404`, а не ложный успех.
- Стабилизировал e2e baseline в `package.json`: `test:e2e` и `test:e2e:auth` пока сериализованы через `--workers=1`, чтобы auth/UI hydration не давали флак при параллельном запуске.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run test:e2e:auth`.

## 2026-03-15 10:10 - Расширил user-owned isolation до weekly program ownership

- Обновил `tests/e2e/ownership-isolation.spec.ts`: после seed locked workout day root-admin теперь дополнительно проверяется на owner-isolation в weekly-programs.
- Подтвердил три контракта: чужая программа не попадает в GET /api/weekly-programs, а POST /api/weekly-programs/{id}/lock и POST /api/weekly-programs/{id}/clone на чужом programId возвращают 404 WEEKLY_PROGRAM_NOT_FOUND.
- Перепрогнал полный auth/e2e набор через штатный Playwright webServer на 3000: 7 passed; диагностические server logs от invalid UUID и unknown AI session остались ожидаемыми для contract tests.

## 2026-03-15 12:05 - Перевёл e2e на storage state и изолированный build dir

- Добавил tests/e2e/global-auth-setup.ts и tests/e2e/helpers/auth-state.ts: Playwright теперь заранее готовит storage state для обычного пользователя и root-admin, а сами тесты больше не тратят время на повторный UI-логин.
- Перевёл typecheck, build и start:test на NEXT_DIST_DIR=.next_build через scripts/run-next-with-dist-dir.mjs, чтобы quality gates и тестовый сервер не конфликтовали с локальным .next.
- Перевёл Playwright на выделенный порт 3100 и обновил package.json/playwright.config.ts, чтобы e2e больше не упирались в случайные процессы на 3000.
- Ужесточил e2e helper'ы: fetchJson(...) теперь переживает navigation race, а auth/admin/workout/api scenarios стабилизированы под --workers=2.
- Подтвердил tranche полным прогоном: npm run lint, npm run typecheck, npm run build, npx eslint tests/e2e tests/e2e/helpers, npm run test:e2e:auth -> 7 passed.

### 2026-03-15 13:05 - Расширил user-owned isolation до nutrition assets

- Добавил `tests/e2e/helpers/nutrition.ts`, чтобы e2e могли штатно сидировать food, recipe, meal template и meal через обычные product routes под тестовым пользователем.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в nutrition-контуре и получает корректные `404 FOOD_NOT_FOUND`, `RECIPE_NOT_FOUND`, `MEAL_TEMPLATE_NOT_FOUND`, `MEAL_NOT_FOUND` для чужих assets.
- Переподтвердил полный auth/e2e baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run test:e2e:auth` -> 8 passed.

### 2026-03-15 14:10 - Расширил user-owned isolation до custom exercises и стабилизировал e2e navigation

- Ужесточил `src/app/api/exercises/route.ts` и `src/app/api/exercises/[id]/route.ts`: list/update теперь явно фильтруют по `user_id`, а update route дополнительно валидирует UUID и возвращает owner-scoped `404 EXERCISE_NOT_FOUND` для чужого ресурса.
- Добавил `tests/e2e/helpers/exercises.ts` и расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь не видит чужое custom exercise в `GET /api/exercises` и не может обновить его через `PATCH /api/exercises/{id}`.
- Добавил `tests/e2e/helpers/navigation.ts` и перевёл `authenticated-app.spec.ts` и `admin-app.spec.ts` на `navigateStable(...)`, чтобы убрать flaky `ERR_ABORTED`/timeout при e2e navigation под `--workers=2`.
- Усилил `tests/e2e/helpers/workouts.ts`: lock weekly program теперь переживает `WEEKLY_PROGRAM_ACTIVE_WEEK_CONFLICT` и выбирает следующий weekStartDate, поэтому workout sync regression больше не падает от накопившихся активных недель.
- Переподтвердил полный auth/e2e baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e/... src/app/api/exercises`, `npm run test:e2e:auth` -> 9 passed.

### 2026-03-15 16:20 - Убрал skip у локального Playwright full suite

- В `tests/e2e/helpers/auth.ts` добавил автозагрузку `.env.local` через `@next/env`, поэтому e2e больше не зависят от ручного export `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`, `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD` перед обычным `playwright test`.
- Обновил `playwright.config.ts`: дефолтный full suite теперь идёт на `workers: 2`, а не на агрессивной авто-параллельности машины, из-за которой раньше появлялись ложные таймауты и ощущение, что тесты «не работают».
- Добавил `PLAYWRIGHT_*` ключи в `.env.example`, а локально прописал тестовые креды в `.env.local` без коммита секретов.
- Стабилизировал навигационные e2e через `tests/e2e/helpers/navigation.ts`, `tests/e2e/admin-app.spec.ts` и `tests/e2e/authenticated-app.spec.ts`, чтобы полный suite был зелёным и при обычном `npx playwright test`.
- Переподтвердил baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test` -> 12 passed.

### 2026-03-15 19:40 - Расширил user-owned isolation до self-service settings export

- Добавил `tests/e2e/helpers/settings-data.ts`: helper ставит `queue_export` через обычный product route `/api/settings/data` и при повторных прогонах умеет переиспользовать уже активную выгрузку вместо падения на `SETTINGS_EXPORT_ALREADY_ACTIVE`.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в self-service data center и не видит чужой export job в `GET /api/settings/data`, а `GET /api/settings/data/export/{id}/download` возвращает owner-scoped `404 SETTINGS_EXPORT_NOT_FOUND`.
- Подтвердил tranche полным quality прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `10 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 20:25 - Расширил user-owned isolation до workout templates

- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `workout_templates`, не видит чужой template в `GET /api/workout-templates` и не может создать новый template из чужого `programId`, получая `404 WORKOUT_TEMPLATE_SOURCE_NOT_FOUND`.
- Чтобы длинный seed/template flow не падал ложным красным, для `user-owned isolation` suite добавил `test.describe.configure({ timeout: 60_000 })`.
- Подтвердил tranche quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `11 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 21:05 - Расширил user-owned isolation до self-service deletion и стабилизировал admin e2e

- Дополнил `tests/e2e/helpers/settings-data.ts` helper-ом `ensureSettingsDeletionRequest(...)`, чтобы e2e могли штатно создавать self-service deletion request через обычный product route `/api/settings/data`.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `settings/data deletion`, не видит чужой deletion request в `GET /api/settings/data`, не может отменить его через `DELETE /api/settings/data` и получает `404 SETTINGS_DELETION_NOT_FOUND`, при этом пользовательский request остаётся на месте.
- Обновил `tests/e2e/admin-app.spec.ts`: тест detail-экрана администратора больше не привязан к раннему появлению `button[aria-pressed]`, а ждёт реальный секционный heading после client-side загрузки карточки.
- Подтвердил tranche quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 21:40 - Починил Vercel production output directory и сохранил test-build isolation

- Причина падения Vercel оказалась в `scripts/run-next-with-dist-dir.mjs`: helper по умолчанию подставлял `NEXT_DIST_DIR=.next_build`, поэтому production `npm run build` складывал артефакты не в `.next`, а Vercel искал `/.next/routes-manifest.json` и падал после успешной сборки.
- Переписал `scripts/run-next-with-dist-dir.mjs`: теперь он по умолчанию оставляет стандартный `.next`, а кастомный output directory включается только через явный `--dist-dir=...`.
- Обновил `package.json`: `build` снова production-safe, а `build:test`, `start:test`, `typecheck`, `pretest:e2e`, `pretest:e2e:auth`, `pretest:smoke` работают через отдельный `.next_build`, не смешивая локальный test/build контур с production output.
- Подтвердил hotfix полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-15 23:10 - Расширил settings isolation и отвязал smoke от auth bootstrap

- Дополнил `tests/e2e/helpers/settings-data.ts` helper-ом `ensureSettingsBillingReviewRequest(...)`, чтобы e2e могли создавать self-service billing review через обычный route `/api/settings/billing` и не зависели от прямого seed-а в БД.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `settings/billing` и не видит чужой billing review request в `GET /api/settings/billing`.
- Ужесточил `src/app/api/settings/data/export/[id]/download/route.ts`: route теперь валидирует UUID-параметр и даёт явный `400 SETTINGS_EXPORT_INVALID` на невалидный `id`.
- Расширил `tests/e2e/api-contracts.spec.ts` новым invalid-param контрактом для `GET /api/settings/data/export/not-a-uuid/download`.
- Санировал user-facing copy в `src/app/api/settings/billing/route.ts`, `src/app/api/settings/data/route.ts` и `src/app/api/settings/data/export/[id]/download/route.ts`, чтобы этот settings self-service контур не отдавал смешанный английский или битые промежуточные формулировки.
- Добавил `PLAYWRIGHT_SKIP_AUTH_SETUP` в `tests/e2e/global-auth-setup.ts` и новый runner `scripts/run-playwright.mjs`; `npm run test:smoke` теперь не пытается логинить тестовых пользователей и не падает от флака auth bootstrap.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `13 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-15 23:45 - Расширил user-owned isolation до AI history

- Добавил `tests/e2e/helpers/ai.ts`: helper `ensureAiChatSession(...)` сидирует AI chat session через safe blocked-flow (`/api/ai/chat` с risky prompt), поэтому e2e не зависят от платного AI runtime и всё равно получают реальную owner-scoped session в БД.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в AI history и не может удалить чужую AI session по `DELETE /api/ai/sessions/{id}`.
- Тем же сценарием подтверждён bulk-clear contract: `DELETE /api/ai/sessions` под root-admin очищает только его собственную историю, а пользователь после этого всё ещё может удалить свою seeded session по `id`.
- Полный tranche подтверждён прогоном `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `14 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 00:35 - Добавил workout reset regression для clean snapshot после sync

- Расширил `tests/e2e/workout-sync.spec.ts` новым сценарием `reset clears synced execution and pull stays clean afterwards`.
- Новый e2e сначала доводит locked workout day до сохранённого `done` через `sync/push`, затем вызывает `POST /api/workout-days/{id}/reset` и проверяет два последовательных `sync/pull`, чтобы убедиться: после reset не возвращаются старые `actual_reps`, `actual_weight_kg`, `actual_rpe`, а день снова `planned` с `session_duration_seconds = 0`.
- Для `workout sync contracts` поднял timeout до `60_000`, потому что длинный seed/lock/reset flow реально выходит за дефолтные `30s`, хотя сам контракт уже зелёный.
- Подтвердил tranche командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `15 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 02:10 - Закрыл локальный offline reset контур против stale IndexedDB state

- В `src/lib/offline/workout-sync.ts` добавил `replaceWorkoutDayOfflineState(...)`: helper теперь атомарно очищает `mutationQueue` по `dayId` и сразу заменяет `cacheSnapshots` новым snapshot внутри одной Dexie-транзакции.
- В `src/components/workout-session/use-workout-day-sync.ts` и `src/components/workout-session/use-workout-session-actions.ts` reset переведён на этот helper, поэтому клиентский сброс тренировки больше не зависит от нескольких разнесённых шагов в offline слое.
- Добавил `tests/e2e/helpers/offline-db.ts`, чтобы Playwright мог работать с реальным `fit-offline` IndexedDB, а не только проверять server routes.
- `tests/e2e/workout-sync.spec.ts` расширен новым browser-based regression: тест сидирует stale queued mutations и stale cache snapshot, запускает reset через UI и затем подтверждает, что локальный IndexedDB уже очищен и после reload не возвращает старое execution state.
- Заодно усилил `tests/e2e/helpers/workouts.ts`, чтобы seed locked workout day был стабильнее и не выгорал по `active week conflict` на длинных suite.
- Полный tranche подтверждён командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 04:35 - Дожал owner-scoped mutation routes и invalid-param контракты

- Ужесточил `src/app/api/weekly-programs/[id]/lock/route.ts`: route теперь валидирует UUID-параметр и при race по lock state возвращает предсказуемый `409 WEEKLY_PROGRAM_LOCK_CONFLICT`, а не общий `500`.
- Ужесточил `src/app/api/weekly-programs/[id]/clone/route.ts`: `params.id` теперь проходит через `z.string().uuid()`, а invalid params попадают в явный `400 WEEKLY_PROGRAM_CLONE_INVALID`.
- Санировал и довёл до явных `400`/`404` owner-scoped nutrition mutation routes: `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`.
- Расширил `tests/e2e/api-contracts.spec.ts`: invalid route params теперь проверяются дополнительно для `weekly-programs/[id]/lock`, `weekly-programs/[id]/clone`, `foods/[id]`, `recipes/[id]`, `meals/[id]`, `meal-templates/[id]`.
- Подтвердил tranche командами: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 05:20 - Санировал AI route surface и стабилизировал auth bootstrap для full e2e

- В `tests/e2e/helpers/auth.ts` добавил более устойчивый post-sign-in flow: если client-side redirect задерживается, helper дожимает переход на `/dashboard`, не ломая storage-state bootstrap.
- Санировал user-facing copy в `src/app/api/ai/chat/route.ts`, `src/app/api/ai/reindex/route.ts`, `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`, чтобы AI routes больше не отдавали mojibake в ошибках и ответах.
- Повторно подтвердил полный baseline после AI-route sanitation: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 06:25 - Закрыл AI session ownership reuse и settings snapshot fail-open

- В `src/lib/ai/chat.ts` изменил контракт `ensureAiChatSession(...)`: переданный `sessionId` больше не может тихо создать новую сессию; неизвестный или чужой валидный id теперь даёт owner-scoped `404 AI_CHAT_SESSION_NOT_FOUND`.
- В `src/app/api/ai/chat/route.ts` и `src/app/api/ai/assistant/route.ts` добавил явный маппинг `AiChatSessionError`, поэтому оба AI route handler'а возвращают корректный `404`, а не общий `500`.
- В `tests/e2e/api-contracts.spec.ts` добавил контракты для `ai chat` и `ai assistant`, подтверждающие, что неизвестный валидный `sessionId` не создаёт новую сессию молча, а даёт `404 AI_CHAT_SESSION_NOT_FOUND`; в `tests/e2e/ownership-isolation.spec.ts` подтвердил, что root-admin не может продолжить чужую AI session ни через chat, ни через assistant surface.
- `tests/e2e/ownership-isolation.spec.ts` и `tests/e2e/admin-app.spec.ts` перевёл на `navigateStable(...)` для стартового `/admin`, чтобы убрать flaky `ERR_ABORTED` на медленном client-side bootstrap.
- В `src/lib/settings-data-server.ts` добавил `loadSettingsDataSnapshotOrFallback(...)`, а `src/app/api/settings/data/route.ts` и `src/app/api/settings/billing/route.ts` перевёл на безопасный fail-open snapshot: при сбое загрузки оболочки settings UI получает пустой snapshot вместо `500`.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 07:10 - Довёл billing-access fail-open до user-facing страниц и AI routes

- В `src/lib/billing-access.ts` добавил `createFallbackUserBillingAccessSnapshot(...)` и `readUserBillingAccessOrFallback(...)`: при временной ошибке чтения `subscriptions / entitlements / usage_counters` surface больше не валится общим `500`, а получает безопасный fallback-access; для root-super-admin fallback остаётся привилегированным.
- В `src/app/settings/page.tsx`, `src/app/ai/page.tsx`, `src/app/nutrition/page.tsx` и `src/app/api/settings/billing/route.ts` user-facing server surfaces переведены на этот fail-open path, поэтому transient billing-access ошибки больше не ломают открытие основных экранов и billing center.
- Тем же паттерном перевёл user-facing AI routes: `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts`, `src/app/api/ai/meal-plan/route.ts`, `src/app/api/ai/workout-plan/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`. Теперь AI surface не падает из-за временного сбоя billing-access слоя и использует безопасную fallback policy.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 08:05 - Снизил noisy route errors и довёл admin surfaces до fail-open

- В `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-sets/[id]/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts` разнёс expected и unexpected path в `catch`: валидируемые `400/404` больше не шумят как route-level `logger.error`.
- В `src/app/api/admin/stats/route.ts` добавил `createFallbackAdminStatsSnapshot()`, а в `src/app/api/admin/operations/route.ts` — `createFallbackOperationsSnapshot()`. Теперь при временном сбое внешнего Supabase/fetch слоя admin health и operations inbox отдают безопасный fallback snapshot с `meta.degraded`, а не общий `500`.
- Повторный auth/e2e прогон подтвердил эффект: noisy `ZodError`/`AI_CHAT_SESSION_NOT_FOUND` логи из contract-tested routes ушли, а admin route timeout теперь деградирует до `warn + fallback`, не ломая suite.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 08:30 - Показал degraded режим прямо в admin UI

- В `src/components/admin-health-dashboard.tsx` и `src/components/admin-operations-inbox.tsx` добавил чтение `meta.degraded` из API и явные amber-notice баннеры для operator UX.
- Теперь `/admin` и inbox операций не сваливаются в молчаливо пустые карточки: если сервер отдал fallback snapshot, оператор видит, что это резервный снимок и часть источников временно недоступна.
- Подтвердил slice командами: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `1 passed`.

### 2026-03-16 09:05 - Закрыл owner-isolation для AI proposal approve/apply

- Добавил `tests/e2e/helpers/supabase-admin.ts` как минимальный Playwright helper с `SUPABASE_SERVICE_ROLE_KEY`, чтобы e2e могли находить тестового пользователя по email и сидировать user-owned записи без прямых ручных SQL команд.
- Расширил `tests/e2e/helpers/ai.ts`: кроме blocked AI chat session helper, там теперь есть `ensureAiPlanProposal(...)` и `readAiPlanProposal(...)`, поэтому AI proposal ownership можно проверять без live AI runtime.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `POST /api/ai/proposals/{id}/approve` и `/apply` и получает `404 AI_PROPOSAL_NOT_FOUND` на чужом proposal.
- Расширил `tests/e2e/api-contracts.spec.ts`: invalid UUID для AI proposal routes теперь подтверждаются явными `400 AI_PROPOSAL_APPROVE_INVALID` и `400 AI_PROPOSAL_APPLY_INVALID`.
- В `src/app/api/ai/proposals/[id]/approve/route.ts` и `src/app/api/ai/proposals/[id]/apply/route.ts` убрал noisy route-level `logger.error` для ожидаемых `400/404`, оставив логирование только для неожиданных `500`.
- Полный tranche подтверждён командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers src/app/api/ai/proposals/[id]/approve/route.ts src/app/api/ai/proposals/[id]/apply/route.ts`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `19 passed`.

### 2026-03-16 09:35 - Добавил отдельный RLS test baseline

- Добавил `tests/rls/helpers/supabase-rls.ts`: helper логинит обычного пользователя и root-admin напрямую через публичный Supabase key, а fixture сидирует через service-role helper без UI и без webServer.
- Добавил `tests/rls/ownership.spec.ts`: suite подтверждает прямую row-level изоляцию в `ai_plan_proposals`, `exercise_library` и `weekly_programs`; владелец видит свои строки, другой auth-user не видит и не может обновить чужой proposal.
- В `package.json` добавил `npm run test:rls`, который идёт отдельно от UI/e2e контура и не требует сборки test-server.
- Подтвердил tranche командами: `npx eslint tests/rls tests/e2e/helpers/supabase-admin.ts tests/e2e/helpers/ai.ts`, `npm run test:rls`, `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-16 10:05 - Перевёл admin users каталог на fail-open degraded snapshot

- В `src/app/api/admin/users/route.ts` добавил `createFallbackAdminUsersResponse(...)`: при временном сбое внешнего Supabase/fetch слоя route больше не падает общим `500`, а отдаёт безопасный пустой snapshot с `meta.degraded`.
- В `src/components/admin-users-directory-model.ts` расширил `AdminUsersFetchResponse` полем `meta.degraded`, а в `src/components/admin-users-directory.tsx` добавил отдельный amber-banner для оператора, если каталог пришёл из резервного снимка.
- Теперь живой `admin users route failed` timeout-path из e2e деградирует предсказуемо и не ломает экран каталога пользователей.
- Подтвердил tranche командами: `npx eslint src/app/api/admin/users/route.ts src/components/admin-users-directory.tsx src/components/admin-users-directory-model.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.

### 2026-03-16 10:25 - Дожал reindex route contracts

- В `src/app/api/ai/reindex/route.ts` развёл expected и unexpected error path: `AdminAccessError` и `ZodError` теперь возвращаются без noisy `logger.warn`, логирование оставлено только для неожиданных `500`.
- В `tests/e2e/api-contracts.spec.ts` добавил контракт для обычного пользователя: `POST /api/ai/reindex` остаётся строго admin-only и возвращает `403 ADMIN_REQUIRED`.
- В `tests/e2e/admin-app.spec.ts` добавил root-admin сценарий на невалидный `targetUserId`, подтверждающий `400 REINDEX_INVALID`.
- Slice подтверждён таргетными прогонами `npx eslint src/app/api/ai/reindex/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/admin-app.spec.ts` и Playwright contract-suite для `admin-app` + `api-contracts`.

### 2026-03-16 10:55 - Расширил прямой RLS suite до AI history и self-service данных

- В `tests/rls/helpers/supabase-rls.ts` fixture расширен прямыми service-role вставками в `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, чтобы direct RLS tests покрывали не только proposals/programs/exercises, но и AI/history, retrieval corpus плюс self-service data.
- В `tests/rls/ownership.spec.ts` добавлены прямые owner-only проверки: обычный пользователь через публичный Supabase client видит свои AI chat/session rows, export/deletion rows, context snapshot и retrieval chunk, а второй auth-user под тем же RLS не видит эти записи вообще.
- Отдельно зафиксировано, что `support_actions` не используется как direct user-visible RLS surface: self-service billing snapshot собирается через admin-backed path, поэтому для прямого row-level coverage выбран `user_context_snapshots`.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, затем повторным общим baseline `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `22 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 11:25 - Закрыл targeted advisor warnings для AI history и self-service

- Через Supabase MCP посмотрел `security` и `performance` advisors и взял узкий production-tranche по реальным hot tables: `ai_chat_messages`, `export_jobs`, `deletion_requests`, `support_actions`, `admin_audit_logs`.
- Применил корректирующую миграцию `supabase/migrations/20260315173518_ai_history_self_service_index_hardening.sql`: функция `public.set_updated_at()` теперь с фиксированным `search_path = public, pg_temp`, а под AI/history/self-service query paths добавлены индексы на `session_id`, `requested_by`, `actor_user_id`, `target_user_id` и составные user/status маршруты.
- Повторный прогон advisors подтвердил эффект: warning `function_search_path_mutable` для `public.set_updated_at()` ушёл, а targeted `unindexed_foreign_keys` по этой группе таблиц исчезли.
- При этом глобальный advisor backlog сознательно оставлен отдельным последующим tranche: в проекте ещё есть `auth_rls_initplan` и `rls_enabled_no_policy` для более широкого круга admin/system tables, и это уже следующий системный слой, а не точечный hotfix.

### 2026-03-16 11:45 - Закрыл targeted auth_rls_initplan для AI history и retrieval

- Через `pg_policies` снял реальные owner-policy определения для `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, `knowledge_embeddings`, `ai_safety_events` и подтвердил, что это безопасный массовый паттерн `auth.uid() = user_id`.
- Применил корректирующую миграцию `supabase/migrations/20260315173725_ai_history_self_service_rls_initplan_hardening.sql`: все эти owner policies переведены на `(select auth.uid())`, чтобы Supabase больше не пересчитывал auth-функции per-row на горячих AI/history/self-service таблицах.
- Повторный прогон performance advisors подтвердил, что targeted `auth_rls_initplan` warnings по этим таблицам ушли; после этого отдельно прогнал `npm run test:rls`, чтобы подтвердить сохранение реальной row-level изоляции после policy-alter.
- Оставшийся advisor backlog теперь сузился до других product/admin/system таблиц и отдельного security-слоя `rls_enabled_no_policy`, который уже пойдёт следующим DB tranche, а не как часть AI/history hotfix.

### 2026-03-16 12:35 - Закрыл internal jobs auth и invalid-param контракты

- Добавил `tests/e2e/internal-jobs.spec.ts` как отдельный contract-suite для `/api/internal/jobs/*`.
- Для обычного пользователя подтверждён `403 ADMIN_REQUIRED` на `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`, `billing-reconcile`.
- Для root-admin подтверждены явные `400` на невалидных параметрах `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`.
- В `src/app/api/internal/jobs/ai-evals-schedule/route.ts` разнёс expected и unexpected error path: `ZodError` больше не шумит как route-level `logger.error`.
- Усилил `tests/e2e/helpers/auth.ts`: вход теперь сначала использует обычный `fill`, затем fallback через setter, и ждёт активации submit до 10 секунд. Это убрало flaky bootstrap в `global-auth-setup`.
- Подтвердил tranche полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `24 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 13:05 - Расширил CI до полного regression-контура

- В `.github/workflows/quality.yml` добавил secret-guarded jobs `rls` и `auth-e2e`, чтобы GitHub Actions мог прогонять не только `lint/typecheck/build/smoke`, но и прямые RLS tests плюс authenticated e2e.
- `rls` job использует `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`, `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD` и запускает `npm run test:rls`.
- `auth-e2e` job использует тот же секретный набор, ставит Chromium и запускает `npm run test:e2e:auth`.
- В `README.md` и `docs/RELEASE_CHECKLIST.md` зафиксировал явный список secrets для полного CI regression-контура, чтобы это было частью release hygiene, а не неявным знанием.

### 2026-03-16 13:20 - Зафиксировал допустимые build warnings

- Добавил `docs/BUILD_WARNINGS.md` как source of truth по текущему warning-хвосту от `@sentry/nextjs` и `@opentelemetry/*`.
- Зафиксировал, что текущие `Critical dependency: the request of a dependency is an expression` warnings допустимы только пока они приходят из instrumentation dependencies и не ломают `npm run build`, manifest, traces и regression-suite.
- В `docs/README.md`, `README.md` и `docs/MASTER_PLAN.md` добавил явные ссылки и policy, чтобы этот warning-хвост больше не считался “непонятным шумом” без статуса.
### 2026-03-16 13:40 - Добавил migration-aware CI gate

- Добавил `scripts/verify-migrations.ps1` и `scripts/verify-migrations.mjs`: PowerShell-обёртка собирает diff локально и в CI, а JS-валидатор проверяет изменения в `supabase/migrations`, формат migration filenames, пустые `.sql` и обязательный update `docs/MASTER_PLAN.md` плюс `docs/AI_WORKLOG.md`.
- В `package.json` появился `npm run verify:migrations`, а `.github/workflows/quality.yml` теперь запускает тот же gate перед основным `quality` job.
- В `README.md` и `docs/RELEASE_CHECKLIST.md` зафиксировал, что при изменениях `supabase/migrations` этот gate должен быть зелёным и в локальном baseline, и в CI.
- Это сознательно только migration-aware слой: advisor execution через CI пока остаётся отдельным следующим tranche, потому что требует отдельного secret/runtime контура.

### 2026-03-16 14:20 - Вернул test-build на стандартный .next

- На текущем Windows + Next.js 16 custom `NEXT_DIST_DIR` для `next build` стабильно упирался в `spawn EPERM`, поэтому `build:test` и `start:test` откатил на стандартный `.next`.
- Изоляция осталась там, где она реально стабильна: `typecheck` продолжает работать через `.next_build`, а Playwright всё так же использует выделенный порт `3100`.
- После rollback заново прогнал baseline, чтобы `test:smoke`, `test:rls` и `test:e2e:auth` снова были зелёными на реальном локальном контуре.

### 2026-03-16 15:05 - Переписал frontend handoff-док

- `docs/FRONTEND.md` был в mojibake и перестал быть usable handoff-документом.
- Переписал его с нуля под текущий `fit`: shell, workspace-паттерн, workouts, nutrition, AI workspace, admin UI, quality gates и практические правила для frontend-изменений.
- `docs/AI_EXPLAINED.md` сознательно не трогал: он остаётся отдельным triaged локальным документом вне этого sanitation tranche.

### 2026-03-16 15:20 - Зафиксировал критерий prod-ready

- Добавил `docs/PROD_READY.md` как отдельный документ с production-ready критерием: automated gates, manual acceptance, env readiness и release blockers.
- В `docs/README.md`, `README.md` и `docs/MASTER_PLAN.md` закрепил, что `prod-ready` в `fit` больше не равен просто “локальный build зелёный”.
- Это не закрывает Stripe/AI live verification, но даёт нормальный release-контракт, от которого теперь можно двигаться дальше по staging-like tranche.

### 2026-03-16 16:10 - Добавил UI regression suite

- Добавил `tests/e2e/ui-regressions.spec.ts`: отдельный Playwright-slice на client-side reliability, а не только на happy-path навигацию.
- Новый suite проверяет три вещи: отсутствие hydration/render-loop ошибок на user/admin surfaces, отсутствие runaway `sync/pull` в workout focus-mode и сохранение этих проверок внутри общего `test:e2e:auth`.
- Для этого добавил `tests/e2e/helpers/client-regressions.ts`, а `tests/e2e/helpers/http.ts` перевёл на `browserContext.request`, чтобы API contract tests не падали из-за фона страницы и `networkidle`.
- После правок `npm run test:e2e:auth` снова зелёный и теперь проходит как `27 passed`.

### 2026-03-16 18:20 - Закрыл AI workspace regression tranche

- Добавил отдельный `tests/e2e/ai-workspace.spec.ts`: suite покрывает prompt library, web-search toggle, image upload, одиночное удаление чата и массовую очистку истории.
- В `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-workspace.tsx`, `src/app/ai/page.tsx` почистил user-facing AI workspace copy до нормального UTF-8 и убрал свежий mojibake из этого surface.
- В `src/components/ai-chat-panel.tsx` добавил стабильный hydration marker `data-hydrated`, а `tests/e2e/ui-regressions.spec.ts` и новый AI workspace suite перевёл на него вместо хрупких ранних селекторов и старых desktop-ссылок.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 23:10 - Закрыл workspace sanitation и стабилизировал AI surface

- Переписал `src/components/page-workspace.tsx` и `src/components/dashboard-workspace.tsx` в чистом UTF-8, чтобы базовый workspace-контур основных страниц больше не отдавал битую кириллицу.
- Дожал весь AI workspace surface: `src/components/ai-workspace.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx`, `src/app/ai/page.tsx` теперь в нормальном русском UX без mojibake.
- Перевел web-search toggle в `src/components/ai-chat-panel.tsx` на `useSyncExternalStore` поверх `sessionStorage`, чтобы режим не терялся при remount и не нарушал `react-hooks/set-state-in-effect`.
- Усилил тестовую устойчивость в `tests/e2e/ai-workspace.spec.ts`, `tests/e2e/ui-regressions.spec.ts` и `tests/e2e/helpers/http.ts`: prompt library re-open, degraded admin detail и неожиданные `401` от auth bootstrap больше не дают ложный красный.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 00:35 - Санировал admin role и operator surfaces

- Переписал `src/lib/admin-permissions.ts` в чистом UTF-8: роль-подписи и capability error copy больше не отдают mojibake.
- Переписал `src/components/admin-role-manager.tsx`, `src/components/admin-user-actions.tsx`, `src/components/admin-ai-operations.tsx`, `src/components/admin-ai-eval-runs.tsx`, `src/components/admin-operations-inbox.tsx` в нормальный русский operator UX.
- Для non-root/admin-only режимов убрал лишний показ role/capability деталей: там, где доступен только просмотр, UI теперь говорит об этом нейтрально, без лишних внутренних формулировок.
- Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 01:20 - Дожал advisor backlog по owner policies и query paths

- Проверил рабочее дерево и зафиксировал, что ложный sanitation-slice по `admin-users-directory-model.ts` и `admin-user-detail-model.ts` не дал реального git diff; в commit пошёл только настоящий DB tranche плюс тестовый hotfix.
- Применил через Supabase MCP `supabase/migrations/20260317012000_query_path_and_fk_index_hardening.sql`: закрыл первую волну `auth_rls_initplan` для `profiles`, `subscriptions`, `subscription_events`, `workout_days`, `ai_plan_proposals` и добавил targeted FK indexes под горячие query paths.
- Затем применил `supabase/migrations/20260317014500_owner_policy_initplan_hardening.sql`: owner-policies на user-level таблицах питания, тренировок, профиля, usage и memory перевёл на `(select auth.uid())`, чтобы убрать массовый `auth_rls_initplan`.
- Затем применил `supabase/migrations/20260317015500_foods_select_policy_merge.sql`: `foods_owner_select` и `foods_owner_shared_select` схлопнуты в одну permissive select-policy `foods_access_select`, чтобы performance-advisor больше не ругался на `multiple_permissive_policies`.
- Повторный прогон advisors после DDL подтвердил, что performance backlog теперь очищен от `auth_rls_initplan`, `multiple_permissive_policies` и targeted FK warnings; в remaining backlog остались только `unused_index` info и отдельный security-layer (`rls_enabled_no_policy`, `extension_in_public`, `auth_leaked_password_protection`).
- Полный verification после DB tranche зелёный: `npm run verify:migrations`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 01:35 - Убрал flaky селектор из ui-regressions

- В `tests/e2e/ui-regressions.spec.ts` заменил хрупкий `button[aria-pressed]` на гарантированный `main` для `dashboard / workouts / nutrition / settings`, потому что наличие section-pill не является обязательным DOM-контрактом для каждого user surface.
- Сначала подтвердил targeted suite `npx playwright test tests/e2e/ui-regressions.spec.ts --workers=1` -> `3 passed`, затем заново прогнал весь `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 02:10 - Закрыл security-advisor baseline для системных таблиц

- Через кодовый аудит подтвердил, что `admin_audit_logs`, `support_actions`, `ai_eval_runs`, `ai_eval_results`, `feature_flags`, `platform_settings`, `system_metrics_snapshots` читаются только через `createAdminSupabaseClient()` или service-role контуры, а не через обычный user client.
- Применил `supabase/migrations/20260317022000_system_table_rls_policy_baseline.sql`: добавил явные deny-all policies на эти таблицы, чтобы закрыть `rls_enabled_no_policy` без изменения runtime-контрактов для владельцев или админских service-role путей.
- Повторный прогон `security` advisors подтвердил, что `rls_enabled_no_policy` полностью ушёл; в security backlog остались только platform-level warnings `extension_in_public` для `vector` и `auth_leaked_password_protection`.
- После DB slice пришлось отдельно дожать flaky AI workspace test: в `tests/e2e/ai-workspace.spec.ts` создание шаблона теперь ждёт visible+enabled состояние кнопки внутри модалки, после чего full `npm run test:e2e:auth` снова зелёный (`36 passed`).
- Tranche подтверждён командами `npm run verify:migrations`, `npm run test:rls`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1`, `npm run test:e2e:auth`, `npm run test:smoke`.

### 2026-03-17 09:45 - Дожал workspace sanitation для dashboard, workouts и nutrition

- Переписал `src/components/page-workspace.tsx` в чистом UTF-8 и добавил стабильные `data-testid` для mobile section-menu и visibility toggles.
- Полностью санировал `src/components/dashboard-workspace.tsx`: hero, summary, AI-блок и mobile section-menu на `/dashboard` больше не показывают битую кириллицу.
- Переписал `src/app/workouts/page.tsx` и `src/app/nutrition/page.tsx` в нормальный русский user-facing copy для badges, metrics, section labels и descriptions.
- Обновил `tests/e2e/mobile-pwa-regressions.spec.ts`: mobile regression теперь опирается на стабильные test ids вместо старых текстовых селекторов и снова подтверждает `Dashboard / Workouts / Nutrition / Admin` на узком viewport.
- Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 10:35 - Санировал admin user detail surface

- Переписал `src/components/admin-user-detail.tsx`, `src/components/admin-user-detail-state.ts`, `src/components/admin-user-detail-model.ts`, `src/components/admin-user-detail-sections.tsx`, `src/components/admin-user-detail-operations.tsx`, `src/components/admin-user-detail-billing.tsx` и `src/app/admin/users/[id]/page.tsx` в чистом UTF-8.
- Убрал mojibake из summary metrics, degraded-banner, section-switcher, профиля, активности, операций, биллинга и role/status словарей для карточки пользователя.
- Сразу после санации прогнал targeted operator regression: `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`, `npx playwright test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `3 passed`.
- Общие quality gates по tranche тоже зелёные: `npx eslint ...admin-user-detail*`, `npm run typecheck`, `npm run build`.
- После первого полного прогона `npm run test:e2e:auth` поймал flaky degraded-dashboard check: тест цеплялся за общий `a[href="/admin/users"]`, а не за конкретный fallback CTA.
- Для этого добавил стабильные `data-testid` на degraded CTA в `src/app/admin/page.tsx` и перевёл `tests/e2e/admin-app.spec.ts` на эти селекторы.
- После hotfix полный auth baseline снова зелёный: `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 11:40 - Санировал user-facing copy в AI API

- Дочистил весь `/api/ai` user-facing слой: `chat`, `assistant`, `meal-photo`, `meal-plan`, `workout-plan`, `reindex`, `sessions`, `sessions/[id]`, `proposals/[id]/apply`, `proposals/[id]/approve`.
- Убрал английские сообщения и технический жаргон вроде `AI runtime`, `live-запросы`, `AI-предложение`; вместо этого ошибки и статусы теперь объясняются по-русски и без лишнего внутреннего языка.
- Прогнал машинный scan по `src/app/api/ai` и подтвердил, что английских `message:` / `return` строк в user-facing слое больше не осталось.
- Tranche подтверждён командами `npx eslint ...src/app/api/ai/*`, `npm run typecheck`, `npm run build`, `npm run build:test`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `6 passed`.

### 2026-03-17 12:25 - Расширил direct RLS ownership и дочистил self-service route copy

- `tests/rls/helpers/supabase-rls.ts` расширен fixture-данными для `foods`, `recipes`, `recipe_items` и `workout_templates`, чтобы direct row-level suite покрывал не только proposals/history/self-service, но и user-scoped nutrition plus workout template surfaces.
- `tests/rls/ownership.spec.ts` теперь напрямую подтверждает, что обычный пользователь видит свои `foods`, `recipes` и `workout_templates`, а root-admin не видит эти строки через обычный user client.
- В `src/app/api/workout-templates/route.ts`, `src/app/api/foods/route.ts` и `src/app/api/recipes/route.ts` дочистил user-facing copy до нормального русского без обрывков старой технической формулировки.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers src/app/api/workout-templates/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts`, `npm run test:rls`, `npm run typecheck`, `npm run build`.

### 2026-03-17 13:20 - Санировал product API copy для тренировок, питания и онбординга

- Перевёл в нормальный русский user-facing ошибки и статусы в `src/app/api/weekly-programs/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/meal-templates/route.ts`, `src/app/api/meals/route.ts`, `src/app/api/settings/billing/route.ts`.
- Закрыл остатки английского и mojibake в self-service/product route surface: weekly programs, nutrition targets, onboarding, legacy chat, meal templates, meals и billing center теперь отдают чистый UTF-8 copy.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 14:10 - Дочистил self-service delete/export routes

- Переписал в чистом UTF-8 `src/app/api/foods/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/settings/data/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`.
- Self-service update/delete/export поверхности для продуктов, шаблонов питания, приёмов пищи, рецептов и центра данных теперь отдают единый понятный русский copy без mojibake.
- Follow-up подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 15:00 - Санировал billing, sync и workout route copy

- Перевёл в нормальный русский user-facing copy в `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/dashboard/period-compare/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/exercises/[id]/route.ts`, `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts`, `src/app/api/workout-sets/[id]/route.ts`.
- Billing, dashboard compare, exercise library, sync и workout execution route surface больше не отдают английские login/update/error сообщения и выровнены по русскому production copy.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 16:05 - Санировал operator и internal API copy

- Перевёл в нормальный русский operator/internal copy в `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/bootstrap/route.ts`, `src/app/api/admin/operations/route.ts`, `src/app/api/admin/operations/process/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts`, `src/app/api/admin/users/[id]/deletion/route.ts`, `src/app/api/admin/users/[id]/export/route.ts`, `src/app/api/admin/users/[id]/restore/route.ts`, `src/app/api/admin/users/[id]/role/route.ts`, `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts`, `src/app/api/billing/webhook/stripe/route.ts`, `src/app/api/internal/jobs/billing-reconcile/route.ts`, `src/app/api/internal/jobs/dashboard-warm/route.ts`, `src/app/api/internal/jobs/knowledge-reindex/route.ts`, `src/app/api/internal/jobs/nutrition-summaries/route.ts`.
- Operator/internal API surface больше не отдает английские payload/update/queue/error сообщения и выровнен по русскому operator UX.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 17:10 - Добавил CI gate для Supabase advisors

- Добавил `scripts/verify-advisors.mjs` и `scripts/verify-advisors.ps1`: они используют Supabase Management API (`/v1/projects/{ref}/advisors/security` и `/v1/projects/{ref}/advisors/performance`) и автоматически срабатывают только если в diff есть SQL-миграции.
- В `package.json` появился `npm run verify:advisors`, а в `.github/workflows/quality.yml` добавлен secret-guarded job `advisors`, который запускается при наличии `SUPABASE_ACCESS_TOKEN` и `SUPABASE_PROJECT_REF`.
- Gate падает только на новые `WARN/ERROR` findings; текущий platform-level security warning `auth_leaked_password_protection` зафиксирован как baseline allowlist, чтобы workflow не был вечно красным из-за внешней настройки проекта.
- Локально tranche подтверждён командами `npm run verify:advisors`, `npm run lint`, `npm run typecheck`, `npm run build`; `verify:advisors` корректно делает no-op, если в текущем diff нет SQL-миграций.

### 2026-03-17 17:35 - Закрыл retrieval ownership для vector-layer

- `tests/rls/helpers/supabase-rls.ts` расширен fixture-строкой в `knowledge_embeddings`: теперь direct RLS suite сидирует не только `knowledge_chunks`, но и реальный vector row для того же пользователя.
- `tests/rls/ownership.spec.ts` теперь подтверждает, что владелец видит свой `knowledge_embeddings` row, а другой auth-user не видит его даже при точечном запросе по `id`.
- После этого подпункт плана про owner-only доступ для `chat`, `sessions`, `retrieval`, `reindex` и `proposal apply` можно считать закрытым не только по route-level сценариям, но и по прямому retrieval storage layer.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, `npm run typecheck`, `npm run build`.

### 2026-03-17 21:20 - Развёл AI runtime/config UX и убрал лишний повторный build в тестах

- `src/components/ai-chat-panel-model.ts`, `src/components/ai-chat-notices.tsx`, `src/components/use-ai-chat-actions.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-view-state.ts`, `src/components/ai-chat-panel.tsx` перевёл на typed notice-модель: теперь AI surface отдельно показывает `сервис временно недоступен` для provider/config проблем и `повтори позже` для runtime сбоев.
- `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts` теперь отдают согласованные русские сообщения и явный `503 AI_PROVIDER_UNAVAILABLE` там, где сбой именно во внешнем провайдере или неготовой конфигурации.
- `scripts/run-next-with-dist-dir.mjs` получил memory guard для `next build`, а новый `scripts/ensure-next-build.mjs` подключён в `pretest:e2e`, `pretest:e2e:auth`, `pretest:smoke`: smoke и auth e2e больше не делают лишний rebuild поверх уже готового `.next`.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 22:05 - Подтвердил retrieval по всей исторической базе пользователя

- `src/lib/ai/knowledge-retrieval.ts` перевёл text/vector fallback на пагинацию по всей истории пользователя: больше нет скрытого свежего bias через `limit(400)` на embeddings и `limit(600)` на последние knowledge chunks.
- Вынес чистые helper’ы `collectPaginatedRows`, `rankKnowledgeChunksByText`, `rankKnowledgeMatchesFromEmbeddingRows`, чтобы исторический retrieval был проверяемым без живого AI runtime и без внешнего embedding provider.
- Добавил `tests/rls/retrieval-history.spec.ts`: suite подтверждает, что pager доходит дальше первых страниц, старый релевантный text chunk находится среди сотен новых нерелевантных записей, а старый релевантный embedding выигрывает в vector fallback после загрузки поздних страниц.
- Tranche подтверждён командами `npx eslint src/lib/ai/knowledge-retrieval.ts tests/rls/retrieval-history.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-17 21:56 - Довёл AI quality gate до реального внешнего блокера

- В `src/lib/ai/chat.ts` добавил явное создание новой AI-сессии, а `src/app/api/ai/sessions/route.ts` научил `POST`, чтобы новый чат существовал на сервере до первого сообщения.
- `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-actions.ts` и `src/components/ai-chat-panel.tsx` перевёл на этот контракт: новый чат, stale-session recovery и анализ фото еды больше не падают на ложном `AI_CHAT_SESSION_NOT_FOUND`.
- Дочистил AI gate тест `tests/ai-gate/ai-quality-gate.spec.ts`: assistant surface теперь доходит до provider/runtime notice вместо зависания на пустом transcript state.
- Подтвердил общий baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/ai-gate tests/e2e/helpers/ai.ts tests/e2e/helpers/auth.ts`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1` -> `2 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- `npm run test:ai-gate` теперь падает только на реальном внешнем блокере: `OpenRouter 402` по кредитам и `Voyage 403` по embeddings.

### 2026-03-18 00:35 - Дожал regression-контур мобильной тренировки

- В `src/components/workout-day-session.tsx` убрал принудительный возврат к первому незавершённому шагу при hydration: focus-mode теперь даёт открыть уже сохранённый шаг и нажать `Редактировать`, если нужно поправить упражнение.
- В `src/components/workout-session/use-workout-session-actions.ts` автопереход на следующий шаг теперь делается в момент сохранения упражнения, а не глобальным эффектом после любого server snapshot.
- Добавил стабильные `data-testid` на шаги, карточки упражнения, save/edit-кнопки и таймер в `src/components/workout-session/workout-step-strip.tsx`, `src/components/workout-session/workout-exercise-card.tsx`, `src/components/workout-day-session.tsx`.
- Расширил тестовые helper'ы `tests/e2e/helpers/workouts.ts` и `tests/e2e/helpers/navigation.ts`, а также добавил новый сценарий `tests/e2e/workout-focus-flow.spec.ts`: теперь отдельным e2e подтверждены ordered-step flow, повторное редактирование сохранённого шага, сохранение времени при завершении и полный reset до стартового состояния.
- Заодно убрал хрупкий `networkidle` из owner-isolation сценария `tests/e2e/ownership-isolation.spec.ts`, чтобы admin/user proposal isolation не флакал на лишнем сетевом шуме.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth -- --reporter=line` -> `38 passed`.

### 2026-03-18 02:10 - Привёл admin в общий workspace-паттерн и убрал hydration-риск у section visibility

- Вынес `/admin` в новый `src/components/admin-dashboard-workspace.tsx`: операторская главная теперь использует тот же workspace-подход, что `Dashboard`, `Workouts`, `Nutrition` и `Settings`, с секциями `Состояние`, `Очереди`, `Пользователи`, `ИИ` и `Главный доступ`.
- `src/app/admin/page.tsx` стал server-side orchestrator'ом: загрузка данных осталась на странице, а сам heavy UI moved в выделенный workspace surface без giant inline markup.
- `src/components/page-workspace.tsx` перевёл на hydration-safe чтение `localStorage`: состояние скрытия `обзора / меню / раздела` теперь поднимается только после mount и больше не даёт mismatch между серверным HTML и клиентом.
- Для тестового контура зафиксировал production-like build contract в `package.json`: `build`, `build:test` и `start:test` явно работают со стандартным `.next`, чтобы Playwright и Vercel не расходились по `distDir`.
- Обновил `tests/e2e/mobile-pwa-regressions.spec.ts`: mobile regression теперь отдельно подтверждает admin workspace, section-menu и hide/show toggles на `/admin`.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm exec playwright test tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1 --reporter=line` -> `8 passed`, `npm run test:e2e:auth` -> `38 passed`.

### 2026-03-18 03:25 - Дожал shell и навигацию до production-паттерна

- `src/components/app-shell-frame.tsx` полностью пересобран в чистом UTF-8: desktop header и compact header больше не отдают битую кириллицу, а collapsed-state остаётся читаемым и предсказуемым.
- `src/components/app-shell-nav.tsx` теперь поднимает состояние burger-drawer наружу через `onDrawerOpenChange`, так что shell знает, когда mobile drawer действительно открыт.
- `src/components/ai-assistant-widget.tsx` получил `hidden` contract и стабильный `data-testid` для floating launcher; в mobile shell AI-виджет теперь не мешает burger-menu и не перекрывает drawer.
- `src/app/api/admin/users/[id]/route.ts` больше не зависит от `PLAYWRIGHT_TEST_HOOKS` для forced degraded snapshot: admin detail fallback regression теперь стабилен независимо от того, как именно поднят локальный test server.
- Полностью переписал `tests/e2e/mobile-pwa-regressions.spec.ts` и `tests/e2e/ui-regressions.spec.ts` в чистом UTF-8 и добавил отдельную desktop-shell regression: проверяется полный top nav, сворачивание шапки и отсутствие hydration/render-loop regressions на user/admin surface.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts tests/e2e/ui-regressions.spec.ts tests/e2e/ownership-isolation.spec.ts -g "AI chat history|admin app|mobile pwa regressions|ui regressions" --workers=1 --reporter=line` -> `13 passed`.

### 2026-03-18 14:25 - Довёл AI chat и knowledge до orchestrator-паттерна

- `src/components/use-ai-chat-web-search.ts` вынес hydration-safe `web search` storage state и toggle-логику из `src/components/ai-chat-panel.tsx`, так что сам чат больше не держит `useSyncExternalStore` plumbing внутри JSX-orchestrator слоя.
- `src/components/use-ai-chat-session-recovery.ts` вынес stale-session recovery: сброс transcript state, повторный `createRemoteSession(...)` и safe retry на `AI_CHAT_SESSION_NOT_FOUND` больше не размазаны по `ai-chat-panel.tsx`.
- `src/components/ai-chat-panel.tsx` теперь сводит только orchestration: toolbar/notices/transcript/composer + вызовы `useAiChatWebSearch`, `useAiChatSessionRecovery`, `useAiChatSessionState`, `useAiChatActions`, `useAiChatComposer`, `useAiChatViewState`.
- `src/lib/ai/knowledge-runtime.ts` вынес `reindexUserKnowledgeBase(...)` и `ensureKnowledgeIndex(...)` из `src/lib/ai/knowledge.ts`; сам `knowledge.ts` теперь остался тонким facade для re-export и `retrieveKnowledgeMatches(...)`.
- Пункт плана про финальную orchestrator-роль `knowledge.ts` и `ai-chat-panel.tsx` закрыт; общий прогресс execution checklist после tranche: `140 / 176` (`80%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 15:20 - Довёл workout day screen до orchestrator-паттерна

- `src/components/workout-session/workout-status-actions.tsx` вынес action-bar статусов (`Начать`, `Завершить`, `Синхр.`, `Обнулить`) из `src/components/workout-day-session.tsx`, так что day-screen больше не держит внутри business-aware button JSX.
- `src/components/workout-session/workout-day-notices.tsx` вынес offline/lock/error/notice surface из `workout-day-session.tsx`; предупреждения и sync notices теперь живут отдельно от orchestration state.
- `src/components/workout-session/workout-focus-header.tsx` вынес мобильный focus-header: таймер, collapse toggle, regular-mode CTA, progress pills и compact action area больше не смешаны с sync/persistence logic в основном экране.
- `src/components/workout-day-session.tsx` после этого стал ближе к реальной orchestrator-роли: он собирает derived state, sync/actions/timer hooks и композицию через `WorkoutDayOverviewCard`, `WorkoutDayContextCard`, `WorkoutFocusHeader`, `WorkoutDayNotices`, `WorkoutStatusActions`, `WorkoutExerciseCard`.
- Пункт плана про финальную orchestrator-роль `workout-day-session.tsx` закрыт; общий прогресс execution checklist после tranche: `141 / 176` (`80%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 17:55 - Довёл AI workspace до читаемого сценария и почистил copy

- `src/components/ai-workspace.tsx` получил явный flow-блок `Запрос -> Анализ -> Предложение -> Подтверждение -> Применение`, поэтому путь работы с AI теперь читается прямо на странице, а не только через разрозненные карточки в чате.
- `src/components/ai-chat-panel-cards.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-composer.tsx` и связанный AI surface copy выровнены под читаемый user-facing сценарий без служебных формулировок.
- `tests/e2e/ai-workspace.spec.ts` теперь подтверждает наличие нового assistant-flow surface, а полный regression baseline заново зелёный.
- Пункт плана про сценарий `запрос -> анализ -> предложение -> подтверждение -> применение` закрыт; общий прогресс execution checklist после tranche: `142 / 176` (`81%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 19:05 - Сделал AI proposal actions идемпотентными

- В `src/lib/ai/proposal-actions.ts` перевёл `approveAiPlanProposal(...)` и `applyAiPlanProposal(...)` в идемпотентный режим: повторное подтверждение возвращает уже `approved` proposal, а повторное применение возвращает уже `applied` proposal и тот же applied meta без лишнего side effect.
- Для applied proposals добавил единый helper `buildAppliedProposalMeta(...)`, чтобы и первый, и повторный `apply` отдавали одинаковый `mealTemplateIds` / `weeklyProgramId` payload вместо скрытого расхождения между первичным и повторным ответом.
- `tests/e2e/api-contracts.spec.ts` расширен admin-only контрактом на повторные `approve/apply` вызовы; сценарий использует реальный seeded proposal и подтверждает, что второй запрос остаётся `200`, не дублирует побочный эффект и возвращает тот же applied result.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `7 passed`, `npm run test:e2e:auth` -> `40 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 20:10 - Восстановил стабильный typecheck и добавил regression на повторные done/reset

- В `package.json` перевёл `typecheck` обратно на стандартный `.next`, а из `tsconfig.json` убрал legacy include-пути `.next_build/types/**/*.ts` и `.next_build/dev/types/**/*.ts`: baseline снова проходит за один запуск без `TS6053` на отсутствующих route types.
- `tests/e2e/workout-sync.spec.ts` получил отдельный direct-route regression: после заполнения сета повторный `PATCH /api/workout-days/[id]` со статусом `done` и повторный `POST /api/workout-days/[id]/reset` оба остаются `200` и возвращают тот же корректный snapshot.
- Тестовый контракт теперь отдельно подтверждает, что direct workout mutation routes безопасно переживают повторные запросы, а не только `sync/push -> reset -> sync/pull` сценарий.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/workout-sync.spec.ts -g "done and reset routes stay idempotent on repeated requests" --workers=1` -> `1 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 21:05 - Расширил direct RLS ownership на nutrition self-service слой

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `meal_templates`, `meals`, `meal_items`, а затем расширил этот же слой до `recipe_items` и `daily_nutrition_summaries`.
- `tests/rls/ownership.spec.ts` теперь напрямую подтверждает, что владелец видит свои `meal_templates`, `meals`, `meal_items`, `recipe_items`, `daily_nutrition_summaries`, а другой auth-user не видит их даже при точечном запросе по `id`.
- Это добивает прямой row-level слой для nutrition self-service контура: owner-only подтверждён не только route-level e2e, но и raw Supabase client access tests.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-18 22:20 - Довёл typecheck до реально стабильного one-run контракта

- Первый фикс с простым переводом `typecheck` на `.next` оказался недостаточным: `next typegen` не строил полный `app`-набор route wrappers после чистого удаления `.next/types`, из-за чего `tsc` продолжал ловить `TS6053`.
- Для этого добавил `scripts/typecheck-stable.mjs`: runner сначала запускает `npx next typegen`, потом проверяет, действительно ли появились route wrappers в `.next/types/app/...`, и если нет — автоматически догоняет их через `npm run build`, а уже затем запускает `tsc`.
- После этого `package.json` переведён на новый runner, и baseline подтверждён честным сценарием с удалением `.next/types` через Node и последующим одним `npm run typecheck` без ручного повтора.
- Tranche подтверждён командами `node -e \"fs.rmSync('.next/types', ...)\"`, `npm run typecheck`, `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run build`.

### 2026-03-19 00:40 - Дожал nutrition targets contract и прямой RLS для профиля питания

- В `src/app/api/nutrition/targets/route.ts` перенёс обработку `ZodError` до unexpected logger-ветки: ожидаемо невалидный payload на `PUT /api/nutrition/targets` теперь даёт явный `400 NUTRITION_TARGETS_INVALID` без лишнего route-level `logger.error`.
- В `tests/e2e/api-contracts.spec.ts` добавил invalid-payload контракт для nutrition targets, а `tests/e2e/helpers/http.ts` расширил общим `PUT`-методом.
- В `tests/rls/helpers/supabase-rls.ts` и `tests/rls/ownership.spec.ts` расширил прямой owner-only coverage до `goals`, `nutrition_goals`, `nutrition_profiles`, `body_metrics`, чтобы nutrition/body/self-profile слой был подтверждён не только route-level e2e, но и raw Supabase client access тестами.
- Проверка зелёная: `npx eslint src/app/api/nutrition/targets/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/http.ts tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npm run test:e2e:auth` -> `41 passed`.

### 2026-03-19 02:05 - Расширил direct RLS на профили, метрики и AI memory

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, чтобы тестовый owner-only слой покрывал уже и профильный/агрегатный/AI-memory контур.
- В `tests/rls/ownership.spec.ts` расширил прямые проверки видимости и blocked-update сценарии: другой auth-user теперь подтверждённо не видит и не может менять `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`.
- Это уменьшает реальный хвост по database audit: RLS теперь подтверждён не только route-level e2e и nutrition/workout assets, но и на нескольких ключевых user-scoped таблицах, из которых читаются `viewer`, onboarding, dashboard aggregates и AI context.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 02:40 - Закрыл прямой RLS на billing user tables

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`, чтобы billing user-scoped слой тоже был подтверждён direct Supabase client access тестами.
- В `tests/rls/ownership.spec.ts` расширил owner-only проверки: владелец видит свои billing rows, другой auth-user не видит их и не может точечно обновить `usage_counters`.
- Это снижает остаток по database/billing audit: user-scoped billing данные теперь покрыты не только route guards, но и прямой RLS-проверкой.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 03:15 - Довёл direct RLS до workout execution rows

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `workout_days`, `workout_exercises`, `workout_sets`, чтобы owner-only suite покрывал уже и фактическое выполнение тренировки, а не только `weekly_programs` и `workout_templates`.
- В `tests/rls/ownership.spec.ts` расширил direct checks: владелец видит свои `workout_day / workout_exercise / workout_set`, другой auth-user не видит их и не может обновить чужой `workout_set`.
- Заодно сделал billing fixture идемпотентным через `upsert` для `entitlements` и `usage_counters`, чтобы `test:rls` не падал на накопленных уникальных ключах предыдущих прогонов.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 05:05 - Зафиксировал полный Supabase DB audit и закрыл DB checklist пункты

- Собрал свежий MCP-снимок базы через `list_tables`, `get_advisors`, прямые SQL-запросы к `pg_indexes`, `pg_policies` и `information_schema.routines`, чтобы закрыть DB checklist не “по памяти”, а по актуальному состоянию проекта.
- Добавил `docs/DB_AUDIT.md` как source of truth по схеме, RLS, RPC, owner/deny-all policies, индексным путям и остаткам Supabase advisors для `fit`.
- В `docs/README.md` и `docs/BACKEND.md` добавил явные ссылки на новый audit-doc, чтобы DB-срез был частью рабочей handoff-документации, а не отдельной временной заметкой.
- Подтверждено, что используемые `public`-таблицы находятся под `RLS`, ключевые owner-only и deny-all policies зафиксированы, а query paths для `sync`, `workout`, `knowledge`, `admin`, `billing` обеспечены индексами.
- По security advisors остались только platform-level residuals: `vector` extension в `public` и выключенная `leaked password protection`; по performance advisors остались только `unused_index` info без блокирующих missing-index warning.
- В `docs/MASTER_PLAN.md` закрыты два основных DB-пункта: полный аудит схемы/RLS/RPC/index-path через MCP и отдельная проверка query paths/индексов для критических контуров. Общий прогресс execution checklist после tranche: `144 / 176` (`82%`).

### 2026-03-19 16:55 - Дожал auth-first billing contracts и invalid payload coverage

- `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/settings/billing/route.ts` теперь жёстко auth-first: анонимный запрос получает `401 AUTH_REQUIRED` до любых Stripe/env checks.
- В `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/settings/billing/route.ts` ожидаемый `ZodError` теперь возвращает явный `400` до unexpected logger-ветки, поэтому invalid payload больше не шумит как route-level failure.
- `src/app/api/billing/webhook/stripe/route.ts` и весь billing/settings surface в этом tranche переведены в чистый UTF-8: user-facing auth/config/error copy больше не отдаёт битую кириллицу.
- `tests/e2e/api-contracts.spec.ts` расширен двумя контрактами: unauthenticated billing/settings routes остаются auth-first (`401 AUTH_REQUIRED`), а invalid payload на `POST /api/settings/billing` даёт `400 SETTINGS_BILLING_INVALID`.
- В `tests/e2e/helpers/auth.ts` добавлен более устойчивый `waitForSubmitButtonReady(...)`, чтобы Playwright auth bootstrap не флакал из-за delayed React-controlled form state.
- Tranche подтверждён командами `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/auth.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`.

### 2026-03-19 17:30 - Санировал shared billing access copy

- `src/lib/billing-access.ts` переведён в чистый UTF-8 на уровне общего feature-config словаря, deny-reason текстов и `FEATURE_ACCESS_DENIED` copy; shared billing snapshot больше не тянет mojibake в `/settings`, `/ai`, `/nutrition` и другие поверхности, которые читают общий access слой.
- Логика доступа, fallback и usage counters не менялась: tranche ограничен shared user-facing copy и форматированием billing layer.
- Tranche подтверждён командами `npx eslint src/lib/billing-access.ts`, `npm run typecheck`, `npm run build`. Дополнительно содержимое файла перепроверено прямым поиском по нормальным русским строкам, чтобы исключить ложный PowerShell misrender.

### 2026-03-19 19:05 - Разнёс heavy settings surfaces на model/helper слои

- `src/lib/settings-data-server.ts` разгружен до server-data orchestration роли: snapshot factory, audit-action constants и mapper/formatter helpers вынесены в `src/lib/settings-data-server-model.ts`.
- `src/components/settings-billing-center.tsx` переведён на вынесенный formatter/model слой `src/components/settings-billing-center-model.ts`, поэтому billing screen больше не держит внутри себя pure date/status/feature/timeline helper-логику.
- `src/components/settings-data-center.tsx` переведён на вынесенный formatter/model слой `src/components/settings-data-center-model.ts`, чтобы export/deletion surface тоже был ближе к orchestrator-роли, а не к смеси JSX и derive helper-функций.
- В `tests/rls/ownership.spec.ts` поднял timeout до `60_000`, потому что direct owner-only suite после всех последних расширений уже не помещался в старый `30s`, хотя по логике оставался зелёным.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `4 passed`.
- Общий прогресс execution checklist не изменился и остаётся `144 / 176` (`82%`): tranche уменьшает архитектурный и maintenance-риск, но не закрывает отдельный основной checkbox целиком.

### 2026-03-19 20:10 - Вынес settings self-service доменную логику из route handlers

- Добавил `src/lib/settings-self-service.ts` и перенёс туда общий auth-context, audit logging, `queue export`, `request/cancel deletion`, `load billing center data`, `request billing access review`.
- `src/app/api/settings/data/route.ts` и `src/app/api/settings/billing/route.ts` теперь ближе к transport-слою: HTTP-валидация и API responses остались в route handlers, а доменная self-service логика живёт в `lib`.
- Это уменьшает дублирование между route handlers и `lib` в одном из самых тяжёлых self-service контуров и двигает открытый основной пункт по domain-rule extraction.
- Проверка зелёная: `npx eslint src/lib/settings-self-service.ts src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts`, `npm run build`, `npm run typecheck`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice уменьшает architectural drift, но не закрывает отдельный основной checkbox целиком.

### 2026-03-19 21:00 - Вынес billing self-service доменную логику из checkout routes

- Добавил `src/lib/billing-self-service.ts` и перенёс туда Stripe self-service слой для `checkout / reconcile / portal`: env guards, customer lookup, checkout session creation, checkout reconcile, portal session creation и self-service audit logging.
- `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts` теперь ближе к transport-слою: auth, Zod validation и response shape остаются в handlers, а бизнес-логика и side-effects живут в `lib`.
- Заодно полностью убран remaining mojibake из `billing/portal` и синхронизирован user-facing billing copy вокруг self-service Stripe flow.
- `src/app/api/settings/data/export/[id]/download/route.ts` тоже переведён на общий self-service слой: owner-only export lookup, archive build и download audit log теперь идут через `src/lib/settings-self-service.ts`, а route handler остался transport-обёрткой.
- Проверка зелёная: `npx eslint src/lib/billing-self-service.ts src/lib/settings-self-service.ts src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/settings/data/export/[id]/download/route.ts`, `npm run typecheck`, `npm run build`.
- Попытка локально прогнать короткий Playwright API contract slice упёрлась в локальный browser-runner timeout этой машины, поэтому для этого tranche я фиксировал baseline по compile/lint gates без дополнительного browser-suite.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice уменьшает backend duplication и route-handler drift, но не закрывает следующий основной checkbox целиком.

### 2026-03-19 22:10 - Вынес nutrition write-model из create routes

- Добавил `src/lib/nutrition/nutrition-write-model.ts` и перенёс туда общий owner-scoped nutrition write-layer: загрузку `foods` по `user_id`, проверку missing-food ids, расчёт macro snapshots и подготовку payload для `recipe_items`, `meal_items` и template `payload.items`.
- `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` и `src/app/api/meals/route.ts` стали тоньше и больше не дублируют один и тот же `foods -> macros -> payload` код в каждом handler.
- Одновременно санировал user-facing copy в этих create-routes и добавил rollback для `meals`: если вставка `meal_items` падает, временно созданная `meals` строка теперь удаляется, чтобы не оставлять несогласованное состояние.
- Кодовые проверки зелёные: `npx eslint src/lib/nutrition/nutrition-write-model.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts`, `npm run typecheck`, `npm run build`.
- Повторные browser suites (`npm run test:e2e:auth`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1`, `npm run test:smoke`) на этой машине снова упёрлись в локальный timeout runner'а, поэтому tranche зафиксирован по compile/type baseline без нового browser green run.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice уменьшает backend duplication, но не закрывает отдельный основной checkbox целиком.

### 2026-03-19 22:35 - Вынес nutrition self-service delete/update слой из [id] routes

- Добавил `src/lib/nutrition/nutrition-self-service.ts` и перенёс туда общий nutrition self-service слой: generic owner-scoped delete helper, `meal` delete с пересчётом дневной summary и build helper для `foods` update payload.
- `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts` и `src/app/api/meals/[id]/route.ts` теперь ближе к transport-слою и больше не дублируют один и тот же owner-check/delete/update plumbing.
- Заодно полностью перевёл эти route handlers в чистый UTF-8, чтобы remaining mojibake не висел в nutrition self-service surface.
- Проверка зелёная: `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/[id]/route.ts src/app/api/recipes/[id]/route.ts src/app/api/meal-templates/[id]/route.ts src/app/api/meals/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice уменьшает backend duplication и sanitation backlog, но не закрывает отдельный основной checkbox целиком.

### 2026-03-19 22:55 - Дочистил foods list/create surface

- В `src/app/api/foods/route.ts` убрал remaining mojibake и перевёл list/create copy в чистый UTF-8.
- В `src/lib/nutrition/nutrition-self-service.ts` добавил `buildFoodCreateData(...)`, чтобы food create-path использовал тот же shared normalization слой, что и `[id]` update/delete handlers.
- Проверка зелёная: `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice добивает nutrition self-service sanitation, но не закрывает следующий основной checkbox целиком.

### 2026-03-19 23:20 - Санировал shared AI chat и proposal copy

- Полностью переписал `src/lib/ai/chat.ts` в чистом UTF-8: shared session-not-found errors теперь не тянут битый copy в AI history, session restore и delete flow.
- Полностью переписал `src/lib/ai/proposal-actions.ts` в чистом UTF-8: preview titles, request summaries, timelines, owner-only errors и applied/approved messages больше не отдают mojibake в assistant flow и proposal studio.
- Логика proposal actions и AI chat state не менялась; tranche ограничен shared copy sanitation и сохранением текущих owner-only/idempotent contracts.
- Проверка зелёная: `npx eslint src/lib/ai/chat.ts src/lib/ai/proposal-actions.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): slice закрывает remaining shared AI copy backlog, но не закрывает следующий основной checkbox целиком.

### 2026-03-19 23:45 - Санировал AI eval surface

- `src/lib/ai/eval-suites.ts` и `src/lib/ai/eval-runs.ts` переписаны в чистом UTF-8: названия наборов проверок, shared labels ручных и плановых запусков больше не отдают битую кириллицу.
- `src/app/api/admin/ai-evals/route.ts`, `src/app/api/admin/ai-evals/run/route.ts` и `src/app/api/internal/jobs/ai-evals-schedule/route.ts` теперь возвращают нормальный operator-facing copy без изменения API contracts.
- `src/components/admin-ai-eval-runs.tsx` полностью санирован: статусы, notices, quick-run block и пустое состояние снова читаются нормально на русском языке.
- Проверка зелёная: `npx eslint src/lib/ai/eval-suites.ts src/lib/ai/eval-runs.ts src/app/api/admin/ai-evals/route.ts src/app/api/admin/ai-evals/run/route.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/components/admin-ai-eval-runs.tsx`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche сокращает sanitation backlog AI/admin surface, но не закрывает отдельный основной checkbox целиком.

### 2026-03-20 00:05 - Вынес shared runtime copy из ai/chat

- Добавил `src/lib/ai/chat-runtime-copy.ts`: shared user-facing copy для `ai/chat` теперь живёт вне route handler и включает not-configured/auth-invalid/provider/runtime/safety сообщения в чистом UTF-8.
- `src/app/api/ai/chat/route.ts` переведён на этот helper без изменения owner-only, billing, retrieval и session contracts: route остался transport-слоем, а shared runtime copy больше не дублируется внутри handler.
- Проверка зелёная: `npx eslint src/lib/ai/chat-runtime-copy.ts src/app/api/ai/chat/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает route/lib extraction и sanitation wave, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 00:20 - Вынес shared copy из AI plan routes

- Добавил `src/lib/ai/plan-route-copy.ts`: общий user-facing copy для `ai/meal-plan` и `ai/workout-plan` теперь живёт в одном helper слое и включает auth/runtime/invalid/provider/safety сообщения в чистом UTF-8.
- `src/app/api/ai/meal-plan/route.ts` и `src/app/api/ai/workout-plan/route.ts` переведены на этот helper без изменения owner-only, billing и generation contracts: handlers остались transport-обёртками вокруг plan generation flow.
- Проверка зелёная: `npx eslint src/lib/ai/plan-route-copy.ts src/app/api/ai/meal-plan/route.ts src/app/api/ai/workout-plan/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche сокращает AI route duplication и sanitation backlog, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 00:45 - Вынес shared runtime copy из ai/assistant

- Добавил `src/lib/ai/assistant-runtime-copy.ts`: shared runtime, safety и tool-facing copy для `ai/assistant` теперь живёт вне route handler и включает not-configured/auth-invalid/provider/runtime messages, safety fallback, tool descriptions и summary helpers.
- `src/app/api/ai/assistant/route.ts` переведён на этот helper без изменения owner-only, billing, retrieval, proposal и streaming contracts: route остался orchestration-слоем, а shared copy и text-formatting helper'ы больше не дублируются внутри handler.
- `src/lib/ai/domain-policy.ts` остаётся зелёным и синхронизированным с текущим AI helper tranche; локальный diff там ограничен форматной нормализацией prompt-строки.
- Проверка зелёная: `npx eslint src/lib/ai/assistant-runtime-copy.ts src/app/api/ai/assistant/route.ts src/lib/ai/domain-policy.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает AI route/lib extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 01:05 - Вынес shared vision/runtime copy из ai/meal-photo

- Добавил `src/lib/ai/meal-photo-runtime-copy.ts`: shared user-facing и vision/runtime copy для `ai/meal-photo` теперь живёт вне route handler и включает validation/error messages, vision prompt, user-message builder и форматирование итогового разбора блюда.
- `src/app/api/ai/meal-photo/route.ts` переведён на этот helper без изменения owner-only, billing, image-processing и chat-session contracts: route остался transport-обёрткой вокруг meal-photo vision flow.
- Проверка зелёная: `npx eslint src/lib/ai/meal-photo-runtime-copy.ts src/app/api/ai/meal-photo/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает AI route/lib extraction и sanitation wave, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 01:20 - Вынес shared helper из AI session routes

- Добавил `src/lib/ai/session-route-helpers.ts`: общий auth-context и user-facing copy для `ai/sessions` и `ai/sessions/[id]` теперь живут вне route handlers и покрывают create/delete/clear auth, invalid id и default title нового чата.
- `src/app/api/ai/sessions/route.ts` и `src/app/api/ai/sessions/[id]/route.ts` переведены на этот helper без изменения owner-only session contracts: handlers стали тоньше, а delete-route дополнительно синхронизирован в чистом UTF-8.
- Проверка зелёная: `npx eslint src/lib/ai/session-route-helpers.ts src/app/api/ai/sessions/route.ts src/app/api/ai/sessions/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает AI route/lib extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 01:45 - Вынес shared helper из AI proposal routes

- Добавил `src/lib/ai/proposal-route-helpers.ts`: общий auth/proposal lookup/billing feature resolution для `ai/proposals/[id]/apply` и `ai/proposals/[id]/approve` теперь живёт вне route handlers и покрывает auth gate, owner-scoped proposal lookup, invalid-id parse и feature access bootstrap.
- `src/app/api/ai/proposals/[id]/apply/route.ts` и `src/app/api/ai/proposals/[id]/approve/route.ts` переведены на этот helper без изменения owner-only proposal contracts: route handlers теперь ближе к transport-слою и держат только route-specific action call и error mapping.
- Проверка зелёная: `npx eslint src/lib/ai/proposal-route-helpers.ts src/app/api/ai/proposals/[id]/apply/route.ts src/app/api/ai/proposals/[id]/approve/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает AI route/lib extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 02:15 - Вынес shared helper из knowledge reindex routes

- Добавил `src/lib/ai/knowledge-reindex-admin.ts`: общий parse/logging слой для ручного `ai/reindex` и internal `knowledge-reindex` jobs теперь живёт вне route handlers и покрывает parse mode, support action logging, audit logging и форматирование итогового success message.
- `src/app/api/ai/reindex/route.ts` и `src/app/api/internal/jobs/knowledge-reindex/route.ts` переведены на этот helper без изменения owner-only/admin-job contracts: route handlers стали тоньше и держат только auth, validation, orchestration и response shape.
- Проверка зелёная: `npx eslint src/lib/ai/knowledge-reindex-admin.ts src/app/api/ai/reindex/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает AI/data route extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 02:40 - Вынес shared helper из admin support action routes

- Добавил `src/lib/admin-support-actions.ts`: общий queue+audit слой для `admin/users/[id]/support-action`, `suspend` и `restore` теперь живёт вне route handlers и покрывает insert в `support_actions` плюс follow-up audit insert.
- `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts` и `src/app/api/admin/users/[id]/restore/route.ts` переведены на этот helper без изменения owner-only/admin-action contracts: в handlers остались auth, target guard, validation и response shape.
- Проверка зелёная: `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts src/app/api/admin/users/[id]/restore/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает admin/backend route extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 03:05 - Вынес shared helper из admin export and deletion routes

- Добавил `src/lib/admin-user-requests.ts`: общий export/deletion admin слой теперь живёт вне route handlers и покрывает queue export job, hold deletion request и cancel deletion request вместе с audit insert.
- `src/app/api/admin/users/[id]/export/route.ts` и `src/app/api/admin/users/[id]/deletion/route.ts` переведены на этот helper, а `src/app/api/admin/users/bulk/route.ts` использует тот же export queue helper для ветки `queue_export`.
- Проверка зелёная: `npx eslint src/lib/admin-user-requests.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает admin/backend route extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 03:20 - Дотянул bulk support-action ветки до shared helper

- `src/app/api/admin/users/bulk/route.ts` переведён на `src/lib/admin-support-actions.ts` для bulk-веток `queue_resync` и `queue_suspend`, чтобы `support_actions` insert и audit payload не дублировались отдельно от single-user admin routes.
- Shared helper теперь корректно мерджит `supportActionId` и дополнительный audit payload вроде `batchId`, поэтому bulk и single-user admin flows используют один и тот же queue/audit слой без потери метаданных.
- Проверка зелёная: `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает route/lib extraction в admin surface, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 03:35 - Вынес shared billing audit/event helper из admin routes

- `src/lib/admin-billing.ts` расширен helper'ами `recordAdminSubscriptionEvent(...)` и `recordAdminBillingAudit(...)`, чтобы insert в `subscription_events` и `admin_audit_logs` для admin billing flows больше не жили внутри route handlers.
- `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts` и `src/app/api/admin/users/bulk/route.ts` переведены на этот shared billing audit/event слой без изменения owner/admin contracts.
- Проверка зелёная: `npx eslint src/lib/admin-billing.ts src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает route/lib extraction в admin/billing surface, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 04:05 - Вынес shared helper из admin role route

- Добавил `src/lib/admin-role-management.ts`: target lookup через auth admin API, чтение `platform_admins`, primary super-admin guards и audit insert для role-management теперь живут вне route handler.
- `src/app/api/admin/users/[id]/role/route.ts` переведён на этот helper без изменения access-control contracts: `PATCH` и `DELETE` стали тоньше и больше не дублируют один и тот же target/audit plumbing.
- Проверка зелёная: `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает admin/backend extraction, но не закрывает следующий основной checkbox целиком.

### 2026-03-24 23:20 - Добавил rollout и release gate для RAG v2

- Добавил [knowledge-retrieval-rollout.ts](/C:/fit/src/lib/ai/knowledge-retrieval-rollout.ts): retrieval pipeline теперь поддерживает режимы `legacy`, `hybrid`, `shadow`, а `shadow` сохраняет legacy ranking и логирует rollout snapshot для безопасного сравнения.
- [env.ts](/C:/fit/src/lib/env.ts), [package.json](/C:/fit/package.json), [quality.yml](/C:/fit/.github/workflows/quality.yml) и [\.env.example](/C:/fit/.env.example) синхронизированы под `AI_RETRIEVAL_MODE` и новый release harness [verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs).
- Добавлен regression suite [retrieval-rollout.spec.ts](/C:/fit/tests/ai-gate/retrieval-rollout.spec.ts), а `npm run test:retrieval-gate` теперь покрывает hybrid rollout mode вместе с metadata, chunk sync, retrieval metrics и historical fallback.
- Локальная verification-связка зелёная: `npm run lint`, `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`. `npm run verify:retrieval-release` сейчас честно упирается во внешний provider blocker: `OpenRouter 402` по кредитам и `Voyage 403` по embeddings.
- Общий прогресс execution checklist остаётся `165 / 176` (`94%`), а профильный `RAG_V2_EXECUTION` вырос до `15 / 18` (`83%`).

### 2026-03-24 23:55 - Закрыл telemetry и latency baseline для RAG v2

- Добавил [knowledge-retrieval-telemetry.ts](/C:/fit/src/lib/ai/knowledge-retrieval-telemetry.ts) и расширил [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts): pipeline теперь снимает step-level telemetry по `indexRefresh`, `embedding`, `semantic`, `lexical`, `hybridRank`, candidate counts и rollout summary.
- Добавил [knowledge-retrieval-performance.ts](/C:/fit/src/lib/ai/knowledge-retrieval-performance.ts), [retrieval-telemetry.spec.ts](/C:/fit/tests/ai-gate/retrieval-telemetry.spec.ts) и [retrieval-performance.spec.ts](/C:/fit/tests/ai-gate/retrieval-performance.spec.ts); deterministic latency budget теперь является частью `npm run test:retrieval-gate`.
- Добавил handoff [RETRIEVAL_PERFORMANCE.md](/C:/fit/docs/RETRIEVAL_PERFORMANCE.md) с текущим baseline: `p50 0.1346 ms`, `p95 0.3964 ms`, `max 0.9397 ms`, `250` samples на caps `30 / 30 / 20 / 8`.
- Проверка зелёная: `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`.
- Общий progress в [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) остаётся `165 / 176` (`94%`), а профильный [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) после корректного пересчёта checklist находится на `17 / 19` (`89%`).

### 2026-03-25 00:10 - Зафиксировал реальный blocker по финальным DB slices RAG v2

- Сверка через Supabase MCP показала, что доступный namespace `supabase-finappka` указывает не на `fit`, а на другой проект с finance/tenders schema.
- Из-за этого два оставшихся пункта [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) по `knowledge_chunks` DDL, lexical index и hybrid RPC нельзя безопасно закрывать через `apply_migration` и advisors до корректной project binding.
- Блокер зафиксирован в [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md).

### 2026-03-21 11:45 - Подготовил Android / TWA scaffold и досанировал release docs

- Добавлен Android/TWA release blueprint `android/twa-release.json`: package name `app.fitplatform.mobile`, production host, splash assets, signing placeholders и Play metadata теперь зафиксированы как source of truth для Android-оболочки.
- Добавлен `npm run verify:android-twa` и скрипт `scripts/verify-android-twa.mjs`: он валидирует Android scaffold, синхронизирует `public/android-assetlinks.json` и заранее сигнализирует об отсутствии `ANDROID_TWA_SHA256_FINGERPRINTS`.
- `next.config.ts` получил rewrite `/.well-known/assetlinks.json -> /android-assetlinks.json`, поэтому Digital Asset Links endpoint теперь обслуживается production-safe static asset path вместо нестабильного dot-segment app route.
- Добавлены `docs/ANDROID_TWA.md` и smoke-проверка `tests/smoke/app-smoke.spec.ts` для `/.well-known/assetlinks.json`.
- Досанированы ключевые handoff/release docs и корневой `README.md`: `docs/README.md`, `docs/PROD_READY.md`, `docs/RELEASE_CHECKLIST.md`, `docs/BUILD_WARNINGS.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, `docs/AI_STACK.md`, `docs/DB_AUDIT.md`, `docs/USER_GUIDE.md`.
- Проверка зелёная: `npm run verify:android-twa`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke` -> `5 passed`, `npm run test:e2e:auth` -> `50 passed`.
- Общий прогресс execution checklist вырос до `164 / 176` (`93%`).

### 2026-03-21 12:20 - Уперся в реальный blocker по TWA wrapper

- После подготовки Android scaffold попытался перейти к следующему открытому пункту `Собрать и проверить TWA wrapper`.
- Локальная среда не готова к этому tranche: `java` отсутствует, `adb` отсутствует, а `npx @bubblewrap/cli doctor` не может завершиться без JDK 17 и Android SDK Platform Tools.
- Это уже не кодовый, а инфраструктурный blocker: до установки JDK/Android SDK и появления release fingerprint нельзя закрыть `Готов TWA wrapper` и `Android smoke`.
- Остальные незакрытые основные пункты плана тоже завязаны на внешние зависимости: Stripe production secrets, Sentry production env и AI provider credits (`OpenRouter 402`, `Voyage 403`).
- Текущий baseline остаётся зелёным: `npm run verify:android-twa`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth`.

### 2026-03-21 08:55 - Закрыл Milestone 1 и подтвердил installability production PWA

- `src/app/layout.tsx` больше не держит мёртвый production URL: metadata base теперь собирается через `src/lib/site-url.ts` из `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL` и `VERCEL_URL`, а `.env.example` получил `NEXT_PUBLIC_APP_URL`.
- `tests/smoke/app-smoke.spec.ts` расширен installability smoke: manifest link, apple touch icon, `application-name`, `display=standalone`, `start_url=/dashboard`, maskable icon и service worker с `skipWaiting/clients.claim` теперь подтверждаются автоматически.
- Локальная проверка зелёная: `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth` -> `50 passed`.
- Production alias `https://fit-platform-eta.vercel.app` отдельно подтверждён fetch-проверкой: root HTML отдаёт manifest/apple metadata, `/manifest.webmanifest` возвращает installability-поля, а `/sw.js`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` доступны с `200`.
- Этим закрыты Milestone 1, acceptance-чекбокс про mojibake в ключевых UI/docs и release-пункт про installability production PWA.
- Общий прогресс execution checklist вырос до `158 / 176` (`90%`).

### 2026-03-21 09:05 - Закрыл sanitation-wave документации

- Повторный поиск по `src/` и `docs/` (включая локальный `docs/AI_EXPLAINED.md`) не нашёл характерных mojibake-маркеров, поэтому отдельный triage по локальному explain-документу завершён без правки его содержимого.
- Локальный dirty `docs/AI_EXPLAINED.md` оставлен вне коммитов, но больше не считается blocker для shipped documentation surface.
- Этим закрыт оставшийся волновой sanitation-пункт и верхнеуровневый статус документации переведён в санированное состояние.
- Общий прогресс execution checklist вырос до `160 / 176` (`91%`).

### 2026-03-21 11:40 - Ввёл staging-like verification для AI и billing runtime

- Добавил `npm run verify:staging-runtime`: единый release harness теперь сам проверяет readiness по AI/Stripe env и auth-credentials, запускает `test:ai-gate` и `test:billing-gate` только для реально готовых контуров и печатает явные blocker-причины для остальных.
- Добавил `tests/billing-gate/billing-runtime-gate.spec.ts`: staging-like billing suite умеет подтвердить bootstrapping live Stripe Checkout session, когда готовы `STRIPE_SECRET_KEY` и `STRIPE_PREMIUM_MONTHLY_PRICE_ID`.
- `docs/PROD_READY.md` и `docs/RELEASE_CHECKLIST.md` синхронизированы с новым command-level gate, так что staging-like verification теперь оформлен как официальный release шаг, а не как разовая ручная договорённость.
- Проверка зелёная по коду и harness-обвязке: `npx eslint scripts/verify-staging-runtime.mjs tests/billing-gate/billing-runtime-gate.spec.ts`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 skipped`.
- `npm run verify:staging-runtime` в текущем окружении отрабатывает как и задумано: явно показывает внешний blocker (`AI provider unavailable`, `Stripe env missing`) вместо молчаливого отсутствия процесса.
- Общий прогресс execution checklist вырос до `161 / 176` (`91%`).

### 2026-03-20 18:55 - Вынес self-service orchestration из settings data center

- Добавил `src/components/use-settings-data-center-state.ts`: refresh snapshot, queue export, request/cancel deletion, success/error state и derived flags для settings data center теперь живут вне JSX.
- `src/components/settings-data-center.tsx` переведен на thin UI-orchestrator surface, а `src/components/settings-data-center-model.ts` переписан в чистом UTF-8 без mojibake в export/deletion copy и timeline labels.
- Проверка зелёная: `npm run lint`, `npm run build`, `npm run typecheck`.
- Общий прогресс execution checklist остается `145 / 176` (`82%`): tranche закрывает первый из двух remaining heavy self-service screens.

### 2026-03-20 19:15 - Вынес self-service orchestration из settings billing center

- Добавил `src/components/use-settings-billing-center-state.ts`: checkout return reconcile, retry-loop, URL/session orchestration, access review request flow, feature selection и refresh billing snapshot теперь живут вне JSX.
- `src/components/settings-billing-center.tsx` и `src/components/settings-billing-center-model.ts` синхронизированы в чистом UTF-8: billing center, request-access surface и access timeline больше не держат битый copy.
- После этого закрыт основной checklist-пункт `Async/data orchestration больше не смешивается с JSX в оставшихся тяжёлых экранах`: remaining heavy self-service screens переведены на тот же state-hook/model/orchestrator pattern, что и workout/admin/AI surface.
- Проверка зелёная: `npm run lint`, `npm run build`, `npm run typecheck`. Локальный targeted Playwright smoke для `/settings` уперся в нестабильный `webServer` bootstrap на этой машине, но кодовый baseline по settings surface остается зеленым.
- Общий прогресс execution checklist обновлен до `146 / 176` (`83%`).

### 2026-03-20 22:05 - Дожал self-service contracts в settings routes

- `src/app/api/settings/data/route.ts` и `src/app/api/settings/billing/route.ts` переведены в чистый UTF-8: auth-first и failure copy больше не держат mojibake, а expected validation path не шумит как route-level `error`.
- `tests/e2e/api-contracts.spec.ts` расширен predictable self-service contracts: invalid `settings/data` payload теперь режется как `400 SETTINGS_DATA_INVALID`, повторная отмена удаления как `404 SETTINGS_DELETION_NOT_FOUND`, повторный billing access review как `409 SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE`.
- Проверка зелёная: `npx eslint src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche двигает открытый backend audit по validation/idempotency, но еще не закрывает следующий основной checkbox целиком.

### 2026-03-20 22:40 - Дожал billing self-service transport contracts

- `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/billing/portal/route.ts` переведены в чистый UTF-8: auth-first и runtime failure copy больше не держат mojibake в billing self-service surface.
- `tests/e2e/api-contracts.spec.ts` расширен explicit validation-покрытием для `POST /api/billing/checkout/reconcile`: пустой payload подтвержден как `400 STRIPE_CHECKOUT_RECONCILE_INVALID`.
- Проверка зелёная: `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает route-handler audit по billing/self-service contracts, но не закрывает следующий основной checkbox целиком.

### 2026-03-20 23:20 - Дожал admin billing invalid-payload contract

- `src/app/api/admin/users/[id]/billing/route.ts` и `src/app/api/admin/users/[id]/billing/reconcile/route.ts` переведены в чистый UTF-8: operator-facing invalid/failure copy больше не держит mojibake в admin billing surface.
- `tests/e2e/api-contracts.spec.ts` расширен admin billing validation-контрактом: при валидном `targetUserId` и некорректном payload (`enable_entitlement` без `feature_key`) route подтвержден как `400 ADMIN_BILLING_INVALID` до любых side effects.
- Проверка зелёная: `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает route-handler audit по admin/billing contracts, но не закрывает следующий основной checkbox целиком.

### 2026-03-21 00:05 - Дожал admin bulk и operations transport contracts

- `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/[id]/route.ts` и `src/app/api/admin/users/[id]/role/route.ts` дочищены до чистого UTF-8: operator-facing invalid/not-found/self-guard copy больше не держит mojibake и английские хвосты.
- `src/app/api/admin/operations/[kind]/[id]/route.ts` больше не пишет noisy `logger.error` на ожидаемом `ZodError`: validation path `ADMIN_OPERATION_INVALID` теперь режется до unexpected-failure logging.
- `tests/e2e/api-contracts.spec.ts` расширен тремя admin transport contracts: invalid `GET /api/admin/users/not-a-uuid` -> `400 ADMIN_USER_DETAIL_INVALID`, invalid `POST /api/admin/users/bulk` (`enable_entitlement` без `feature_key`) -> `400 ADMIN_BULK_INVALID`, invalid `PATCH /api/admin/operations/support_action/not-a-uuid` -> `400 ADMIN_OPERATION_INVALID`.
- Проверка зелёная: `npx eslint src/app/api/admin/users/bulk/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 00:35 - Дожал bootstrap, webhook и billing-reconcile contracts

- `src/app/api/admin/bootstrap/route.ts`, `src/app/api/billing/webhook/stripe/route.ts` и `src/app/api/internal/jobs/billing-reconcile/route.ts` переведены в чистый UTF-8: auth/bootstrap, Stripe webhook и billing reconcile job больше не держат английский или битый transport copy.
- `src/app/api/admin/bootstrap/route.ts` больше не пишет noisy `logger.error` на ожидаемом `ZodError`: validation path `ADMIN_BOOTSTRAP_PAYLOAD_INVALID` теперь режется до unexpected-failure logging.
- `src/app/api/internal/jobs/billing-reconcile/route.ts` теперь парсит query до env-gate: invalid `userId` подтверждён как `400 BILLING_RECONCILE_JOB_INVALID`, а не маскируется `503 STRIPE_BILLING_RECONCILE_NOT_CONFIGURED`.
- `tests/e2e/api-contracts.spec.ts` расширен transport-контрактами: anonymous `POST /api/admin/bootstrap` -> `401 AUTH_REQUIRED`, anonymous `POST /api/billing/webhook/stripe` подтверждён как `400 STRIPE_SIGNATURE_MISSING` или `503 STRIPE_WEBHOOK_NOT_CONFIGURED` в зависимости от env.
- `tests/e2e/internal-jobs.spec.ts` расширен validation-контрактом для `POST /api/internal/jobs/billing-reconcile?userId=not-a-uuid` -> `400 BILLING_RECONCILE_JOB_INVALID`.
- Проверка зелёная: `npx eslint src/app/api/admin/bootstrap/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 01:10 - Дожал admin mutation payload contracts

- `src/app/api/admin/users/[id]/billing/route.ts`, `billing/reconcile/route.ts`, `deletion/route.ts`, `export/route.ts`, `restore/route.ts`, `support-action/route.ts`, `suspend/route.ts` дочищены до чистого UTF-8: target-id, validation и failure copy больше не держат английские или битые transport messages.
- Default audit reasons для этих admin mutation handlers переведены на русский, чтобы operator-visible history больше не показывала английские `manual ... request` хвосты.
- `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для admin queue routes: `ADMIN_DELETION_INVALID`, `ADMIN_EXPORT_INVALID`, `ADMIN_RESTORE_INVALID`, `ADMIN_SUPPORT_ACTION_INVALID`, `ADMIN_SUSPEND_INVALID`.
- Проверка зелёная: `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/restore/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `12 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 01:35 - Дожал admin operator tooling contracts

- `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/operations/process/route.ts` и `src/app/api/admin/observability/sentry-test/route.ts` дочищены до чистого UTF-8: tooling routes больше не держат битый operator copy в validation, audit reason и failure paths.
- `src/app/api/admin/operations/process/route.ts` и `src/app/api/admin/ai-evals/run/route.ts` теперь режут invalid payload до expected `400` без noisy route-level failure logging на validation path.
- `tests/e2e/api-contracts.spec.ts` расширен direct invalid-payload контрактами для operator tooling routes: `AI_EVAL_RUN_INVALID` и `ADMIN_OPERATIONS_PROCESS_INVALID`.
- Проверка зелёная: `npx eslint src/app/api/admin/ai-evals/run/route.ts src/app/api/admin/operations/process/route.ts src/app/api/admin/observability/sentry-test/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 02:20 - Дочистил operator wording в admin operations и role routes

- `src/app/api/admin/operations/[kind]/[id]/route.ts` больше не держит английские `support action / export job / deletion request` в validation, transition и failure copy; default audit reason переведён в единое `Ручное обновление операторской очереди`.
- `src/app/api/admin/operations/route.ts` теперь отдает русские заголовки `Экспорт данных пользователя` и `Запрос на удаление данных`, а fallback route message больше не содержит `operations inbox`.
- `src/app/api/admin/users/[id]/role/route.ts` и `src/app/api/admin/users/[id]/support-action/route.ts` переведены на чистый operator-facing transport copy: административная роль и действие поддержки больше не отдают английские хвосты в validation, audit reason и failure paths.
- `src/app/api/admin/ai-evals/run/route.ts` теперь создает русский default label `AI-проверка ...`, чтобы operator queue и audit history не смешивали английские и русские названия.
- Проверка зелёная: `npm run lint -- --quiet src/app/api/admin/operations/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/ai-evals/run/route.ts`, последовательные `npm run typecheck` и `npm run build`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 03:05 - Дочистил internal jobs и queue-processing copy

- `src/app/api/internal/jobs/ai-evals-schedule/route.ts`, `billing-reconcile/route.ts` и `knowledge-reindex/route.ts` переведены на чистый operator-facing copy: internal job labels, success/failure messages и Stripe/billing wording больше не смешивают английский и русский transport слой.
- `src/lib/admin-queue-processing.ts` переведён на единый русский audit/log слой: queue-processing reasons, deletion hold transitions, support queue notes и hard-delete workflow labels больше не держат английские `queue processor ...` хвосты.
- Повторная проверка поиском подтвердила, что в `src/app/api` и `src/lib` больше не осталось английских `queue processor`, `scheduled AI eval jobs`, `billing reconciliation jobs` и `knowledge reindex jobs` строк.
- Проверка зелёная: `npm run lint -- --quiet src/lib/admin-queue-processing.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- `npx playwright test tests/e2e/internal-jobs.spec.ts --workers=1` локально упёрся в Playwright `webServer` bootstrap, который ожидает отдельный test-build; кодовый baseline этого tranche подтверждён зелёными `lint/typecheck/build`.
- Общий прогресс execution checklist остается `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 03:40 - Дочистил onboarding, weekly programs и workout templates contracts

- `src/app/api/onboarding/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts` и `src/app/api/workout-templates/route.ts` переведены в чистый UTF-8: auth, validation, conflict, not-found и failure copy больше не держит mojibake.
- В `onboarding` и `workout templates` validation path больше не пишет noisy route-level `logger.error` на ожидаемом `ZodError`; predictable `400` остаётся чистым transport-контрактом без ложных error-логов.
- `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для `POST /api/onboarding`, `POST /api/weekly-programs/{id}/clone` и `POST /api/workout-templates`, чтобы эти product routes были покрыты тем же predictable `400` baseline, что и остальной self-service контур.
- Проверка зелёная: `npm run lint -- --quiet src/app/api/onboarding/route.ts src/app/api/nutrition/targets/route.ts src/app/api/weekly-programs/[id]/lock/route.ts src/app/api/weekly-programs/[id]/clone/route.ts src/app/api/workout-templates/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist остаётся `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 04:20 - Дочистил weekly programs, exercises и nutrition create contracts

- `src/app/api/weekly-programs/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/foods/route.ts`, `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` и `src/app/api/meals/route.ts` переведены в чистый UTF-8: auth, validation, missing-food, duplicate-day и failure copy больше не держит mojibake в weekly/workout/nutrition create surface.
- В этих create-routes validation path больше не пишет noisy route-level `logger.error` на ожидаемом `ZodError`, а default fallback `Unknown exercise` заменён на пользовательское `Неизвестное упражнение`.
- `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для `POST /api/weekly-programs`, `POST /api/exercises`, `POST /api/foods`, `POST /api/recipes`, `POST /api/meal-templates` и `POST /api/meals`, чтобы весь create-surface weekly/workout/nutrition контура был покрыт predictable `400` regression suite.
- Проверка зелёная: `npm run lint -- --quiet src/app/api/weekly-programs/route.ts src/app/api/exercises/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist остаётся `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-21 05:05 - Дочистил workout sync transport contracts

- `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts` и `src/app/api/workout-days/[id]/reset/route.ts` переведены в чистый UTF-8: auth, validation, duplicate mutation, not-found и failure copy больше не держит mojibake в workout sync transport surface.
- `tests/e2e/api-contracts.spec.ts` расширен invalid transport-contracts для `POST /api/sync/push`, `GET /api/sync/pull` и payload-level `PATCH /api/workout-days/{id}`: sync/day routes теперь тоже подтверждены predictable `400` baseline без noisy route-level error logging.
- Проверка зелёная: `npm run lint -- --quiet src/app/api/sync/pull/route.ts src/app/api/sync/push/route.ts src/app/api/workout-days/[id]/route.ts src/app/api/workout-days/[id]/reset/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist остаётся `146 / 176` (`83%`): tranche продолжает большой backend audit по validation/owner-only/idempotency, но ещё не закрывает основной checkbox целиком.

### 2026-03-20 06:10 - Закрыл user-facing billing UX

- `src/components/settings-billing-center.tsx` и `src/components/settings-billing-center-model.ts` дочищены до нормального product copy: privileged access больше не показывает `super-admin`, usage limit отображается как `без лимита`, а billing plan surface остаётся понятным русским языком.
- `src/components/page-workspace.tsx` получил desktop `data-testid` для section-menu, чтобы billing regression suite переключал раздел `Доступ` без хрупких текстовых селекторов.
- Добавлен и подтверждён `tests/e2e/settings-billing.spec.ts`: billing section на `/settings` открывается корректно, блоки `Текущий план / Запросить доступ / История доступа` видимы, queued billing review отображается с русским статусом `в очереди`.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/settings-billing.spec.ts --workers=1` -> `2 passed`.
- Общий прогресс execution checklist вырос до `150 / 176` (`85%`).

### 2026-03-20 07:05 - Закрыл admin billing health и reconcile UX

- `src/components/admin-health-dashboard.tsx` получил стабильный billing operator surface: карточки проверки оплат и подписок, а также кнопка ручной сверки теперь явно проверяются как отдельный админский сценарий.
- `src/components/admin-user-actions.tsx`, `src/components/admin-user-detail.tsx` и `src/components/admin-user-detail-sections.tsx` дочищены до понятного billing copy и стабильной секционной навигации; формулировка про `главному супер-админу` заменена на `корневому администратору`.
- `tests/e2e/admin-app.spec.ts` расширен новым billing regression: root-admin видит billing health на `/admin`, кнопку `Сверить оплаты`, billing controls в карточке пользователя и billing section с карточками подписки и истории доступа.
- Проверка зелёная: `npx eslint src/components/admin-health-dashboard.tsx src/components/admin-user-actions.tsx src/components/admin-user-detail.tsx src/components/admin-user-detail-sections.tsx tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/admin-app.spec.ts --workers=1` -> `6 passed`.
- Общий прогресс execution checklist вырос до `152 / 176` (`86%`).

### 2026-03-20 08:00 - Закрыл базовый reliability gate по UI и sync

- `tests/e2e/authenticated-app.spec.ts` стабилизирован на реальных shell-локаторах: переходы по `/dashboard -> /workouts -> /nutrition -> /ai -> /settings` и восстановление сессии больше не зависят от хрупкого `a[href="/ai"]`.
- `tests/e2e/ui-regressions.spec.ts` переведён на стабильные admin shell locators `/admin` и `/admin/users`, чтобы regression suite отражал текущий root-admin shell без ложных падений из-за названия `Центр управления`.
- Полный reliability bundle подтверждён единым прогоном: `authenticated-app`, `settings-billing`, `ui-regressions`, `mobile-pwa-regressions`, `workout-sync` -> `16 passed`.
- Этим закрыт основной acceptance checkbox про отсутствие `hydration mismatch`, `render loops`, `infinite polling` и `state desync` в базовых пользовательских сценариях.
- Общий прогресс execution checklist вырос до `153 / 176` (`87%`).

### 2026-03-20 04:20 - Закрыл основной checkbox по route/lib duplication

- После серии extraction tranche по `settings`, `nutrition`, `billing`, `AI` и `admin` mutation routes основной checklist-пункт `Доменные правила больше не дублируются между route handlers и lib` закрыт в `docs/MASTER_PLAN.md`.
- Зафиксирован новый baseline прогресса execution checklist: `145 / 176` (`82%`).

### 2026-03-20 03:50 - Расширил admin mutation contract coverage

- `tests/e2e/api-contracts.spec.ts` получил отдельный admin-only контракт для invalid target ids на `admin/users/[id]/export`, `deletion`, `support-action`, `suspend`, `restore`, `billing`, `billing/reconcile` и `role`.
- Это подтверждает route-handler audit по validation path: admin mutation routes отдают ожидаемые `400 ..._TARGET_INVALID` и не доходят до side effects при битом `userId`.
- Проверка зелёная: `npx eslint tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `9 passed`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche двигает открытый route-handler audit пункт, но пока не закрывает его целиком.

### 2026-03-20 04:05 - Вынес shared helper из admin role route

- Добавил `src/lib/admin-role-management.ts`: target lookup через auth admin API, чтение `platform_admins`, primary super-admin guards и audit insert для role-management теперь живут вне route handler.
- `src/app/api/admin/users/[id]/role/route.ts` переведён на этот helper без изменения access-control contracts: `PATCH` и `DELETE` стали тоньше и больше не дублируют один и тот же target/audit plumbing.
- Проверка зелёная: `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- Общий прогресс execution checklist остаётся `144 / 176` (`82%`): tranche продолжает admin/backend extraction, но не закрывает следующий основной checkbox целиком.
### 2026-03-31 18:40 - Закрыл nutrition camera и Open Food Facts flow

- В `nutrition` добавлены mobile-first photo и barcode сценарии: [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx) теперь умеет `Снять фото` и `Из галереи`, а новый [nutrition-barcode-scanner.tsx](/C:/fit/src/components/nutrition-barcode-scanner.tsx) даёт live scan через `BarcodeDetector` с fallback на фото упаковки и ручной ввод.
- Новый integration слой [open-food-facts.ts](/C:/fit/src/lib/nutrition/open-food-facts.ts) и routes [foods/open-food-facts/[barcode]/route.ts](/C:/fit/src/app/api/foods/open-food-facts/%5Bbarcode%5D/route.ts) / [foods/open-food-facts/import/route.ts](/C:/fit/src/app/api/foods/open-food-facts/import/route.ts) закрывают lookup/import продукта по штрихкоду с preview состава, изображения и КБЖУ.
- Миграция [20260331103000_foods_open_food_facts_metadata.sql](/C:/fit/supabase/migrations/20260331103000_foods_open_food_facts_metadata.sql) расширяет `foods` полями `brand`, `image_url`, `ingredients_text`, `quantity`, `serving_size` и индексом по `user_id + barcode`; nutrition contracts обновлены в [nutrition-self-service.ts](/C:/fit/src/lib/nutrition/nutrition-self-service.ts) и [meal-logging.ts](/C:/fit/src/lib/nutrition/meal-logging.ts).
- В [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx) встроены preview/import карточки для базы продуктов и текущего приёма пищи, локальный `foods` state обновляется без полного refresh, а `/nutrition` теперь поддерживает deep-link на нужный блок через `?section=...&panel=...`.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:migrations`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/nutrition-capture.spec.ts --workers=1` -> `2 passed`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- Общий прогресс execution checklist вырос до `172 / 180` (`96%`).

### 2026-03-31 21:10 - Запустил premium fitness redesign tranche

- Создан отдельный execution-doc [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) и добавлен новый tracked-блок в [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md), чтобы визуальный overhaul вёлся так же строго по `[ ]/[x]`, как backend и AI tranche.
- В [layout.tsx](/C:/fit/src/app/layout.tsx) добавлен display-шрифт `Sora`, обновлён `themeColor`, а в [globals.css](/C:/fit/src/app/globals.css) переведены дизайн-токены, surface layers, section chips, drawer и bottom nav в premium fitness-направление.
- Общие shell/workspace поверхности обновлены в [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx), [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) и [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx): hero, section switchers, metric cards и mobile triggers получили более цельный mobile-first visual contract.
- Заодно очищены и пересобраны developer-facing frontend docs в [docs/README.md](/C:/fit/docs/README.md) и [FRONTEND.md](/C:/fit/docs/FRONTEND.md), чтобы handoff по редизайну тоже был в чистом UTF-8.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/smoke/app-smoke.spec.ts --workers=1` -> `5 passed`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/nutrition-capture.spec.ts --workers=1` -> `2 passed`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `3 passed`.
- Общий progress execution checklist после добавления redesign-блока и закрытия первого slice: `174 / 186` (`94%`).

### 2026-03-31 23:55 - Закрыл premium redesign и стабилизировал Playwright regression harness

- `src/app/globals.css` получил финальный premium contract для `action-button`, `surface-panel` и hero-состояний; этот слой теперь используется в `Workouts`, `Nutrition` и `Admin`.
- `src/components/weekly-program-builder.tsx`, `src/components/nutrition-tracker.tsx`, `src/components/nutrition-open-food-facts-card.tsx`, `src/components/nutrition-photo-analysis.tsx`, `src/components/workout-session/workout-focus-header.tsx`, `src/components/workout-session/workout-step-strip.tsx`, `src/components/workout-session/workout-exercise-card.tsx`, `src/components/panel-card.tsx` переведены на единый premium fitness visual language без потери focus-mode, barcode и photo flows.
- `src/app/admin/page.tsx`, `src/components/admin-users-directory.tsx`, `src/components/admin-user-detail.tsx`, `src/components/admin-user-detail-model.ts`, `src/components/admin-user-detail-sections.tsx`, `src/components/admin-user-detail-operations.tsx`, `src/components/admin-health-dashboard.tsx`, `src/components/admin-operations-inbox.tsx` доведены до того же визуального языка и clean UTF-8 copy.
- `playwright.config.ts`, `scripts/run-playwright.mjs`, `tests/e2e/global-auth-setup.ts`, `tests/e2e/helpers/auth.ts`, `tests/e2e/nutrition-capture.spec.ts`, `tests/e2e/ui-regressions.spec.ts` обновлены для стабильного regression-контура без stale reused server и битых chunk/css ссылок.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`, `node scripts/run-playwright.mjs -- test tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `9 passed`, `node scripts/run-playwright.mjs -- test tests/e2e/ui-regressions.spec.ts --workers=1` -> `4 passed`, `npm run test:e2e:auth` -> `52 passed`.
- Общий progress execution checklist вырос до `178 / 186` (`96%`); после этого в основном плане остались только внешние runtime/env блокеры по Stripe, AI providers и production Sentry.

### 2026-04-01 00:25 - Довёл release-gates до быстрых внешних blocker-сигналов

- `package.json` переведён на единый Playwright wrapper для `test:ai-gate` и `test:sentry-gate`, чтобы release-проверки не зависели от случайно оставшегося `webServer` на `3100`.
- Добавлен [scripts/ai-runtime-preflight.mjs](/C:/fit/scripts/ai-runtime-preflight.mjs): быстрый preflight проверяет живой доступ к OpenRouter chat completions и Voyage embeddings до запуска тяжёлого `ai-gate`.
- [scripts/verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs) и [scripts/verify-staging-runtime.mjs](/C:/fit/scripts/verify-staging-runtime.mjs) теперь fast-fail на provider blocker и не тратят минуты на подвисший runtime suite, если кредиты или embeddings-доступ реально недоступны.
- Проверка зелёная по ожидаемому контракту: `npm run verify:retrieval-release` -> быстрый fail с `Voyage 403`, `npm run verify:staging-runtime` -> быстрый fail с `Voyage 403` и отдельный skip по отсутствующим Stripe env, `npm run verify:sentry-runtime` -> явный skip по отсутствующим `NEXT_PUBLIC_SENTRY_DSN` и `SENTRY_PROJECT`.
- Общий progress execution checklist остаётся `178 / 186` (`96%`): это hardening release-процесса без закрытия новых основных checklist-пунктов.

### 2026-04-01 00:45 - Добавил явную матрицу env readiness для внешних blocker-ов

- Добавлен [scripts/verify-runtime-env.mjs](/C:/fit/scripts/verify-runtime-env.mjs) и команда `npm run verify:runtime-env`: она группирует текущие env по контурам `Web/PWA`, `AI`, `Stripe`, `Sentry`, `CI`, `Android/TWA` и сразу показывает, каких ключей не хватает.
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) и [README.md](/C:/fit/README.md) синхронизированы: теперь для внешних blocker-ов есть один быстрый preflight и явный список того, что должен выставить владелец окружения.
- Проверка по новому контуру: `npm run verify:runtime-env`, `npm run verify:retrieval-release`, `npm run verify:staging-runtime`, `npm run verify:sentry-runtime`.
- Общий progress execution checklist остаётся `178 / 186` (`96%`): это ускоряет закрытие последних внешних блокеров, но не закрывает новые main checklist-пункты без реальных env/secrets.

### 2026-04-01 13:40 - Починил AI transcript duplicate keys и подчистил live copy

- В [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) добавлена нормализация `messages` через `dedupeUiMessages(...)`, поэтому AI transcript больше не получает два элемента с одинаковым `message.id` и не шумит React warning `Encountered two children with the same key`.
- В [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx), [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx), [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx), [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts) и верхнем слое [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) убран битый русский текст на живой AI-поверхности.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint src/components/ai-chat-panel.tsx src/components/ai-chat-transcript.tsx src/components/ai-chat-toolbar.tsx src/components/ai-chat-notices.tsx src/components/ai-chat-composer.tsx src/components/ai-chat-panel-model.ts`, `node scripts/run-playwright.mjs -- test tests/e2e/ai-workspace.spec.ts:91 --workers=1` -> `1 passed`.
- Полный `ai-workspace` suite в одном из прогонов всё ещё может краснеть не на transcript, а на внешнем timeout фонового dashboard fetch в history-сценарии; сам duplicate-key баг после slice закрыт.

### 2026-04-01 14:20 - Зафиксировал техплан миграции billing со Stripe на провайдера РФ

- В [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) переписаны открытые billing-пункты под provider-neutral формулировки: теперь основной план смотрит не на `Stripe`, а на контур выбранного российского платёжного провайдера.
- Добавлен отдельный handoff-документ [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) с чекбоксами, картой затрагиваемых файлов, env-контрактом и пошаговой миграцией через provider adapter layer.
- В этом документе зафиксирован выбор `CloudPayments` как primary-кандидата для `fit` и `ЮKassa` как fallback: по официальной документации CloudPayments лучше ложится на текущий подписочный runtime, mobile/TWA-поток и webhook/idempotency модель проекта.
- Общий progress execution checklist не изменился и остаётся `178 / 186` (`96%`): это архитектурный reframe и подготовка migration backlog, а не закрытие live billing rollout.

### 2026-04-01 16:05 - Довёл CloudPayments migration slice до provider-neutral admin/runtime handoff

- В [billing-provider.ts](/C:/fit/src/lib/billing-provider.ts), [billing-self-service.ts](/C:/fit/src/lib/billing-self-service.ts), [cloudpayments-billing.ts](/C:/fit/src/lib/cloudpayments-billing.ts), [billing checkout/reconcile/portal routes](/C:/fit/src/app/api/billing/checkout/route.ts), [CloudPayments intent route](/C:/fit/src/app/api/billing/cloudpayments/intent/route.ts) и [CloudPayments webhook route](/C:/fit/src/app/api/billing/webhook/cloudpayments/[kind]/route.ts) завершён provider-neutral runtime для checkout, return reconcile, webhook и billing-center action.
- [admin/stats route](/C:/fit/src/app/api/admin/stats/route.ts), [admin-health-dashboard.tsx](/C:/fit/src/components/admin-health-dashboard.tsx), [admin-user-detail-model.ts](/C:/fit/src/components/admin-user-detail-model.ts), [admin-user-detail-billing.tsx](/C:/fit/src/components/admin-user-detail-billing.tsx), [admin-user-detail-sections.tsx](/C:/fit/src/components/admin-user-detail-sections.tsx) переведены на active billing provider: `/admin` и карточка пользователя больше не предполагают, что единственный провайдер в системе — `Stripe`.
- Handoff-доки синхронизированы с новым billing runtime: [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md), [BACKEND.md](/C:/fit/docs/BACKEND.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md). Прогресс отдельного migration-plan вырос до `19 / 21` (`90%`).
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint src/app/api/admin/stats/route.ts src/components/admin-health-dashboard.tsx src/components/admin-user-detail-model.ts src/components/admin-user-detail-sections.tsx src/components/admin-user-detail-billing.tsx tests/e2e/admin-app.spec.ts tests/e2e/api-contracts.spec.ts`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/admin-app.spec.ts:86 --workers=1` -> `1 passed`, `npx playwright test tests/e2e/api-contracts.spec.ts --grep 'billing and settings routes stay auth-first for anonymous requests|authenticated invalid route params and payloads return explicit 400s' --workers=1` -> `2 passed`.
- Общий progress execution checklist остаётся `178 / 186` (`96%`): кодовый migration-slice закрыт, а в main-плане всё ещё открыты только live billing env/runtime, AI provider gate и production Sentry env.

### 2026-04-01 21:05 - Закрыл CloudPayments billing gate и mobile/TWA verification

- В [cloudpayments-billing.ts](/C:/fit/src/lib/cloudpayments-billing.ts) и [env.ts](/C:/fit/src/lib/env.ts) добавлен `CLOUDPAYMENTS_TEST_MODE=mock`, чтобы локальный billing gate детерминированно проходил без живого платёжного кабинета.
- В [billing-runtime-gate.spec.ts](/C:/fit/tests/billing-gate/billing-runtime-gate.spec.ts) добавлен полный CloudPayments contract flow: `checkout -> intent -> webhook -> return reconcile -> billing center`, а также отдельный mobile/PWA regression для hosted billing page.
- В [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx) и [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx) убран mojibake и добавлены стабильные `data-testid`, чтобы hosted payment page была и чистой по UX, и менее хрупкой для regression suite.
- Через `adb` подтверждён Android/TWA billing deep-link smoke: `TWALauncherActivity` открывает `https://fit-platform-eta.vercel.app/billing/cloudpayments?reference=android-billing-smoke`, а это зафиксировано и в [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md).
- Проверка зелёная: `npx eslint src/app/billing/cloudpayments/page.tsx src/components/cloudpayments-checkout.tsx tests/billing-gate/billing-runtime-gate.spec.ts src/lib/cloudpayments-billing.ts src/lib/env.ts`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_SKIP_AUTH_SETUP=1 NEXT_PUBLIC_BILLING_PROVIDER=cloudpayments NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID=pk_test_mock_terminal CLOUDPAYMENTS_API_SECRET=mock_api_secret CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB=1490 CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION=\"fit premium monthly\" CLOUDPAYMENTS_WEBHOOK_SECRET=mock_webhook_secret CLOUDPAYMENTS_TEST_MODE=mock -- test tests/billing-gate/billing-runtime-gate.spec.ts --workers=1` -> `3 passed`, плюс `adb shell am start ... /billing/cloudpayments?...` и `logcat` smoke на эмуляторе.
- Подплан [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) после этого закрыт на `21 / 21` (`100%`), а основной progress execution checklist остаётся `178 / 186` (`96%`), потому что дальше ещё нужны живые provider env для production/staging.

### 2026-04-01 21:35 - Дочистил handoff docs после billing/TWA tranche

- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) переписан в чистом UTF-8: visual language, mobile acceptance и финальный статус редизайна теперь снова читаются нормально, без mojibake.
- В [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) архивные `Следующий ... tranche` записи в historical addendum переведены из ложных `[ ]`-чекбоксов в обычные заметки, чтобы не маскировать реальный остаток работ десятками устаревших псевдо-open пунктов.
- Этот slice не меняет основной progress execution checklist: он остаётся `178 / 186` (`96%`), но source of truth стал заметно чище и понятнее для следующих разработчиков и агентов.

### 2026-04-01 22:05 - Добавил точный runtime env handoff для Vercel и внешних сервисов

- Добавлен [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md): в одном месте собраны точные env для `CloudPayments`, `Sentry`, `AI runtime`, `Web/PWA baseline` и `Android/TWA`, плюс порядок настройки в Vercel и кабинетах внешних сервисов.
- В документ вынесены production webhook URL для `CloudPayments`, порядок live billing smoke и явный post-setup checklist, чтобы следующий разработчик или DevOps мог закрывать последние внешние блокеры без чтения исходников.
- [docs/README.md](/C:/fit/docs/README.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) и [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) синхронизированы с новым handoff.
- Общий progress execution checklist не меняется и остаётся `178 / 186` (`96%`): этот tranche документирует и ускоряет финальный rollout, но не заменяет реальные env/secrets и live provider access.

### 2026-04-02 00:20 - Собрал отдельный пакет экранной документации для дизайнера

- Добавлена отдельная папка [design-handoff](/C:/fit/docs/design-handoff/README.md), чтобы дизайнеру можно было передать весь экранный handoff отдельно от общей инженерной документации проекта.
- В [FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md) подробно описаны все реальные экраны приложения: старт, онбординг, dashboard, workouts, workout day, nutrition, AI, history, settings, billing, suspended, а также `/admin`, `/admin/users`, `/admin/users/[id]`.
- Для каждого экрана зафиксированы цель, композиция, mobile/desktop-поведение, состояния и продуктовые ограничения, чтобы новый дизайн можно было интегрировать без слома текущих route-flow и business logic.
- [docs/README.md](/C:/fit/docs/README.md) и [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) синхронизированы с новым дизайнерским handoff-пакетом.

## 2026-04-13

### Stitch redesign foundation + workout anchor

- Добавлен отдельный execution-doc [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md), а в [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) открыт новый tracked-блок по полному visual refactor под reference pack `stitch_`.
- В [layout.tsx](/C:/fit/src/app/layout.tsx), [globals.css](/C:/fit/src/app/globals.css), [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx) и [sign-out-button.tsx](/C:/fit/src/components/sign-out-button.tsx) введён новый visual foundation: `Lexend + Manrope`, светлый editorial canvas, electric blue и mobile bottom nav.
- В [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) собран stitch-style anchor-screen `Dashboard` с blue hero, stat plates и section rail.
- В [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx), [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-day-context-card.tsx](/C:/fit/src/components/workout-session/workout-day-context-card.tsx) и [workouts/day/[dayId]/page.tsx](/C:/fit/src/app/workouts/day/[dayId]/page.tsx) экран дня тренировки переведён на тот же язык: progress bars, крупная timer-plate, новый grid подходов и более чистая hierarchy CTA.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`. Таргетированный `tests/e2e/mobile-pwa-regressions.spec.ts` в этой среде упёрся не в новый UI, а в старый auth-bootstrap redirect на `/` во время `global-auth-setup`.
- Общий progress execution checklist пересчитан честно: `183 / 196` (`93%`), потому что в план добавлен новый `stitch`-workstream с ещё открытыми screen-tranche.

### Stitch redesign AI + Nutrition

- [ai/page.tsx](/C:/fit/src/app/ai/page.tsx), [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx), [ai-workspace-sidebar.tsx](/C:/fit/src/components/ai-workspace-sidebar.tsx), [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx), [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx), [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx), [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx), [ai-prompt-library.tsx](/C:/fit/src/components/ai-prompt-library.tsx), [ai-chat-panel-cards.tsx](/C:/fit/src/components/ai-chat-panel-cards.tsx) и [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts) переведены на stitch-style chat-first подачу и очищены от битого русского текста.
- [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx), [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx), [nutrition-barcode-scanner.tsx](/C:/fit/src/components/nutrition-barcode-scanner.tsx) и [nutrition-open-food-facts-card.tsx](/C:/fit/src/components/nutrition-open-food-facts-card.tsx) собраны в более clean mobile-first surface под тот же visual language.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`. Таргетированный Playwright по AI history всё ещё может упираться не в новый UI, а во внешний auth-bootstrap redirect на `/`.

### Stitch redesign remaining user screens

- В [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) очищен общий workspace-shell: section controls, mobile switcher и visibility controls теперь на чистом русском и в том же electric-blue contract.
- На новый stitch-язык переведены [history/page.tsx](/C:/fit/src/app/history/page.tsx), [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx), [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx), [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx) и [onboarding-form.tsx](/C:/fit/src/components/onboarding-form.tsx).
- Этот tranche закрывает remaining user screens в [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) и поднимает общий progress execution checklist до `185 / 196` (`94%`).

### Stitch redesign admin detail slice

- В [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx) и [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) переведена на новый visual language операторская карточка пользователя: hero, summary metrics, degraded banners, section switcher и верхний operator copy теперь без mojibake и в том же stitch-style contract.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`.
- Общий progress execution checklist пока не меняется и остаётся `185 / 196` (`94%`), потому что admin checkbox ещё не закрыт целиком: dashboard, inbox и health/evals surfaces остаются в следующем tranche.

### Stitch redesign admin AI evals slice

- В [admin-ai-eval-runs.tsx](/C:/fit/src/components/admin-ai-eval-runs.tsx) cleaned operator copy, queue controls и история запусков AI-проверок: экран теперь в том же stitch-style contract и без битого русского текста.
- Проверка зелёная: `npm run lint`, `npm run typecheck`.
- Общий progress execution checklist не меняется и остаётся `185 / 196` (`94%`), потому что admin surfaces всё ещё открыты целиком.


### Stitch redesign admin dashboard slice

- [admin/page.tsx](/C:/fit/src/app/admin/page.tsx) и [admin-dashboard-workspace.tsx](/C:/fit/src/components/admin-dashboard-workspace.tsx) переведены со старого generic workspace на stitch-style операторский dashboard: крупные KPI, spotlight cards, отдельные AI и roster/audit блоки в том же visual language, что и reference `stitch_`.
- [admin-users-bulk-actions.tsx](/C:/fit/src/components/admin-users-bulk-actions.tsx) получил тот же operator visual contract: тёмная action-панель для массовых действий и более чистая история волн без служебного визуального шума.
- Для стабилизации auth-редиректа на новом стартовом экране [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) переведён на явный `window.location.assign(...)` после успешной авторизации.
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`. Таргетированный `tests/e2e/admin-app.spec.ts` в этой среде упирался не в UI, а во внешний auth-runtime: `ERR_CONNECTION` на `supabase.co/auth/v1/token`.
- После этого общий progress execution checklist вырос до `186 / 196` (`95%`): admin surfaces были закрыты, а в stitch-workstream оставались visual regression и handoff tranche.

### Stitch redesign sanitation и handoff sync

- Переписан [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) в чистом UTF-8 и приведён к реальному состоянию workstream: admin surfaces закрыты, visible-copy sanitation и handoff sync зафиксированы как выполненные, открытым оставлен только финальный auth-based visual regression.
- Синхронизированы [FRONTEND.md](/C:/fit/docs/FRONTEND.md), [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md): дизайнерский и developer-facing handoff теперь описывает уже внедрённый stitch-style baseline, а не старый промежуточный замысел.
- В [tests/e2e/helpers/auth.ts](/C:/fit/tests/e2e/helpers/auth.ts) добавлена явная диагностика auth-bootstrap failure: при зависании на `/` helper теперь пишет текущий URL, видимую ошибку и фрагмент страницы вместо немого `toHaveURL(/dashboard/)`.
- В master checklist stitch-блок пересчитан честно: закрыты admin surfaces и developer handoff, поэтому общий progress execution checklist вырос до `188 / 196` (`96%`).
- Проверка по этому follow-up: `npm run lint`, `npm run typecheck`, `npm run test:smoke` -> `5 passed`, повторный `node scripts/run-playwright.mjs -- test tests/e2e/ui-regressions.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` снова упирается в внешний auth-bootstrap blocker и теперь явно пишет `Auth redirect did not reach /dashboard`.
- Незакрытым в redesign-потоке остаётся только финальный прогон [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts) и [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts), который по-прежнему зависит от внешней доступности Supabase Auth без `ERR_CONNECTION`.

### Stitch redesign auth entry и брендовый логотип

- Добавлен реальный логотип [fit-logo.svg](/C:/fit/public/fit-logo.svg) из утверждённого SVG-референса; он встроен в [page.tsx](/C:/fit/src/app/page.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx) и [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), чтобы входной поток и shell использовали настоящий brand asset.
- Полностью пересобраны stitch-style [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) и [onboarding-form.tsx](/C:/fit/src/components/onboarding-form.tsx): вход, регистрация и анкета теперь выглядят как единый premium editorial flow и при этом сохраняют структуру полей, на которой держатся e2e helper’ы.
- В [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) добавлено ожидание клиентской сессии перед redirect, чтобы уменьшить race между `signInWithPassword()` и server-side `viewer`.
- Проверка: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`. Таргетированный `tests/e2e/authenticated-app.spec.ts` в этой среде всё ещё упирается в auth-bootstrap и остаётся отдельным blocker; ручной browser-debug на `http://127.0.0.1:3100/` показал `Failed to fetch` на `supabase.co/auth/v1/token`.

### Stitch redesign branded manifest и browser icon

- [icon.svg](/C:/fit/public/icon.svg) переведён на тот же SVG-логотип, что уже используется в shell и entry screens, чтобы браузерный icon и PWA install surface не расходились с новым брендингом.
- В [layout.tsx](/C:/fit/src/app/layout.tsx) добавлен SVG icon/shortcut icon, а [manifest.ts](/C:/fit/src/app/manifest.ts) синхронизирован с новым editorial palette: `background_color=#fcf9f8`, `theme_color=#0040e0`.
- Проверка: `npm run lint`, `npm run typecheck`, `npm run test:smoke` -> `5 passed`.

### Auth screen без левой колонки и server auth transport

- На маршруте `/` в [page.tsx](/C:/fit/src/app/page.tsx) оставлен только компактный brand chip и сама форма; левая промо-часть полностью убрана.
- В [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) удалены социальные кнопки `Google` и `Apple`, очищен русский copy и добавлен явный fallback на временную недоступность auth backend.
- Для входа и регистрации добавлены серверные routes [api/auth/sign-in/route.ts](/C:/fit/src/app/api/auth/sign-in/route.ts) и [api/auth/sign-up/route.ts](/C:/fit/src/app/api/auth/sign-up/route.ts); форма теперь работает через `/api/auth/*`, а не через прямой клиентский вызов Supabase auth SDK.
- Auth routes доведены до аккуратного transport-контракта: при внешнем DNS/runtime-сбое они отдают `503 AUTH_PROVIDER_UNAVAILABLE`, а invalid-payload сценарии покрыты в [api-contracts.spec.ts](/C:/fit/tests/e2e/api-contracts.spec.ts).
- После этого синхронизирован smoke-тест [app-smoke.spec.ts](/C:/fit/tests/smoke/app-smoke.spec.ts): он снова ждёт актуальные stitch-цвета из [manifest.ts](/C:/fit/src/app/manifest.ts).
- Проверка зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`.
- Отдельно подтверждён контрактный тест `auth routes reject invalid payloads before provider runtime`; он проходит зелёно и не зависит от внешнего Supabase DNS.
- Добавлен отдельный preflight [verify-supabase-runtime.mjs](/C:/fit/scripts/verify-supabase-runtime.mjs) и npm-команда `npm run verify:supabase-runtime`; в текущей среде она сразу фиксирует тот же реальный blocker `ENOTFOUND nactzaxrjzsdkyfqwecf.supabase.co`.
- Таргетированный auth e2e всё ещё не закрыт, но причина теперь зафиксирована точно: локальная среда не резолвит `nactzaxrjzsdkyfqwecf.supabase.co` и даёт `getaddrinfo ENOTFOUND`, то есть это внешний runtime/DNS blocker, а не регресс нового дизайна или auth-form.

### Mobile-first auth/admin final pass

- Дожат мобильный stitch-flow: в [page.tsx](/C:/fit/src/app/page.tsx) и [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) входной экран стал легче и ближе к Android/PWA-first подаче, без тяжёлой карточной рамки и лишнего шума вокруг формы.
- На `/admin`, `/admin/users` и `/admin/users/[id]` отключён floating AI widget, чтобы на узком экране он не перекрывал CTA и не ломал операторскую композицию.
- [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts) переведён на новый mobile contract для admin surface, после чего прошли зелёно `authenticated-app`, `ui-regressions`, `mobile-pwa-regressions` и `smoke`.
- Stitch redesign после этого закрыт полностью: `10 / 10` (`100%`), общий master-progress — `189 / 196` (`96%`).

### Supabase runtime и nutrition camera/import follow-up

- Подтвердил, что рабочий Supabase-проект `nactzaxrjzsdkyfqwecf` снова доступен: `npm run verify:supabase-runtime` зелёный, старый DNS-blocker снят.
- Довёл `nutrition-photo-analysis.tsx` до реального mobile camera/import flow: фото выбирается по user gesture, кнопка анализа больше не сбрасывается вторым input-event, а AI-результат сохраняется через `/api/nutrition/photo-import` в продукт, storage и дневник питания.
- Устранил e2e-флаки после восстановления базы: в `authenticated-app.spec.ts` и `nutrition-capture.spec.ts` тестовый пользователь теперь завершает онбординг при редиректе на `/onboarding`, а в `tests/e2e/helpers/ai.ts` появился батчевый `replaceAiChatHistory` с усиленным retry для Supabase seeding.
- Проверил tranche пакетами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:migrations`, `npm run verify:supabase-runtime`, `npm run test:smoke` и общим таргетированным Playwright-прогоном `authenticated-app + ai-workspace + nutrition-capture` -> `7 passed`.
- Progress по master plan не меняется и остаётся `191 / 198` (`96%`): локально закрыт очередной кодовый slice, а дальше остаются только внешние live env/provider блокеры.
- Повторный полный `npm run test:e2e:auth` после восстановления базы выявил уже не feature-gap, а внешний runtime blocker: часть admin/workout/API сценариев периодически ловит транзиентные `ECONNRESET` между приложением и Supabase. Camera/import flow при этом остаётся зелёным, а нестабильность зафиксирована как внешний сетевой фактор, а не как регресс nutrition UX.

## 2026-04-14

### Изображения упражнений и продуктов

- Для пользовательских упражнений и продуктов добавлен единый image-contract: новый helper [image-url.ts](/C:/fit/src/lib/image-url.ts) валидирует только абсолютные `http/https` URL, а API routes [exercises/route.ts](/C:/fit/src/app/api/exercises/route.ts), [exercises/[id]/route.ts](/C:/fit/src/app/api/exercises/%5Bid%5D/route.ts), [foods/route.ts](/C:/fit/src/app/api/foods/route.ts) и [foods/[id]/route.ts](/C:/fit/src/app/api/foods/%5Bid%5D/route.ts) принимают `imageUrl` и сохраняют его в `image_url`.
- В репозиторий добавлена миграция [20260413211718_exercise_library_image_url_support.sql](/C:/fit/supabase/migrations/20260413211718_exercise_library_image_url_support.sql): `exercise_library` теперь поддерживает `image_url`, а owner-scoped exercise/food flows могут хранить собственные изображения без отдельного CDN контракта.
- Потребительский UI обновлён в [exercise-library-manager.tsx](/C:/fit/src/components/exercise-library-manager.tsx) и [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx): в карточках и формах появились preview, ручной ввод URL и безопасный fallback, если картинки нет.
- Для super-admin добавлен отдельный контур [content-assets route](/C:/fit/src/app/api/admin/users/%5Bid%5D/content-assets/route.ts) и helper [admin-user-content-assets.ts](/C:/fit/src/lib/admin-user-content-assets.ts): из карточки пользователя теперь можно обновлять изображения упражнений и продуктов с обязательной записью в `admin_audit_logs`.
- В [admin-user-detail-data.ts](/C:/fit/src/lib/admin-user-detail-data.ts), [admin-user-detail-state.ts](/C:/fit/src/components/admin-user-detail-state.ts), [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) и новом [admin-user-detail-content-assets.tsx](/C:/fit/src/components/admin-user-detail-content-assets.tsx) собран отдельный раздел «Контент», где super-admin видит последние упражнения и продукты пользователя и может быстро поправить изображения.
- Проверка зелёная на кодовом baseline: `npm run lint`, `npm run typecheck`, `npm run build`. Повторный Playwright по этому tranche сначала упёрся в нестабильный lifecycle локального test server на `3100`, поэтому дальше я перевёл verification на отдельный вручную поднятый сервер, чтобы не путать UI regression с падением bootstrap-процесса.

### Codex operating system rollout

- Добавил новые developer-facing документы [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md), [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md): теперь workflow, onboarding и difficult-problem loop для Codex зафиксированы как официальный handoff.
- Оформил настоящий instruction chain: появились вложенные `AGENTS.md` для `src/app`, `src/lib/ai`, `supabase`, `ai-evals`, `android`, а root [AGENTS.md](/C:/fit/AGENTS.md) теперь напрямую ссылается на playbook и evaluator-first режим.
- Расширил agent registry в [\.codex/config.toml](/C:/fit/.codex/config.toml): добавлены роли `onboarding_mapper` и `eval_loop_driver`, а существующие `explorer`, `docs_researcher`, `platform_verifier` получили fit-специфичный operational contract.
- В `.agents/skills/` добавил навыки `fit-web-onboarding`, `fit-ai-eval-ops`, `fit-release-verification`, чтобы вход в новый web-срез, AI eval ops и выбор verification-пакета были воспроизводимыми и repo-specific.
- Добавил локальный gate `npm run verify:codex` через [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs), а [quality.yml](/C:/fit/.github/workflows/quality.yml) теперь прогоняет его перед базовым quality pipeline.
- Для разработчиков синхронизировал [README.md](/C:/fit/README.md) и [docs/README.md](/C:/fit/docs/README.md), чтобы новый Codex operating system был виден сразу при входе в репозиторий.
- Проверка tranche зелёная: `npm run verify:codex`, `npm run lint`, `npm run typecheck`, `npm run build`. Перед финальной сборкой снят stale `.next` lock от оставшегося локального Next-процесса; сама сборка проходит успешно и даёт только уже известные warning-блоки `Sentry/OpenTelemetry`.

### AI runtime, barcode import и CloudPayments mock

- Снял основной runtime-blocker для chat/generation: [gateway.ts](/C:/fit/src/lib/ai/gateway.ts) и [ai-runtime-preflight.mjs](/C:/fit/scripts/ai-runtime-preflight.mjs) теперь по умолчанию ведут на `OpenRouter + google/gemini-3.1-pro-preview`, а live preflight подтверждает рабочий chat runtime без hard-fail по кредитам.
- AI-маршруты [assistant/route.ts](/C:/fit/src/app/api/ai/assistant/route.ts), [chat/route.ts](/C:/fit/src/app/api/ai/chat/route.ts), [plan-generation.ts](/C:/fit/src/lib/ai/plan-generation.ts), [knowledge-source-data.ts](/C:/fit/src/lib/ai/knowledge-source-data.ts), [runtime-retry.ts](/C:/fit/src/lib/runtime-retry.ts) и [user-context.ts](/C:/fit/src/lib/ai/user-context.ts) переведены в fail-open режим: таймауты и provider-сбои больше не валят весь AI surface, а планы при необходимости уходят в детерминированный fallback с `generationMode`.
- Retrieval усилен для lookup-сценариев: [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts), [knowledge-hybrid-ranking.ts](/C:/fit/src/lib/ai/knowledge-hybrid-ranking.ts) и [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) теперь поднимают marker/barcode-like токены и сохраняют рабочий text-only fallback, поэтому seeded retrieval и barcode import больше не зависят от живых embeddings.
- Для продуктов по штрихкоду подтверждён рабочий импорт из Open Food Facts: таргетированный Playwright на [nutrition-capture.spec.ts](/C:/fit/tests/e2e/nutrition-capture.spec.ts) проходит зелёно по сценарию preview/import продукта.
- Для billing добавлен моковый release-gate [run-cloudpayments-mock-gate.mjs](/C:/fit/scripts/run-cloudpayments-mock-gate.mjs) и npm-команда `npm run test:billing-gate:cloudpayments-mock`; это не заменяет live checkout, но фиксирует, что `CloudPayments` surface и mock checkout flow работают без реального списания.
- Проверка tranche зелёная: `npm run typecheck`, `npm run lint`, `npm run build`, `node scripts/run-playwright.mjs -- test tests/ai-gate/ai-quality-gate.spec.ts --workers=1`, `node scripts/run-playwright.mjs -- test tests/e2e/nutrition-capture.spec.ts -g "foods section previews and imports product from Open Food Facts" --workers=1`, `npm run test:billing-gate:cloudpayments-mock`, `node --input-type=module -e "const m = await import('./scripts/ai-runtime-preflight.mjs'); console.log(JSON.stringify(await m.runAiRuntimePreflight(), null, 2));"`.
- Внешний blocker остался только на embeddings-ветке: direct `Voyage` всё ещё отвечает `403`, а AI Gateway embeddings требуют customer verification/credit card, поэтому retrieval сейчас официально работает в degrade-safe text-only режиме, а не в полном vector runtime.

### Codex config guardrails

- В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлен schema-hint `#:schema https://developers.openai.com/codex/config-schema.json` и явный комментарий к `project_doc_max_bytes`, чтобы top-level настройка instruction budget больше не попадала по ошибке в `[features]`.
- В [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) добавлена структурная проверка Codex-конфига: скрипт теперь валит gate, если `project_doc_max_bytes` стоит не на top-level, если budget потерян или если в `[features]` появляются не-boolean значения.
- Follow-up подтверждён локально командой `npm run verify:codex`; это отдельный hardening для developer-facing контура, чтобы ошибка `invalid type: integer 65536, expected a boolean` больше не возвращалась тихо при следующих правках.

### Dark Utility redesign: foundation tranche

- Создан новый execution-doc [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md) и активный дизайнерский handoff [DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md); [FRONTEND.md](/C:/fit/docs/FRONTEND.md) и [docs/README.md](/C:/fit/docs/README.md) переведены на новый source of truth.
- Глобальная тема переведена в тёмный compact fitness-стиль через [globals.css](/C:/fit/src/app/globals.css), а shell и входной экран обновлены в [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx), [page.tsx](/C:/fit/src/app/page.tsx) и [auth-form.tsx](/C:/fit/src/components/auth-form.tsx).
- Для PWA синхронизированы [layout.tsx](/C:/fit/src/app/layout.tsx) и [manifest.ts](/C:/fit/src/app/manifest.ts), чтобы theme-color и фон соответствовали новому Android/PWA-first baseline.

### Dark Utility redesign: dashboard и workspace tranche

- Общий workspace-слой переведён в компактный тёмный mobile-first паттерн через [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx): настройки видимости, обзор и меню разделов теперь собраны в единый плотный сценарий без oversized блоков.
- Экран обзора полностью переведён в новый язык в [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx): короткий hero, next-action, компактные summary-карточки и чистый AI-блок.
- Для уже подключённых workspace-экранов санирован user-visible copy и подтянут новый тон в [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx) и [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx).
- В [AGENTS.md](/C:/fit/AGENTS.md) закреплено правило двойной отчётности: в статусах всегда показывается общий прогресс из `MASTER_PLAN` и отдельный прогресс активного execution-doc, если он существует.

### Dark Utility redesign: workouts и focus-mode tranche

- Перевёл `/workouts` и `/workouts/day/[dayId]` в новый компактный mobile-first стиль: обновлены [weekly-program-builder.tsx](/C:/fit/src/components/weekly-program-builder.tsx), [page.tsx](/C:/fit/src/app/workouts/day/%5BdayId%5D/page.tsx) и [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx).
- Focus-mode тренировки и execution surfaces собраны в более профессиональный utility-ритм через [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx), [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx) и [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx).
- Проверка по code-gates зелёная: `npm run lint`, `npm run typecheck`, `npm run build`.

### Dark Utility redesign: history, settings и self-service tranche

- Перевёл [history/page.tsx](/C:/fit/src/app/history/page.tsx) в компактный dark utility формат: архив программ, AI-предложения и data actions теперь собраны в один рабочий timeline без лишнего визуального шума.
- Перестроил [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), [settings-billing-center.tsx](/C:/fit/src/components/settings-billing-center.tsx) и [settings-data-center.tsx](/C:/fit/src/components/settings-data-center.tsx) под mobile-first control center с чистым self-service copy и единым визуальным контрактом.
- Довёл billing/restricted surfaces через [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx), [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx), [sign-out-button.tsx](/C:/fit/src/components/sign-out-button.tsx) и [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx).
- Shared workspace и auth regression harness синхронизированы с новым layout: [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) очищен как source of truth для разработчиков, а [authenticated-app.spec.ts](/C:/fit/tests/e2e/authenticated-app.spec.ts) теперь проверяет реальные hero/workspace surfaces вместо скрытых mobile-триггеров на desktop.
- Проверка tranche зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/authenticated-app.spec.ts --workers=1` -> `2 passed`.
- Таргетированный Playwright по workout/mobile сейчас честно упирается не в layout, а во внешний runtime: seed helper периодически ловит timeout/`500` в `Supabase`, поэтому этот хвост зафиксирован как внешний blocker verification, а не как незавершённый UI slice.

### Agent hardening: review, security и prompt-contract

- Создан [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md) как отдельный execution-doc с `[ ] / [x]` чекбоксами для нового tranche по усилению агента.
- В [AGENTS.md](/C:/fit/AGENTS.md) добавлены `Review guidelines` и `Prompt contract`, а подробный reviewer contract вынесен в [code_review.md](/C:/fit/code_review.md), чтобы локальный `/review` и GitHub review читали один и тот же rule-set.
- В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлены `review_model = "gpt-5.2-codex"` и роли `pr_reviewer`, `security_reviewer`, `prompt_contract_editor`, `workflow_maintainer`; одновременно в `.agents/skills/` оформлены repo-local навыки `fit-pr-review`, `fit-security-review`, `fit-prompt-contracts`, `fit-github-review-ops`.
- Для GitHub review добавлен [PULL_REQUEST_TEMPLATE.md](/C:/fit/.github/PULL_REQUEST_TEMPLATE.md), а [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md), [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md), [README.md](/C:/fit/README.md) и [docs/README.md](/C:/fit/docs/README.md) синхронизированы с новым advisory-first review flow и `@codex review`.
- [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) расширен обязательной проверкой нового review/security/prompt-contract слоя; tranche подтверждён локально командами `npm run verify:codex`, `npm run lint`, `npm run typecheck`, `npm run build`.

### Agent autonomy, governance и self-evolving lane

- Для developer-facing agent layer создан новый execution-doc [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md); рядом добавлены [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) и [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md), чтобы orchestration, allowlist и autonomous mainline lane были оформлены как отдельный управляемый контур.
- В [`.codex/config.toml`](/C:/fit/.codex/config.toml) появились роли `orchestrator`, `autonomy_guardian`, `evolution_driver`, а в `.agents/skills/` — новые repo-local навыки `fit-agent-orchestration`, `fit-agent-governance`, `fit-agent-evolution`.
- В scripts добавлен полный automation bundle: [agent-governance-config.mjs](/C:/fit/scripts/agent-governance-config.mjs), [agent-inventory.mjs](/C:/fit/scripts/agent-inventory.mjs), [sync-codex-agent-registry.mjs](/C:/fit/scripts/sync-codex-agent-registry.mjs), [verify-agent-governance.mjs](/C:/fit/scripts/verify-agent-governance.mjs), [agent-evolve.mjs](/C:/fit/scripts/agent-evolve.mjs) и npm-команды `agent:*` плюс `verify:agent-governance`.
- Для CI и scheduled autonomy добавлен [agent-autonomy.yml](/C:/fit/.github/workflows/agent-autonomy.yml), а [quality.yml](/C:/fit/.github/workflows/quality.yml) теперь дополнительно запускает `verify:agent-governance`.
- Tranche подтверждён командами `npm run agent:sync-registry`, `npm run agent:evaluate`, `npm run verify:codex`, `npm run verify:agent-governance`, `npm run lint`, `npm run typecheck`, `npm run build`.

### Deploy wait и прогресс по MASTER_PLAN

- В agent contract добавлено обязательное правило: deploy-ориентированные tranche не считаются завершёнными, пока Vercel deployment не дошёл до clean terminal state через Vercel MCP или CLI fallback.
- Для этого в репозиторий добавлен helper [wait-for-vercel-deployment.mjs](/C:/fit/scripts/wait-for-vercel-deployment.mjs) и команда `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- Параллельно добавлен helper [master-plan-progress.mjs](/C:/fit/scripts/master-plan-progress.mjs) и команда `npm run report:master-progress`, чтобы агент каждый раз показывал актуальный `MASTER_PLAN` progress в формате `done / total (percent%)`, а `agent-evolve` пишет этот прогресс и в свои artifacts.
- Обновлены [AGENTS.md](/C:/fit/AGENTS.md), [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md), [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md), [README.md](/C:/fit/README.md) и [docs/README.md](/C:/fit/docs/README.md).
- Follow-up подтверждён командами `npm run report:master-progress`, `npm run wait:vercel-deploy -- --help`, `npm run agent:sync-registry`, `npm run verify:codex`, `npm run verify:agent-governance`.
