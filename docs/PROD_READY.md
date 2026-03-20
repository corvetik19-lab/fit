# Критерий `prod-ready` для `fit`

Этот документ фиксирует, что именно считается production-ready состоянием для `fit`.

`Prod-ready` в этом проекте не означает просто:

- `npm run build` зелёный;
- Vercel deployment создался;
- приложение "в целом открывается".

`Prod-ready` означает, что одновременно выполнены automated gates, manual acceptance, env readiness и release-specific проверки.

## 1. Обязательные automated gates

### Базовый engineering baseline

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`

### Дополнительные обязательные проверки по изменению контура

- `npm run test:rls` - если менялся auth, RLS, owner-only или self-service контур
- `npm run test:e2e:auth` - если менялись пользовательские сценарии, shell, API contracts, AI/admin UX
- `npm run verify:staging-runtime` - если менялись AI runtime или billing runtime контуры и нужно прогнать staging-like preflight для live secrets
- `npm run verify:migrations` - если менялись `supabase/migrations`
- `npm run verify:android-twa` - если менялись Android/TWA scaffold, asset links или packaging metadata

### Что считается провалом automated gates

- хотя бы одна из команд падает;
- команды проходят только "со второго раза" без объяснимой причины;
- quality gates оставляют неожиданный tracked-noise;
- тесты зелёные только за счёт skip, а не реального прохождения сценариев.

## 2. Обязательный manual acceptance

### Базовый пользовательский поток

- вход и восстановление сессии
- onboarding
- dashboard
- workouts
- nutrition
- AI workspace
- settings

### Критические UX-сценарии

- mobile PWA shell не перекрывает контент;
- burger drawer открывается и закрывается без layout/hydration артефактов;
- workout focus-mode читаем и usable на телефоне;
- AI workspace не показывает служебный мусор и не теряет историю;
- admin surface читаем, секционен и не валится общим `500` при degraded fallback.

### Критические runtime-сценарии

- нет hydration mismatch на базовых экранах;
- нет render loops;
- нет infinite polling;
- reset/save/finish workout flows ведут себя предсказуемо;
- owner-only данные не текут между пользователями;
- fallback/degraded режимы не превращаются в blank screen.

## 3. Env readiness

### Обязательные для web/PWA

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

### Для observability

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

### Для AI runtime

- `OPENROUTER_API_KEY`
- `VOYAGE_API_KEY`

### Для billing

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`

### Для Android/TWA

- `ANDROID_TWA_PACKAGE_NAME` (можно оставить дефолт `app.fitplatform.mobile`)
- `ANDROID_TWA_SHA256_FINGERPRINTS`

Отсутствие обязательных env не всегда блокирует локальную разработку, но блокирует статус `prod-ready` для соответствующего контура.

## 4. Release-specific блокеры

### Web/PWA нельзя считать production-ready, если

- есть mojibake в ключевой документации или пользовательском UI;
- базовый regression contour не зелёный;
- mobile shell всё ещё перекрывает контент;
- есть неподтверждённые race conditions в workout sync/reset/save/finish flows.

### AI нельзя считать production-ready, если

- history/retrieval/proposals не подтверждены как owner-scoped;
- provider failure ломает UX вместо понятного user-facing ответа;
- minimal eval gate не закрыт для:
  - `assistant`
  - `retrieval`
  - `workout plan`
  - `meal plan`
  - `safety`

### Billing нельзя считать production-ready, если

- не пройден живой сценарий `checkout -> return reconcile -> webhook -> portal`;
- webhook idempotency не подтверждена;
- `/settings` и `/admin` не показывают корректное состояние подписки.

### Android/TWA нельзя считать production-ready, если

- production PWA installability не подтверждена;
- не готовы `assetlinks.json`, package name, signing и splash;
- Android scaffold в `android/twa-release.json` не синхронизирован с `docs/ANDROID_TWA.md`;
- не пройден smoke на production URL.

### Supabase platform нельзя считать release-ready, если

- leaked password protection остаётся выключенной без отдельного принятого риска;
- нет зафиксированного решения по `vector` extension в `public`;
- platform-level настройки расходятся с `docs/RELEASE_CHECKLIST.md`.

## 5. Минимум для статуса "можно выкатывать"

Статус "можно выкатывать" допустим только если одновременно верны все пункты:

- baseline quality gates зелёные;
- критические manual acceptance сценарии пройдены;
- нет известных blocker-багов по shell, workouts, nutrition, AI и admin;
- release checklist пройден;
- env для затронутого контура подтверждены;
- для DDL-изменений пройдены migration discipline и advisor checks.

## 6. Где это проверять

- общий merge/deploy чеклист: `docs/RELEASE_CHECKLIST.md`
- текущий backlog и незакрытые blocker-пункты: `docs/MASTER_PLAN.md`
- история изменений и последних прогонов: `docs/AI_WORKLOG.md`
- допустимый warning-хвост сборки: `docs/BUILD_WARNINGS.md`
- Android/TWA handoff: `docs/ANDROID_TWA.md`
