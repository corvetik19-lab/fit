# AI Worklog

## 2026-03-10

### Stripe checkout return retry flow

- `src/components/settings-billing-center.tsx` теперь не останавливается на одном `checkout/reconcile` после возврата из Stripe: billing center делает несколько auto-retry попыток с backoff, показывает текущий sync state и сохраняет ручной retry как fallback.
- `POST /api/billing/checkout/reconcile` остаётся источником истины для прямой post-checkout синхронизации, но UX вокруг него стал app-like: пользователь на телефоне видит session/payment/sync status вместо немого ожидания webhook.

### Billing health для super-admin

- `GET /api/admin/stats` расширен новым `billingHealth` slice: Stripe subscription counters, linked customer coverage, queued/completed `billing_access_review`, recent checkout return reconcile за 24 часа и последние timestamps по billing activity.
- `src/components/admin-health-dashboard.tsx` теперь показывает отдельный billing operations блок рядом с sync queues, а `src/components/admin-user-detail.tsx` раскрывает self-service billing audit logs с полезными payload-полями (`requestedFeatures`, `paymentStatus`, `sessionStatus`, `reconciled`).

### Проверка billing ops slice

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- отдельный `npm run build` через `NEXT_DIST_DIR=.next_codex_ops_health` не завершился за timeout и был остановлен; основной `.next` build по-прежнему нежелательно трогать, пока в workspace работает локальный `next dev`

## 2026-03-09

### Mobile app shell и admin control center

- `src/components/app-shell-nav.tsx` переведён на контекстный mobile bottom-nav: на телефоне нижняя навигация всегда остаётся в пяти слотах и не ломает сетку на `/history` и `/admin`, а текущий раздел подменяет пятый таб вместо переполнения.
- В `src/app/globals.css` добавлены мобильные polish-правки для app-shell: скрытие scrollbar у route strip, обрезка длинных подписей в нижней навигации и более явное active-состояние для app-like bottom bar.
- `/admin` расширен до control center: экран теперь показывает текущую admin-сессию, быстрые переходы в каталог пользователей, roster действующих админов с email и last sign-in, а также последние изменения доступов из `admin_audit_logs`.
- `/admin/users` усилен под реальное управление доступами: каталог поддерживает поиск по email/UUID, фильтр по роли, summary-карточки по текущей выборке и прямой CTA в карточку управления доступом.
- `AdminRoleManager` упрощён до прямого server-backed flow без ручного ввода SQL: супер-админ может выдать, подтвердить, изменить и отозвать admin-role, а UI подчёркивает actor role и аудит изменений.

### Проверка mobile/admin slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### Mobile burger drawer для PWA shell

- `src/components/app-shell.tsx` теперь сам подтягивает `viewer` и прокидывает его в shell-навигацию, чтобы телефонный PWA-режим видел email, имя и admin-role без ручной передачи этих данных по страницам.
- `src/components/app-shell-nav.tsx` переделан под mobile drawer: на телефоне появился burger trigger, затемнение фона, slide-in панель, сгруппированные разделы, account block и выход из сессии прямо из выезжающего меню.
- Нижний tab bar сохранён для core-разделов, а расширенная навигация и admin-входы переехали в drawer, чтобы не перегружать экран телефона и не ломать app-like UX.
- `src/app/globals.css` дополнен стилями `app-drawer*` и `app-drawer-link*`, чтобы drawer открывался как нативный sheet, а не как обычный список ссылок.
- `src/components/sign-out-button.tsx` получил `className`, чтобы кнопка выхода могла переиспользоваться и в settings-экране, и в mobile drawer без дублирования логики.

### Проверка mobile drawer slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### Role-based permission matrix для admin panel

- Добавлен единый контракт `src/lib/admin-permissions.ts` с ролями `super_admin`, `support_admin`, `analyst` и capability-matrix для чтения админских экранов, support actions, knowledge reindex, AI eval runs и управления admin-ролями.
- `src/lib/admin-auth.ts` теперь умеет требовать не просто факт admin-доступа, а конкретную capability, и отдаёт типизированные `401/403` ошибки для route handlers.
- Admin API routes переведены на capability-checks: user directory/detail, support actions, role management, admin stats, AI eval list/run и `POST /api/ai/reindex`.
- `AdminUserActions` и `AdminAiOperations` больше не притворяются доступными всем admin-ролям: `support_admin` и `super_admin` могут выполнять operational actions, а `analyst` видит read-only состояние с явным объяснением ограничений.
- `/admin` теперь показывает capability-статус текущей роли, чтобы из overview было видно, кто может запускать support actions, reindex и AI eval операции.

### Проверка admin permission slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### PWA service worker и offline shell

- Добавлен `public/sw.js` с предкешем `offline.html`, `manifest.webmanifest` и `icon.svg`, а также с runtime-кешем для критичных `/_next/static`-ассетов, шрифтов, стилей и изображений.
- Добавлен `public/offline.html` как безопасный offline fallback без кеширования приватных SSR-страниц пользователя.
- В `src/app/layout.tsx` подключена клиентская регистрация service worker через `src/components/service-worker-registration.tsx`.
- Service worker намеренно не кеширует защищённые HTML-страницы, чтобы не сохранять user-scoped SSR-срез между сессиями в общем кеше браузера.

### Проверка PWA/offline slice

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- `npm run build` завершился успешно локально
- Через Playwright CLI подтверждено, что страница находится под `navigator.serviceWorker.controller`
- Через Playwright CLI подтверждено, что offline navigation на `/dashboard` отдаёт `fit offline`, а не сетевую ошибку

### Диапазоны повторов в workout flow

- Добавлена миграция `supabase/migrations/20260309121000_workout_rep_ranges.sql`, которая расширяет `workout_sets` колонками `planned_reps_min` и `planned_reps_max`.
- В `src/lib/workout/rep-ranges.ts` вынесен общий доменный контракт диапазонов повторов с пресетами `1-6`, `6-10`, `6-12`, `10-15`, `15-20`, `20-25`.
- Weekly program builder больше не просит вручную вводить плановые повторы: вместо этого пользователь выбирает пресет диапазона, который потом хранится в workout-срезе.
- На `/workouts/day/[dayId]` поле `actual_reps` переведено с числового ввода на выпадающий список, ограниченный значениями выбранного диапазона.
- Для legacy-сетов без сохранённого диапазона сохранён безопасный fallback `1..25`, чтобы старые программы не ломались после миграции.
- Template flow, history clone и AI apply-поток обновлены так, чтобы сохранять или восстанавливать диапазон повторов вместе со структурой тренировки.

