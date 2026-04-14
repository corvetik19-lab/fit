# Codex Agent Registry

Этот документ синхронизируется командой `npm run agent:sync-registry`.
Он фиксирует текущий control plane agent layer внутри `fit`: роли, repo-local skills,
governance, workflows и developer-facing команды.

## Role Control Plane

| Роль | Назначение | Config | Режим |
| --- | --- | --- | --- |
| `explorer` | Read-only web platform explorer for Next.js routes, data ownership, offline sync, admin surfaces, and AI seams. | [agents/explorer.toml](/C:/fit/agents/explorer.toml) | `medium` / `read-only` |
| `onboarding_mapper` | Read-only onboarding mapper for unfamiliar slices of fit that must return module maps, request/data flow, risky spots, and next-file recommendations. | [agents/onboarding-mapper.toml](/C:/fit/agents/onboarding-mapper.toml) | `medium` / `read-only` |
| `worker` | Implementation-focused web agent for Next.js, route handlers, Supabase integration, and TypeScript changes after the target path is understood. | [agents/worker.toml](/C:/fit/agents/worker.toml) | `high` / `workspace-write` |
| `docs_researcher` | Read-only documentation agent for Next.js, Vercel, Supabase, AI SDK, PWA, Codex, and MCP questions. | [agents/docs-researcher.toml](/C:/fit/agents/docs-researcher.toml) | `medium` / `read-only` |
| `platform_verifier` | Verification agent for npm lint/typecheck/build, Supabase migrations, preview readiness, and external platform blockers. | [agents/platform-verifier.toml](/C:/fit/agents/platform-verifier.toml) | `medium` / `workspace-write` |
| `browser_debugger` | Browser-flow debugger for auth, admin panels, docs reproduction, desktop/mobile web regressions, and evidence capture. | [agents/browser-debugger.toml](/C:/fit/agents/browser-debugger.toml) | `high` / `workspace-write` |
| `eval_loop_driver` | Iterative evaluator-first agent for difficult problems that need baseline measurement, artifacts, repeated checks, and explicit stop conditions. | [agents/eval-loop-driver.toml](/C:/fit/agents/eval-loop-driver.toml) | `high` / `workspace-write` |
| `orchestrator` | Workflow orchestrator for fit developer tasks that must route work through explicit discover, execute, verify, and documentation stages. | [agents/orchestrator.toml](/C:/fit/agents/orchestrator.toml) | `high` / `workspace-write` |
| `autonomy_guardian` | Governance guard for self-evolving fit agent runs that must enforce allowlists, budgets, kill switches, and required verification. | [agents/autonomy-guardian.toml](/C:/fit/agents/autonomy-guardian.toml) | `medium` / `workspace-write` |
| `evolution_driver` | Self-evolving agent maintainer for fit that performs narrow registry, governance, and workflow improvements inside the agent layer. | [agents/evolution-driver.toml](/C:/fit/agents/evolution-driver.toml) | `high` / `workspace-write` |
| `pr_reviewer` | Read-only reviewer for local and PR-style fit diffs that must return prioritized findings about regressions, missing tests, rollout risk, and workflow drift. | [agents/pr-reviewer.toml](/C:/fit/agents/pr-reviewer.toml) | `medium` / `read-only` |
| `security_reviewer` | Read-only security reviewer for fit changes that may affect auth, RLS, admin privilege boundaries, secrets, billing, webhooks, or AI/runtime safety. | [agents/security-reviewer.toml](/C:/fit/agents/security-reviewer.toml) | `high` / `read-only` |
| `prompt_contract_editor` | Workflow-maintenance agent for AGENTS, review contracts, skills, and prompt-guidance hardening inside the fit repository. | [agents/prompt-contract-editor.toml](/C:/fit/agents/prompt-contract-editor.toml) | `medium` / `workspace-write` |
| `workflow_maintainer` | Developer-process maintainer for PR templates, GitHub review workflow docs, Codex playbooks, and verify:codex synchronization. | [agents/workflow-maintainer.toml](/C:/fit/agents/workflow-maintainer.toml) | `medium` / `workspace-write` |

## Repo Skills

