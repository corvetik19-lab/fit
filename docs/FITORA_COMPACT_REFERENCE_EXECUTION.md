# Fitora compact reference execution

Активный подплан: повторный редизайн под референсы `C:\Users\User\Desktop\Фит`.

Текущий прогресс подплана: `10 / 10` (`100%`).

## Цель

Довести интерфейс до единого мобильного стиля из `Стиль.png` и соседних экранов: точный бренд `fitora`, светлый воздушный фон, компактные панели, короткие рабочие зоны, нижнее меню без скачков, постоянная AI-кнопка в удобном правом нижнем углу.

## Чеклист

- [x] Сверить текущий UI с референсами и выделить проблемные зоны: приблизительный логотип, растянутые full-page экраны, слишком крупные карточки, тяжёлое меню, неудобный AI trigger.
- [x] Подключить точные PNG-ассеты из `Стиль.png` для wordmark, mark, favicon/PWA icons, login и app shell.
- [x] Уплотнить глобальную дизайн-систему: фон, радиусы, тени, типографика Manrope, размеры кнопок, карточек, чипов и form controls.
- [x] Пересобрать `AppShellFrame`, bottom nav, drawer и AI widget под компактную мобильную механику.
- [x] Упростить `PageWorkspace`: compact summary вместо длинного hero, горизонтальные tabs вместо тяжёлого блока выбора, меньше текста в первом viewport.
- [x] Пройти пользовательские экраны `/`, `/onboarding`, `/dashboard`, `/workouts`, `/workouts/day/[dayId]`, `/nutrition`, `/ai`, `/history`, `/settings`, `/billing/cloudpayments`, `/suspended` и убрать лишнюю вертикальную тяжесть.
- [x] Пройти admin surfaces `/admin`, `/admin/users`, `/admin/users/[id]` и привести их к той же компактной системе без нечитаемых badge/overflow.
- [x] Снять свежие мобильные скриншоты `390x844` и сравнить contact sheet с `C:\Users\User\Desktop\Фит`.
- [x] Прогнать verification: `lint`, `typecheck`, `build`, smoke и релевантные Playwright mobile/e2e проверки.
- [x] Обновить `docs/MASTER_PLAN.md`, `docs/FRONTEND.md`, `docs/AI_WORKLOG.md` и закрыть подплан с финальными процентами.

## Итог

- Точные PNG-ассеты из `Стиль.png` сохранены в `public/fitora-logo-clean.png`, `public/fitora-mark-clean.png`, `public/fitora-brand-clean.png`, `public/fitora-app-icon-clean.png`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`.
- Login, metadata, manifest, app header, shell, bottom nav и AI FAB переведены на точный `fitora` visual layer.
- `PageWorkspace`, dashboard и AI workspace уплотнены: первый viewport стал ближе к референсам, section switcher больше не занимает отдельный большой экранный блок.
- Свежие скриншоты: `output/fitora-compact-viewport-contact-sheet.png`, `output/fitora-compact-full-contact-sheet.png`, отдельные экраны в `output/fitora-compact-screens/`.
- `settings` и admin full-page остаются длинными из-за реальных рабочих секций и операторских controls, но первый viewport и mobile shell приведены к единому компактному стилю; следующий UX-срез для них должен быть не визуальной покраской, а collapsible/accordion-группировкой сценариев.

## Дизайн-контракт

- Основной бренд берётся из `Стиль.png`, а не собирается заново текстом или приблизительным SVG.
- Цвета: `#2563EB`, `#0891FF`, `#06B6D4`, `#2DD4BF`, `#0F172A`, `#64748B`, `#E2E8F0`.
- Шрифт: Manrope для UI, заголовков и controls.
- Мобильный экран должен сначала показывать главное действие/сводку, а длинные сервисные детали уходят ниже или в компактные tabs.
- Нижнее меню не должно прыгать, перекрывать контент или конфликтовать с AI-кнопкой.