### Проверка workout rep range slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально после повторного запуска на уже сгенерированных `.next/types`

### Production hotfix для отстающей Supabase-схемы

- После деплоя обнаружено, что production `/workouts` падает server-side ошибкой, потому что удалённая таблица `workout_sets` ещё не содержит `planned_reps_min/max`.
- Причина подтверждена прямым запросом к remote Supabase: `column workout_sets.planned_reps_min does not exist`.
- Добавлен совместимый fallback в `src/lib/workout/workout-sets.ts`: чтение и запись `workout_sets` теперь автоматически откатываются на legacy-схему без новых колонок, если remote БД ещё не мигрирована.
- Обновлены `listWeeklyPrograms`, `Workout Day`, workout templates, history clone, AI workout apply и knowledge-сборка так, чтобы production не падал до применения SQL-миграции.
- Полная функциональность диапазонов повторов на production всё ещё зависит от применения миграции `20260309121000_workout_rep_ranges.sql` в удалённой Supabase БД.

### Дополнительный hotfix для legacy PostgREST и диапазонов без миграции

- Выяснено, что для `insert` в `workout_sets` remote PostgREST возвращает не `42703`, а `PGRST204` (`Could not find the 'planned_reps_max' column ... in the schema cache`).
- Fallback-детектор обновлён: теперь он ловит и `42703`, и `PGRST204`, поэтому создание новой weekly program больше не должно падать на legacy-схеме.
- `formatPlannedRepTarget` и `getActualRepOptions` теперь умеют восстанавливать выбранный диапазон повторов по `planned_reps`, если в БД пока нет `planned_reps_min/max`, но в `planned_reps` лежит верхняя граница пресета.
- Это даёт ограниченный список повторов даже без применённой remote-миграции для новых программ, созданных после перехода на rep range presets.

### Workout offline logging и sync queue

- Добавлен `src/lib/workout/execution.ts`, который выносит общий server-side контракт обновления статуса дня и `actual_reps` из route handlers.
- `PATCH /api/workout-days/[id]` и `PATCH /api/workout-sets/[id]` переведены на общий execution helper, чтобы online-обновления и sync push использовали одну и ту же валидацию.
- `POST /api/sync/push` больше не заглушка: route теперь принимает офлайн-мутации `workout_day_status` и `workout_set_actual_reps`, применяет их на сервере и возвращает список `applied/rejected`.
- `src/lib/offline/db.ts` типизирован под реальные workout-мутации, а `src/lib/offline/workout-sync.ts` добавляет enqueue, dedupe по цели мутации, чтение очереди по дню и flush в `/api/sync/push`.
- `WorkoutDaySession` теперь поддерживает optimistic updates, локальное сохранение статуса дня и `actual_reps` при отсутствии сети, отображение состояния очереди и автосинхронизацию при возвращении сети.
- Локальный queue slice сделан только для workout day execution; `sync/pull` и остальные домены по-прежнему не доведены до полного incremental sync.

### Проверка production hotfix

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` повторно прошёл локально после отдельного запуска на уже сгенерированных `.next/types`

### Проверка workout offline/sync slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` повторно прошёл локально после отдельного запуска на уже сгенерированных `.next/types`

## 2026-03-08

### Бутстрап платформы

- Репозиторий был переведён с пустого bootstrap-состояния в web-first Next.js 16 foundation.
- Добавлены продуктовые поверхности для `dashboard`, `workouts`, `nutrition`, `history`, `ai`, `settings` и `admin`.
- Добавлены базовые Supabase browser/server-клиенты, env-парсинг, safety helper, offline Dexie DB и API error response helper.
- Добавлены AI route scaffolds для chat, workout plans, meal plans, photo flow, reindex, admin stats, admin users и AI eval orchestration.
- Обновлены `.env.example`, `README.md` и `AGENTS.md` под фактическое направление проекта.

### Data plane и схема

- Созданы и применены первые две миграции Supabase.
- Добавлены таблицы для workout, nutrition, AI, SaaS readiness, admin operations, export/delete flows и AI eval tracking.
- Добавлены owner-based RLS policies.
- Добавлены lock-guard triggers для immutable weekly programs и связанных workout-таблиц.

### Инфраструктура и секреты

- Создан Supabase project `fit-dev`.
- Создан и привязан Vercel project `fit-platform`.
- Локально настроен `SUPABASE_SERVICE_ROLE_KEY`.
- Через Playwright MCP создан локальный `AI_GATEWAY_API_KEY`.
- Работы по деплою намеренно остановлены после решения продолжать локальную разработку.

### Локальный auth и onboarding slice

- Добавлена страница `/auth` с регистрацией и входом через Supabase Auth.
- Добавлена страница `/onboarding` для заполнения базового профиля.
- Добавлен `/api/onboarding`, который сохраняет `profiles`, `onboarding_profiles`, `goals` и `user_context_snapshots`.
- Добавлены `viewer` helpers для текущего пользователя, статуса onboarding и проверки admin-роли.
- Продуктовые маршруты защищены редиректами для незалогиненных пользователей и пользователей без завершённого onboarding.
- В settings добавлен локальный sign-out flow.

### Документационный контур

- Добавлен `docs/README.md` как индекс документации.
- Добавлен `docs/MASTER_PLAN.md` с текущими статусами фаз.
- Добавлены `docs/FRONTEND.md`, `docs/BACKEND.md` и `docs/AI_STACK.md`.
- В `AGENTS.md` зафиксировано правило: после существенных изменений документацию нужно обновлять.
- План из `План фит.docx` перенесён в `docs/MASTER_PLAN.md` и переведён в чек-листы с `[x]` и `[ ]`.

### Проверка

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- `npm run build` прошёл локально

### Admin bootstrap и exercise library CRUD

- `/admin` теперь умеет назначать первого `super_admin` через локальный `ADMIN_BOOTSTRAP_TOKEN`, не через временный header-костыль.
- Остатки старой схемы `x-admin-token` убраны из privileged routes; admin API теперь проверяет реальную запись в `platform_admins`.
- `/workouts` переведён из текстовой заглушки в рабочий экран библиотеки упражнений.
- Подключён существующий `exercise` API-контур: создание, редактирование, архивация и восстановление упражнений.
- `GET /api/admin/ai-evals` теперь отдаёт реальные записи `ai_eval_runs`, а `POST /api/admin/ai-evals/run` ставит eval run в очередь и пишет audit log.
- `POST /api/ai/reindex`, `POST /api/admin/users/[id]/suspend`, `POST /api/admin/users/[id]/restore` и `POST /api/admin/users/[id]/support-action` теперь создают реальные queued actions и audit logs вместо старых заглушек с bootstrap-header.
- `GET /api/admin/users/[id]` теперь отдаёт реальный admin detail snapshot по пользователю.

