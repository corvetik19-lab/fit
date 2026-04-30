# Codex Operating System Rollout

Этот документ фиксирует состояние внутреннего agentic-контура разработки `fit`.
Он нужен, чтобы Codex, другие AI-агенты и разработчики работали по одному
операционному контракту, а ключевые правила не растворялись в истории чатов.

## Цель

- закрепить `AGENTS.md` и вложенные инструкции как реальный instruction-chain;
- сделать onboarding, role routing, verification и difficult-problem loop частью репозитория;
- держать developer-facing handoff в явных документах, а не в неформальных договорённостях;
- проверять этот контур через отдельный gate `verify:codex`.

## Текущее состояние rollout

### Волна 1. Документационный старт

- [x] Создан execution-doc [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md).
- [x] Созданы handoff-доки [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
- [x] Root-docs `README.md`, [docs/README.md](/C:/fit/docs/README.md), [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) синхронизированы с этим контуром.

### Волна 2. Instruction chain

- [x] Добавлены вложенные `AGENTS.md` для `src/app`, `src/lib/ai`, `supabase`, `ai-evals` и `android`.
- [x] Root [AGENTS.md](/C:/fit/AGENTS.md) переведён в evaluator-first режим и указывает на playbook/onboarding как на канонические источники процесса.
- [x] Конфигурация [.codex/config.toml](/C:/fit/.codex/config.toml) расширена под новые роли и больший instruction budget.

### Волна 3. Agent roles и skills

- [x] Добавлены роли `onboarding_mapper` и `eval_loop_driver`.
- [x] Существующие роли `explorer`, `docs_researcher`, `platform_verifier` привязаны к реальному workflow `fit`.
- [x] Добавлены repo-specific skills `fit-web-onboarding`, `fit-ai-eval-ops`, `fit-release-verification`.

### Волна 4. Workflow и onboarding

- [x] В playbook зафиксированы локальные аналоги официальных Codex workflows: onboarding, bugfix loop, docs work, review и difficult problems.
- [x] В onboarding-доке зафиксирован обязательный формат результата при входе в новый срез репозитория.
- [x] Для сложных задач формализован evaluator loop: `goal -> baseline -> evaluator -> artifacts -> stop condition -> escalation rule`.

### Волна 5. Verification и adoption

- [x] Добавлен [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) и npm-команда `npm run verify:codex`.
- [x] `verify:codex` включён в CI как обязательный developer-facing gate.
- [x] В документации закреплено, какие developer docs нужно обновлять после значимых tranche этого контура.

## Adoption follow-up на 2026-04-14

- [x] Difficult AI/runtime tranche по `OpenRouter`, text-only retrieval fallback и `CloudPayments` mock был проведён уже по новому evaluator-loop, а его результат зафиксирован одновременно в [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md), [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md) и [docs/AI_STACK.md](/C:/fit/docs/AI_STACK.md).
- [x] Provider degradation теперь документируется как отдельный operational outcome: live embeddings blocker не маскируется под зелёный runtime, а фиксируется как внешний blocker с сохранением degrade-safe режима для продукта.
- [x] Для следующих сложных tranche разработчик обязан обновлять не только `MASTER_PLAN`, но и профильный contract-док: например, AI/runtime изменения должны отражаться в [docs/AI_STACK.md](/C:/fit/docs/AI_STACK.md), а agent/process изменения — в этом rollout-доке.

## Как использовать дальше

1. Начинать работу с [AGENTS.md](/C:/fit/AGENTS.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md).
2. Для review и workflow-hardening дополнительно читать [code_review.md](/C:/fit/code_review.md) и [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md).
3. Для orchestration/governance/self-evolving слоя дополнительно читать [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md), [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) и [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md).
4. Для повседневного operational flow использовать [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md).
5. Для сложных AI/UI/backend/release задач не пропускать evaluator loop и явно фиксировать baseline, артефакты и stop condition.
6. После каждого существенного tranche обновлять:
   - [CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
   - [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
   - [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
   - профильные developer docs по затронутому домену

## Подтверждение контура

- `npm run verify:codex`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 2026-04-14 config guardrails addendum

- В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлен schema-hint `#:schema https://developers.openai.com/codex/config-schema.json`, чтобы редактор сразу подсвечивал невалидные ключи и неверные типы в Codex-конфиге.
- [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) усилен структурной проверкой `.codex/config.toml`: guard теперь валит проверку, если `project_doc_max_bytes` попадает внутрь `[features]`, если top-level budget отсутствует или если в `[features]` появляются не-boolean значения.
- Этот follow-up специально закрывает уже пойманный drift по Codex-конфигу, чтобы ошибка `invalid type: integer 65536, expected a boolean` не возвращалась незаметно при следующих правках.

## 2026-04-14 agent hardening addendum

- В [AGENTS.md](/C:/fit/AGENTS.md) добавлены `Review guidelines` и `Prompt contract`, а детальный reviewer contract вынесен в новый [code_review.md](/C:/fit/code_review.md), чтобы локальный `/review` и GitHub review читали один и тот же набор правил.
- В [`.codex/config.toml`](/C:/fit/.codex/config.toml) добавлены `review_model = "gpt-5.2-codex"` и новые роли `pr_reviewer`, `security_reviewer`, `prompt_contract_editor`, `workflow_maintainer`, чтобы reviewer/process работа не смешивалась с обычным implementation flow.
- В `.agents/skills/` добавлены self-contained навыки `fit-pr-review`, `fit-security-review`, `fit-prompt-contracts`, `fit-github-review-ops`, а repo-local reference-файлы закрепляют security checklist и prompt-contract patterns внутри репозитория.
- GitHub-facing контур усилен через [PULL_REQUEST_TEMPLATE.md](/C:/fit/.github/PULL_REQUEST_TEMPLATE.md), обновлённый [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md), [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md) и execution-doc [CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md) с чекбоксами прогресса.
- [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) теперь проверяет не только базовый Codex rollout, но и новый review/security/prompt-contract слой: обязательные docs, `code_review.md`, PR template, agent configs и repo-local skills.

## 2026-04-14 agent autonomy and governance addendum

- В репозитории добавлены execution-doc [CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md), governance-doc [CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) и generated registry [CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md), чтобы orchestration, self-evolving loop и direct-to-main policy были зафиксированы так же явно, как rollout и review-contract слой.
- [`.codex/config.toml`](/C:/fit/.codex/config.toml) теперь включает роли `orchestrator`, `autonomy_guardian` и `evolution_driver`, а `.agents/skills/` дополнен навыками `fit-agent-orchestration`, `fit-agent-governance`, `fit-agent-evolution`.
- Добавлены scripts [agent-governance-config.mjs](/C:/fit/scripts/agent-governance-config.mjs), [agent-inventory.mjs](/C:/fit/scripts/agent-inventory.mjs), [sync-codex-agent-registry.mjs](/C:/fit/scripts/sync-codex-agent-registry.mjs), [verify-agent-governance.mjs](/C:/fit/scripts/verify-agent-governance.mjs), [agent-evolve.mjs](/C:/fit/scripts/agent-evolve.mjs) и npm-команды `agent:*` плюс `verify:agent-governance`.
- [quality.yml](/C:/fit/.github/workflows/quality.yml) теперь прогоняет `verify:agent-governance`, а новый workflow [agent-autonomy.yml](/C:/fit/.github/workflows/agent-autonomy.yml) даёт scheduled/manual governance sweep и optional direct-to-main lane при включённом `CODEX_AGENT_AUTONOMY_ENABLED=1`.
- Этот tranche подтверждается пакетами `npm run agent:sync-registry`, `npm run agent:evaluate`, `npm run verify:codex`, `npm run verify:agent-governance`, `npm run lint`, `npm run typecheck`, `npm run build`.

## 2026-04-14 deploy-wait and plan-progress follow-up

- Root [AGENTS.md](/C:/fit/AGENTS.md) и [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) усилены правилом: deploy-oriented tranche не считаются завершёнными, пока Vercel deployment не дошёл до terminal state без ошибок через Vercel MCP или CLI fallback.
- В репозиторий добавлены команды [master-plan-progress.mjs](/C:/fit/scripts/master-plan-progress.mjs) и [wait-for-vercel-deployment.mjs](/C:/fit/scripts/wait-for-vercel-deployment.mjs), а `README` и docs теперь закрепляют `npm run report:master-progress` и `npm run wait:vercel-deploy -- <deployment-url-or-id>` как стандартные operational entrypoints.
- Release docs [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md) и [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md) синхронизированы с новым deploy-wait contract.

## 2026-04-16 CLI-only verification addendum

- Root [AGENTS.md](/C:/fit/AGENTS.md), [CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) и [CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md) уточнены: для `fit` browser verification идёт только через Playwright CLI, а deploy/runtime verification — только через Vercel CLI и repo wrapper `npm run wait:vercel-deploy -- <deployment-url-or-id>`.
- Для этого follow-up [verify-codex.mjs](/C:/fit/scripts/verify-codex.mjs) получил guard против возврата к `Vercel MCP` / `Playwright MCP` в канонических agent docs.

## 2026-04-28 AI Agent redesign addendum

- Сложный AI/UI tranche проведён через evaluator-loop и зафиксирован в [FITORA_AI_AGENT_REDESIGN_EXECUTION.md](/C:/fit/docs/FITORA_AI_AGENT_REDESIGN_EXECUTION.md): baseline был mini-chat widget + полноценный `/ai`, stop condition - widget launcher + intent-prefill в основном `AiChatPanel`.
- Для будущих AI surface изменений обязательный минимум остается тем же: typed intent/API contract, `AI_STACK.md`, `MASTER_PLAN.md`, `AI_WORKLOG.md`, targeted Playwright и честная фиксация provider/fallback blockers.
- Проверочный пакет этого tranche: `lint`, `typecheck`, `build`, `test:smoke`, targeted `ai-workspace`.

## 2026-04-30 AI Assistant streaming addendum

- Streaming-регрессия `/api/ai/assistant` проведена через отдельный evaluator-loop и зафиксирована в [AI_ASSISTANT_STREAMING_FIX_EXECUTION.md](/C:/fit/docs/AI_ASSISTANT_STREAMING_FIX_EXECUTION.md): baseline был `generateText` + один статический `text-delta`, stop condition - настоящий `streamText` SSE с несколькими chunk во времени.
- Для user-facing AI runtime запрещено маскировать non-streaming путь под UIMessage stream: если ответ показывается пользователю в `/ai`, route должен отдавать настоящий поток или явно фиксировать provider/deploy blocker.
- Canonical Vercel terminal verification по этому tranche остаётся внешним blocker до восстановления Vercel CLI auth/token; публичный live proof и CLI terminal state учитываются отдельно.
