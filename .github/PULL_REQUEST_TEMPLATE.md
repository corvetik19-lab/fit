## Что меняется

- Кратко опишите пользовательский или developer-facing результат.

## Рискованные зоны

- [ ] `src/app` / UI / App Router
- [ ] `src/lib/ai` / prompts / retrieval / evals
- [ ] `supabase/migrations` / RLS / advisors
- [ ] `admin` / privileged actions / audit
- [ ] billing / env / provider runtime
- [ ] docs / AGENTS / `.codex` / skills / workflows

## Проверки

- [ ] `npm run verify:codex`
- [ ] `npm run verify:agent-governance` для agent-layer / docs / skills / workflows
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Профильные `verify:*` или `test:*` перечислены в описании PR

## Codex review

- [ ] Нужен обычный `@codex review`
- [ ] Нужен `@codex review for security regressions`
- [ ] Нужен `@codex review for AI/runtime regressions`
- [ ] Нужен `@codex review for docs and process drift`

## Artifacts и handoff

- [ ] Обновлены `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md`, если tranche существенный
- [ ] Обновлены профильные developer docs, если изменился рабочий контракт
- [ ] Для сложной задачи зафиксированы `goal`, `baseline`, `evaluator`, `artifacts`, `stop condition`
