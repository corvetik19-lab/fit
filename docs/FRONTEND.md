# Документация по фронтенду

## Стек

- Next.js 16
- App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4
- responsive PWA shell

## Текущая route-поверхность

- `/`: landing и точка входа
- `/auth`: вход и регистрация
- `/onboarding`: базовый профиль и цели
- `/dashboard`
- `/workouts`
- `/nutrition`
- `/history`
- `/ai`
- `/settings`
- `/admin`
- `/admin/users`
- `/admin/users/[id]`

## Текущая frontend-архитектура

- `src/app`: route files и route handlers
- `src/components`: переиспользуемые UI-компоненты
- `src/lib`: env, AI, Supabase, logging, safety, offline и viewer helpers
- `public/sw.js`: service worker для app shell, offline fallback и critical asset caches
- `public/offline.html`: offline shell для navigation fallback

## Auth и onboarding flow

1. Неавторизованный пользователь попадает на `/auth`
2. Регистрация или вход идут через Supabase Auth
3. Пользователь направляется на `/onboarding`
4. Onboarding сохраняет:
   - `profiles.full_name`
   - `onboarding_profiles`
   - последнюю запись в `goals`
   - `user_context_snapshots`
5. После сохранения пользователь попадает на `/dashboard`

## Текущие правила защиты маршрутов

- `/dashboard`, `/workouts`, `/nutrition`, `/history`, `/ai`, `/settings` требуют signed-in пользователя и completed onboarding
- `/admin` требует signed-in пользователя и проверяет наличие записи в `platform_admins`
- `/auth` редиректит уже авторизованного пользователя дальше в продукт

## Ключевые файлы

- `src/app/auth/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/workouts/page.tsx`
- `src/app/nutrition/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/users/[id]/page.tsx`
- `src/components/auth-form.tsx`
- `src/components/onboarding-form.tsx`
- `src/components/exercise-library-manager.tsx`
- `src/components/nutrition-tracker.tsx`
- `src/components/admin-bootstrap-form.tsx`
- `src/components/admin-users-directory.tsx`
- `src/components/admin-user-detail.tsx`
- `src/components/admin-user-actions.tsx`
- `src/components/sign-out-button.tsx`
- `src/lib/viewer.ts`

## Текущее состояние UI

Реализовано:

- landing CTA теперь зависит от состояния сессии
- верхняя навигация и пользовательские подписи по приложению переведены на русский
- mobile-first app shell теперь использует sticky header, burger drawer и контекстный нижний tab bar, чтобы `/dashboard`, `/workouts`, `/nutrition`, `/ai`, `/settings` и служебные разделы ощущались как полноценное телефонное приложение
- service worker для offline shell и critical caches уже подключён в production runtime
- auth form
- onboarding form
- bootstrap-форма для первого `super_admin`
- dashboard с реальным snapshot по данным пользователя
- period comparison UI на `/dashboard` с переключением `7 / 30 / 90` дней
- workout charts на `/dashboard` с недельными трендами по завершённым дням и logged sets
- nutrition charts на `/dashboard` с дневными калориями и средними КБЖУ
- рабочий nutrition tracker на `/nutrition` с ручным логированием приёмов пищи
- CRUD собственной базы продуктов на `/nutrition`
- recipes UI на `/nutrition` с сохранением составов и повторным применением в текущий приём пищи
- meal templates UI на `/nutrition` с быстрым сохранением и повторным применением draft-приёма пищи
- локальный barcode flow на `/nutrition` для быстрого добавления продукта из собственной базы по штрихкоду
- AI photo analysis block на `/nutrition` с загрузкой фото блюда и proposal-оценкой КБЖУ
- дневные цели по КБЖУ и прогресс по ним на `/nutrition`
- отдельный блок goal adherence на `/nutrition` с остатком до цели и 7-дневным трендом выполнения
- история последних приёмов пищи с удалением и автоматическим пересчётом дневной сводки
- рабочий экран `/workouts` с exercise library CRUD
- weekly program builder на `/workouts`
- builder диапазонов повторов на `/workouts` с пресетами `1-6`, `6-10`, `6-12`, `10-15`, `15-20`, `20-25`
- lock action для draft weekly programs
- блок `My Week` на `/workouts`
- страница `/workouts/day/[dayId]` для выполнения тренировки
- выпадающий выбор `actual_reps` на `/workouts/day/[dayId]`, ограниченный диапазоном конкретного подхода
- clone action для weekly programs
- workout templates на `/workouts`
- `/admin/users` и `/admin/users/[id]` с живыми данными
- `/admin` теперь работает как control center: показывает текущую admin-сессию, roster действующих администраторов, последние изменения доступов и быстрые входы в user management
- `/admin/users` поддерживает поиск по имени, email и UUID, фильтр по admin role, summary-карточки по выборке и прямой переход в управление доступом пользователя
- `/admin/users/[id]` показывает auth metadata пользователя и server-backed manager для ролей `super_admin`, `support_admin`, `analyst`
- UI для queued `suspend`, `restore` и custom support actions
- settings page показывает текущий account context
- sign-out button
- protected route redirects
- `/ai` теперь является рабочим proposal-центром, а не заглушкой

