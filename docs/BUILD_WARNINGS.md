# Допустимые build warnings

Этот документ фиксирует warnings, которые сейчас регулярно появляются в `npm run build`, но не считаются блокером для production deploy.

## Текущий известный warning-хвост

Во время webpack-сборки `Next.js` проект печатает серию одинаковых предупреждений:

- `Critical dependency: the request of a dependency is an expression`

Они приходят не из прикладного кода `fit`, а из инструментального observability-стека:

- `@opentelemetry/instrumentation`
- `@fastify/otel`
- `@prisma/instrumentation`
- `@sentry/nextjs`

Типичный import trace ведёт в:

- [global-error.tsx](/C:/fit/src/app/global-error.tsx)
- [route.ts](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts)

## Почему это пока допустимо

- warning появляется после успешной компиляции и не ломает итоговый build;
- route manifest, static generation и server traces собираются корректно;
- `lint`, `typecheck`, `build`, `test:smoke`, `test:e2e:auth`, `test:rls` продолжают проходить;
- источник warning — динамические `require(...)` внутри сторонних instrumentation packages, а не бизнес-логика проекта.

Иными словами, это известный webpack-шум от Sentry/OpenTelemetry-интеграций, а не индикатор сломанного приложения.

## Когда warning перестаёт быть допустимым

Его нужно считать блокером, если выполняется хотя бы одно условие:

- warning начинает приходить из `src/`-кода приложения, а не из `node_modules`;
- warning сопровождается фактическим падением `next build`;
- после warning ломается `routes-manifest`, `server traces`, PWA assets или runtime route handlers;
- появляются новые warnings вне уже известного списка `Sentry / OpenTelemetry / Fastify OTel / Prisma instrumentation`.

## Что делать перед релизом

Перед production deploy достаточно подтвердить:

1. warning относится только к известному observability-стеку;
2. `npm run build` завершается успешно;
3. smoke/e2e/rls baseline остаётся зелёным;
4. `npm run verify:sentry-runtime` либо проходит, либо явно пишет blocker по env или credentials.

Если warning меняется по форме или начинает затрагивать новый пакет, его нужно отдельно triage'ить и добавлять в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
