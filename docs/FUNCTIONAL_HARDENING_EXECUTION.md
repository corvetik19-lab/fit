# Functional Hardening Execution

Этот execution-doc фиксирует отдельный active tranche по доводке живого runtime и полной пользовательской проверке `fit`.

Цели tranche:
- убрать остаточные flaky-сбои в auth/admin bootstrap для Playwright;
- сделать admin degraded fallback детерминированным;
- подтвердить, что ключевые пользовательские вкладки, AI, питание, штрихкоды, фото и планы проходят полный рабочий цикл;
- сохранить единый мобильный UX без регрессий в shell и основных экранах.

## Чеклист

- [x] Собрать карту остаточных functional/runtime-сбоев по admin bootstrap, forced degraded fallback и ключевым пользовательским сценариям.
- [x] Убрать зависимость Playwright bootstrap от `auth.admin.listUsers` для известных тестовых аккаунтов.
- [x] Сделать forced degraded fallback на `/admin` детерминированным для runtime и regression-suite.
- [x] Прогнать живой пакет по вкладкам, AI-чату, AI-планам, штрихкоду, импортам и настройкам на свежем локальном runtime.
- [x] Синхронизировать `docs/MASTER_PLAN.md`, `docs/AI_WORKLOG.md` и артефакты проверки после закрытия tranche.

## Артефакты

- `output/runtime-3139.log`
- `output/runtime-3139.err.log`
- `output/manual-functional-check-3139.json`
- `output/manual-functional-check-3139.summary.txt`

## Критерии приёмки

- `admin-app.spec.ts` больше не упирается в `findAuthUserIdByEmail(...)` через `auth.admin.listUsers` для стандартных Playwright аккаунтов.
- `?__test_admin_dashboard_fallback=1` стабильно показывает degraded banner и навигационные ссылки.
- Живые API-проверки подтверждают `200` для AI-чата, meal/workout plan generation, barcode lookup/import и nutrition photo import.
- `settings`, `dashboard`, `workouts`, `nutrition`, `ai`, `admin` и связанные e2e-пакеты проходят без новых regressions.
