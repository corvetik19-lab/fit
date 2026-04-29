# Live deploy и auth hardening

Дата старта: 2026-04-30.

Цель: выкатить актуальный мобильный стиль `fitora` в интернет и убрать неоднозначный/небезопасный вход, при котором production мог принимать непроверенный Supabase cookie как пользователя после auth fallback.

## Прогресс

Текущий подплан: `11 / 13` (`85%`).
Общий `MASTER_PLAN` на старте: `245 / 247` (`99%`).

## Чеклист

- [x] Проверить live `https://fit-platform-eta.vercel.app` в чистом мобильном браузере: production показывает старый бренд `fit`, а пустой пароль в чистой сессии не проходит, но placeholder-точки визуально выглядят как заполненный пароль.
- [x] Усилить server auth: непроверенный cookie/session fallback разрешен только при `PLAYWRIGHT_TEST_HOOKS=1`; production принимает только валидированную Supabase-сессию или проверенный bearer-token.
- [x] Исправить форму входа: email нормализуется перед отправкой, пустой email/password останавливается на клиенте, password placeholder больше не выглядит как уже введенный пароль.
- [x] Проверить локальный production-like runtime без test hooks: forged Supabase cookie редиректит с `/dashboard` на `/`, password value пустой, submit disabled без пароля.
- [x] Отправить актуальную сборку через GitHub push: commit `bb85964` попал в `origin/main`, после auto-deploy внешний URL стал отдавать `title=fitora` и новые `fitora` assets.
- [x] Проверить внешний URL через clean mobile browser: password value пустой, placeholder `Введите пароль`, submit disabled без password, forged cookie на `/dashboard` редиректит на `/`.
- [ ] Закрыть canonical Vercel terminal verification через `vercel inspect --wait` или `npm run wait:vercel-deploy -- <deployment>` после восстановления Vercel CLI доступа.

## Developer contract

- Не включать `PLAYWRIGHT_TEST_HOOKS` в production/staging окружении.
- Cookie decoding без проверки Supabase допустим только для локального Playwright fast path.
- Вход без пароля должен быть невозможен на двух уровнях: client form disabled/required и `/api/auth/sign-in` schema `password.min(6)`.
- Если пользователь попадает в приложение без ввода пароля, это должно быть только существующей валидной Supabase-сессией; для проверки использовать clean browser context.

## Verification

- [x] `npm run lint` -> passed, остались прежние 2 warnings в `src/lib/ai/plan-generation.ts`.
- [x] `npm run typecheck` -> passed.
- [x] `npm run build` -> passed, остались прежние Sentry/OpenTelemetry warnings.
- [x] Local proof: `output/live-auth-fix-local-2026-04-30/result.json`.
- [x] Public production proof: `output/live-fitora-production-check-2026-04-30/result.json`.
- [ ] Canonical Vercel proof: заблокирован, потому что текущий Vercel CLI не авторизован для team/project (`Not authorized` / `Could not retrieve Project Settings`).