| Skill | Назначение | Файл |
| --- | --- | --- |
| `fit-agent-evolution` | Use when Codex must run or improve the self-evolving loop for the fit developer agent. Trigger for inventory-driven hardening, registry synchronization, autonomous dry-runs, and direct-to-main governance lane work. Do not use for product AI runtime changes or user-facing feature work. | [.agents/skills/fit-agent-evolution/SKILL.md](/C:/fit/.agents/skills/fit-agent-evolution/SKILL.md) |
| `fit-agent-governance` | Use when Codex must enforce or update the governance rules for the fit self-evolving developer agent. Trigger for allowlists, kill switches, diff budgets, verification requirements, autonomous write policy, and audit-trail maintenance. Do not use for ordinary product implementation. | [.agents/skills/fit-agent-governance/SKILL.md](/C:/fit/.agents/skills/fit-agent-governance/SKILL.md) |
| `fit-agent-orchestration` | Use when Codex must route a fit developer workflow through explicit discover -> route -> execute -> verify -> document orchestration instead of improvising. Trigger for multi-step agent-layer changes, cross-doc/process sync, and cookbook-style workflow assembly. Do not use for isolated product code edits whose target path is already obvious. | [.agents/skills/fit-agent-orchestration/SKILL.md](/C:/fit/.agents/skills/fit-agent-orchestration/SKILL.md) |
| `fit-ai-eval-ops` | Use when Codex changes prompts, retrieval, guardrails, AI admin flows, eval thresholds, or other AI behavior in the fit repository and needs an explicit evaluator/artifact loop. Trigger for difficult AI problems, release gates, provider blocker analysis, and ai-evals maintenance. Do not use for generic UI-only work or simple docs updates with no AI behavior change. | [.agents/skills/fit-ai-eval-ops/SKILL.md](/C:/fit/.agents/skills/fit-ai-eval-ops/SKILL.md) |
| `fit-android-foundation` | Bootstrap or evolve the Android project foundation for the fit app. Use when Codex needs repo-specific guidance for Kotlin, Jetpack Compose, Gradle modules, package layout, navigation seams, DI boundaries, data/domain/ui layering, or greenfield Android architecture decisions. Do not use for browser-only investigation, OpenAI docs lookup, or generic non-Android tasks. | [.agents/skills/fit-android-foundation/SKILL.md](/C:/fit/.agents/skills/fit-android-foundation/SKILL.md) |
| `fit-android-verification` | Verify Android changes for the fit app without editing source code. Use when Codex needs repo-specific guidance for Gradle commands, lint, unit tests, instrumentation tests, emulator checks, adb inspection, build blockers, or acceptance verification after a Kotlin/Compose change. Do not use for implementation, browser-only debugging, or docs-only research. | [.agents/skills/fit-android-verification/SKILL.md](/C:/fit/.agents/skills/fit-android-verification/SKILL.md) |
| `fit-compose-feature` | Design or implement a Jetpack Compose feature for the fit app. Use when the task is about Android screens, routes, UI state, state holders, event handling, previews, form flows, lists, workout detail views, session tracking UI, or Compose-specific architecture. Do not use for verification-only work, browser debugging, or documentation research by itself. | [.agents/skills/fit-compose-feature/SKILL.md](/C:/fit/.agents/skills/fit-compose-feature/SKILL.md) |
| `fit-docs-research` | Research current documentation before coding in the fit app. Use when Codex must verify AndroidX, Kotlin, Gradle, Firebase, Retrofit, Coil, Room, Hilt, or Codex/OpenAI/MCP APIs and should not rely on memory. Use for version-sensitive Android implementation questions and official Codex/OpenAI guidance. Do not use for pure implementation once the APIs are already known. | [.agents/skills/fit-docs-research/SKILL.md](/C:/fit/.agents/skills/fit-docs-research/SKILL.md) |
| `fit-github-review-ops` | Use when Codex must maintain or execute the GitHub-facing review workflow for the fit repository. Trigger for PR review process changes, advisory review rollout, `@codex review` usage, PR template updates, and keeping AGENTS/code_review/docs aligned for GitHub review. Do not use for generic product implementation. | [.agents/skills/fit-github-review-ops/SKILL.md](/C:/fit/.agents/skills/fit-github-review-ops/SKILL.md) |
| `fit-pr-review` | Use when Codex must review a fit repository diff, pull request, commit, or uncommitted change set and return prioritized findings. Trigger for local `/review`, PR-style review, change-risk triage, and manual `@codex review` follow-up. Do not use for generic implementation or security-only review without a broader code review request. | [.agents/skills/fit-pr-review/SKILL.md](/C:/fit/.agents/skills/fit-pr-review/SKILL.md) |
| `fit-prompt-contracts` | Use when Codex must create or update AGENTS instructions, reviewer contracts, skill prompts, or developer-facing workflow docs in the fit repository. Trigger for prompt-guidance hardening, output-contract revisions, verification-loop rules, and sync work across AGENTS, code_review.md, playbooks, and skills. Do not use for generic code changes unrelated to the agent layer. | [.agents/skills/fit-prompt-contracts/SKILL.md](/C:/fit/.agents/skills/fit-prompt-contracts/SKILL.md) |
| `fit-release-verification` | Use when Codex must choose and run the minimum defensible verification package for a fit repository change. Trigger for release-oriented work, pre-merge checks, production hardening slices, and when the touched area spans multiple verification surfaces. Do not use for pure implementation planning with no need to decide checks. | [.agents/skills/fit-release-verification/SKILL.md](/C:/fit/.agents/skills/fit-release-verification/SKILL.md) |
| `fit-security-review` | Use when Codex must review fit for security regressions, secure-by-default behavior, privileged boundary drift, or manual `@codex review for security regressions`. Trigger for Next.js, Supabase, admin, billing, webhook, env, or AI-runtime changes where auth, RLS, secrets, or unsafe fallbacks may be at risk. Do not use for general non-security review. | [.agents/skills/fit-security-review/SKILL.md](/C:/fit/.agents/skills/fit-security-review/SKILL.md) |
| `fit-web-onboarding` | Use when Codex needs to enter an unfamiliar web slice of the fit app and produce a concrete module map, request/data flow, risky spots, and next-file recommendations before editing. Trigger for App Router, frontend, admin, backend-web, and cross-cutting Next.js onboarding tasks. Do not use for Android-only work or for tasks where the target files are already clearly known. | [.agents/skills/fit-web-onboarding/SKILL.md](/C:/fit/.agents/skills/fit-web-onboarding/SKILL.md) |
| `fit-workout-domain` | Apply workout-domain guidance for the fit app. Use when the task involves workout plans, exercises, training sessions, sets, reps, timers, progress tracking, onboarding for goals, or cloud-synced workout behavior. Do not use for nutrition-first features, wearables-first integrations, or generic Android plumbing without workout semantics. | [.agents/skills/fit-workout-domain/SKILL.md](/C:/fit/.agents/skills/fit-workout-domain/SKILL.md) |