### Дополнительная проверка

- `npm run lint` повторно прошёл после admin/workout правок
- `npm run typecheck` повторно прошёл после admin/workout правок
- `npm run build` повторно прошёл после admin/workout правок

### Nutrition recipes, templates и adherence

- В nutrition-модуль добавлены полноценные рецепты с составом из пользовательских продуктов и расчётом КБЖУ по позициям.
- Добавлены шаблоны приёмов пищи, которые можно сохранить из текущего draft и повторно применять в ручной лог приёма пищи.
- На `/nutrition` добавлен отдельный блок выполнения целей по питанию: остаток до цели на сегодня и тренд adherence за последние 7 дней.
- В `src/lib/nutrition/meal-logging.ts` добавлены выборки для recipes, meal templates и 7-дневного nutrition trend.
- Добавлены route handlers для `recipes` и `meal_templates`.
- Исправлен технический хвост со stale `.next/dev/types`: `tsconfig.json` больше не тянет dev-generated types в `tsc`, а временные `.next_stale_*` исключены из `eslint` и `.gitignore`.

### Проверка nutrition-среза

- `npm run lint` прошёл локально после nutrition recipes/templates/adherence
- `npm run typecheck` прошёл локально после nutrition recipes/templates/adherence
- `npm run build` прошёл локально после nutrition recipes/templates/adherence

### Barcode flow и стабилизация локальной верификации

- В `/nutrition` добавлен быстрый поиск по штрихкоду внутри собственной базы продуктов пользователя.
- Найденный по штрихкоду продукт теперь можно сразу добавить в текущий draft приёма пищи без ручного выбора из списка.
- `package.json` обновлён: `typecheck` теперь использует `next typegen && tsc --noEmit`, чтобы route types генерировались автоматически.
- `build` переключён на `next build --webpack`, потому что локальный Turbopack падал внутренней ошибкой на CSS/PostCSS-стадии.

### Проверка barcode flow и toolchain

- `npm run typecheck` прошёл локально после перехода на `next typegen`
- `npm run lint` прошёл локально после добавления barcode flow
- `npm run build` прошёл локально через webpack

### Photo meal analysis flow

- `/api/ai/meal-photo` больше не является 501-заглушкой: route принимает фото блюда через `FormData`, отправляет его в Vercel AI Gateway через OpenResponses image input и возвращает структурированную proposal-оценку.
- Добавлена схема `mealPhotoAnalysisSchema` для валидации ответа AI и защиты UI от произвольного формата.
- На `/nutrition` добавлен отдельный блок AI-анализа фото блюда с загрузкой изображения, дополнительным контекстом и выводом ориентировочных калорий, КБЖУ, состава блюда и подсказок для ручного логирования.
- Photo flow сделан proposal-first: результат не пишет meal log автоматически и служит только опорой для ручного внесения питания.

### Проверка photo meal analysis flow

- `npm run typecheck` прошёл локально после добавления photo analysis route и UI
- `npm run lint` прошёл локально после добавления photo analysis route и UI
- `npm run build` прошёл локально после добавления photo analysis route и UI

### AI proposal flow с user context

- `meal-plan` и `workout-plan` routes переведены с простых prompt-заглушек на реальный server-side proposal flow.
- Добавлен `src/lib/ai/user-context.ts`, который собирает профиль, onboarding, goals, nutrition targets, body metrics и текущую nutrition summary для AI-контекста пользователя.
- Добавлен `src/lib/ai/proposals.ts` для выборки и сохранения `ai_plan_proposals`.
- `/api/ai/meal-plan` теперь генерирует proposal плана питания из реального пользовательского контекста и сохраняет результат в `ai_plan_proposals`.
- `/api/ai/workout-plan` теперь генерирует proposal тренировочного плана из реального пользовательского контекста и сохраняет результат в `ai_plan_proposals`.
- `/ai` переведена из статической заглушки в рабочий AI proposal-центр с формами генерации meal/workout proposals и историей последних AI-предложений.
- Proposal flow остаётся безопасным: данные сохраняются как предложения и не применяются автоматически к workout или nutrition домену.

### Проверка AI proposal flow

- `npm run typecheck` прошёл локально после AI proposal-правок
- `npm run lint` прошёл локально после AI proposal-правок
- `npm run build` прошёл локально после AI proposal-правок

### AI proposal confirmation и controlled apply

- Добавлены `POST /api/ai/proposals/[id]/approve` и `POST /api/ai/proposals/[id]/apply`.
- Workout proposal теперь можно не только подтвердить, но и применить в реальную draft weekly program с автоматическим созданием недостающих упражнений в `exercise_library`.
- Meal proposal теперь можно применить в nutrition-домен как набор reference-only `meal_templates`, чтобы использовать AI-план как управляемый артефакт, а не как автологирование.
- В `NutritionMealTemplatesManager` добавлена явная обработка reference-only AI-шаблонов, чтобы они не выглядели как обычные food-mapped шаблоны.
- AI proposal UI на `/ai` теперь поддерживает подтверждение и применение предложений прямо из интерфейса.

### Проверка confirmation/apply flow

- `npm run typecheck` прошёл локально после confirmation/apply flow
- `npm run lint` прошёл локально после confirmation/apply flow
- `npm run build` прошёл локально после confirmation/apply flow

### Admin user directory и detail UI

- Добавлены страницы `/admin/users` и `/admin/users/[id]`.
- `admin/page.tsx` теперь даёт переход в полноценный user directory и ссылки в карточки пользователей.
- Добавлен client-side user directory, который читает реальные данные из `/api/admin/users`.
- Добавлена карточка пользователя с profile/onboarding/goal snapshot, статистикой по упражнениям и программам, а также историей queued support actions.
- Добавлен `AdminUserActions` с кнопками `suspend`, `restore`, `queue resync` и кастомным support action.
- Под этот UI использованы уже реализованные server routes на `support_actions` и `admin_audit_logs`.

### Дополнительная проверка после admin UI

- `npm run lint` прошёл после добавления `/admin/users` UI
- `npm run typecheck` прошёл после добавления `/admin/users` UI
- `npm run build` прошёл после добавления `/admin/users` UI

### Weekly program builder

