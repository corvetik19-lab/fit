# Fitora AI Agent redesign execution

Дата старта: 2026-04-28

Цель: превратить AI в полноценного мобильного агента `fitora`, где `/ai` является главным рабочим центром, а плавающий AI-виджет служит быстрым лаунчером сценариев, а не вторым маленьким чатом.

Текущий прогресс подплана: `10 / 10` (`100%`).

## Чеклист

- [x] Зафиксировать активный AI Agent redesign-план отдельно от закрытых UI/UX подпланов.
- [x] Ввести единый typed intent-контракт для запуска AI: питание, тренировки, фото еды, штрихкод, текущий экран, прогресс и память.
- [x] Переделать плавающий AI-виджет в launcher/action sheet без собственного мини-чата.
- [x] Подключить route-intent запуск `/ai?intent=...&from=...` и prefill основного composer.
- [x] Сделать `/ai` понятным AI Agent Center: чат, быстрые сценарии, контекст запуска и proposal-first действия.
- [x] Синхронизировать `/api/ai/assistant` с новым intent body contract без поломки существующего streaming flow.
- [x] Оставить `/api/ai/chat` как legacy/eval route и зафиксировать направление на деприкацию в документации.
- [x] Обновить developer-документацию: `FRONTEND.md`, `AI_STACK.md`, `MASTER_PLAN.md`, `AI_WORKLOG.md`.
- [x] Добавить или обновить regression coverage для launcher, intent-prefill и мобильного AI workspace.
- [x] Подтвердить результат проверками и зафиксировать оставшиеся внешние blockers.

## UX-решения

- `/ai` - главный полноэкранный AI Agent Center.
- Floating AI widget - не чат, а быстрый launcher с 4-6 контекстными действиями.
- На мобильном не открываем маленькое чат-окно поверх интерфейса: пользователь переходит в полноценный AI workspace или в конкретный продуктовый экран.
- AI может создавать планы питания и тренировок только как proposal-first черновики.
- Виджет обязан учитывать текущую страницу: `/nutrition`, `/workouts`, `/dashboard`, `/history`, `/settings`.

## Developer contract

- Главный runtime для пользовательского агента: `/api/ai/assistant`.
- `AiChatPanel` остается единственным основным UI чата.
- `AiAssistantWidget` не должен импортировать `useChat` и не должен дублировать transcript/composer/tool-card logic.
- Intent запуск должен быть typed и одинаково использоваться server page, widget и chat composer.
- Если live provider деградирует, UI показывает provider/fallback notices через существующий `AiChatPanel`, а не скрывает это.

## Evaluator loop

- Goal: AI surface должен ощущаться как полноценный агент, а не маленький floating chat.
- Baseline: до подплана widget содержит отдельный `useChat` mini-chat, `/ai` уже использует `AiChatPanel`.
- Evaluator: lint/typecheck/build/smoke, targeted Playwright для `/ai` и mobile shell, ручной сценарий "widget -> intent -> /ai -> proposal".
- Artifacts: обновленная документация, screenshots/e2e output при финальной проверке, записи в `AI_WORKLOG`.
- Stop condition: launcher не дублирует чат, `/ai` получает intent prefill, AI proposal flow не сломан, проверки проходят или blockers явно названы.
- Escalation rule: provider credits, Supabase/Auth outage или live embeddings degradation фиксируются как внешние blockers, а не как успешный live AI rollout.

## Реализовано

- Добавлен typed intent contract [agent-intents.ts](/C:/fit/src/lib/ai/agent-intents.ts): `general`, `daily_plan`, `screen_context`, `meal_plan`, `workout_plan`, `meal_photo`, `barcode`, `progress_review`, `memory_review`.
- [ai-assistant-widget.tsx](/C:/fit/src/components/ai-assistant-widget.tsx) больше не импортирует `useChat` и не содержит transcript/composer logic. Виджет открывает action sheet и ведет в `/ai` или в продуктовый scanner route.
- [ai/page.tsx](/C:/fit/src/app/ai/page.tsx) распознает `intent` и `from`, а [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx) показывает контекст запуска и быстрые AI-действия.
- [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) получает `launchContext` и один раз подставляет стартовый prompt в основной composer без автозапуска.
- [use-ai-chat-composer.ts](/C:/fit/src/components/use-ai-chat-composer.ts) передает `intent`, `sourceRoute` и `contextPayload` в `/api/ai/assistant`.
- [assistant/route.ts](/C:/fit/src/app/api/ai/assistant/route.ts) принимает новый body contract, сохраняя существующий streaming/tool flow.
- [ai-workspace.spec.ts](/C:/fit/tests/e2e/ai-workspace.spec.ts) получил regression на сценарий `widget -> meal_plan intent -> /ai -> composer prefill`.

## Verification

- `npm run lint` -> passed, остались 2 старых warning в `src/lib/ai/plan-generation.ts`.
- `npm run typecheck` -> passed.
- `npm run build` -> passed, остались известные Sentry/OpenTelemetry critical dependency warnings.
- `npm run test:smoke` -> `5 passed`.
- `node scripts/run-playwright.mjs PLAYWRIGHT_SKIP_AUTH_SETUP=1 -- test tests/e2e/ai-workspace.spec.ts --workers=1 --reporter=list` -> `3 passed`.
- Внешние blockers не изменились: production/live provider quality path, полноценный embeddings runtime и production env остаются отдельными runtime-вопросами, не UI-дефектом текущего AI Agent Center.
