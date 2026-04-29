# UI Consistency + Mobile Cohesion Execution

Этот execution-doc фиксирует отдельный активный tranche по визуальной санации `fit`:
- выровнять интерфейс в один понятный стиль;
- убрать видимый mojibake из user-facing shell и ключевых экранов;
- сделать mobile-подачу компактной и предсказуемой, без лишних hero-блоков и oversized CTA;
- подтвердить, что вход и основные user surfaces выглядят корректно на телефоне.

## Чеклист

- [x] Собрать карту проблем по `/`, `AppShell`, `PageWorkspace` и ключевым mobile-экранам через код и реальные скриншоты.
- [x] Упростить входной экран и форму авторизации, убрать ощущение “экрана без стилей”.
- [x] Привести общий shell, drawer и bottom navigation к чистому русскому copy и более компактной mobile-композиции.
- [x] Уплотнить `PageWorkspace`, чтобы обзор, меню и секции не создавали лишнюю вертикальную тяжесть.
- [x] Пересобрать `/nutrition` как более компактный рабочий экран без дублирующих крупных вводных блоков.
- [x] Почистить видимый mojibake и inconsistent copy на основных user entrypoints: `/dashboard`, `/workouts`, `/ai`, `/settings`.
- [x] Подтвердить mobile-view на ширинах `360 / 390 / 430` через реальные скриншоты и таргетированные проверки.
- [x] Синхронизировать `docs/MASTER_PLAN.md`, `docs/AI_WORKLOG.md` и смежные developer-facing docs после каждого существенного slice.

## Артефакты

- Базовые mobile-скриншоты до правок:
  - `output/ui-consistency-login-before.png`
  - `output/ui-consistency-nutrition-before.png`
- Финальные mobile-скриншоты после shell/hydration fix:
  - `output/screens-login-mobile.png`
  - `output/screens-dashboard-mobile.png`
  - `output/screens-nutrition-mobile.png`
  - `output/screens-workouts-mobile.png`
  - `output/screens-settings-mobile.png`
- Runtime-артефакты финальной проверки:
  - `output/manual-functional-check-3138.json`
  - `output/full-functional-runtime-3138.log`
  - `output/full-functional-runtime-3138.err.log`
  - `output/dev-hydration.log`
  - `output/dev-hydration.err.log`

## Критерии приёмки

- На входе и в shell нет битого русского текста.
- На мобильном верхняя часть экрана не тратит лишнюю высоту на второстепенные вводные блоки.
- CTA и карточки имеют рабочий размер для телефона, а не лендинговую подачу.
- Пользовательские экраны читаются как части одного приложения, а не как набор разрозненных стилей.
