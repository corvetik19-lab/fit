# Frontend `fit`

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- PWA shell + service worker
- AI UI на `ai` и `@ai-sdk/react`

## Основные страницы

### Пользовательские

- `/` — входная точка, перенаправляет в `auth`, `onboarding` или `dashboard`
- `/auth` — вход и регистрация
- `/onboarding` — первичная настройка профиля, целей и ограничений
- `/dashboard` — сводка по тренировкам, питанию и AI
- `/workouts` — недельные программы, упражнения и история выполнения
- `/workouts/day/[dayId]` — экран конкретной тренировки, включая focus-mode
- `/nutrition` — дневной баланс, приёмы пищи, продукты и история
- `/ai` — полноэкранный AI workspace
- `/history` — история программ, AI-предложений и self-service событий
- `/settings` — профиль, доступы, billing, экспорт и удаление данных
- `/suspended` — экран ограниченного аккаунта

### Админские

- `/admin` — операторский центр
- `/admin/users` — каталог пользователей
- `/admin/users/[id]` — детальная карточка пользователя

### Технические

- `/smoke` — стабильная smoke-страница для локальных и CI-проверок
- `app/api/**` — runtime routes, которые поддерживают UI и тесты

## Базовая архитектура

Frontend держится на трёх уровнях:

1. `src/app/**` — server pages и route-level orchestration
2. `src/components/**` — клиентский UI, shell, формы, секции экранов
3. `src/lib/**` — derived state, форматтеры, runtime helpers, domain logic

Текущее правило production hardening:

- страницы должны быть тонкими orchestrator-компонентами;
- тяжёлая логика не должна жить прямо в JSX;
- hydration-sensitive и sync-sensitive части нужно выносить в helper-модули и hooks;
- UI не должен зависеть от служебного текста и внутренних технических терминов.

## Shell и навигация

Ключевые файлы shell:

- `src/components/app-shell.tsx`
- `src/components/app-shell-frame.tsx`
- `src/components/app-shell-nav.tsx`

Что считается правильным состоянием:

- на desktop есть стабильный top nav без перекрытий и лишнего fixed chrome;
- на mobile/PWA используется burger drawer без portal-глюков и hydration mismatch;
- AI chat-виджет доступен как отдельное действие, но не мешает навигации;
- shell не должен ломать focus-mode сценарии тренировки и полноэкранный AI workspace.

## Workspace-паттерн

Тяжёлые страницы приложения должны быть разбиты на логические секции.

Это уже используется как базовый паттерн для:

- `Dashboard`
- `Workouts`
- `Nutrition`
- `AI`
- `Admin`

Ожидаемое поведение:

- пользователь видит явные разделы, а не длинную ленту блоков;
- на мобильной PWA одновременно открыт только один основной логический блок;
- обзор, меню и активный раздел можно скрывать независимо;
- переключатели секций должны быть читаемыми и на desktop, и на mobile.

## Тренировки

Ключевые файлы:

- `src/app/workouts/page.tsx`
- `src/app/workouts/day/[dayId]/page.tsx`
- `src/components/workout-day-session.tsx`
- `src/components/workout-session/**`

Что уже является текущим продуктовым контрактом:

- шаги тренировки видны сразу все;
- будущие упражнения закрыты, пока текущее не сохранено;
- сохранение упражнения возможно только при полностью заполненных `повторах`, `весе`, `RPE`;
- после сохранения шаг становится read-only, пока пользователь явно не нажмёт `Редактировать`;
- есть `focus-mode` для мобильной PWA;
- таймер тренировки умеет старт, паузу, завершение и сохранение времени;
- `Обнулить тренировку` сбрасывает и UI, и серверное execution state.

## Питание

Ключевые файлы:

- `src/app/nutrition/page.tsx`
- `src/components/nutrition-tracker.tsx`
- `src/components/dashboard-nutrition-charts.tsx`
- `src/lib/nutrition/**`

Фронтенд-контракт питания:

- есть секционный интерфейс вместо одной длинной страницы;
- пользователь видит дневной баланс, приёмы пищи, продукты и историю;
- AI и дашборд получают meal-level и strategy-level сигналы без сырых технических деталей в UI;
- карточки и бейджи не должны вылезать за экран на mobile/PWA.

## AI workspace

Ключевые файлы:

- `src/app/ai/page.tsx`
- `src/components/ai-workspace.tsx`
- `src/components/ai-chat-panel.tsx`
- `src/components/ai-chat-toolbar.tsx`
- `src/components/ai-chat-transcript.tsx`
- `src/components/ai-chat-composer.tsx`

Что считается правильным UX:

- это chat-first полноэкранный экран без лишнего служебного текста;
- история чатов создаётся автоматически и может очищаться по одному или массово;
- поиск в интернете включается понятным компактным toggle;
- загрузка фото еды встроена в composer, а не вынесена в отдельный непонятный поток;
- assistant flow читается как `запрос -> анализ -> предложение -> подтверждение -> применение`.

## Admin UI

Ключевые файлы:

- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/users/[id]/page.tsx`
- `src/components/admin-*.tsx`

Операторский контракт:

- только русский язык и понятные бизнес-формулировки;
- детали ролей и capability-поверхность видны только там, где это действительно нужно;
- degraded/fallback режимы должны быть явными, но не ломать экран общим `500`;
- каталоги и карточки пользователей остаются секционными и читабельными и на desktop, и на mobile.

## Тесты и контроль качества

Frontend regression-контур сейчас держится на:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`
- `npm run test:e2e:auth`

Дополнительно:

- `npm run test:rls` проверяет data isolation напрямую через Supabase clients
- `npm run verify:migrations` обязателен, если изменялись `supabase/migrations`

## Практические правила для изменений

- не добавлять новый UI с сырым техническим текстом;
- не полагаться на `networkidle`, если тест проверяет только API-контракт;
- не держать важную business logic прямо внутри большого client-компонента;
- не ломать mobile/PWA layout fixed-плашками и лишними overlay;
- не трогать `docs/AI_EXPLAINED.md` как часть sanitation-wave без отдельного triage.
