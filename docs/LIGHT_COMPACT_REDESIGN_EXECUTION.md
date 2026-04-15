# Light Compact Mobile Redesign

Этот execution-doc фиксирует новый активный редизайн `fit`: светлый, компактный и mobile-first.
Он заменяет `Dark Utility` как текущее направление развития UI, но не удаляет исторические документы.

Текущий прогресс подплана: `6 / 10` (`60%`).

## Как вести этот подплан

- Переключать чекбоксы только после реальной реализации и проверки.
- После каждого tranche синхронизировать:
  - [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
  - [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
  - [FRONTEND.md](/C:/fit/docs/FRONTEND.md)
  - [design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md)
- В пользовательском статусе всегда показывать два числа:
  - общий `MASTER_PLAN`
  - текущий прогресс этого execution-doc

## Checklist

- [x] Создать новый execution-doc и handoff для light compact mobile redesign.
- [x] Перевести глобальные токены и shared visual contract на светлую компактную систему.
- [x] Пересобрать shell, top bar, drawer, bottom nav и shared `PageWorkspace` под mobile-first utility UX.
- [x] Полностью переделать `/nutrition` и связанные nutrition surfaces так, чтобы экран стал компактным, понятным и удобным на телефоне.
- [x] Переделать `/dashboard` и `/workouts` под тот же light compact rhythm без oversized hero/card layout.
- [ ] Переделать `/workouts/day/[dayId]` и focus-mode под более плотный рабочий mobile layout.
- [ ] Переделать `/ai`, `/history` и `/settings` под единый light compact style.
- [ ] Выровнять `/admin`, `/admin/users`, `/admin/users/[id]` под тот же визуальный контракт без возврата к bulky-карточкам.
- [ ] Закрыть полный mobile regression pass для user/admin screens на `360 / 390 / 430px`.
- [ ] Обновить финальный designer/developer handoff и закрыть этот подплан как новый UI source of truth.
