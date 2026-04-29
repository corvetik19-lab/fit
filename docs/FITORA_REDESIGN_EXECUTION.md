# Fitora redesign execution

Текущий прогресс подплана: `12 / 12` (`100%`).

Общий прогресс `MASTER_PLAN` на старте подплана: `223 / 228` (`98%`).

## Цель

Полностью перевести приложение на мобильный визуальный стиль `fitora` из референсов `C:\Users\User\Desktop\Фит`: светлый интерфейс, Manrope, компактные карточки, сине-бирюзовый градиент, нижняя навигация, понятные действия и аккуратная Android/PWA-подача.

Техническое имя репозитория, Supabase-проекта, env-переменных и внутренних контрактов остаётся `fit`. Пользовательский бренд, PWA-метаданные, логотип, favicon, onboarding/login copy и все видимые поверхности должны показывать `fitora`.

## Чеклист

- [x] Завести и синхронизировать developer-facing документацию: execution-doc, дизайн-brief, `FRONTEND`, `MASTER_PLAN`, `AI_WORKLOG`.
- [x] Внедрить brand foundation `fitora`: logo, mark, favicon, PWA icons, manifest, metadata, title/description, slogan.
- [x] Пересобрать глобальную дизайн-систему: palette, typography, background patterns, surfaces, buttons, inputs, chips, badges, motion, safe-area spacing.
- [x] Пересобрать shared shell: top app bar, bottom nav, drawer, page container, floating AI widget, header/content offsets.
- [x] Пересобрать `/` и `/onboarding` под чистый мобильный auth/profile flow без лишнего текста и без overflow.
- [x] Пересобрать `/dashboard` как главный daily overview с ясным фокусом, прогрессом, тренировкой, питанием и AI prompt.
- [x] Пересобрать `/workouts` и `/workouts/day/[dayId]`: компактные program cards, media slots для упражнений, focus-mode, set tracking, sticky actions.
- [x] Пересобрать `/nutrition`: дневной баланс, фото еды, штрихкод, Open Food Facts, карточки продуктов с изображениями, рецепты и AI meal plan.
- [x] Пересобрать `/ai` как chat-first coach: transcript, composer, быстрые сценарии питания/тренировок/продукта, без декоративных explainers.
- [x] Пересобрать `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`: чистые utility screens, корректный русский текст, no overflow.
- [x] Пересобрать `/admin`, `/admin/users`, `/admin/users/[id]` как compact operator console в том же стиле.
- [x] Закрыть verification: lint, typecheck, build, smoke, mobile PWA regression, nutrition capture, AI/workout/settings/admin suites, свежие mobile screenshots.

## Developer contract

- Все новые пользовательские тексты писать на чистом русском UTF-8.
- Не возвращать dark utility, oversized CTA, декоративные hero-блоки и большие пустые карточки.
- Основной viewport: `360x800`, `390x844`, `430x932`; desktop является расширением мобильной композиции.
- Нельзя ломать существующие route/API contracts для AI, питания, тренировок, настроек, оплаты и админки.
- AI остаётся proposal-first: агент может предложить план питания или тренировок, но не должен записывать его пользователю без подтверждения.
- Open Food Facts, фото еды и barcode flows должны оставаться first-class действиями на `/nutrition`.
- Admin UI должен быть компактным и читаемым, но не превращаться в consumer-dashboard.

## Verification matrix