Пока остаётся заглушкой:

- history UI пока в основном scaffold-поверхность
- admin UI уже умеет bootstrap первого super-admin, полноценный user directory, role management и audit views, но system/sync dashboards пока не собраны полностью

## PWA и offline slice

- `src/components/service-worker-registration.tsx` регистрирует `public/sw.js` в production runtime и форсирует быстрое применение новой версии service worker.
- `public/sw.js` предкеширует `offline.html`, `manifest.webmanifest` и `icon.svg`.
- `AppShell` теперь сам получает `viewer` и передаёт его в shell-навигацию, поэтому мобильный PWA-shell может показать имя, email, admin-role и account actions в общем выезжающем меню.
- `AppShellNav` на телефоне использует burger drawer с overlay, grouped routes и встроенным `SignOutButton`, а нижний tab bar оставляет только быстрые core-переходы.
- `src/app/globals.css` содержит отдельный `app-drawer` слой, который открывается как slide-in sheet и не конфликтует с нижним таббаром.
- runtime-кеш применяется только к критичным same-origin ассетам: `/_next/static`, стилям, скриптам, шрифтам и изображениям.
- приватные HTML-страницы пользователя не кешируются намеренно, чтобы не держать пользовательский SSR-срез в shared browser cache.
- при offline navigation service worker отдаёт `public/offline.html`, а не браузерную network error page.

## Язык интерфейса

- Пользовательская поверхность приложения ведётся на русском.
- Если в БД лежат enum-значения вроде `fat_loss`, `beginner`, `super_admin`, на UI они должны маппиться в русские подписи, а не показываться как сырой backend value.
- Новые кнопки, заголовки, навигация и статусы тоже добавлять на русском, если пользователь явно не просил другое.

## Workout UI slice

- `/workouts` теперь грузит реальные данные из `exercise_library`
- `/workouts` теперь грузит последние weekly programs и показывает их как server snapshot
- пользователь может:
  - добавить упражнение
  - отредактировать упражнение
  - отправить упражнение в архив
  - вернуть упражнение из архива
- пользователь может:
  - создать draft weekly program
  - выбрать дни недели
  - выбрать упражнения из активной библиотеки
  - задать количество подходов и выбрать диапазон повторов из фиксированных пресетов
- пользователь может:
  - зафиксировать draft week через `Lock week`
  - увидеть текущую active week в блоке `My Week`
  - открыть конкретный тренировочный день
  - сохранить `actual_reps` по каждому подходу через выпадающий список, а не через ручной ввод
  - переводить статус дня между `planned`, `in_progress` и `done`
  - клонировать неделю на следующий 7-дневный цикл
  - сохранять неделю как template
  - применять template обратно в builder
