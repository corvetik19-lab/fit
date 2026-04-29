# Codex Agent Hardening Plan

Этот execution-doc усиливает уже внедрённый Codex operating system в `fit`.
Цель tranche: закрепить review-contract, self-contained repo skills,
GitHub-поверхность для advisory review и prompt-contract правила так, чтобы
локальный Codex и будущий GitHub review contour работали по одному набору
документов и проверок.

## Целевое состояние

- `AGENTS.md` и ближайшие доменные `AGENTS.md` содержат явные review-guidelines.
- Детальный review-contract живёт в [code_review.md](/C:/fit/code_review.md) и
  используется как для локального `/review`, так и для GitHub PR review.
- Критичные review/security/prompt workflows упакованы в repo-local skills, а не
  зависят только от глобальных установок пользователя.
- В `.codex/config.toml` есть отдельные reviewer/maintainer роли для этого
  контура.
- Developer docs объясняют, как запускать auto/manual review, как писать
  prompt-contract и как поддерживать этот контур дальше.
- `verify:codex` проверяет новый слой так же жёстко, как уже проверяет playbook,
  onboarding и базовые skills.

## Checklist

### Волна 1. План и execution-doc

- [x] Создан [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md)
  как отдельный план усиления агента с чекбоксами прогресса.
- [x] Новый tranche связан с текущими handoff-доками и будет отражаться в
  [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md),
  [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

### Волна 2. Review contract

- [x] Root [AGENTS.md](/C:/fit/AGENTS.md) расширен секциями `Review guidelines`
  и `Prompt contract`, чтобы локальный и GitHub review читали одинаковые
  правила.
- [x] Создан [code_review.md](/C:/fit/code_review.md) с reportable-правилами,
  P0/P1/P2-критериями и доменными акцентами для `fit`.
- [x] Ближайшие доменные `AGENTS.md` усилены review-фокусом для `src/app`,
  `src/lib/ai` и `supabase`.
- [x] GitHub-facing шаблон [PULL_REQUEST_TEMPLATE.md](/C:/fit/.github/PULL_REQUEST_TEMPLATE.md)
  добавляет явные точки входа для `@codex review` и security-focused review.

### Волна 3. Роли и skills

- [x] В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлены роли
  `pr_reviewer`, `security_reviewer`, `prompt_contract_editor` и
  `workflow_maintainer`, а review-поведение закреплено через `review_model`.
- [x] Добавлены repo-local skills `fit-pr-review`, `fit-security-review`,
  `fit-prompt-contracts`, `fit-github-review-ops`.
- [x] `fit-security-review` и `fit-prompt-contracts` получили локальные
  reference-файлы, чтобы ключевые правила жили в репозитории, а не только в
  глобальных навыках.

### Волна 4. Developer docs и verification

- [x] Обновлены [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и
  [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md) под новый review и
  prompt-contract слой.
- [x] Обновлены [README.md](/C:/fit/README.md) и [docs/README.md](/C:/fit/docs/README.md),
  чтобы следующий разработчик сразу видел новый контур.
- [x] [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) расширен проверкой
  нового review/security/prompt-contract слоя.
- [x] Текущий tranche подтверждён `npm run verify:codex`, `npm run lint`,
  `npm run typecheck`, `npm run build`.

### Волна 5. GitHub adoption follow-up

- [x] Repo-side подготовка для GitHub review завершена: правила, PR template,
  локальные skills и docs готовы к automatic review и manual `@codex review`.
- [ ] GitHub-side включение внешнего Codex Cloud review остаётся отдельным
  операционным шагом вне кода репозитория, если команда захочет активировать
  именно облачную интеграцию OpenAI вместо одного только repo-local contour.

## 2026-04-14 follow-up

- [x] Следующий tranche по orchestration/governance/self-evolving слою вынесен в
  [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md), чтобы review-contract
  и autonomous mainline lane развивались раздельно и не смешивали GitHub review с automation policy.

## 2026-04-16 CLI-only verification follow-up

- [x] Root [AGENTS.md](/C:/fit/AGENTS.md) закреплён в CLI-only режиме для browser/deploy verification: browser-проверки теперь обязаны идти через `playwright-cli`, а rollout verification — через `vercel inspect --wait` или repo wrapper `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- [x] [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md) синхронизированы с тем же контрактом, чтобы agent layer не возвращался к Vercel/Playwright MCP в канонических workflow.
- [x] [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) теперь валит проверку, если в `AGENTS.md`, `CODEX_PLAYBOOK.md` или `CODEX_ONBOARDING.md` пропали `playwright-cli` / `vercel inspect` или вернулись legacy-ссылки на `Vercel MCP` / `Playwright MCP`.
