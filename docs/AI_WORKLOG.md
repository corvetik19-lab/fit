# AI Worklog

## 2026-03-09

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