- диапазон повторов сохраняется в `workout_sets` и переиспользуется в clone/template/AI apply flow
- для legacy-сетов без `planned_reps_min/max` UI даёт fallback-список `1..25`
- для новых legacy-записей на ещё не мигрированной БД UI умеет восстановить диапазон по `planned_reps`, если там сохранена верхняя граница пресета
- `WorkoutDaySession` поддерживает optimistic updates и локальную очередь для `actual_reps` и статуса тренировочного дня
- при offline-режиме экран выполнения тренировки показывает состояние сети, размер очереди и отдельное действие синхронизации при возвращении online
- экран показывает краткий snapshot по активным и архивным упражнениям
- экран показывает последние сохранённые weekly programs
- после CRUD-действий используется `router.refresh()`, поэтому серверная страница остаётся источником правды

## Dashboard UI slice

- `/dashboard` теперь грузит реальные summary-метрики через server-side helpers
- `DashboardPeriodComparison` запрашивает обновление period comparison через `/api/dashboard/period-compare`
- пользователь уже может переключать сравнение `7 / 30 / 90` дней
- текущий UI показывает сравнительные карточки и полосы по тренировкам, калориям и AI-сессиям
- `DashboardWorkoutCharts` показывает недельные столбцы по завершённым тренировочным дням и логам подходов
- `DashboardNutritionCharts` показывает калории по дням и средние белки/жиры/углеводы за последние 7 дней

## Nutrition UI slice

- `/nutrition` теперь показывает не только ручное логирование, но и отдельный adherence-блок с остатком до цели на текущий день
- `NutritionRecipesManager` позволяет собрать рецепт из пользовательских продуктов, сохранить его и сразу применить в текущий draft приёма пищи
- `NutritionMealTemplatesManager` позволяет сохранить текущий draft как шаблон и повторно подставить его в форму
- в блоке ручного логирования есть быстрый lookup по штрихкоду, который подставляет найденный продукт в текущий приём пищи
- `NutritionPhotoAnalysis` позволяет загрузить фото блюда и получить AI-оценку состава, калорий и КБЖУ без автоматической записи в дневник
- `NutritionGoalAdherence` показывает 7-дневный тренд выполнения целей по КБЖУ и среднее weekly adherence
- все nutrition-действия используют `router.refresh()`, поэтому server snapshot остаётся источником правды после CRUD-операций

## AI UI slice

- `/ai` теперь загружает реальные `ai_plan_proposals` текущего пользователя
- `AiProposalStudio` позволяет генерировать meal plan proposal и workout plan proposal из пользовательского контекста
- результат генерации сохраняется в БД и сразу появляется в истории AI-предложений после `router.refresh()`
- пользователь видит последние сохранённые proposal-результаты прямо на странице `/ai`
- AI UI поддерживает явные действия `Подтвердить` и `Применить`
- AI UI остаётся proposal-first: ни один план не применяется автоматически к workout или nutrition домену, пользователь всегда подтверждает шаг вручную

## Nutrition AI template UX

- reference-only шаблоны питания, созданные из AI meal proposal, видны в nutrition templates
- такие шаблоны не притворяются обычными food-mapped черновиками и не дают выполнить мгновенное применение
- UI прямо сообщает, что это справочный AI-шаблон, который нужно вручную сопоставить с продуктами базы

## Локальная проверка

Текущий frontend slice проходит:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Playwright-проверку `navigator.serviceWorker.controller` и offline fallback на `/dashboard`
## AI-чат и RAG на `/ai`

- На [ai/page.tsx](/C:/fit/src/app/ai/page.tsx) AI-раздел теперь состоит из двух рабочих поверхностей:
  - контекстный AI-чат;
  - центр AI-предложений для тренировок и питания.
- Добавлен клиентский компонент [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx):
  - показывает историю текущей chat session;
  - позволяет начать новый чат;
  - после каждого ответа показывает источники retrieval, которые были использованы в генерации.
- Пользовательский текст на AI-экране доведён до русского UI, включая чат и visible actions вокруг AI-предложений.