- Добавлен `/api/weekly-programs` для загрузки и создания draft weekly programs.
- Добавлен server helper `listWeeklyPrograms`, который собирает программу из `weekly_programs`, `workout_days`, `workout_exercises` и `workout_sets`.
- На `/workouts` добавлен рабочий weekly program builder с днями недели, упражнениями, количеством подходов и плановыми повторами.
- Builder создаёт draft-неделю на реальных workout-таблицах и сразу показывает её в списке последних программ.
- Срез сделан без lock/execution UI: это останется следующими шагами домена.

### Проверка weekly program builder

- `npm run lint` прошёл после добавления weekly program builder
- `npm run typecheck` прошёл после добавления weekly program builder
- `npm run build` прошёл после добавления weekly program builder

### Immutable lock UI и My Week

- Добавлен `POST /api/weekly-programs/[id]/lock`, который переводит draft week в `active` и выставляет `is_locked = true`.
- В списке weekly programs появилась кнопка `Lock week` для draft-программ.
- На `/workouts` добавлен блок `My Week`, который показывает текущую активную неделю и её дни.
- Теперь workout flow выглядит так: библиотека упражнений -> draft week -> lock -> active week snapshot.

### Проверка lock и My Week

- `npm run lint` прошёл после добавления lock flow и My Week
- `npm run typecheck` прошёл после добавления lock flow и My Week
- `npm run build` прошёл после добавления lock flow и My Week

### Workout Day и actual reps

- Добавлена страница `/workouts/day/[dayId]` для выполнения конкретного тренировочного дня.
- Добавлен `WorkoutDaySession`, который показывает упражнения, подходы, плановые повторы и позволяет сохранять `actual_reps`.
- Добавлены API routes `PATCH /api/workout-days/[id]` и `PATCH /api/workout-sets/[id]`.
- Status дня теперь можно переводить между `planned`, `in_progress` и `done`.
- Сохранение фактических повторов доступно только для locked week и работает через реальные обновления `workout_sets.actual_reps`.
- Из `My Week` и из списка locked-программ появились переходы в выполнение дня тренировки.

### Проверка Workout Day

- `npm run lint` прошёл после добавления Workout Day
- `npm run typecheck` прошёл после добавления Workout Day
- `npm run build` прошёл после добавления Workout Day

### History cloning flow

- Добавлен `POST /api/weekly-programs/[id]/clone`, который создаёт новый draft на основе существующей недели.
- В UI weekly programs появилась кнопка `Clone +7d`.
- Клонирование переносит дни, упражнения и плановые повторы, но не переносит `actual_reps`.
- Новый draft автоматически получает `source_program_id` и дату старта на неделю позже исходной.

### Проверка history cloning

- `npm run lint` прошёл после добавления cloning flow
- `npm run typecheck` прошёл после добавления cloning flow
- `npm run build` прошёл после добавления cloning flow

### Workout templates

- Добавлен `GET/POST /api/workout-templates`.
- Любую сохранённую weekly program теперь можно сохранить как template через `Save template`.
- На `/workouts` появился список `Workout templates`.
- Template можно применить обратно в builder и быстро собрать новый draft без ручного повторного ввода.

### Проверка workout templates

- `npm run lint` прошёл после добавления workout templates
- `npm run typecheck` прошёл после добавления workout templates
- `npm run build` прошёл после добавления workout templates

### Dashboard metrics queries и period comparison UI

- `src/lib/dashboard/metrics.ts` переведён на реальные запросы к Supabase вместо mock-данных.
- `/dashboard` теперь показывает живой snapshot по active/draft программам, упражнениям, logged sets, AI-сессиям и nutrition days.
- Добавлен client-side `DashboardPeriodComparison` с переключением `7 / 30 / 90` дней через `/api/dashboard/period-compare`.
- На dashboard появились визуальные сравнения текущего периода с предыдущим интервалом такой же длины по тренировкам, калориям и AI-сессиям.

### Русификация пользовательского UI

- Навигация `AppShell`, landing, dashboard, admin, settings, workouts, history, nutrition, AI и страницы выполнения тренировки приведены к русской пользовательской поверхности.
- Кнопки, заголовки, статусы и подсказки в workout/admin/dashboard контуре переведены на русский, включая `Lock week`, `Clone +7d`, `Save template`, `Workout Day` и route-level captions.
- Для отображаемых goal/fitness/sex/admin-role значений добавлены русские маппинги, чтобы UI не показывал пользователю сырой enum из БД.

### Проверка dashboard и русификации UI

- `npm run lint` прошёл после dashboard/UI-правок
- `npm run typecheck` прошёл после dashboard/UI-правок
- `npm run build` прошёл после dashboard/UI-правок

### Workout charts на dashboard

- В `src/lib/dashboard/metrics.ts` добавлен `getDashboardWorkoutCharts`, который собирает недельные workout-тренды по `workout_days` и `workout_sets`.
- На `/dashboard` добавлен `DashboardWorkoutCharts` с двумя графиками: завершённые тренировочные дни по неделям и логи подходов по неделям.
- Графики работают без внешней chart-библиотеки и строятся прямо на данных Supabase, поэтому текущий analytics slice остаётся лёгким и локально проверяемым.

### Проверка workout charts

- `npm run lint` прошёл после добавления workout charts
- `npm run typecheck` прошёл после добавления workout charts
- `npm run build` прошёл после добавления workout charts

### Nutrition charts на dashboard

- В `src/lib/dashboard/metrics.ts` добавлен `getDashboardNutritionCharts`, который собирает 7-дневный nutrition trend по `daily_nutrition_summaries`.
- На `/dashboard` добавлен `DashboardNutritionCharts` с графиком калорий по дням и визуализацией средних КБЖУ за день.
- Analytics dashboard теперь закрывает оба графических среза из текущего плана: тренировки и питание.

### Проверка nutrition charts

- `npm run lint` прошёл после добавления nutrition charts
- `npm run typecheck` прошёл после добавления nutrition charts
- `npm run build` прошёл после добавления nutrition charts

### Nutrition tracker и исправление cookie helper

- В `src/lib/supabase/server.ts` добавлена безопасная обработка cookie writes: Server Components больше не падают на `cookieStore.set`, а helper не ломает рендер в защищённых server pages.
- На `/nutrition` вместо заглушки появился рабочий nutrition-срез с ручным логированием приёмов пищи.
- Добавлены API routes `src/app/api/foods/*`, `src/app/api/meals/*` и `src/app/api/nutrition/targets/route.ts`.
- Добавлен `src/lib/nutrition/meal-logging.ts` для выборки продуктов, последних приёмов пищи, nutrition targets и пересчёта `daily_nutrition_summaries`.
- Добавлен `src/components/nutrition-tracker.tsx` с формами для базы продуктов, дневных целей по КБЖУ и ручного логирования питания.
- После создания и удаления приёма пищи дневная nutrition summary пересчитывается автоматически, а экран `/nutrition` показывает текущую сводку и историю последних логов.
- `npm run lint` прошёл после nutrition-правок и фикса cookie helper.
- `npm run typecheck` прошёл после nutrition-правок и фикса cookie helper.
- `npm run build` прошёл после nutrition-правок и фикса cookie helper.
### AI-чат и базовый RAG pipeline

