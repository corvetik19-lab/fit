# Full App Live Verification Execution

Этот execution-doc фиксирует отдельный tranche по полной live-проверке `fit`
после runtime hardening, AI-fallback stabilizing и mobile UI polish.

Цель:
- честно подтвердить, что основные пользовательские вкладки, AI-ассистент,
  питание, штрихкоды, импорт продуктов, photo-import, meal/workout plans,
  настройки и admin-поверхности реально работают;
- отдельно подтвердить mobile UX на телефоне без layout-регрессий;
- не маскировать provider/runtime деградацию как success.

## Чеклист

- [x] Прогнать базовые quality gates: `lint`, `typecheck`, `build`.
- [x] Прогнать широкий e2e-пакет по user/admin/mobile/API поверхностям.
- [x] Прогнать evaluator loop для AI: `ai-gate`, живой чат, safety, meal/workout plans.
- [x] Подтвердить nutrition flows: barcode lookup/import, products, meal-photo/photo-import.
- [x] Зафиксировать артефакты, обновить `MASTER_PLAN` и `AI_WORKLOG`.

## Итог tranche

- Runtime verification подтверждён на свежем production-like сервере
  `http://127.0.0.1:3235`.
- Пользовательские и operator surface проверки зелёные отдельными пакетами:
  - `tests/e2e/authenticated-app.spec.ts` -> `2 passed`
  - `tests/e2e/ai-workspace.spec.ts` -> `2 passed`
  - `tests/e2e/nutrition-capture.spec.ts tests/e2e/workout-focus-flow.spec.ts tests/e2e/settings-billing.spec.ts` -> `7 passed`
  - `tests/e2e/admin-app.spec.ts` -> `7 passed`
  - `tests/e2e/mobile-pwa-regressions.spec.ts` -> `9 passed`
  - `tests/ai-gate/ai-quality-gate.spec.ts` -> `5 passed`
  - `tests/smoke/app-smoke.spec.ts` -> `5 passed`
- Живой manual proof по функционалу сохранён в:
  - [manual-functional-check.2026-04-17.json](/C:/fit/output/manual-functional-check.2026-04-17.json)
  - [manual-functional-check.2026-04-17.summary.txt](/C:/fit/output/manual-functional-check.2026-04-17.summary.txt)
- По этому proof подтверждено:
  - `settings billing/data` -> `200/200`
  - `ai chat` -> `200, 200, 200:blocked`
  - `meal plan` -> `200`
  - `workout plan` -> `200`
  - `barcode lookup` -> `200/200`
  - `barcode import` -> `200/200`
  - `foods list` -> `200`
  - `meal photo/photo import` -> `200/200`

## Технические правки в verification harness

- [navigation.ts](/C:/fit/tests/e2e/helpers/navigation.ts) теперь умеет
  самовосстанавливать user/admin сессию, если long-lived suite утыкается в `/`
  или `/auth`.
- [http.ts](/C:/fit/tests/e2e/helpers/http.ts) переведён на обычный `fetch`
  с cookie из browser context, чтобы admin/API проверки не зависели от
  нестабильного Playwright request-path.
- [supabase-admin.ts](/C:/fit/tests/e2e/helpers/supabase-admin.ts) и
  [workouts.ts](/C:/fit/tests/e2e/helpers/workouts.ts) повторяют transient
  `fetch failed / ECONNRESET`, даже если Supabase SDK вернул ошибку в `result.error`,
  а не бросил exception.
- [admin/page.tsx](/C:/fit/src/app/admin/page.tsx) получил более реалистичный
  `ADMIN_DASHBOARD_TIMEOUT_MS = 10000`, чтобы operator dashboard не сваливался в
  degraded snapshot слишком рано под load.

## Оставшиеся внешние блокеры

- live `CloudPayments` env и реальный `checkout -> return reconcile -> webhook -> billing center`;
- production `Sentry` env;
- full-quality live AI provider path без fallback.
