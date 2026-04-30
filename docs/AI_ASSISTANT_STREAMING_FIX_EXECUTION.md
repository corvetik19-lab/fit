# AI Assistant Streaming Fix Execution

Дата старта: 2026-04-30.

Цель: убрать ответ AI-агента одним готовым блоком на `/ai`, вернуть настоящий
SSE/UIMessage streaming в обычной ветке `/api/ai/assistant` и зафиксировать
причину, почему главная страница может сразу открывать dashboard без формы
входа.

Текущий прогресс подплана: `4 / 6` (`67%`).

## Чеклист

- [x] Baseline: внешний `/ai` проверен через Playwright с реальной Supabase-сессией, первый viewport показывает нормальный русский текст без видимых `????`; артефакты: [01-ai-live.png](/C:/fit/output/live-ai-check-2026-04-30/01-ai-live.png), [result.json](/C:/fit/output/live-ai-check-2026-04-30/result.json).
- [x] Причина ответа одним блоком найдена: обычная ветка `/api/ai/assistant` использовала `generateText`, дожидалась полного ответа и отправляла один `text-delta` через статический UIMessage stream.
- [x] Runtime исправлен: обычная ветка `/api/ai/assistant` теперь сразу возвращает `streamText(...).toUIMessageStreamResponse(...)`, а plan/tool ветка сохраняет существующий streaming/tool contract.
- [x] Хранилище AI-чата усилено: session title и message content проходят через `repairMojibakeText` при записи и чтении, чтобы старые mojibake-строки не возвращались в UI и model context.
- [ ] Public production proof после GitHub auto-deploy: live `/api/ai/assistant` должен вернуть `text/event-stream` с несколькими chunk/delta во времени, а не один финальный блок.
- [ ] Canonical Vercel terminal verification: повторить `vercel inspect --wait` или `npm run wait:vercel-deploy -- <deployment>` после восстановления Vercel CLI auth/token.

## Evaluator Loop

- Goal: пользователь видит ответ AI-коуча как поток в реальном времени, а не
  как один готовый блок после ожидания.
- Baseline: live UI открывается, но generic assistant route на обычные вопросы
  собирал полный ответ через `generateText` и только потом отдавал один
  `text-delta`.
- Evaluator: локальный production-like SSE probe на `/api/ai/assistant` должен
  подтвердить `content-type: text/event-stream` и несколько chunk во времени.
- Artifacts: [stream-result.json](/C:/fit/output/ai-streaming-local-2026-04-30/stream-result.json).
- Stop condition: `lint`, `typecheck`, `build` зелёные; локальный SSE probe
  показывает несколько chunk; после push отдельный live SSE probe подтверждает
  то же на `https://fit-platform-eta.vercel.app`.
- Escalation rule: если Vercel CLI остаётся неавторизованным, публичный live
  proof фиксируется отдельно, но canonical rollout verification остаётся
  внешним blocker.

## Контракт Входа

Главная страница [page.tsx](/C:/fit/src/app/page.tsx) intentionally делает
`redirect('/dashboard')`, если `getViewer()` находит валидную Supabase-сессию.
Это не вход без пароля: это сохранённая сессия браузера. Форму входа пользователь
увидит в чистом браузере/incognito или после выхода из аккаунта.