- Static: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke`.
- User flow: `tests/e2e/authenticated-app.spec.ts`, `tests/e2e/mobile-pwa-regressions.spec.ts`.
- Feature flow: `tests/e2e/ai-workspace.spec.ts`, `tests/e2e/nutrition-capture.spec.ts`, `tests/e2e/workout-focus-flow.spec.ts`, `tests/e2e/settings-billing.spec.ts`.
- Admin flow: `tests/e2e/admin-app.spec.ts`.
- Manual visual proof: screenshots for `/`, `/onboarding`, `/dashboard`, `/workouts`, `/workouts/day/[dayId]`, `/nutrition`, `/ai`, `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`, `/admin`, `/admin/users`, `/admin/users/[id]`.

## Рабочие заметки

- 2026-04-28: старт подплана. Зафиксирован отдельный счётчик текущего redesign-плана, чтобы не смешивать его с общим `MASTER_PLAN`.
- 2026-04-28: создан дизайн-brief для разработчиков и дизайнеров, `MASTER_PLAN` получил активный пункт, `AI_WORKLOG` получил стартовую запись. Прогресс текущего подплана: `1 / 12 (8%)`.
- 2026-04-28: внедрён brand foundation `fitora`: заменены SVG logo/app icon, пересобраны `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, обновлены `metadata`, `manifest`, login header, onboarding header и shared shell brand. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `2 / 12 (17%)`.
- 2026-04-28: обновлены глобальные tokens/palette под `fitora`, переписан общий `PageWorkspace`, входной экран и onboarding form на чистый русский UTF-8 и compact mobile flow. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `4 / 12 (33%)`.
- 2026-04-28: пересобран `/dashboard` как compact daily overview: чистые русские строки, fitora cards, секции `Сегодня / Тренировки / Питание / AI`, сохранены runtime metrics и chart-компоненты. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `5 / 12 (42%)`.
- 2026-04-28: пересобраны `/workouts` и `/workouts/day/[dayId]`: shell-copy, focus header, day overview, day context, notices, status actions, step strip, set tracking card и пустое состояние переведены на чистый mobile fitora UI. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `6 / 12 (50%)`.
- 2026-04-28: пересобран `/nutrition`: page shell, tracker surface, Open Food Facts lookup/import, barcode scanner, food photo analysis, recipes и meal templates приведены к светлой компактной мобильной системе, изображения продуктов и упаковок остались first-class. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `7 / 12 (58%)`.
- 2026-04-28: закрыт shared shell: app header, nav, page workspace и floating AI widget приведены к `fitora`, виджет закреплён снизу справа и не конфликтует с drawer/bottom nav. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `8 / 12 (67%)`.
- 2026-04-28: пересобран `/ai` как chat-first coach: workspace, transcript, composer, notices, toolbar, tool cards, prompt library, history/context/plans sidebar и floating widget переписаны без mojibake и лишних explainers. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `9 / 12 (75%)`.
- 2026-04-28: пересобраны utility screens `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`: тексты приведены к чистому UTF-8, настройки и оплата уплотнены под телефон, success/warning/error статусы адаптированы под светлый фон, suspended больше не показывает битые `???????`-fallback. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `10 / 12 (83%)`.
- 2026-04-28: пересобраны admin surfaces `/admin`, `/admin/users`, `/admin/users/[id]`: операторский центр, каталог, cohorts, bulk/action panels и карточка пользователя приведены к компактной светлой системе; исправлены dark status tones (`text-*-100`) и уплотнены detail-секции. Проверено: `npm run lint`, `npm run typecheck`. Прогресс текущего подплана: `11 / 12 (92%)`.
- 2026-04-28: verification частично закрыта: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` зелёные. Smoke-контракт обновлён под бренд `fitora`, offline fallback переведён на новую PWA-палитру. Auth-dependent e2e (`authenticated-app`, `nutrition-capture`) не закрыты из-за runtime blocker: live Supabase/Auth отвечает `ECONNRESET`/timeouts, `/nutrition` не отдаёт `commit` за 30 секунд даже после test-only сокращения fallback timeouts. Прогресс текущего подплана остаётся `11 / 12 (92%)` до зелёного e2e/mobile contour.
- 2026-04-28: verification закрыта полностью. Проверено: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`, широкий Playwright-контур `authenticated-app`, `nutrition-capture`, `ai-workspace`, `workout-focus-flow`, `settings-billing`, `admin-app`, `mobile-pwa-regressions` -> `26 passed / 1 skipped`. Skip локальный и ожидаемый: `admin content asset images` требует реальную DB-строку пользователя, а стабильный локальный контур использует synthetic auth. Свежие mobile screenshots `390x844` сохранены в `output/fitora-mobile-screens/`, contact sheet: `output/fitora-mobile-screens-contact-sheet.png`. Дополнительно исправлен `/history`, чтобы при деградации Supabase/Auth экран показывал fallback-архив вместо global error, и добавлен Playwright-only `__test_suspended=1` для визуальной проверки `/suspended`. Прогресс текущего подплана: `12 / 12 (100%)`.
