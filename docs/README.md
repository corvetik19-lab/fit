# Индекс документации fit

Эта папка является постоянной handoff-поверхностью для будущих разработчиков и AI-агентов.

## Правила обновления

После каждого существенного изменения нужно обновлять все релевантные файлы:

- `docs/AI_WORKLOG.md` для хронологического журнала изменений
- `docs/MASTER_PLAN.md` для статусов фаз, выполненной работы и оставшихся задач
- профильный документ, например `FRONTEND.md`, `BACKEND.md` или `AI_STACK.md`

Правило ведения прогресса:

- агент обязан отмечать прогресс прямо в `docs/MASTER_PLAN.md`
- выполненные пункты нужно переключать из `[ ]` в `[x]`
- после каждого существенного изменения нужно добавлять запись в `docs/AI_WORKLOG.md`

Секреты и реальные значения ключей в документацию не записывать.

## Файлы

- `AI_WORKLOG.md`: хронологический журнал того, что было сделано и проверено
- `MASTER_PLAN.md`: master plan проекта с отслеживанием статусов
- `FRONTEND.md`: app shell, маршруты, auth flow, onboarding flow и текущее состояние UI
- `BACKEND.md`: схема Supabase, RLS, route handlers, env-контракт и текущее состояние backend-части
- `AI_STACK.md`: Vercel AI Gateway, модели, AI routes, safety и eval-процесс

## Текущее краткое состояние

- Репозиторий представляет собой локально развиваемую Next.js 16 web-платформу для `fit`
- Проект Supabase и миграции уже существуют
- Локальный ключ Vercel AI Gateway уже создан
- Auth и onboarding уже работают локально
- Пользовательский интерфейс основных поверхностей ведётся на русском
- Dashboard уже читает реальные summary-метрики и умеет сравнивать периоды
- Workout charts на dashboard уже работают локально
- Nutrition charts на dashboard уже работают локально
- Nutrition recipes и meal templates уже работают локально
- Nutrition barcode flow по собственной базе продуктов уже работает локально
- Nutrition photo analysis flow через AI Gateway уже работает локально
- Nutrition goal adherence и 7-дневный тренд уже работают локально
- Exercise library CRUD уже работает локально
- AI meal/workout proposal flow с сохранением в `ai_plan_proposals` уже работает локально
- AI proposal confirmation/apply flow уже работает локально
- Weekly program builder уже работает локально
- Lock flow и `My Week` уже работают локально
- Workout Day и `actual_reps` уже работают локально
- History cloning уже работает локально
- Workout templates уже работают локально
- Bootstrap первого `super_admin` уже реализован локально
- Базовый admin user management UI уже работает локально
- Деплой пока намеренно поставлен на паузу
- AI-раздел теперь включает рабочий контекстный чат с retrieval по пользовательской knowledge base и отдельный центр AI-предложений.
