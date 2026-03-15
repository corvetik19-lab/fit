# Допустимые build warnings

Этот документ фиксирует warnings, которые сейчас регулярно появляются в `npm run build`, но не считаются blocker'ом для production deploy.

## Текущий известный warning-хвост

Во время webpack-сборки `Next.js` проект печатает серию одинаковых предупреждений:

- `Critical dependency: the request of a dependency is an expression`

Они приходят не из прикладного кода `fit`, а из инструментального стека observability:

- `@opentelemetry/instrumentation`
- `@fastify/otel`
- `@prisma/instrumentation`
- `@sentry/nextjs`

Типичный import trace ведёт в:

- `src/app/global-error.tsx`
- `src/app/api/admin/observability/sentry-test/route.ts`

## Почему это пока допустимо

- warning возникает после успешной компиляции и не ломает итоговый build;
- route manifest, static generation и server traces собираются корректно;
- `lint`, `typecheck`, `build`, `test:smoke`, `test:e2e:auth`, `test:rls` продолжают проходить;
- источник warning — динамические `require(...)` внутри сторонних instrumentation packages, а не наша бизнес-логика.

Иными словами: это известный webpack-шум от Sentry/OpenTelemetry-интеграций, а не индикатор поломанного приложения.

## Когда warning перестаёт быть допустимым

Нужно считать его blocker'ом, если выполняется хотя бы одно условие:

- warning начинает приходить из `src/`-кода приложения, а не из `node_modules`;
- warning сопровождается фактическим падением `next build`;
- после warning ломается `routes-manifest`, `server traces`, PWA assets или runtime route handlers;
- появляются новые warnings вне уже известного списка `Sentry / OpenTelemetry / Fastify OTel / Prisma instrumentation`.

## Что делать при релизе

Перед production deploy достаточно подтвердить:

1. warning относится только к известному стеку observability;
2. `npm run build` завершается успешно;
3. smoke/e2e/rls baseline остаётся зелёным.

Если warning меняется по форме или начинает затрагивать новый пакет, его нужно отдельно triage'ить и добавить в `docs/AI_WORKLOG.md`.
