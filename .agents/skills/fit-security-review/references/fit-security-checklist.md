# fit Security Checklist

## Web и App Router

- Проверить auth redirects, route guards и отсутствие client-side-only privilege checks.
- Проверить, что sensitive data не сериализуется в клиент без необходимости.
- Проверить, что form/action flows не обходят owner-only ограничения.

## Supabase и RLS

- Проверить, что доступ остаётся owner-scoped по `user_id`.
- Проверить, что service-role используется только на сервере и сопровождается audit trail.
- Проверить, что DDL не выключает RLS, не ослабляет policy и не пропускает advisor verification.

## Admin и privileged actions

- Проверить, что admin actions логируются и не доступны обычному пользователю.
- Проверить, что UI не скрывает опасную server-side дыру только за display condition.

## Billing, webhooks и env

- Проверить, что webhook trust не строится на пользовательском вводе.
- Проверить, что checkout/reconcile/access-review не дают ложный успех и не раскрывают чужие данные.
- Проверить, что secrets, provider keys и internal URLs не уходят в клиент, логи или docs.

## AI и runtime safety

- Проверить, что proposal-first contract сохранён и AI не делает silent apply.
- Проверить, что retrieval остаётся owner-scoped и не смешивает данные разных пользователей.
- Проверить, что provider fallback не выдаёт unsafe success и не отключает guardrails молча.