- Добавлен реальный AI-чат с сохранением сессий и сообщений в `ai_chat_sessions` и `ai_chat_messages`.
- Добавлен knowledge/retrieval слой в `src/lib/ai/knowledge.ts` поверх `knowledge_chunks` и `knowledge_embeddings`.
- Индексация пользовательской базы знаний теперь собирает документы из onboarding, целей, nutrition targets, nutrition summaries, body metrics, user memory facts, context snapshots и последних weekly programs.
- Добавлен route `POST /api/ai/chat`, который сохраняет user message, поднимает retrieval по knowledge base, генерирует ответ через AI Gateway и сохраняет assistant message.
- Добавлен route `POST /api/ai/reindex`, который теперь реально переиндексирует базу знаний выбранного пользователя и пишет support/audit записи.
- На `/ai` добавлена клиентская панель чата с историей диалога, запуском нового чата и отображением источников retrieval для assistant-ответов.
- На AI-экране добран русский текст в пользовательских подписях, чтобы не оставлять смешанный English/Russian интерфейс.

### Проверка AI-чата и RAG

- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Live admin UX для AI eval runs

- На `/admin` статичная карточка последних eval runs заменена на живой client-side блок `AdminAiEvalRuns`.
- Админ теперь может вручную поставить новый `ai_eval_run` в очередь прямо из control center и сразу увидеть его в списке без полного обновления страницы.
- `GET /api/admin/ai-evals` и `POST /api/admin/ai-evals/run` теперь используются как единый live-контур для списка и queue action.
- UI уважает capability `queue_ai_eval_runs`: `analyst` и `super_admin` могут ставить eval runs в очередь, остальные роли видят read-only состояние.

### Проверка live admin UX для AI eval runs

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### User detail operations timeline

- `GET /api/admin/users/[id]` расширен actor-aware payload для super-admin карточки пользователя: теперь route отдает `recentExportJobs`, `recentOperationAuditLogs`, обогащенные `recentSupportActions`, а также actor refs для lifecycle/export/deletion/subscription history.
- В карточке пользователя `AdminUserDetail` собран полноценный operations view: текущий export/deletion state, история export jobs, support actions с resolution info, отдельный timeline по status transitions и расширенный billing/subscription timeline.
- `src/app/admin/users/[id]/page.tsx` переписан с чистым admin shell title, чтобы detail route выглядел как полноценный раздел панели, а не временный debug screen.

### Проверка user detail operations timeline

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Queue processor для admin operations

- Добавлен server-side helper `processAdminOperationQueues` и новый route `POST /api/admin/operations/process`, чтобы support-admin / super-admin могли прогонять admin queues не только ручными status clicks, но и пакетной обработкой.
- Export lifecycle теперь имеет автоматический wave flow: queued export jobs переводятся в `processing`, получают synthetic `artifact_path` и завершаются в `completed` с audit trail по обеим transition-точкам.
- Deletion lifecycle получил server wave logic: legacy `queued` requests нормализуются в `holding`, а просроченные hold-записи релизятся в queued support action `purge_user_data` с отдельным audit событием `queue_deletion_purge_action`.
- На `/admin` `AdminOperationsInbox` теперь умеет запускать `Прогнать wave`, а `AdminHealthDashboard` показывает due deletion holds и последние export/deletion timestamps.

### Проверка queue processor

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Support action execution и suspended state

- Добавлена миграция `user_admin_states`, чтобы `suspend_user` / `restore_user` имели реальный persisted account state, а не оставались только support queue action.
- `getViewer` теперь учитывает `user_admin_states`: suspended пользователь без admin-прав уходит на `/suspended`, где видит reason/state и может выйти из сессии.
- `processAdminOperationQueues` расширен support execution flow: wave теперь обрабатывает `suspend_user`, `restore_user`, `resync_user_context` и `purge_user_data`.
- `resync_user_context` создает `admin_support_resync` snapshot в `user_context_snapshots`, а `purge_user_data` формирует `admin_purge_manifest` snapshot с реальным inventory по user-scoped таблицам.
- В user detail появился текущий suspended state, так что super-admin видит не только timeline очереди, но и фактическое состояние аккаунта.

### Проверка support action execution

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Operations inbox и manual status workflow

- Добавлен `AdminOperationsInbox` на `/admin`: единый inbox по `support_actions`, `export_jobs` и `deletion_requests` с KPI, переходом в карточку пользователя и ручным refresh.
- Добавлен `GET /api/admin/operations`, который собирает pending/recent operations, подтягивает actor/target identity из Auth и profiles и возвращает summary для super-admin dashboard.
- Добавлен `PATCH /api/admin/operations/[kind]/[id]` для ручного разбора очередей: support actions переводятся из `queued` в `completed/failed`, export jobs — в `processing/completed/failed`, deletion requests — в `holding/completed/canceled`.
- Все ручные status transitions пишутся в `admin_audit_logs` с `fromStatus`, `toStatus`, `kind` и operator note.
- `GET /api/admin/stats` и `AdminHealthDashboard` приведены к реальной support-схеме: больше нет ложного `running` для `support_actions`, вместо этого считаются `queued/completed/failed`, а также отдельно показываются export backlog и deletion holds.

### Проверка operations inbox и admin health

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Workout offline sync pull и cache snapshots

- `GET /api/sync/pull` больше не заглушка для workout execution slice: route поддерживает scope `workout_day` и отдаёт канонический snapshot конкретного тренировочного дня.
- В `src/lib/offline/workout-sync.ts` добавлены helpers для `cacheWorkoutDaySnapshot`, чтения локального snapshot и server pull без полного обновления страницы.
- `WorkoutDaySession` теперь гидратится из Dexie snapshot + локальной очереди, а после online sync подтягивает свежий server state через `sync/pull`, а не через `router.refresh()`.
- На экране дня тренировки показывается время последнего локального snapshot, что полезно для phone-first PWA сценария с нестабильной сетью.

### Проверка workout offline sync pull и cache snapshots

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin system health и sync health dashboards

