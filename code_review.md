# fit Code Review Contract

Этот документ задаёт единые правила review для локального Codex `/review`,
GitHub PR review и ручных комментариев вроде `@codex review`.

## Базовый фокус review

- Ищи реальные регрессии поведения, а не косметические пожелания.
- Поднимай missing tests и missing verification, если diff затрагивает
  рискованный runtime или developer-facing contract.
- Смотри на ownership, user isolation, RLS, auditability и provider/env safety
  как на неотменяемые правила `fit`.
- Если проблема не подтверждается из diff и ближайшего контекста, не выдумывай
  finding.

## Что считается reportable

### P0

- Утечка данных между пользователями.
- Отключение или обход RLS / auth / admin gates.
- Коммит или логирование secrets, service-role ключей или чувствительных токенов.
- Неконтролируемое privileged действие без audit trail.

### P1

- Поломка основного пользовательского сценария `Dashboard / Workouts / Nutrition / AI / Settings`.
- Регрессия billing, admin или AI runtime, из-за которой пользователь получает
  ложный успех, silent failure или несанкционированное действие.
- Изменение proposal-first AI contract в сторону silent apply.
- Рискованная миграция без явной проверки advisors, RLS или rollback-пути.

### P2

- Missing tests или missing verification на явно рискованном diff.
- Drift между `AGENTS.md`, `.codex`, skills и developer docs.
- Документационная ошибка, которая ломает handoff, quality gate или процесс
  релиза.

## Доменные акценты

### App Router и frontend

- Проверяй auth redirects, hydration/state drift, hidden client-only side effects
  и поломки mobile-first UX.
- Если diff затрагивает `src/app` или `src/components`, смотри на route
  ownership, server/client boundary и сохранность existing smoke/e2e paths.

### AI и retrieval

- Проверяй proposal-first flow, owner-scoped retrieval, provider degradation,
  prompt/policy drift и корректность fallback-поведения.
- Для AI diff считаются важными также missing evals, отсутствие baseline и
  разрыв между runtime и `ai-evals`.

### Supabase, migrations и RLS

- Проверяй owner-only policies, service-role containment, migration discipline и
  post-DDL advisors.
- Любой diff, который может открыть доступ шире `user_id`, должен считаться как
  минимум P1.

### Billing, admin и runtime env

- Проверяй, что privileged flows остаются server-only, audit-логируемыми и не
  скрывают ошибки оплаты, webhook reconcile или access review.
- Secrets, webhook keys, provider tokens и env drift всегда reportable.

## Как оформлять findings

- Сначала перечисляй findings по убыванию риска.
- Для каждого finding указывай файл, краткий impact и почему проблема реально
  следует из diff.
- Не превращай review в общий changelog.
- Если findings нет, можно явно написать, что критичных проблем не найдено, и
  назвать оставшиеся verification gaps.

## GitHub-режим

- Автоматический review в `fit` трактуется как advisory-first и не блокирует
  merge сам по себе.
- Ручной фокус задаётся комментариями:
  - `@codex review`
  - `@codex review for security regressions`
  - `@codex review for docs and process drift`
  - `@codex review for AI/runtime regressions`
- Если для конкретного среза нужен более строгий фильтр, используй ближайший
  `AGENTS.md` и его локальные правила review.