## Governance Summary

- Allowlisted write surfaces:
  `AGENTS.md`, `.codex/config.toml`, `agents/`, `.agents/skills/`, `code_review.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/agent-autonomy.yml`, `docs/CODEX_AGENT_AUTONOMY_PLAN.md`, `docs/CODEX_AGENT_GOVERNANCE.md`, `docs/CODEX_AGENT_REGISTRY.md`, `docs/CODEX_PLAYBOOK.md`, `docs/CODEX_ONBOARDING.md`, `docs/CODEX_ROLLOUT_PLAN.md`, `docs/README.md`, `README.md`, `scripts/agent-governance-config.mjs`, `scripts/agent-inventory.mjs`, `scripts/sync-codex-agent-registry.mjs`, `scripts/verify-agent-governance.mjs`, `scripts/agent-evolve.mjs`, `scripts/verify-codex.mjs`
- Denied surfaces:
  `.env`, `.env.`, `node_modules/`, `package-lock.json`, `public/`, `src/`, `supabase/migrations/`, `tests/`
- Write-run verification:
  `npm run verify:codex`, `npm run verify:agent-governance`, `npm run lint`, `npm run typecheck`, `npm run build`
- Канонический governance-doc:
  [docs/CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md)

## Workflow Docs

| Док | Путь | Назначение |
| --- | --- | --- |
| `rollout` | [docs/CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md) | rollout и handoff Codex operating system |
| `agent-hardening` | [docs/CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md) | review, security и prompt-contract слой |
| `agent-autonomy` | [docs/CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md) | orchestration, governance и autonomous mainline lane |
| `agent-governance` | [docs/CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md) | allowlist, denied surfaces, budgets и kill switch |
| `agent-registry` | [docs/CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md) | синхронизированный реестр ролей, skills, workflows и команд |
| `playbook` | [docs/CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md) | рабочий playbook и cookbook-паттерны для agent layer |
| `onboarding` | [docs/CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md) | обязательный onboarding для нового домена и agent layer |
| `review-contract` | [code_review.md](/C:/fit/code_review.md) | локальный и GitHub review contract |

## Automation And Verification Commands

| Команда | Что делает |
| --- | --- |
| `agent:evaluate` | `node scripts/agent-evolve.mjs` |
| `agent:evolve` | `node scripts/agent-evolve.mjs --write` |
| `agent:evolve:push` | `node scripts/agent-evolve.mjs --write --push` |
| `agent:inventory` | `node scripts/agent-inventory.mjs --out output/codex-runs/agent-evolution/latest/agent-inventory.json` |
| `agent:sync-registry` | `node scripts/sync-codex-agent-registry.mjs --write` |
| `verify:advisors` | `powershell -ExecutionPolicy Bypass -File scripts/verify-advisors.ps1` |
| `verify:agent-governance` | `node scripts/verify-agent-governance.mjs` |
| `verify:android-twa` | `node scripts/verify-android-twa.mjs` |
| `verify:codex` | `node scripts/verify-codex.mjs` |
| `verify:migrations` | `powershell -ExecutionPolicy Bypass -File scripts/verify-migrations.ps1` |
| `verify:retrieval-release` | `node scripts/verify-retrieval-release.mjs` |
| `verify:runtime-env` | `node scripts/verify-runtime-env.mjs` |
| `verify:sentry-runtime` | `node scripts/verify-sentry-runtime.mjs` |
| `verify:staging-runtime` | `node scripts/verify-staging-runtime.mjs` |
| `verify:supabase-runtime` | `node scripts/verify-supabase-runtime.mjs` |

## Workflow Files

| Workflow | Путь |
| --- | --- |
| Quality | [.github/workflows/quality.yml](/C:/fit/.github/workflows/quality.yml) |
| Agent Autonomy | [.github/workflows/agent-autonomy.yml](/C:/fit/.github/workflows/agent-autonomy.yml) |

## Regeneration

1. `npm run agent:inventory`
2. `npm run agent:sync-registry`
3. `npm run verify:agent-governance`