- `GET /api/admin/stats` расширен из простого counters endpoint в health API с отдельными срезами `systemHealth` и `syncHealth`.
- На `/admin` добавлен живой client-side блок `AdminHealthDashboard`, который умеет вручную обновлять runtime readiness, workload counters, support/eval backlog и workout sync activity.
- В health dashboard выведены readiness-флаги для `SUPABASE_PUBLIC`, `AI_GATEWAY`, `SUPABASE_SERVICE_ROLE_KEY` и scoped `workout sync pull`, а также свежесть последних профилей, программ, support actions, eval runs и сохранённых `actual_reps`.
- `/admin` теперь закрывает не только user management и AI operations, но и базовую operational observability для текущей PWA/offline архитектуры.

### Проверка admin system health и sync health dashboards

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Primary super-admin policy и расширенный user analytics

- Root-политика закреплена серверно: `super_admin` можно bootstrap/назначить только для `corvetik1@yandex.ru`, а снять или понизить этот доступ нельзя.
- `manage_admin_roles` теперь реально является root-only capability: UI и route handlers больше не считают любой `super_admin` в таблице достаточным для управления ролями.
- `/admin` получил отдельный root-only `Super-admin контур`, который виден только основному владельцу платформы и показывает policy drift по root-доступу.
- `GET /api/admin/users/[id]` расширен до полноценного analytics payload по пользователю: workout, nutrition, AI и lifecycle counters вместе с последними activity timestamps.
- Клиентская карточка пользователя на `/admin/users/[id]` теперь показывает подробную операционную статистику по аккаунту, а каталог пользователей прямо сообщает root-policy для `super_admin`.

### Проверка primary super-admin policy и user analytics

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin user operations: export и deletion

- Добавлены admin routes `POST /api/admin/users/[id]/export` и `POST` / `DELETE` `/api/admin/users/[id]/deletion` для живого управления export jobs и deletion hold flow без SQL.
- `AdminUserActions` теперь умеет ставить экспорт данных в очередь, переводить deletion request в `holding` и отменять его из карточки пользователя.
- User detail payload дополнен текущими состояниями `latestExportJob`, `deletionRequest` и `latestSubscription`, чтобы у админа был не только счётчик, но и реальный operational state.
- Карточка пользователя показывает отдельный operations/billing блок с export status, deletion hold, subscription state и access counters.

### Проверка admin user operations: export и deletion

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin users catalog: activity, backlog и billing signals

- `GET /api/admin/users` расширен до операционного каталога: route теперь обходит все страницы Supabase Auth users и агрегирует по каждому пользователю workout, nutrition, AI, support backlog, export/deletion state и subscription state.
- Каталог пользователей на `/admin/users` получил дополнительные фильтры `activity` и `paid`, server-driven сортировки по активности, входам, workout, AI и backlog, а также KPI summary по активным за 7 дней, backlog, пользователям без входов и платящим аккаунтам.
- Каждая карточка пользователя в списке теперь показывает mobile-friendly ops snapshot: роль, activity bucket, root/backlog/billing badges, workout/nutrition/AI/operations мини-панели и footer с источником последней активности.

### Проверка admin users catalog: activity, backlog и billing signals

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin users catalog: cohort analytics и priority segments

- `/api/admin/users` теперь возвращает не только `data`, но и server-side `summary` и `segments` для super-admin панели: activity buckets, backlog totals, billing hygiene и приоритетные выборки пользователей.
- В `/admin/users` добавлены cohort-блоки по активности, operational summary по backlog/export/deletion/subscriptions, а также три приоритетных сегмента: `priorityQueue`, `inactivePaid`, `newestUsers` и `topWorkoutUsers`.
- Панель позволяет супер-админу сразу видеть, кого нужно разбирать в первую очередь: пользователей с backlog, платящих без активности, новых аккаунтов без входов и самых активных workout users.

### Проверка admin users catalog: cohort analytics и priority segments

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Root billing controls и bulk user actions

- Добавлены root-only admin routes `POST /api/admin/users/[id]/billing` и `POST /api/admin/users/bulk` для server-backed управления subscription state, entitlements и массовыми действиями по выбранным пользователям.
- В user detail появился billing/access control block: root super-admin может выдать `trial`, активировать/отменить подписку, пометить `past_due`, а также включать и выключать entitlements по `feature_key`.
- В `/admin/users` добавлена bulk-панель с выбором пользователей прямо из каталога. Root super-admin теперь может массово запускать `queue_export`, `queue_resync`, `queue_suspend`, `grant_trial` и `enable_entitlement`.
- User detail payload расширен `recentEntitlements` и `recentUsageCounters`, чтобы billing/access state был не только редактируемым, но и наблюдаемым из UI.

### Проверка root billing controls и bulk user actions

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Billing timeline и bulk wave history

- `POST /api/admin/users/[id]/billing` теперь пишет subscription-side audit не только в `admin_audit_logs`, но и в `subscription_events`, чтобы user detail показывал реальную timeline по admin billing actions.
- `POST /api/admin/users/bulk` теперь формирует `batchId`, добавляет его в per-user audit payload и пишет отдельную summary-запись `bulk_wave_completed` в `admin_audit_logs`.
- `/api/admin/users` возвращает `recentBulkWaves`, а `/api/admin/users/[id]` возвращает `recentSubscriptionEvents`, поэтому super-admin видит и историю массовых операций, и историю billing updates на уровне пользователя.
- В UI это отображено как `Bulk history` на `/admin/users` и `Subscription timeline` в user detail.

### Проверка billing timeline и bulk wave history

- `npm run lint`
- `npm run build`
- `npm run typecheck`
### Settings data center and self-service export

- Added a real self-service data center in `Settings`: users can queue a data export, request account deletion with a 14-day hold, cancel that deletion request, and refresh statuses without leaving the screen.
- Added `GET/POST/DELETE /api/settings/data` for authenticated user-scoped export/deletion actions and `GET /api/settings/data/export/[id]/download` for completed export downloads.
- Added server helpers to load the settings snapshot and build a JSON export bundle across profile, onboarding, workouts, nutrition, AI history, billing, snapshots, and privacy records.
- Applied remote Supabase migrations before this slice: `20260309121000_workout_rep_ranges.sql` and `20260309173000_user_admin_states.sql`.

### Verification: settings data center

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Settings export archive upgrade

- Upgraded self-service export delivery from a raw JSON response to a real ZIP archive.
- Added a server-side archive builder that ships `export.json`, `summary.csv`, and CSV slices for workouts, nutrition, AI, billing, and privacy records.
- Updated the download route in settings to return `application/zip` and aligned the settings UI with ZIP-first copy.

### Verification: settings export archive

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Settings privacy timeline

- Extended the settings data snapshot with user-facing privacy events derived from `admin_audit_logs`.
- `/settings` now shows a privacy timeline for export/deletion lifecycle plus next-step summaries for the current export and deletion state.
- Timeline intentionally exposes actor scope as `you / support / system` instead of leaking internal admin identity fields.

### Verification: settings privacy timeline

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Hard-delete purge worker and protected primary admin

- `purge_user_data` in the admin queue processor now executes a real hard-delete via `auth.admin.deleteUser(..., false)` instead of stopping at a manifest-only placeholder.
- Purge manifests are now persisted in surviving `support_actions` and audit payloads before deletion, because `user_context_snapshots` are cascaded away with the deleted account and cannot serve as a durable audit artifact.
- Added protection for the root account `corvetik1@yandex.ru`: self-service deletion, admin deletion requests, direct destructive support actions, and bulk suspend now reject the primary super admin.

### Verification: hard-delete purge worker

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Sentry and Vercel observability

- Added `@sentry/nextjs`, `@vercel/analytics`, and `@vercel/speed-insights` to the app and wired them into the App Router shell.
- Added current Sentry manual setup for Next.js App Router: `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, and `src/app/global-error.tsx`.
- `next.config.ts` now conditionally wraps the app with `withSentryConfig(...)` when build-time Sentry credentials are present, including source-map upload support, a tunnel route, and automatic Vercel monitors.
- `logger.error(...)` now forwards handled server-side errors into Sentry so route failures show up in monitoring even when they are caught and converted to API responses.
- `/api/admin/stats` and the admin health dashboard now expose readiness for Sentry runtime/build config and Vercel runtime observability next to the existing Supabase and AI readiness checks.
- No new SQL migration was required for this slice.

### Verification: Sentry and Vercel observability

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Sentry smoke test and readiness diagnostics

- Added root-only `POST /api/admin/observability/sentry-test`, which emits a real Sentry smoke-test event and returns the resulting event id for operational verification.
- Expanded `/api/admin/stats` with non-secret observability diagnostics: missing Sentry runtime/build env keys, configured Sentry org/project/environment, and current Vercel runtime environment.
- `AdminHealthDashboard` now shows those diagnostics directly in `/admin` and exposes a smoke-test button to the primary super-admin.

### Verification: Sentry smoke test and readiness diagnostics

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Runtime entitlements, AI usage accounting and settings billing center

- Added `src/lib/billing-access.ts` as the runtime contract for subscriptions, entitlements, monthly usage counters, and per-feature access snapshots for `ai_chat`, `meal_plan`, `workout_plan`, and `meal_photo`.
- AI routes now enforce plan access and increment usage counters on success: `POST /api/ai/chat`, `POST /api/ai/meal-plan`, `POST /api/ai/workout-plan`, `POST /api/ai/meal-photo`, plus proposal `approve/apply` flows.
- `/ai` and `/nutrition` no longer act as if every AI feature is always available: the UI now shows access source, monthly usage, reset window, and blocked reasons directly in the product surface.
- `/settings` now includes a dedicated `SettingsBillingCenter` with plan summary, feature usage cards, billing timeline, and a self-service `billing_access_review` request flow for blocked premium AI features.
- Added `GET/POST /api/settings/billing` for user-scoped billing refresh and access-review requests; those requests are written into `support_actions` plus `admin_audit_logs`, so they are visible to the admin inbox.
- Admin billing mutations now also write entitlement changes into `subscription_events`, so user-facing billing history is not limited to subscription status changes only.
- Production Sentry rollout is intentionally deferred until `SENTRY_PROJECT` and `NEXT_PUBLIC_SENTRY_DSN` are provided; runtime diagnostics already surface this gap in `/admin`.

### Verification: runtime entitlements and settings billing center

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe billing integration foundation

- Added Stripe SDK integration and shared billing helpers in `src/lib/stripe-billing.ts` for customer creation, subscription reconciliation, event idempotency, and local subscription upserts.
- Added user-facing Stripe routes: `POST /api/billing/checkout`, `POST /api/billing/portal`, and `POST /api/billing/webhook/stripe`.
- `/settings` billing center now exposes Stripe-aware CTAs for checkout and subscription management when runtime env is ready, and shows configuration warnings when Stripe env is incomplete.
- `/api/admin/stats` and `AdminHealthDashboard` now surface readiness for Stripe checkout, Stripe portal, and Stripe webhook configuration alongside the existing observability diagnostics.
- Added admin reconcile route `POST /api/admin/users/[id]/billing/reconcile` so a root admin can force local subscription state to match Stripe after manual provider changes.
- Added SQL migration `20260310121500_stripe_provider_customer.sql` and applied it to remote Supabase project `nactzaxrjzsdkyfqwecf`.
- Remaining external dependency for this slice is production Stripe env rollout: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PREMIUM_MONTHLY_PRICE_ID`.

### Verification: Stripe billing integration foundation

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe admin UX and live billing refresh

- Fixed a real settings bug in `SettingsBillingCenter`: `GET/POST /api/settings/billing` now return both billing snapshot and live access state, so refresh/update flows no longer leave subscription-feature cards stale until a full page reload.
- Added root-admin Stripe reconcile action to `AdminUserActions`, so billing operators can trigger provider-to-local sync from the user card instead of relying on direct API calls only.
- Extended `/api/admin/users/[id]` and `AdminUserDetail` with Stripe-specific references: latest `provider_customer_id`, latest `provider_subscription_id`, and `provider_event_id` visibility inside the subscription timeline.
- Manual reconcile now also writes `admin_reconcile_stripe_subscription` into `admin_audit_logs`, so billing corrections remain visible in the super-admin audit trail.

### Verification: Stripe admin UX and live billing refresh

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe return flow and in-product billing CTA

- `SettingsBillingCenter` now handles `?billing=success|canceled|portal_return` on `/settings`, clears the query state after handling, and performs a live refresh so the user sees current subscription access instead of stale cards after returning from Stripe.
- Added direct `Открыть billing center` links from blocked AI surfaces: `AiChatPanel`, `AiProposalStudio`, and `NutritionPhotoAnalysis`, so mobile users can move from a paywall state straight into `/settings#billing-center`.
- Added `id="billing-center"` to the settings billing section so those deep links land on the right surface in the PWA.
- `GET/POST /api/settings/billing` now act as a combined refresh endpoint for both timeline snapshot data and runtime feature access.

### Verification: Stripe return flow and in-product billing CTA

- `npm run lint`
- `npm run typecheck`
- `npm run build` could not be re-run on the default `.next` because the local `next dev` process is active, and a separate env-driven build directory run hung after manifest generation.

### Direct Stripe checkout return reconcile

- `POST /api/billing/checkout/reconcile` now lets the signed-in user reconcile a just-completed Stripe checkout session by `session_id` immediately after returning from Stripe, without waiting for webhook timing.
- Checkout success URLs now include `session_id={CHECKOUT_SESSION_ID}`, so `/settings` can perform direct provider reconciliation on successful return.
- `SettingsBillingCenter` now prefers the direct reconcile route on `billing=success&session_id=...`; plain refresh remains the fallback for cancel and portal-return flows.
- Added best-effort audit logging for `user_reconciled_stripe_checkout_return` so self-service billing recovery is visible to operators.

### Verification: direct Stripe checkout return reconcile

- `npm run lint`
- `npm run typecheck`

### Stripe checkout return status banner

- `SettingsBillingCenter` now keeps a local `checkoutReturn` state and renders a dedicated banner for checkout return outcomes instead of only showing a generic success notice.
- Success returns now show whether the Stripe session has already been reconciled into a local subscription or is still waiting for confirmation.
- If the checkout session exists but local subscription state is not confirmed yet, the user gets a direct `Проверить Stripe ещё раз` retry action in `/settings`.
- Portal and canceled return flows now also show explicit status messaging inside the billing center instead of silently falling back to a generic refresh.

### Verification: Stripe checkout return status banner

- `npm run lint`
- `npm run typecheck`
- Separate compile-build in an alternative `distDir` was attempted again but hung and was stopped manually; default `npm run build` is still blocked by the active local `next dev` process using `.next`.

### Primary super-admin root policy and admin shell refresh

- Added migration `20260310164000_primary_super_admin_root_policy.sql` and applied it to remote Supabase project `nactzaxrjzsdkyfqwecf`.
- The migration now enforces `corvetik1@yandex.ru` as the only `super_admin`: it upserts the matching `platform_admins` row, demotes any other `super_admin` rows to `support_admin`, writes `primary_super_admin_enforced` into `admin_audit_logs`, and creates a partial unique index for `role = 'super_admin'`.
- Verified against the linked remote project that `corvetik1@yandex.ru` exists in `auth.users`, has a `platform_admins` row, and is the only current `super_admin`.
- Reworked the public landing page `/` into a cleaner product-first PWA entry screen with lighter copy, clearer CTAs, and a more professional mobile-first composition.
- Reworked `/admin` into a wider, less compressed control-center layout with a root summary hero, KPI strip, health dashboard, operations inbox, user-management entry point, AI ops, admin roster, audit stream, and product-signal panels.
- Expanded the global app shell width to `max-w-[1500px]` so admin and settings surfaces have more usable room on desktop without changing the mobile PWA rhythm.

### Verification: root-admin policy and landing/admin shell

- `npx supabase db push --linked --include-all`
- `npx eslint src/app/page.tsx src/app/admin/page.tsx src/components/app-shell.tsx`
- `npm run typecheck`
- `cmd /c "set NEXT_DIST_DIR=.next_codex_root_admin_ui&& npm run build"`

### Login-first app shell and PWA icon polish

- `/` is now the real entry point of the product: signed-out users see a compact Russian auth screen with `AuthForm`, while signed-in users are redirected straight to `/dashboard` or `/onboarding`.
- `/auth` now collapses into the same entry flow by redirecting back to `/`, and unauthenticated protected routes now also return to `/` instead of a separate auth surface.
- The shared `AppShell` now uses a fixed, collapsible top bar with persisted local state, which gives the mobile PWA more vertical space and keeps the navigation behavior consistent between phone and desktop.
- Reworked `/dashboard`, `/workouts`, `/nutrition`, `/settings`, and the main admin wrappers so they read like product screens in Russian rather than technical internal checklists.
- Fixed the broken PWA icon pipeline: `public/icon.svg` now closes correctly, generated real `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`, and updated metadata/manifest to use PNG icons so install surfaces stop warning about invalid images.
- Browser verification on local `http://127.0.0.1:3000/` confirmed the new root auth screen, and both `/dashboard` and `/auth` now redirect back to the unified root login flow when no session exists.

### Verification: login-first shell and PWA polish

- `npx eslint src/app/page.tsx src/app/auth/page.tsx src/app/dashboard/page.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx src/app/settings/page.tsx src/app/admin/page.tsx src/app/admin/users/page.tsx src/components/auth-form.tsx src/components/app-shell.tsx src/components/app-shell-frame.tsx src/components/app-shell-nav.tsx src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/layout.tsx src/app/manifest.ts src/lib/viewer.ts`
- `npm run typecheck`
- `npm run build`
- Playwright manual verification on `http://127.0.0.1:3000/`, `/dashboard`, and `/auth`

### Admin UX language cleanup

- Continued the product polish pass for the super-admin workflow so admin surfaces read like a finished product instead of an internal console.
- `AdminUsersDirectory` now uses more product-facing Russian labels for user queue, paid risk, bulk actions, subscription summaries, and footer state chips.
- Bulk-action history and controls now present Russian labels instead of enum-like phrases, including clearer success/error notices and queue wording.
- `AdminUserDetail` now uses more user-facing Russian copy for support actions, export/deletion history, subscription history, Stripe references, and admin audit sections.
- The admin detail page now describes billing/access state, opened features, and manual actions in a calmer product tone rather than mixed English/internal wording.

### Verification: admin UX language cleanup

- `npx eslint src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/admin/page.tsx src/app/admin/users/page.tsx src/app/admin/users/[id]/page.tsx`
- `npm run typecheck`
- `npm run build`

### AI, billing, and workout product copy cleanup

- Reworked `/ai` so the page reads like a user-facing AI workspace in Russian instead of a mixed internal billing/debug panel.
- Simplified the access wording in `/ai`: subscription state, provider, feature availability, and usage reset copy now use product language rather than raw `Provider / Active / reset` labels.
- Cleaned `/settings` billing center copy around checkout return, payment status, feature access review, and access history so the screen feels like a real billing section rather than Stripe/session diagnostics.
- Reduced technical wording inside the workout day session: local save state, reconnect notices, pending changes, and send actions now speak about device saving and sending changes instead of snapshots/queues/sync internals.

### Verification: AI/billing/workout polish

- `npx eslint src/app/ai/page.tsx src/components/settings-billing-center.tsx src/components/workout-day-session.tsx src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx`
- `npm run build`
- `npm run typecheck` (rerun after build because `.next/types` is still occasionally flaky on the first pass)
