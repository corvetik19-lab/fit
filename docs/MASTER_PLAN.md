# Master Plan РїСЂРѕРµРєС‚Р° `fit`

## РљР°Рє РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ СЌС‚РѕС‚ РїР»Р°РЅ

- `[x]` вЂ” СЃРґРµР»Р°РЅРѕ Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ РІ РєРѕРґРµ, РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂРµ РёР»Рё РїСЂРѕРІРµСЂРєР°С….
- `[ ]` вЂ” РµС‰С‘ РЅРµ СЃРґРµР»Р°РЅРѕ РёР»Рё РЅРµ РґРѕРІРµРґРµРЅРѕ РґРѕ production-ready СЃРѕСЃС‚РѕСЏРЅРёСЏ.
- РљР°Р¶РґС‹Р№ Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ slice РѕР±СЏР·Р°РЅ СЃСЂР°Р·Сѓ РјРµРЅСЏС‚СЊ СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёР№ С‡РµРєР±РѕРєСЃ РІ СЌС‚РѕРј С„Р°Р№Р»Рµ СЃ `[ ]` РЅР° `[x]`, РµСЃР»Рё РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ СЂРµР°Р»СЊРЅРѕ Р·Р°РєСЂС‹С‚, Р»РёР±Рѕ РґРѕР±Р°РІР»СЏС‚СЊ/РѕР±РЅРѕРІР»СЏС‚СЊ addendum-РїРѕРґРїСѓРЅРєС‚ СЃ С‚РµРєСѓС‰РёРј СЃС‚Р°С‚СѓСЃРѕРј.
- РџРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ СЃСѓС‰РµСЃС‚РІРµРЅРЅРѕРіРѕ tranche:
  - РѕР±РЅРѕРІР»СЏС‚СЊ СЌС‚РѕС‚ С„Р°Р№Р»;
  - РґРѕР±Р°РІР»СЏС‚СЊ РєРѕСЂРѕС‚РєСѓСЋ Р·Р°РїРёСЃСЊ РІ `docs/AI_WORKLOG.md`;
  - СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹ РІ `docs/`, РµСЃР»Рё РјРµРЅСЏРµС‚СЃСЏ РєРѕРЅС‚СЂР°РєС‚, Р°СЂС…РёС‚РµРєС‚СѓСЂР° РёР»Рё release-РїСЂРѕС†РµСЃСЃ.
- РџРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ tranche РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ РїРµСЂРµСЃС‡РёС‚С‹РІР°С‚СЊ `done / total` РїРѕ РѕСЃРЅРѕРІРЅРѕРјСѓ execution checklist Рё РѕР±РЅРѕРІР»СЏС‚СЊ РїСЂРѕС†РµРЅС‚ РїСЂСЏРјРѕ РІ СЌС‚РѕРј С„Р°Р№Р»Рµ Рё РІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРј СЃС‚Р°С‚СѓСЃРµ.

Р­С‚РѕС‚ С„Р°Р№Р» вЂ” С‚РµРєСѓС‰РёР№ production-hardening backlog РїСЂРѕРµРєС‚Р°. РћРЅ РѕС‚СЂР°Р¶Р°РµС‚ С„Р°РєС‚РёС‡РµСЃРєРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ РЅР° `2026-03-31`.

Текущий прогресс execution checklist: `188 / 196` (`96%`).

## РўРµРєСѓС‰Р°СЏ Р±Р°Р·Р°

- [x] Р•СЃС‚СЊ web-first PWA РЅР° `Next.js 16 + React 19 + TypeScript strict`.
- [x] РћСЃРЅРѕРІРЅС‹Рµ РїСЂРѕРґСѓРєС‚РѕРІС‹Рµ РїРѕРІРµСЂС…РЅРѕСЃС‚Рё СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‚: `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`, `Settings`, `History`.
- [x] Р•СЃС‚СЊ Supabase schema, migrations, RLS, admin-РєРѕРЅС‚СѓСЂ, cron routes Рё offline sync РґР»СЏ С‚СЂРµРЅРёСЂРѕРІРѕРє.
- [x] Р•СЃС‚СЊ AI runtime, retrieval, structured knowledge, proposals, eval workspace Рё SVG demo.
- [x] `npm run lint` РїСЂРёРІРµРґС‘РЅ Рє CI-С„РѕСЂРјР°С‚Сѓ Рё РїСЂРѕРІРµСЂСЏРµС‚ С‚РѕР»СЊРєРѕ РїРѕРґРґРµСЂР¶РёРІР°РµРјС‹Рµ РёСЃС…РѕРґРЅРёРєРё.
- [x] `npm run typecheck` СЃС‚Р°Р±РёР»РµРЅ С‡РµСЂРµР· `next typegen + tsc`.
- [x] `npm run build` РїСЂРѕС…РѕРґРёС‚.
- [x] Р•СЃС‚СЊ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ smoke-РєРѕРЅС‚СѓСЂ Рё release checklist.
- [x] Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ Рё РєР»СЋС‡РµРІС‹Рµ UI/docs-РїРѕРІРµСЂС…РЅРѕСЃС‚Рё СЃР°РЅРёСЂРѕРІР°РЅС‹ РѕС‚ mojibake; Р»РѕРєР°Р»СЊРЅС‹Р№ `docs/AI_EXPLAINED.md` РѕС‚РґРµР»СЊРЅРѕ triaged Рё РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚ shipped surface.
- [x] Р•СЃС‚СЊ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ regression-РєРѕРЅС‚СѓСЂ СЃРІРµСЂС… smoke: auth/admin e2e, API contracts, RLS, workout sync Рё UI regression suites.
- [x] РџРµСЂРІС‹Р№ production milestone Р·Р°РєСЂС‹С‚.

## Milestones

### Milestone 1 вЂ” Stable Web/PWA

- [x] РЎС‚Р°Р±РёР»СЊРЅС‹Рµ Р»РѕРєР°Р»СЊРЅС‹Рµ engineering gates: `lint`, `typecheck`, `build`.
- [x] Р•СЃС‚СЊ smoke baseline РґР»СЏ РєР»СЋС‡РµРІС‹С… РјР°СЂС€СЂСѓС‚РѕРІ.
- [x] РљР»СЋС‡РµРІС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёРµ Рё Р°РґРјРёРЅСЃРєРёРµ СЃС†РµРЅР°СЂРёРё РїСЂРѕС…РѕРґСЏС‚ Р±РµР· hydration loops, infinite polling Рё layout regressions.
- [x] Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ, shell, AI workspace Рё workout flow РґРѕРІРµРґРµРЅС‹ РґРѕ production-РєР°С‡РµСЃС‚РІР°.
- [x] Р•СЃС‚СЊ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ automated regression contour СЃРІРµСЂС… smoke.

### Milestone 2 вЂ” Live Billing

- [ ] Production/staging env РІС‹Р±СЂР°РЅРЅРѕРіРѕ СЂРѕСЃСЃРёР№СЃРєРѕРіРѕ РїР»Р°С‚С‘Р¶РЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР° РіРѕС‚РѕРІС‹.
- [ ] Р Р°Р±РѕС‚Р°РµС‚ Р¶РёРІРѕР№ РєРѕРЅС‚СѓСЂ `checkout -> return reconcile -> webhook -> billing center`.
- [x] UI РІ `/settings` Рё `/admin` РєРѕСЂСЂРµРєС‚РЅРѕ РїРѕРєР°Р·С‹РІР°РµС‚ СЃС‚Р°С‚СѓСЃ РїРѕРґРїРёСЃРєРё Рё СЂР°СЃС…РѕР¶РґРµРЅРёСЏ.

### Milestone 3 вЂ” Android Wrapper

- [x] РџРѕРґС‚РІРµСЂР¶РґРµРЅР° installability production PWA.
- [x] Р“РѕС‚РѕРІ TWA wrapper.
- [x] РџРѕРґРіРѕС‚РѕРІР»РµРЅС‹ `assetlinks.json`, package name, signing, splash Рё Play metadata.
- [x] РџСЂРѕР№РґРµРЅ Android smoke РЅР° production URL.

## Р’РѕР»РЅР° 0. Engineering hygiene Рё release baseline

### Quality gates

- [x] РџРѕС‡РёРЅРёС‚СЊ `typecheck`, С‡С‚РѕР±С‹ РѕРЅ РїСЂРѕС…РѕРґРёР» Р·Р° РѕРґРёРЅ Р·Р°РїСѓСЃРє Р±РµР· СЂСѓС‡РЅС‹С… РїРѕРІС‚РѕСЂРѕРІ.
- [x] РЈР±СЂР°С‚СЊ Р·Р°РІРёСЃРёРјРѕСЃС‚СЊ quality gates РѕС‚ РјСѓСЃРѕСЂРЅС‹С… `.next/types` Рё РЅРµСЃС‚Р°Р±РёР»СЊРЅС‹С… `distDir`-СЃС†РµРЅР°СЂРёРµРІ.
- [x] РџСЂРёРІРµСЃС‚Рё `lint` Рє СЂР°Р±РѕС‡РµРјСѓ CI-С„РѕСЂРјР°С‚Сѓ.
- [x] Р—Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ РІРѕСЃРїСЂРѕРёР·РІРѕРґРёРјС‹Р№ baseline: `lint`, `typecheck`, `build`, smoke.
- [x] Р”РѕР±Р°РІРёС‚СЊ РІРѕСЃРїСЂРѕРёР·РІРѕРґРёРјС‹Р№ `verify:advisors` gate РґР»СЏ DB-РёР·РјРµРЅРµРЅРёР№ РїСЂРё РЅР°Р»РёС‡РёРё Supabase management secrets.

### Workspace cleanup

- [x] РЈР±СЂР°С‚СЊ РёР· Р°РєС‚РёРІРЅРѕРіРѕ dev-РїРѕС‚РѕРєР° `.next_codex_*`, `.next_stale_*` Рё РІСЂРµРјРµРЅРЅС‹Рµ build-РїР°РїРєРё.
- [x] Р Р°СЃС€РёСЂРёС‚СЊ `.gitignore` РґР»СЏ build-РјСѓСЃРѕСЂР° Рё generated artifacts.
- [x] Р—Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ line-ending policy С‡РµСЂРµР· `.gitattributes`.
- [x] РЈР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ quality gates РЅРµ РѕСЃС‚Р°РІР»СЏСЋС‚ repo-tracked С€СѓРј РІСЂРѕРґРµ РёР·РјРµРЅРµРЅРёР№ РІ `tsconfig.json`.

### Docs Рё entrypoints

- [x] РџРµСЂРµРїРёСЃР°С‚СЊ РєРѕСЂРЅРµРІРѕР№ `README.md` РІ РЅРѕСЂРјР°Р»СЊРЅРѕРј UTF-8 Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РµРіРѕ СЃ С‚РµРєСѓС‰РёРј СЃРѕСЃС‚РѕСЏРЅРёРµРј РїСЂРѕРµРєС‚Р°.
- [x] РџРµСЂРµРїРёСЃР°С‚СЊ `docs/MASTER_PLAN.md` РєР°Рє production-hardening backlog.
- [x] РџРµСЂРµРїРёСЃР°С‚СЊ `docs/FRONTEND.md` РІ С‡РёСЃС‚РѕРј UTF-8 Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ СЃ С‚РµРєСѓС‰РёРј frontend-РєРѕРЅС‚СѓСЂРѕРј.
- [x] Р”РѕР±Р°РІРёС‚СЊ release checklist РґР»СЏ production web/PWA.
- [x] РЎР°РЅРёСЂРѕРІР°С‚СЊ release-policy РґРѕРєСѓРјРµРЅС‚С‹ `docs/RELEASE_CHECKLIST.md`, `docs/PROD_READY.md`, `docs/BUILD_WARNINGS.md`.
- [x] РЎР°РЅРёСЂРѕРІР°С‚СЊ `docs/README.md`, `docs/AI_WORKLOG.md`, `docs/BACKEND.md`, `docs/AI_STACK.md`, `docs/USER_GUIDE.md` РѕС‚ mojibake.
- [x] РћС‚РґРµР»СЊРЅРѕ РїСЂРѕРІРµСЃС‚Рё triage Р»РѕРєР°Р»СЊРЅРѕРіРѕ `docs/AI_EXPLAINED.md` Рё Р·Р°РІРµСЂС€РёС‚СЊ sanitation-wave РґРѕРєСѓРјРµРЅС‚Р°С†РёРё.

## Р’РѕР»РЅР° 1. РђСЂС…РёС‚РµРєС‚СѓСЂРЅР°СЏ РґРµРєРѕРјРїРѕР·РёС†РёСЏ СЂРёСЃРєРѕРІР°РЅРЅС‹С… РјРѕРґСѓР»РµР№

### Workout execution

- [x] Р’С‹РЅРµСЃС‚Рё С‡РёСЃС‚СѓСЋ Р»РѕРіРёРєСѓ РёР· `src/components/workout-day-session.tsx` РІ `session-utils` Рё `derived-state`.
- [x] Р’С‹РЅРµСЃС‚Рё timer/focus-header state РІ `use-workout-session-timer.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё sync/hydration/offline orchestration РІ `use-workout-day-sync.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё save/status/reset action-СЃР»РѕР№ РІ `use-workout-session-actions.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё step-strip Рё exercise-card UI РІ РѕС‚РґРµР»СЊРЅС‹Рµ РјРѕРґСѓР»Рё.
- [x] Р’С‹РЅРµСЃС‚Рё non-focus overview Рё day-context surface РІ РѕС‚РґРµР»СЊРЅС‹Рµ РјРѕРґСѓР»Рё.
- [x] Р”РѕРІРµСЃС‚Рё `workout-day-session.tsx` РґРѕ РѕРєРѕРЅС‡Р°С‚РµР»СЊРЅРѕР№ orchestrator-СЂРѕР»Рё Р±РµР· СЃРјРµС€РµРЅРёСЏ UI, sync, persistence Рё РґРѕРјРµРЅРЅС‹С… РїСЂР°РІРёР».

### Dashboard analytics

- [x] Р’С‹РЅРµСЃС‚Рё РѕР±С‰РёРµ helperвЂ™С‹ РёР· `src/lib/dashboard/metrics.ts` РІ `dashboard-utils.ts` Рё `dashboard-snapshot.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё workout-specific helper-СЃР»РѕР№ РІ `dashboard-workout-helpers.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё overview/period-comparison РІ `dashboard-overview.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё aggregate snapshot/cache РІ `dashboard-aggregate.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё runtime snapshot cache РІ `dashboard-runtime-cache.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё live runtime assembly РІ `dashboard-runtime-assembly.ts`.
- [x] РџСЂРѕРґРѕР»Р¶РёС‚СЊ РІС‹РЅРѕСЃ nutrition-specific analytics Рё fail-open/result-format СЃР»РѕСЏ РёР· `metrics.ts`.

### Admin UI

- [x] Р’С‹РЅРµСЃС‚Рё model/helper СЃР»РѕР№ РёР· `src/components/admin-users-directory.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё filter/selection/bulk-request helper-СЃР»РѕР№ РёР· `src/components/admin-users-directory.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё bulk actions/history UI РёР· `src/components/admin-users-directory.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё model/helper СЃР»РѕР№ РёР· `src/components/admin-user-detail.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё fetch/state Рё section-config СЃР»РѕР№ РёР· `src/components/admin-user-detail.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё СЃРµРєС†РёРѕРЅРЅС‹Рµ `profile/activity/operations/billing` Р±Р»РѕРєРё РёР· `src/components/admin-user-detail.tsx`.
- [x] РЈР±СЂР°С‚СЊ mojibake РёР· `admin-user-detail` model/state СЃР»РѕРІР°СЂРµР№ Рё section copy.
- [x] Р”РѕР±РёС‚СЊ РґР°Р»СЊРЅРµР№С€СѓСЋ РґРµРєРѕРјРїРѕР·РёС†РёСЋ `admin-user-detail.tsx` РїРѕ timeline/detail РїРѕРґР±Р»РѕРєР°Рј.

### AI knowledge Рё chat

- [x] Р’С‹РЅРµСЃС‚Рё model/search helper СЃР»РѕР№ РёР· `src/lib/ai/knowledge.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё retrieval RPC/vector/text fallback СЃР»РѕР№ РёР· `src/lib/ai/knowledge.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё data-loading/fetch preparation СЃР»РѕР№ РІ `knowledge-source-data.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё indexing/embeddings refresh СЃР»РѕР№ РІ `knowledge-indexing.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё document builders Рё knowledge corpus assembly РІ `knowledge-documents.ts`.
- [x] Р’С‹РЅРµСЃС‚Рё model/helper Рё tool-card СЃР»РѕР№ РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё `chat surface + composer` UI РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё toolbar / prompt-library trigger / search toggle UI РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё access/error/notice panels РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё local session / prompt-state / URL orchestration РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё proposal-action / meal-photo runtime helper СЃР»РѕР№ РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё submit / composer helper СЃР»РѕР№ РёР· `src/components/ai-chat-panel.tsx`.
- [x] Р’С‹РЅРµСЃС‚Рё view/media state РёР· `src/components/ai-chat-panel.tsx`.
- [x] РЈР±СЂР°С‚СЊ mojibake РёР· `src/lib/ai/plan-generation.ts` Рё `src/lib/ai/domain-policy.ts`.
- [x] Р”РѕРІРµСЃС‚Рё `knowledge.ts` Рё `ai-chat-panel.tsx` РґРѕ С„РёРЅР°Р»СЊРЅРѕР№ orchestrator-СЂРѕР»Рё Р±РµР· СЃРјРµС€РµРЅРёСЏ UI, retrieval, persistence Рё runtime plumbing.

### РћР±С‰РёР№ СЃС‚Р°РЅРґР°СЂС‚ РґР»СЏ РєСЂСѓРїРЅС‹С… РјРѕРґСѓР»РµР№

- [x] Р”Р»СЏ `workout-day-session.tsx` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ derive-СЃР»РѕРµРј, timer-hook Рё sync-hook.
- [x] Р”Р»СЏ `metrics.ts` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ overview/aggregate/runtime СЂР°Р·РґРµР»РµРЅРёРµРј.
- [x] Р”Р»СЏ `admin-users-directory.tsx` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ РІС‹РЅРµСЃРµРЅРЅС‹Рј model/helper СЃР»РѕРµРј.
- [x] Р”Р»СЏ `admin-user-detail.tsx` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ РІС‹РЅРµСЃРµРЅРЅС‹Рј state/model/sections СЃР»РѕРµРј.
- [x] Р”Р»СЏ `knowledge.ts` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ РІС‹РЅРµСЃРµРЅРЅС‹РјРё retrieval/indexing/document builders.
- [x] Р”Р»СЏ `ai-chat-panel.tsx` РµСЃС‚СЊ СЂРµС„РµСЂРµРЅСЃРЅС‹Р№ РїР°С‚С‚РµСЂРЅ СЃ РІС‹РЅРµСЃРµРЅРЅС‹РјРё session/actions/composer/view-state РјРѕРґСѓР»СЏРјРё.
- [x] Async/data orchestration Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°РµС‚СЃСЏ СЃ JSX РІ РѕСЃС‚Р°РІС€РёС…СЃСЏ С‚СЏР¶С‘Р»С‹С… СЌРєСЂР°РЅР°С….
- [x] Р”РѕРјРµРЅРЅС‹Рµ РїСЂР°РІРёР»Р° Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ route handlers Рё `lib`.

## Р’РѕР»РЅР° 2. UX overhaul РґР»СЏ Web/PWA

### Shell Рё РЅР°РІРёРіР°С†РёСЏ

- [x] Р•СЃС‚СЊ desktop Рё mobile shell.
- [x] Desktop top nav РґРѕРІРµРґС‘РЅ РґРѕ СЃС‚Р°Р±РёР»СЊРЅРѕРіРѕ production-РІРёРґР° Р±РµР· РІРёР·СѓР°Р»СЊРЅС‹С… СЂРµРіСЂРµСЃСЃРёР№.
- [x] Mobile burger drawer РґРѕРІРµРґС‘РЅ РґРѕ РєРѕСЂСЂРµРєС‚РЅРѕР№ СЂР°Р±РѕС‚С‹ Р±РµР· РїРµСЂРµРєСЂС‹С‚РёР№, portal-РіР»СЋРєРѕРІ Рё hydration mismatch.
- [x] РЈР±СЂР°РЅС‹ РјРµС€Р°СЋС‰РёРµ РїР»Р°РІР°СЋС‰РёРµ РїР°РЅРµР»Рё, РѕСЃС‚Р°РІР»РµРЅС‹ С‚РѕР»СЊРєРѕ РїРѕР»РµР·РЅС‹Рµ РґРµР№СЃС‚РІРёСЏ.
- [x] Р•СЃС‚СЊ mobile/PWA regression suite РґР»СЏ burger drawer, focus-mode Рё section-menu РЅР° СѓР·РєРѕРј viewport.
- [x] Mobile/PWA regression suite СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ against hydration timing Рё flaky selectors: shell drawer, focus-header Рё С‚СЏР¶С‘Р»С‹Р№ nutrition isolation flow Р±РѕР»СЊС€Рµ РЅРµ РґР°СЋС‚ Р»РѕР¶РЅС‹Р№ РєСЂР°СЃРЅС‹Р№ РЅР° С†РµР»РµРІРѕРј mobile subset.

### Workspace-РїР°С‚С‚РµСЂРЅ СЃС‚СЂР°РЅРёС†

- [x] РќР° С‡Р°СЃС‚Рё СЌРєСЂР°РЅРѕРІ СѓР¶Рµ РµСЃС‚СЊ Р»РѕРіРёС‡РµСЃРєРёРµ СЂР°Р·РґРµР»С‹ Рё РїРµСЂРµРєР»СЋС‡РµРЅРёРµ.
- [x] Р’СЃРµ С‚СЏР¶С‘Р»С‹Рµ СЃС‚СЂР°РЅРёС†С‹ (`Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`) РїСЂРёРІРµРґРµРЅС‹ Рє РµРґРёРЅРѕРјСѓ workspace-РїР°С‚С‚РµСЂРЅСѓ.
- [x] РќР° РјРѕР±РёР»СЊРЅРѕР№ PWA РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ РѕС‚РєСЂС‹С‚ С‚РѕР»СЊРєРѕ РѕРґРёРЅ Р»РѕРіРёС‡РµСЃРєРёР№ Р±Р»РѕРє.
- [x] РЎРѕСЃС‚РѕСЏРЅРёРµ СЃРєСЂС‹С‚РёСЏ/РїРѕРєР°Р·Р° Р±Р»РѕРєРѕРІ РІРµРґС‘С‚ СЃРµР±СЏ РїСЂРµРґСЃРєР°Р·СѓРµРјРѕ РЅР° РІСЃРµС… РѕСЃРЅРѕРІРЅС‹С… СЃС‚СЂР°РЅРёС†Р°С….

### Premium fitness redesign

- [x] Р—Р°РІРµСЃС‚Рё РѕС‚РґРµР»СЊРЅС‹Р№ execution-doc [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) Рё РїСЂРёРІСЏР·Р°С‚СЊ РµРіРѕ Рє `MASTER_PLAN`.
- [x] РћР±РЅРѕРІРёС‚СЊ РІРёР·СѓР°Р»СЊРЅС‹Рµ С‚РѕРєРµРЅС‹, С‚РёРїРѕРіСЂР°С„РёРєСѓ Рё РѕР±С‰РёРµ shell/workspace primitives РІ premium fitness-РЅР°РїСЂР°РІР»РµРЅРёРё.
- [x] РџРµСЂРµСЃРѕР±СЂР°С‚СЊ `Dashboard` Рё `AI` РїРѕРґ РЅРѕРІС‹Р№ visual language.
- [x] РџРµСЂРµСЃРѕР±СЂР°С‚СЊ `Workouts` Рё `Nutrition` РїРѕРґ mobile/PWA-first РїРѕРґР°С‡Сѓ Р±РµР· РїРѕС‚РµСЂРё С‚РµРєСѓС‰РёС… flows.
- [x] Р”РѕРІРµСЃС‚Рё `Admin` Рё remaining detail surfaces РґРѕ С‚РѕРіРѕ Р¶Рµ РІРёР·СѓР°Р»СЊРЅРѕРіРѕ СЏР·С‹РєР°.
- [x] Р—Р°РєСЂС‹С‚СЊ visual regression, mobile acceptance Рё С„РёРЅР°Р»СЊРЅС‹Р№ handoff РїРѕ СЂРµРґРёР·Р°Р№РЅСѓ.

### Workout execution

- [x] Р•СЃС‚СЊ focus-mode Рё РїРѕС€Р°РіРѕРІРѕРµ РІС‹РїРѕР»РЅРµРЅРёРµ С‚СЂРµРЅРёСЂРѕРІРєРё.
- [x] Р’РёРґРЅС‹ РІСЃРµ С€Р°РіРё С‚СЂРµРЅРёСЂРѕРІРєРё, Р±СѓРґСѓС‰РёРµ С€Р°РіРё Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹.
- [x] РЎРѕС…СЂР°РЅРµРЅРёРµ СѓРїСЂР°Р¶РЅРµРЅРёСЏ С‚СЂРµР±СѓРµС‚ РїРѕР»РЅРѕСЃС‚СЊСЋ Р·Р°РїРѕР»РЅРµРЅРЅС‹С… РїРѕРґС…РѕРґРѕРІ.
- [x] Р•СЃС‚СЊ С‚Р°Р№РјРµСЂ СЃ Р»РёРјРёС‚РѕРј 2 С‡Р°СЃР° Рё РєРѕСЂСЂРµРєС‚РЅС‹Р№ СЃР±СЂРѕСЃ С‚СЂРµРЅРёСЂРѕРІРєРё.
- [x] Focus-mode РЅР° РјРѕР±РёР»СЊРЅРѕР№ PWA РґРѕРІРµРґС‘РЅ РґРѕ СЌС‚Р°Р»РѕРЅРЅРѕРіРѕ UX Р±РµР· Р»РёС€РЅРµРіРѕ chrome Рё РІРёР·СѓР°Р»СЊРЅРѕРіРѕ С€СѓРјР°.
- [x] РЎР±СЂРѕСЃ, СЃРѕС…СЂР°РЅРµРЅРёРµ, Р·Р°РІРµСЂС€РµРЅРёРµ Рё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РїСЂРѕР№РґРµРЅС‹ РїРѕРІС‚РѕСЂРЅРѕ РєР°Рє regression-critical СЃС†РµРЅР°СЂРёРё.

### Nutrition camera / barcode flow

  - [x] Р”РѕР±Р°РІРёС‚СЊ in-app photo capture РґР»СЏ РїРёС‚Р°РЅРёСЏ СЃ СѓРґРѕР±РЅС‹Рј mobile/PWA UX.
  - [x] Р”РѕР±Р°РІРёС‚СЊ barcode scan Рё Open Food Facts lookup/import СЃ preview РёР·РѕР±СЂР°Р¶РµРЅРёСЏ Рё СЃРѕСЃС‚Р°РІР°.
  - [x] Р Р°СЃС€РёСЂРёС‚СЊ `foods` schema Рё nutrition data-contract РїРѕРґ image/composition/source metadata.
  - [x] Р—Р°РєСЂС‹С‚СЊ regression, РґРѕРєСѓРјРµРЅС‚Р°С†РёСЋ Рё handoff РїРѕ nutrition capture/import flow.

### AI workspace

- [x] Р•СЃС‚СЊ fullscreen AI workspace Рё РёСЃС‚РѕСЂРёСЏ С‡Р°С‚РѕРІ.
- [x] Р•СЃС‚СЊ СѓРґР°Р»РµРЅРёРµ РѕС‚РґРµР»СЊРЅС‹С… С‡Р°С‚РѕРІ Рё РјР°СЃСЃРѕРІР°СЏ РѕС‡РёСЃС‚РєР°.
- [x] Р•СЃС‚СЊ Р·Р°РіСЂСѓР·РєР° РёР·РѕР±СЂР°Р¶РµРЅРёР№ Рё prompt library.
- [x] РЈР±СЂР°С‚СЊ РІРµСЃСЊ СЃР»СѓР¶РµР±РЅС‹Р№ РєРѕРїРёСЂР°Р№С‚, РїСѓСЃС‚С‹Рµ СЃРѕСЃС‚РѕСЏРЅРёСЏ Рё РјРµС€Р°СЋС‰РёР№ UI-С…СЂРѕРј.
- [x] Web search toggle Рё image upload РґРѕРІРµСЃС‚Рё РґРѕ РµСЃС‚РµСЃС‚РІРµРЅРЅРѕРіРѕ mobile-first UX.
- [x] Assistant flow РґРѕР»Р¶РµРЅ С‡РёС‚Р°С‚СЊСЃСЏ РєР°Рє СЃС†РµРЅР°СЂРёР№ `Р·Р°РїСЂРѕСЃ -> Р°РЅР°Р»РёР· -> РїСЂРµРґР»РѕР¶РµРЅРёРµ -> РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ -> РїСЂРёРјРµРЅРµРЅРёРµ`.

### Admin UI

- [x] Р•СЃС‚СЊ `/admin`, РєР°С‚Р°Р»РѕРі РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, user detail, health dashboards Рё operations inbox.
- [x] Degraded/fallback СЂРµР¶РёРј РІ `admin health` Рё `operations inbox` СЏРІРЅРѕ РїРѕРєР°Р·Р°РЅ РІ UI, Р° РЅРµ РїСЂСЏС‡РµС‚СЃСЏ Р·Р° РјРѕР»С‡Р°Р»РёРІС‹Рј РїСѓСЃС‚С‹Рј СЃРѕСЃС‚РѕСЏРЅРёРµРј.
- [x] Р’РµСЂС…РЅРёР№ СЃР»РѕР№ `admin user detail` РїРµСЂРµРІРµРґС‘РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8: state, summary shell Рё section-switcher Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake.
- [x] РџРѕР»РЅРѕСЃС‚СЊСЋ СѓР±СЂР°С‚СЊ СЃС‹СЂС‹Рµ С‚РµС…РЅРёС‡РµСЃРєРёРµ С‚РµРєСЃС‚С‹ Рё mojibake РёР· admin UI.
- [x] РћСЃС‚Р°РІРёС‚СЊ РґРµС‚Р°Р»Рё СЂРѕР»РµР№ Рё capability only РґР»СЏ root/super-admin.
- [x] Р”РѕРІРµСЃС‚Рё РєР°С‚Р°Р»РѕРіРё Рё РєР°СЂС‚РѕС‡РєРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РґРѕ СЃРµРєС†РёРѕРЅРЅРѕРіРѕ desktop/mobile UX Р±РµР· РїРµСЂРµРіСЂСѓР·Р°.

## Р’РѕР»РЅР° 3. Р”РѕРјРµРЅРЅС‹Рµ, AI Рё backend hardening

### Workout / Nutrition / API

- [x] РЎРґРµР»Р°С‚СЊ `sync/push` РґР»СЏ `workout_day_execution` Р°С‚РѕРјР°СЂРЅС‹Рј, Р±РµР· С‡Р°СЃС‚РёС‡РЅРѕ РїСЂРёРјРµРЅС‘РЅРЅРѕРіРѕ СЃС‚Р°С‚СѓСЃР° РїСЂРё РѕС€РёР±РєРµ СЃРѕС…СЂР°РЅРµРЅРёСЏ.
- [x] Р—Р°РїСЂРµС‚РёС‚СЊ С‡Р°СЃС‚РёС‡РЅРѕ Р·Р°РїРѕР»РЅРµРЅРЅС‹Рµ set-updates РЅР° СЃРµСЂРІРµСЂРµ: set СЃС‡РёС‚Р°РµС‚СЃСЏ Р»РёР±Рѕ РїСѓСЃС‚С‹Рј, Р»РёР±Рѕ РїРѕР»РЅРѕСЃС‚СЊСЋ Р·Р°РїРѕР»РЅРµРЅРЅС‹Рј (`reps`, `weight`, `RPE`).
- [x] Р—Р°РїСЂРµС‚РёС‚СЊ РїРµСЂРµРІРѕРґ workout day РІ `done`, РµСЃР»Рё РЅРµ Р·Р°РїРѕР»РЅРµРЅС‹ Рё РЅРµ СЃРѕС…СЂР°РЅРµРЅС‹ РІСЃРµ СЃРµС‚С‹ РґРЅСЏ.
- [x] РџСЂРѕРІР°Р»РёРґРёСЂРѕРІР°С‚СЊ РїР°СЂР°РјРµС‚СЂС‹ `sync/pull` РЅР° СѓСЂРѕРІРЅРµ route handler, Р° РЅРµ С‚РѕР»СЊРєРѕ РЅР° РєР»РёРµРЅС‚Рµ.
- [x] Р”РѕР±Р°РІРёС‚СЊ UUID-РІР°Р»РёРґР°С†РёСЋ route params РІ direct workout mutation routes (`workout-days/[id]`, `reset`, `workout-sets/[id]`).
- [x] Р”РѕР±Р°РІРёС‚СЊ regression-РїРѕРєСЂС‹С‚РёРµ РґР»СЏ СЃС†РµРЅР°СЂРёСЏ `sync -> reset -> sync/pull`, РїРѕРґС‚РІРµСЂР¶РґР°СЋС‰РµРµ С‡РёСЃС‚С‹Р№ snapshot РїРѕСЃР»Рµ СЃР±СЂРѕСЃР° С‚СЂРµРЅРёСЂРѕРІРєРё.
- [x] Р”РѕР±Р°РІРёС‚СЊ UUID-РІР°Р»РёРґР°С†РёСЋ Рё СЏРІРЅС‹Рµ `400` РІ owner-scoped mutation routes `weekly-programs/[id]/lock`, `weekly-programs/[id]/clone`, `foods/[id]`, `recipes/[id]`, `meals/[id]`, `meal-templates/[id]`.
- [x] Р”РѕР±Р°РІРёС‚СЊ UUID-РІР°Р»РёРґР°С†РёСЋ Рё СЏРІРЅС‹Рµ `400` РІ admin user mutation routes `billing`, `billing/reconcile`, `deletion`, `export`, `restore`, `role`, `support-action`, `suspend`.
- [x] РЈРЅРёС„РёС†РёСЂРѕРІР°С‚СЊ invalid-id РєРѕРЅС‚СЂР°РєС‚С‹ РґР»СЏ `admin/users/[id]` Рё `admin/users/bulk`, С‡С‚РѕР±С‹ detail route Рё bulk route С‚РѕР¶Рµ РѕС‚РґР°РІР°Р»Рё РїСЂРµРґСЃРєР°Р·СѓРµРјС‹Рµ `400` Р±РµР· noisy error logging.
- [x] Р Р°СЃС€РёСЂРёС‚СЊ `api-contracts.spec.ts` invalid-param РїРѕРєСЂС‹С‚РёРµРј РґР»СЏ weekly program Рё nutrition mutation routes.
- [x] `settings/data` Рё `settings/billing` snapshot routes С‚РµРїРµСЂСЊ fail-open: РїСЂРё СЃР±РѕРµ Р·Р°РіСЂСѓР·РєРё РѕР±РѕР»РѕС‡РєРё settings UI РїРѕР»СѓС‡Р°РµС‚ Р±РµР·РѕРїР°СЃРЅС‹Р№ РїСѓСЃС‚РѕР№ snapshot РІРјРµСЃС‚Рѕ РѕР±С‰РµРіРѕ `500`.
- [x] User-facing billing access С‚РµРїРµСЂСЊ fail-open РЅР° `/settings`, `/ai`, `/nutrition`, `/api/settings/billing` Рё РІ AI mutation routes: РїСЂРё СЃР±РѕРµ billing-access Р·Р°РіСЂСѓР·РєРё UI Рё AI surface Р±РѕР»СЊС€Рµ РЅРµ РїР°РґР°СЋС‚ РѕР±С‰РёРј `500`, Р° РёСЃРїРѕР»СЊР·СѓСЋС‚ Р±РµР·РѕРїР°СЃРЅС‹Р№ fallback snapshot/access policy.
- [x] РџСЂРѕР№С‚Рё РІСЃРµ route handlers РЅР° РІР°Р»РёРґР°С†РёСЋ, owner-only РґРѕСЃС‚СѓРї, РѕС€РёР±РєРё Рё idempotency.
- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ, С‡С‚Рѕ reset/finish/sync СЃС†РµРЅР°СЂРёРё РЅРµ СЃРѕР·РґР°СЋС‚ race conditions Рё Р±РµСЃРєРѕРЅРµС‡РЅС‹Р№ polling.
- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ, С‡С‚Рѕ offline queue Рё stale cleanup РЅРµ РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°СЋС‚ СѓР¶Рµ СЃР±СЂРѕС€РµРЅРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ.
- [x] РџСЂРѕРІРµСЂРёС‚СЊ locked program guard Рё РІСЃРµ mutation routes РІРѕРєСЂСѓРі workout day execution.

### AI / RAG / CAG / KAG

- [x] Р•СЃС‚СЊ retrieval, structured knowledge, proposals Рё snapshots.
- [x] Р”Р»СЏ `AI sessions` Рё `proposal apply/approve` РґРѕР±Р°РІР»РµРЅС‹ СЏРІРЅС‹Рµ UUID-РІР°Р»РёРґР°С†РёРё Рё РїСЂРµРґСЃРєР°Р·СѓРµРјС‹Рµ `400/404/409`, Р° РЅРµ С‚РѕР»СЊРєРѕ РѕР±С‰РёРµ `500`.
- [x] `AI meal-plan` Рё `AI workout-plan` routes С‚РµРїРµСЂСЊ РІР°Р»РёРґРёСЂСѓСЋС‚ РІС…РѕРґ С‡РµСЂРµР· РѕР±С‰РёР№ Zod schema helper Рё РІРѕР·РІСЂР°С‰Р°СЋС‚ СЏРІРЅС‹Рµ `400 MEAL_PLAN_INVALID` / `WORKOUT_PLAN_INVALID` РґРѕ runtime, billing Рё provider СЃР»РѕСЏ.
- [x] РЈРґР°Р»РµРЅРёРµ AI chat session С‚РµРїРµСЂСЊ РїСЂРѕРІРµСЂСЏРµС‚ owner-scoped СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ СЃРµСЃСЃРёРё Рё РЅРµ РІРѕР·РІСЂР°С‰Р°РµС‚ Р»РѕР¶РЅС‹Р№ СѓСЃРїРµС….
- [x] `AI chat` Рё `AI assistant` С‚РµРїРµСЂСЊ РѕС‚РєР»РѕРЅСЏСЋС‚ РЅРµРёР·РІРµСЃС‚РЅС‹Р№ РёР»Рё С‡СѓР¶РѕР№ РІР°Р»РёРґРЅС‹Р№ `sessionId` СЃ `404 AI_CHAT_SESSION_NOT_FOUND`, Р° РЅРµ СЃРѕР·РґР°СЋС‚ РёР»Рё РїСЂРѕРґРѕР»Р¶Р°СЋС‚ РЅРѕРІСѓСЋ СЃРµСЃСЃРёСЋ РјРѕР»С‡Р°.
- [x] `AI proposal approve/apply` С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ owner-scoped e2e: root-admin РїРѕР»СѓС‡Р°РµС‚ `404 AI_PROPOSAL_NOT_FOUND` РЅР° С‡СѓР¶РѕРј `proposalId`, Р° invalid UUID РґР°С‘С‚ СЏРІРЅС‹Рµ `400 AI_PROPOSAL_APPROVE_INVALID` / `AI_PROPOSAL_APPLY_INVALID`.
- [x] РЎР°РЅРёСЂРѕРІР°РЅ user-facing copy РІ `ai/chat`, `ai/reindex`, `ai/sessions/[id]`, `ai/proposals/[id]/apply`, `ai/proposals/[id]/approve`, С‡С‚РѕР±С‹ AI surface РЅРµ РѕС‚РґР°РІР°Р» mojibake.
- [x] Expected contract errors (`400/404` РЅР° invalid params Рё owner-scoped misses) Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРіРёСЂСѓСЋС‚СЃСЏ РєР°Рє route-level `error` РІ contract-tested mutation routes Рё AI session routes.
- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ owner-only data access РґР»СЏ chat, sessions, retrieval, reindex Рё proposal apply.
- [x] Р Р°Р·РІРµСЃС‚Рё runtime failure UX Рё provider configuration UX.
- [x] РЎС‚Р°Р±РёР»РёР·РёСЂРѕРІР°С‚СЊ РёСЃС‚РѕСЂРёСЋ С‡Р°С‚РѕРІ, prompt library, web search toggle Рё image upload.
- [ ] РџСЂРѕРіРЅР°С‚СЊ assistant/retrieval/workout-plan/meal-plan/safety eval suites РєР°Рє quality gate. РљРѕРґРѕРІС‹Р№ РєРѕРЅС‚СѓСЂ СѓР¶Рµ РіРѕС‚РѕРІ; С‚РµРєСѓС‰РёР№ РІРЅРµС€РЅРёР№ blocker вЂ” `OpenRouter 402` РїРѕ РєСЂРµРґРёС‚Р°Рј Рё `Voyage 403` РїРѕ embeddings.
- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ retrieval РїРѕ РІСЃРµР№ РёСЃС‚РѕСЂРёС‡РµСЃРєРѕР№ Р±Р°Р·Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, Р° РЅРµ С‚РѕР»СЊРєРѕ РїРѕ СЃРІРµР¶РёРј РґР°РЅРЅС‹Рј.

### Database / Supabase

- [x] РџСЂРѕРІРµСЃС‚Рё РїРѕР»РЅС‹Р№ Р°СѓРґРёС‚ СЃС…РµРјС‹, RLS, RPC, cron-related С„СѓРЅРєС†РёР№ Рё РёРЅРґРµРєСЃРЅС‹С… РїСѓС‚РµР№ С‡РµСЂРµР· Supabase MCP.
- [x] РџРѕСЃР»Рµ DDL-РёР·РјРµРЅРµРЅРёР№ Р·Р°РїСѓСЃРєР°С‚СЊ advisors `security` Рё `performance` РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅСѓСЋ РїСЂРѕРІРµСЂРєСѓ.
- [x] РџСЂРѕРІРµСЂРёС‚СЊ query paths Рё РёРЅРґРµРєСЃС‹ РґР»СЏ `sync`, `workout`, `knowledge`, `admin`, `billing`.

### Observability

- [x] Sentry, Vercel Analytics Рё health dashboards СѓР¶Рµ РІСЃС‚СЂРѕРµРЅС‹ С‡Р°СЃС‚РёС‡РЅРѕ.
- [ ] Р—Р°РІРµСЂС€РёС‚СЊ Sentry rollout РЅР° production env.
- [x] Р”РѕР±Р°РІРёС‚СЊ Р±Р°Р·РѕРІСѓСЋ РІР°Р»РёРґР°С†РёСЋ `userId`-РїР°СЂР°РјРµС‚СЂРѕРІ РґР»СЏ internal jobs Рё СЏРІРЅС‹Рµ `400`, Р° РЅРµ РѕР±С‰РёРµ `500`.
- [x] `admin/stats` Рё `admin/operations` С‚РµРїРµСЂСЊ fail-open: РїСЂРё РІСЂРµРјРµРЅРЅРѕРј СЃР±РѕРµ РІРЅРµС€РЅРёС… Р·Р°РїСЂРѕСЃРѕРІ РѕРїРµСЂР°С‚РѕСЂСЃРєРёРµ СЌРєСЂР°РЅС‹ РїРѕР»СѓС‡Р°СЋС‚ Р±РµР·РѕРїР°СЃРЅС‹Р№ fallback snapshot РІРјРµСЃС‚Рѕ РѕР±С‰РµРіРѕ `500`.
- [x] `/admin` page С‚РµРїРµСЂСЊ fail-open: server-side hero Рё РѕРїРµСЂР°С‚РѕСЂСЃРєРёРµ quick links РѕСЃС‚Р°СЋС‚СЃСЏ РґРѕСЃС‚СѓРїРЅС‹ РґР°Р¶Рµ РїСЂРё РІСЂРµРјРµРЅРЅРѕРј СЃР±РѕРµ С‡Р°СЃС‚Рё admin-Р·Р°РїСЂРѕСЃРѕРІ.
- [x] `admin/users` С‚РµРїРµСЂСЊ fail-open: РїСЂРё РІСЂРµРјРµРЅРЅРѕРј СЃР±РѕРµ РІРЅРµС€РЅРёС… РёСЃС‚РѕС‡РЅРёРєРѕРІ РєР°С‚Р°Р»РѕРі РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РѕС‚РґР°С‘С‚ Р±РµР·РѕРїР°СЃРЅС‹Р№ degraded snapshot РІРјРµСЃС‚Рѕ РѕР±С‰РµРіРѕ `500`, Р° UI РїРѕРєР°Р·С‹РІР°РµС‚ РѕРїРµСЂР°С‚РѕСЂСЃРєРёР№ banner.
- [x] `admin/users/[id]` С‚РµРїРµСЂСЊ fail-open: detail-route РѕС‚РґР°С‘С‚ degraded snapshot СЃ `meta.degraded`, Р° РєР°СЂС‚РѕС‡РєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕРєР°Р·С‹РІР°РµС‚ СЏРІРЅС‹Р№ banner РІРјРµСЃС‚Рѕ РїРѕР»РЅРѕРіРѕ РїР°РґРµРЅРёСЏ.
- [x] Expected invalid `userId` errors РІ admin mutation routes Р±РѕР»СЊС€Рµ РЅРµ С€СѓРјСЏС‚ РєР°Рє `logger.error`: РѕР¶РёРґР°РµРјС‹Рµ `400` РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ РґРѕ unexpected-failure logging.
- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ auth/visibility РґР»СЏ cron routes Рё internal jobs.
- [x] Р—Р°РґРѕРєСѓРјРµРЅС‚РёСЂРѕРІР°С‚СЊ РґРѕРїСѓСЃС‚РёРјС‹Рµ build warnings Рё РїСЂР°РІРёР»Р° РёС… СЌСЃРєР°Р»Р°С†РёРё.

## Р’РѕР»РЅР° 4. Billing Рё SaaS readiness

### РџР»Р°С‚С‘Р¶РЅС‹Р№ РїСЂРѕРІР°Р№РґРµСЂ Р Р¤

- [x] Billing domain СѓР¶Рµ РµСЃС‚СЊ; С†РµР»РµРІРѕР№ РїСЂРѕРІР°Р№РґРµСЂ Р Р¤ РґР»СЏ РјРёРіСЂР°С†РёРё Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ: `CloudPayments` РєР°Рє primary Рё `Р®Kassa` РєР°Рє fallback.
- [ ] Р—Р°РІРµСЃС‚Рё Рё РїСЂРѕРІРµСЂРёС‚СЊ РІСЃРµ production/staging env РІС‹Р±СЂР°РЅРЅРѕРіРѕ СЂРѕСЃСЃРёР№СЃРєРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР°.
- [ ] РџСЂРѕР№С‚Рё Р¶РёРІРѕР№ СЃС†РµРЅР°СЂРёР№ `checkout -> return reconcile -> webhook -> billing center`.
- [x] РџСЂРѕРІРµСЂРёС‚СЊ РёРґРµРјРїРѕС‚РµРЅС‚РЅРѕСЃС‚СЊ webhook Рё СЃРѕРіР»Р°СЃРѕРІР°РЅРЅРѕСЃС‚СЊ `subscriptions`, `entitlements`, `usage counters`.

### Billing UI

- [x] Р•СЃС‚СЊ billing center РІ `/settings` Рё admin billing controls.
- [x] Р”РѕРІРµСЃС‚Рё user-facing billing UX РґРѕ production-СѓСЂРѕРІРЅСЏ Р±РµР· СЃС‹СЂС‹С… РїСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹С… СЃРѕСЃС‚РѕСЏРЅРёР№.
- [x] Р”РѕРІРµСЃС‚Рё admin billing health Рё reconcile UX РґРѕ РѕРїРµСЂР°С‚РѕСЂСЃРєРѕРіРѕ СѓСЂРѕРІРЅСЏ.

## Р’РѕР»РЅР° 5. РўРµСЃС‚С‹, CI Рё release process

### РђРІС‚РѕС‚РµСЃС‚С‹

- [x] Р”РѕР±Р°РІРёС‚СЊ Playwright e2e РґР»СЏ `auth -> onboarding -> dashboard -> workouts -> nutrition -> ai -> settings -> admin`.
- [x] Р”РѕР±Р°РІРёС‚СЊ smoke С‚РµСЃС‚С‹ РЅР° РєР»СЋС‡РµРІС‹Рµ SSR/API РјР°СЂС€СЂСѓС‚С‹.
- [x] Р”РѕР±Р°РІРёС‚СЊ regression tests РґР»СЏ offline/sync workout execution.
- [x] Р”РѕР±Р°РІРёС‚СЊ AI route contract tests Р±РµР· РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ РІС‹Р·РѕРІР° РїР»Р°С‚РЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР°.
- [x] РџРѕР»РЅС‹Р№ `auth-e2e` baseline СЃРЅРѕРІР° РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РЅР° Р·РµР»С‘РЅРѕРј РїРѕР»РЅРѕРј РїСЂРѕРіРѕРЅРµ РїРѕСЃР»Рµ СЃС‚Р°Р±РёР»РёР·Р°С†РёРё admin detail selectors Рё session-restore flow.
- [x] Р”РѕР±Р°РІРёС‚СЊ route-level РёР·РѕР»СЏС†РёРѕРЅРЅС‹Рµ РїСЂРѕРІРµСЂРєРё РґР»СЏ owner-scoped user data (`workout`, `nutrition`, `custom exercises`, `settings`, `AI history`).
- [x] Р”РѕР±Р°РІРёС‚СЊ РѕС‚РґРµР»СЊРЅС‹Рµ RLS-focused РїСЂРѕРІРµСЂРєРё СЃРІРµСЂС… route-level owner isolation.

### CI

- [x] Р”РѕР±Р°РІРёС‚СЊ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ CI workflow РґР»СЏ `lint`, `typecheck`, `build`.
- [x] Р”РѕР±Р°РІРёС‚СЊ smoke subset РєР°Рє merge gate.
- [x] Р”РѕР±Р°РІРёС‚СЊ secret-guarded `test:rls` Рё `test:e2e:auth` jobs РґР»СЏ РїРѕР»РЅРѕРіРѕ regression-РєРѕРЅС‚СѓСЂР° РІ GitHub Actions.
- [x] РџСЂРё РЅР°Р»РёС‡РёРё DB-РёР·РјРµРЅРµРЅРёР№ РґРѕР±Р°РІРёС‚СЊ migration-aware verification РІ CI.
- [x] Р”РѕР±Р°РІРёС‚СЊ advisor execution/verification РґР»СЏ DB-РёР·РјРµРЅРµРЅРёР№ РІ CI.

### Release process

- [x] Р¤РѕСЂРјР°Р»РёР·РѕРІР°С‚СЊ release checklist РґР»СЏ web/PWA.
- [x] Р’РІРµСЃС‚Рё staging-like verification РґР»СЏ billing runtime Рё AI runtime.
- [x] Р—Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ РєСЂРёС‚РµСЂРёР№ `prod-ready` РєР°Рє РЅР°Р±РѕСЂ automated + manual acceptance checks, Р° РЅРµ С‚РѕР»СЊРєРѕ Р»РѕРєР°Р»СЊРЅСѓСЋ СЃР±РѕСЂРєСѓ.

## Р’РѕР»РЅР° 6. Android / TWA

- [x] РџРѕРґС‚РІРµСЂРґРёС‚СЊ installability production PWA.
- [x] РџРѕРґРіРѕС‚РѕРІРёС‚СЊ `assetlinks.json`.
- [x] РџРѕРґРіРѕС‚РѕРІРёС‚СЊ package name, signing, splash Рё Play metadata.
- [x] РЎРѕР±СЂР°С‚СЊ Рё РїСЂРѕРІРµСЂРёС‚СЊ TWA wrapper.
- [x] РџСЂРѕР№С‚Рё Android smoke РЅР° production URL.

## Р§С‚Рѕ РјРѕР¶РЅРѕ СЃС‡РёС‚Р°С‚СЊ Р·Р°РІРµСЂС€С‘РЅРЅС‹Рј С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ

- [x] `lint`, `typecheck`, `build` РїСЂРѕС…РѕРґСЏС‚ СЃС‚Р°Р±РёР»СЊРЅРѕ РІ РѕРґРёРЅ Р·Р°РїСѓСЃРє.
- [x] РќРµС‚ mojibake РІ РєР»СЋС‡РµРІРѕР№ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё Рё РѕСЃРЅРѕРІРЅС‹С… СЌРєСЂР°РЅР°С… РїСЂРёР»РѕР¶РµРЅРёСЏ.
- [x] РќРµС‚ hydration mismatch, render loops, infinite polling Рё state desync РІ Р±Р°Р·РѕРІС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёС… СЃС†РµРЅР°СЂРёСЏС….
- [ ] РљРѕРЅС‚СѓСЂ РІС‹Р±СЂР°РЅРЅРѕРіРѕ СЂРѕСЃСЃРёР№СЃРєРѕРіРѕ РїР»Р°С‚С‘Р¶РЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР° СЂР°Р±РѕС‚Р°РµС‚ end-to-end.
- [ ] AI quality gate РїСЂРѕР№РґРµРЅ РїРѕ РјРёРЅРёРјСѓРјСѓ: assistant, retrieval, workout plan, meal plan, safety. РљРѕРґРѕРІР°СЏ С‡Р°СЃС‚СЊ Рё СЏРІРЅС‹Рµ provider/runtime notices СѓР¶Рµ РґРѕРІРµРґРµРЅС‹; РѕСЃС‚Р°С‘С‚СЃСЏ СЃРЅСЏС‚СЊ РІРЅРµС€РЅРёР№ Р±Р»РѕРє РїРѕ РєСЂРµРґРёС‚Р°Рј Рё embeddings.
- [x] Android wrapper smoke РїСЂРѕР№РґРµРЅ РїРѕСЃР»Рµ СЃС‚Р°Р±РёР»РёР·Р°С†РёРё web/PWA.

## 2026-03-15 progress addendum

- [x] Р”РѕР±Р°РІР»РµРЅ РїРµСЂРІС‹Р№ authenticated Playwright e2e baseline РґР»СЏ РѕР±С‹С‡РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ: РІС…РѕРґ, Р°РІС‚РѕР·Р°РІРµСЂС€РµРЅРёРµ РѕРЅР±РѕСЂРґРёРЅРіР° РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё, РїРµСЂРµС…РѕРґ РїРѕ `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings`, РїСЂРѕРІРµСЂРєР° РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ СЃРµСЃСЃРёРё.
- [x] Р”РѕР±Р°РІР»РµРЅ root/admin e2e baseline: `/admin`, `/admin/users`, РѕС‚РєСЂС‹С‚РёРµ РєР°СЂС‚РѕС‡РєРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё РїСЂРѕРІРµСЂРєР° СЃРµРєС†РёРѕРЅРЅРѕРіРѕ operator UI РїРѕРґ `corvetik1@yandex.ru`.
- [x] Р”РѕР±Р°РІР»РµРЅС‹ route contract tests Р±РµР· РїР»Р°С‚РЅРѕРіРѕ AI runtime: СЏРІРЅС‹Рµ `400` РґР»СЏ invalid UUID Рё owner-scoped `404` РґР»СЏ РЅРµРёР·РІРµСЃС‚РЅРѕР№ AI session.
- [x] Р”РѕР±Р°РІР»РµРЅ offline/sync regression baseline: seeded locked workout day, `sync/push` СЃ duplicate/incomplete mutations Рё РєРѕРЅС‚СЂРѕР»СЊ РёС‚РѕРіРѕРІРѕРіРѕ `sync/pull` snapshot.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation tests РґРѕ RLS-РєРѕРЅС‚СѓСЂРѕРІ beyond workout day Рё РІС‹РЅРµСЃС‚Рё auth storage state, С‡С‚РѕР±С‹ e2e СЃРЅРѕРІР° РјРѕР¶РЅРѕ Р±С‹Р»Рѕ Р±РµР·РѕРїР°СЃРЅРѕ СЂР°СЃРїР°СЂР°Р»Р»РµР»РёС‚СЊ.

## 2026-03-15 isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РѕР№ weekly program РІ /api/weekly-programs Рё РЅРµ РјРѕР¶РµС‚ РІС‹Р·РІР°С‚СЊ lock РёР»Рё clone РЅР° С‡СѓР¶РѕРј programId; РѕР±Р° route-РєРѕРЅС‚СЂР°РєС‚Р° РІРѕР·РІСЂР°С‰Р°СЋС‚ owner-scoped 404 WEEKLY_PROGRAM_NOT_FOUND.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation beyond workout/program flows РґРѕ РѕСЃС‚Р°Р»СЊРЅС‹С… RLS-РєРѕРЅС‚СѓСЂРѕРІ Рё РІС‹РЅРµСЃС‚Рё auth storage state, С‡С‚РѕР±С‹ e2e РјРѕР¶РЅРѕ Р±С‹Р»Рѕ СЃРЅРѕРІР° Р±РµР·РѕРїР°СЃРЅРѕ СЂР°СЃРїР°СЂР°Р»Р»РµР»РёС‚СЊ.

## 2026-03-15 e2e infra addendum

- [x] Playwright РїРµСЂРµРІРµРґС‘РЅ РЅР° auth storage state РґР»СЏ РѕР±С‹С‡РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё root-admin; РїРѕРІС‚РѕСЂРЅС‹Р№ UI-Р»РѕРіРёРЅ Р±РѕР»СЊС€Рµ РЅРµ РЅСѓР¶РµРЅ РІ РєР°Р¶РґРѕРј e2e С‚РµСЃС‚Рµ.
- [x] typecheck, build Рё С‚РµСЃС‚РѕРІС‹Р№ webServer РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РѕС‚РґРµР»СЊРЅС‹Р№ NEXT_DIST_DIR=.next_build, С‡С‚РѕР±С‹ quality gates Рё e2e РЅРµ РєРѕРЅС„Р»РёРєС‚РѕРІР°Р»Рё СЃ Р»РѕРєР°Р»СЊРЅС‹Рј .next.
- [x] Playwright РїРµСЂРµРІРµРґС‘РЅ РЅР° РІС‹РґРµР»РµРЅРЅС‹Р№ РїРѕСЂС‚ 3100, РїРѕСЌС‚РѕРјСѓ С‚РµСЃС‚С‹ Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃСЏС‚ РѕС‚ СЃР»СѓС‡Р°Р№РЅРѕРіРѕ Р»РѕРєР°Р»СЊРЅРѕРіРѕ СЃРµСЂРІРµСЂР° РЅР° 3000.
- [x] npm run test:e2e:auth РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РЅР° --workers=2: 7 passed.

## 2026-03-15 nutrition isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ nutrition routes: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РёРµ foods РІ `GET /api/foods` Рё РїРѕР»СѓС‡Р°РµС‚ owner-scoped `404` РЅР° `PATCH/DELETE /api/foods/{id}`, `DELETE /api/recipes/{id}`, `DELETE /api/meal-templates/{id}` Рё `DELETE /api/meals/{id}` РґР»СЏ С‡СѓР¶РёС… nutrition assets.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation beyond workout/program/nutrition flows РґРѕ РѕСЃС‚Р°Р»СЊРЅС‹С… owner-scoped Рё RLS-РєРѕРЅС‚СѓСЂРѕРІ.

## 2026-03-15 exercises isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ custom exercises: route-РєРѕРЅС‚СѓСЂ `GET /api/exercises` Рё `PATCH /api/exercises/{id}` С‚РµРїРµСЂСЊ СЏРІРЅРѕ РґРµСЂР¶РёС‚ owner guard РїРѕ `user_id`, Р° root-admin РЅРµ РІРёРґРёС‚ Рё РЅРµ РјРѕР¶РµС‚ РѕР±РЅРѕРІРёС‚СЊ С‡СѓР¶РѕРµ СѓРїСЂР°Р¶РЅРµРЅРёРµ.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation beyond workout/program/nutrition/exercises flows РґРѕ РѕСЃС‚Р°Р»СЊРЅС‹С… owner-scoped Рё RLS-РєРѕРЅС‚СѓСЂРѕРІ.

## 2026-03-15 playwright env addendum

- [x] Playwright e2e Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓСЋС‚ СЂСѓС‡РЅРѕРіРѕ `PLAYWRIGHT_*` export РїРµСЂРµРґ Р·Р°РїСѓСЃРєРѕРј: auth helper Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїРѕРґС…РІР°С‚С‹РІР°РµС‚ `.env.local`, Р° Р»РѕРєР°Р»СЊРЅС‹Р№ full suite РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РѕР±С‹С‡РЅС‹Рј `npx playwright test`.
- [x] Р”РµС„РѕР»С‚РЅС‹Р№ Playwright full suite СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РЅР° `workers: 2`: Р»РѕРєР°Р»СЊРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ `12 passed` Р±РµР· skip.

## 2026-03-15 settings export isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ self-service `settings/data export`: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РѕР№ export job РІ `GET /api/settings/data` Рё РїРѕР»СѓС‡Р°РµС‚ owner-scoped `404 SETTINGS_EXPORT_NOT_FOUND` РЅР° `GET /api/settings/data/export/{id}/download`.
- [x] Р”РѕР±Р°РІР»РµРЅ `tests/e2e/helpers/settings-data.ts`, С‡С‚РѕР±С‹ e2e РјРѕРіР»Рё С€С‚Р°С‚РЅРѕ СЃРѕР·РґР°РІР°С‚СЊ РёР»Рё РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р°РєС‚РёРІРЅСѓСЋ self-service РІС‹РіСЂСѓР·РєСѓ РїРѕРґ С‚РµСЃС‚РѕРІС‹Рј РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј Р±РµР· РїСЂСЏРјРѕРіРѕ DB-seed.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `10 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation РЅР° РѕСЃС‚Р°РІС€РёРµСЃСЏ owner-scoped self-service Рё AI/data РєРѕРЅС‚СѓСЂС‹ beyond workout/program/nutrition/exercises/settings export.

## 2026-03-15 workout templates isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ `workout_templates`: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РѕР№ workout template РІ `GET /api/workout-templates` Рё РїРѕР»СѓС‡Р°РµС‚ owner-scoped `404 WORKOUT_TEMPLATE_SOURCE_NOT_FOUND` РЅР° РїРѕРїС‹С‚РєСѓ СЃРѕР·РґР°С‚СЊ template РёР· С‡СѓР¶РѕРіРѕ `programId`.
- [x] `tests/e2e/ownership-isolation.spec.ts` СѓСЃРёР»РµРЅ РµС‰С‘ РѕРґРЅРёРј owner-scoped СЃС†РµРЅР°СЂРёРµРј, Р° timeout isolation-suite СѓРІРµР»РёС‡РµРЅ РґРѕ `60_000`, С‡С‚РѕР±С‹ РґР»РёС‚РµР»СЊРЅС‹Р№ seed/template flow РЅРµ РґР°РІР°Р» Р»РѕР¶РЅС‹Р№ РєСЂР°СЃРЅС‹Р№ С‚Р°Р№РјР°СѓС‚.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `11 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation РЅР° РѕСЃС‚Р°РІС€РёРµСЃСЏ owner-scoped self-service Рё AI/data РєРѕРЅС‚СѓСЂС‹ beyond workout/program/nutrition/exercises/settings export/workout templates.

## 2026-03-15 settings deletion isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ self-service `settings/data deletion`: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РѕР№ deletion request РІ `GET /api/settings/data`, РЅРµ РјРѕР¶РµС‚ РѕС‚РјРµРЅРёС‚СЊ РµРіРѕ С‡РµСЂРµР· `DELETE /api/settings/data` Рё РїРѕР»СѓС‡Р°РµС‚ owner-scoped `404 SETTINGS_DELETION_NOT_FOUND`.
- [x] `tests/e2e/helpers/settings-data.ts` РґРѕРїРѕР»РЅРµРЅ helper-РѕРј РґР»СЏ `request_deletion`, Р° `tests/e2e/ownership-isolation.spec.ts` С‚РµРїРµСЂСЊ РїРѕРєСЂС‹РІР°РµС‚ Рё export, Рё deletion self-service РєРѕРЅС‚СѓСЂС‹ `settings/data`.
- [x] `tests/e2e/admin-app.spec.ts` СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РѕР¶РёРґР°РЅРёРµРј СЂРµР°Р»СЊРЅРѕРіРѕ СЃРµРєС†РёРѕРЅРЅРѕРіРѕ heading РЅР° detail-СЌРєСЂР°РЅРµ, РїРѕСЌС‚РѕРјСѓ auth e2e СЃРЅРѕРІР° Р·РµР»С‘РЅС‹Р№ Р±РµР· С„Р»Р°РєР° РёР·-Р·Р° client-side loading state.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation РЅР° РѕСЃС‚Р°РІС€РёРµСЃСЏ owner-scoped self-service Рё AI/data РєРѕРЅС‚СѓСЂС‹ beyond workout/program/nutrition/exercises/settings export/workout templates/settings deletion.

## 2026-03-15 build output hotfix addendum

- [x] РЈСЃС‚СЂР°РЅС‘РЅ production build conflict СЃ Vercel: `npm run build` СЃРЅРѕРІР° СЃРѕР±РёСЂР°РµС‚ РІ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ `.next`, РїРѕСЌС‚РѕРјСѓ Vercel Р±РѕР»СЊС€Рµ РЅРµ СѓРїРёСЂР°РµС‚СЃСЏ РІ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёР№ `.next/routes-manifest.json`.
- [x] РР·РѕР»РёСЂРѕРІР°РЅРЅС‹Р№ build РґР»СЏ С‚РµСЃС‚РѕРІ СЃРѕС…СЂР°РЅС‘РЅ РѕС‚РґРµР»СЊРЅРѕ: `build:test`, `start:test`, `typecheck`, `test:e2e*` Рё `test:smoke` РёСЃРїРѕР»СЊР·СѓСЋС‚ `.next_build` С‡РµСЂРµР· СЏРІРЅС‹Р№ `--dist-dir=.next_build`, Р° production build РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ СЌС‚РѕРіРѕ РєРѕРЅС‚СѓСЂР°.
- [x] `scripts/run-next-with-dist-dir.mjs` С‚РµРїРµСЂСЊ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЏРІРЅС‹Р№ `--dist-dir`, Р° РЅРµ РїРѕРґРјРµРЅСЏРµС‚ output directory РіР»РѕР±Р°Р»СЊРЅРѕ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.
- [x] Hotfix РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-15 settings billing isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ self-service `settings/billing`: root-admin РЅРµ РІРёРґРёС‚ С‡СѓР¶РѕР№ billing review request РІ `GET /api/settings/billing`, Р° РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёР№ request РѕСЃС‚Р°С‘С‚СЃСЏ РІРёРґРµРЅ С‚РѕР»СЊРєРѕ РІР»Р°РґРµР»СЊС†Сѓ.
- [x] `tests/e2e/helpers/settings-data.ts` РґРѕРїРѕР»РЅРµРЅ helper-РѕРј `ensureSettingsBillingReviewRequest(...)`, С‡С‚РѕР±С‹ e2e РјРѕРіР»Рё С€С‚Р°С‚РЅРѕ СЃРѕР·РґР°РІР°С‚СЊ РёР»Рё РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ self-service billing review Р±РµР· РїСЂСЏРјРѕРіРѕ DB seed.
- [x] `GET /api/settings/data/export/[id]/download` РїРѕР»СѓС‡РёР» UUID-РІР°Р»РёРґР°С†РёСЋ params Рё С‚РµРїРµСЂСЊ РґР°С‘С‚ СЏРІРЅС‹Р№ `400 SETTINGS_EXPORT_INVALID` РІРјРµСЃС‚Рѕ РїСЂРѕРІР°Р»Р° РіР»СѓР±Р¶Рµ РІ route.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј invalid-param РєРѕРЅС‚СЂР°РєС‚РѕРј РґР»СЏ export download route.
- [x] `test:smoke` РѕС‚РІСЏР·Р°РЅ РѕС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ auth bootstrap: smoke-suite С‚РµРїРµСЂСЊ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ С‡РµСЂРµР· `PLAYWRIGHT_SKIP_AUTH_SETUP=1`, Р° РіР»РѕР±Р°Р»СЊРЅС‹Р№ auth setup РєРѕСЂСЂРµРєС‚РЅРѕ РїРёС€РµС‚ РїСѓСЃС‚РѕР№ storage state РґР»СЏ smoke-only Р·Р°РїСѓСЃРєР°.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `13 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ С‚РµСЃС‚РѕРІС‹Р№ tranche: СЂР°СЃС€РёСЂРёС‚СЊ user-owned isolation РЅР° РѕСЃС‚Р°РІС€РёРµСЃСЏ owner-scoped AI/data РєРѕРЅС‚СѓСЂС‹ beyond workout/program/nutrition/exercises/settings export/workout templates/settings deletion/settings billing/AI history.

## 2026-03-15 AI history isolation addendum

- [x] Р Р°СЃС€РёСЂРµРЅ user-owned isolation baseline РґРѕ `AI history`: root-admin РЅРµ РјРѕР¶РµС‚ СѓРґР°Р»РёС‚СЊ С‡СѓР¶СѓСЋ AI session РїРѕ `DELETE /api/ai/sessions/{id}` Рё РЅРµ Р·Р°РґРµРІР°РµС‚ РёСЃС‚РѕСЂРёСЋ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїСЂРё `DELETE /api/ai/sessions`.
- [x] Р”РѕР±Р°РІР»РµРЅ `tests/e2e/helpers/ai.ts`, РєРѕС‚РѕСЂС‹Р№ СЃРёРґРёСЂСѓРµС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєСѓСЋ AI session С‡РµСЂРµР· blocked-flow `/api/ai/chat` Р±РµР· Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РїР»Р°С‚РЅРѕРіРѕ live runtime.
- [x] `tests/e2e/ownership-isolation.spec.ts` С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ owner-scoped РїРѕРІРµРґРµРЅРёРµ Рё РґР»СЏ single-session delete, Рё РґР»СЏ bulk clear AI history.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `14 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-15 workout reset regression addendum

- [x] `tests/e2e/workout-sync.spec.ts` СЂР°СЃС€РёСЂРµРЅ РѕС‚РґРµР»СЊРЅС‹Рј regression-СЃС†РµРЅР°СЂРёРµРј `sync -> done -> reset -> sync/pull`, РєРѕС‚РѕСЂС‹Р№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РїРѕСЃР»Рµ СЃР±СЂРѕСЃР° С‚СЂРµРЅРёСЂРѕРІРєРё `status` СЃРЅРѕРІР° `planned`, `session_duration_seconds` СЃР±СЂРѕС€РµРЅ РІ `0`, Р° РІСЃРµ `actual_reps`, `actual_weight_kg`, `actual_rpe` РѕС‡РёС‰РµРЅС‹.
- [x] Р”Р»СЏ `workout sync contracts` РїРѕРґРЅСЏС‚ timeout РґРѕ `60_000`, С‡С‚РѕР±С‹ РґР»РёРЅРЅС‹Р№ seed/lock/reset flow РЅРµ РґР°РІР°Р» Р»РѕР¶РЅС‹Р№ РєСЂР°СЃРЅС‹Р№ С‚РѕР»СЊРєРѕ РёР·-Р·Р° РІСЂРµРјРµРЅРё, Р° РЅРµ РёР·-Р·Р° СЂРµР°Р»СЊРЅРѕР№ РїСЂРѕР±Р»РµРјС‹ РєРѕРЅС‚СЂР°РєС‚Р°.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `15 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-16 offline reset state addendum

- [x] Р’ `src/lib/offline/workout-sync.ts` РґРѕР±Р°РІР»РµРЅ Р°С‚РѕРјР°СЂРЅС‹Р№ helper `replaceWorkoutDayOfflineState(...)`, РєРѕС‚РѕСЂС‹Р№ РІ РѕРґРЅРѕР№ С‚СЂР°РЅР·Р°РєС†РёРё РѕС‡РёС‰Р°РµС‚ `mutationQueue` РїРѕ `dayId` Рё Р·Р°РјРµРЅСЏРµС‚ `cacheSnapshots` РЅР° СЃРІРµР¶РёР№ snapshot РїРѕСЃР»Рµ reset.
- [x] `src/components/workout-session/use-workout-day-sync.ts` Рё `src/components/workout-session/use-workout-session-actions.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° СЌС‚РѕС‚ Р°С‚РѕРјР°СЂРЅС‹Р№ reset-path, С‡С‚РѕР±С‹ РєР»РёРµРЅС‚СЃРєРёР№ reset РЅРµ Р·Р°РІРёСЃРµР» РѕС‚ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё `clear queue -> refresh count -> persist snapshot`.
- [x] `tests/e2e/helpers/offline-db.ts` РґРѕР±Р°РІР»РµРЅ РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ СЂРµР°Р»СЊРЅС‹Рј Р±СЂР°СѓР·РµСЂРЅС‹Рј `fit-offline` IndexedDB РІРЅСѓС‚СЂРё Playwright regression.
- [x] `tests/e2e/workout-sync.spec.ts` СЂР°СЃС€РёСЂРµРЅ СЃС†РµРЅР°СЂРёРµРј `reset action clears stale local cache and queued mutations`: С‚РµСЃС‚ СЃРёРґРёСЂСѓРµС‚ stale snapshot Рё queued mutations РІ IndexedDB, Р·Р°РїСѓСЃРєР°РµС‚ reset С‡РµСЂРµР· UI Рё РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РїРѕСЃР»Рµ reset Рё reload Р»РѕРєР°Р»СЊРЅРѕРµ offline state СѓР¶Рµ С‡РёСЃС‚РѕРµ.
- [x] `tests/e2e/helpers/workouts.ts` СѓСЃРёР»РµРЅ Р±РѕР»РµРµ С€РёСЂРѕРєРёРј РґРёР°РїР°Р·РѕРЅРѕРј Р±СѓРґСѓС‰РёС… РЅРµРґРµР»СЊ Рё Р±РѕР»СЊС€РёРј С‡РёСЃР»РѕРј retry, С‡С‚РѕР±С‹ seed locked-week РЅРµ РїР°РґР°Р» РѕС‚ РЅР°РєРѕРїРёРІС€РёС…СЃСЏ `active week conflict`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РґРѕР±РёС‚СЊ РѕСЃС‚Р°РІС€РёР№СЃСЏ route/backend audit РїРѕ owner-only access, idempotency Рё race conditions, РІ РїРµСЂРІСѓСЋ РѕС‡РµСЂРµРґСЊ AI retrieval/reindex/proposal ownership Рё locked-program execution guards.

## 2026-03-16 AI proposal isolation addendum

- [x] `tests/e2e/helpers/supabase-admin.ts` РґРѕР±Р°РІР»РµРЅ РєР°Рє РјРёРЅРёРјР°Р»СЊРЅС‹Р№ service-role helper РґР»СЏ owner-isolation e2e: РѕРЅ РїРѕРґС…РІР°С‚С‹РІР°РµС‚ `.env.local`, РЅР°С…РѕРґРёС‚ С‚РµСЃС‚РѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ email Рё СЃРёРґРёСЂСѓРµС‚ user-owned AI proposal Р±РµР· РІС‹Р·РѕРІР° live РјРѕРґРµР»Рё.
- [x] `tests/e2e/helpers/ai.ts` СЂР°СЃС€РёСЂРµРЅ helper-Р°РјРё `ensureAiPlanProposal(...)` Рё `readAiPlanProposal(...)`, РїРѕСЌС‚РѕРјСѓ AI proposal ownership С‚РµРїРµСЂСЊ РјРѕР¶РЅРѕ РїСЂРѕРІРµСЂСЏС‚СЊ Р±РµР· РїР»Р°С‚РЅРѕРіРѕ runtime Рё Р±РµР· СЂСѓС‡РЅРѕРіРѕ SQL seed.
- [x] `tests/e2e/ownership-isolation.spec.ts` СЂР°СЃС€РёСЂРµРЅ СЃС†РµРЅР°СЂРёРµРј `root admin cannot approve or apply another user's AI plan proposal`: root-admin РїРѕР»СѓС‡Р°РµС‚ owner-scoped `404 AI_PROPOSAL_NOT_FOUND` Рё РЅРµ РјРµРЅСЏРµС‚ СЃС‚Р°С‚СѓСЃ С‡СѓР¶РѕРіРѕ proposal.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid-param РєРѕРЅС‚СЂР°РєС‚Р°РјРё РґР»СЏ `POST /api/ai/proposals/not-a-uuid/approve` Рё `/apply`, route-РєРѕРЅС‚СѓСЂ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ СЏРІРЅС‹РјРё `400 AI_PROPOSAL_APPROVE_INVALID` Рё `400 AI_PROPOSAL_APPLY_INVALID`.
- [x] `src/app/api/ai/proposals/[id]/approve/route.ts` Рё `.../apply/route.ts` Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРіРёСЂСѓСЋС‚ РѕР¶РёРґР°РµРјС‹Рµ `400/404` РєР°Рє route-level `error`; Р»РѕРіРёСЂРѕРІР°РЅРёРµ РѕСЃС‚Р°РІР»РµРЅРѕ С‚РѕР»СЊРєРѕ РґР»СЏ РЅРµРѕР¶РёРґР°РЅРЅС‹С… `500` path.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers src/app/api/ai/proposals/[id]/approve/route.ts src/app/api/ai/proposals/[id]/apply/route.ts`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `19 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/data tranche: owner-only / RLS coverage РґР»СЏ retrieval / reindex / proposal listing, Р·Р°С‚РµРј РѕС‚РґРµР»СЊРЅС‹Р№ `test:rls` СЃР»РѕР№ РїРѕРІРµСЂС… route-level isolation.

## 2026-03-16 RLS test baseline addendum

- [x] Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ `npm run test:rls`, РєРѕС‚РѕСЂС‹Р№ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ webServer Рё UI-Р»РѕРіРёРЅР°: suite РёРґС‘С‚ С‡РµСЂРµР· `PLAYWRIGHT_SKIP_AUTH_SETUP=1` Рё РїСЂСЏРјСѓСЋ Supabase auth СЃ С‚РµСЃС‚РѕРІС‹РјРё СѓС‡С‘С‚РєР°РјРё.
- [x] `tests/rls/helpers/supabase-rls.ts` РґРѕР±Р°РІР»РµРЅ РєР°Рє RLS harness: РѕРЅ Р»РѕРіРёРЅРёС‚ РѕР±С‹С‡РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё root-admin С‡РµСЂРµР· РїСѓР±Р»РёС‡РЅС‹Р№ key, Р° fixture СЃРёРґРёСЂСѓРµС‚СЃСЏ service-role helper'РѕРј.
- [x] `tests/rls/ownership.spec.ts` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ row-level РёР·РѕР»СЏС†РёСЋ РЅР°РїСЂСЏРјСѓСЋ РЅР° С‚Р°Р±Р»РёС†Р°С… `ai_plan_proposals`, `exercise_library`, `weekly_programs`, `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`: РІР»Р°РґРµР»РµС† РІРёРґРёС‚ СЃРІРѕРё СЃС‚СЂРѕРєРё, РґСЂСѓРіРѕР№ auth-user РЅРµ РІРёРґРёС‚ РёС… Рё РЅРµ РјРѕР¶РµС‚ РѕР±РЅРѕРІРёС‚СЊ С‡СѓР¶РѕР№ proposal.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, Р·Р°С‚РµРј РѕР±С‰РёРј baseline `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `22 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/data tranche: owner-only / RLS coverage РґР»СЏ retrieval / reindex / proposal listing Рё Р·Р°С‚РµРј СЂР°СЃС€РёСЂРµРЅРёРµ CI РґРѕ РѕС‚РґРµР»СЊРЅС‹С… DB/advisor verification С€Р°РіРѕРІ.

## 2026-03-16 admin users fail-open addendum

- [x] `src/app/api/admin/users/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° degraded fallback: РїСЂРё РІСЂРµРјРµРЅРЅРѕРј СЃР±РѕРµ РІРЅРµС€РЅРёС… РёСЃС‚РѕС‡РЅРёРєРѕРІ route РІРѕР·РІСЂР°С‰Р°РµС‚ РїСѓСЃС‚РѕР№ Р±РµР·РѕРїР°СЃРЅС‹Р№ snapshot СЃ `meta.degraded`, Р° РЅРµ РѕР±С‰РёР№ `500`.
- [x] `src/components/admin-users-directory-model.ts` СЂР°СЃС€РёСЂРµРЅ `meta.degraded`, Р° `src/components/admin-users-directory.tsx` РїРѕРєР°Р·С‹РІР°РµС‚ СЏРІРЅС‹Р№ РѕРїРµСЂР°С‚РѕСЂСЃРєРёР№ banner, РµСЃР»Рё РєР°С‚Р°Р»РѕРі РїСЂРёС€С‘Р» РёР· СЂРµР·РµСЂРІРЅРѕРіРѕ СЃРЅРёРјРєР°.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npx eslint src/app/api/admin/users/route.ts src/components/admin-users-directory.tsx src/components/admin-users-directory-model.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.
- [x] Detail surface `/api/admin/users/[id]` РїРµСЂРµРІРµРґС‘РЅ РЅР° Р°РЅР°Р»РѕРіРёС‡РЅС‹Р№ fail-open/degraded contract: route С‚РµРїРµСЂСЊ РѕС‚РґР°С‘С‚ СЂРµР·РµСЂРІРЅС‹Р№ snapshot РІРјРµСЃС‚Рѕ РѕР±С‰РµРіРѕ `500`, state РїРѕРЅРёРјР°РµС‚ `meta.degraded`, Р° РІРµСЂС…РЅРёР№ СЃР»РѕР№ РєР°СЂС‚РѕС‡РєРё Рё section-switcher РѕС‡РёС‰РµРЅС‹ РѕС‚ mojibake.
- [x] Р”РѕР±Р°РІР»РµРЅ e2e РєРѕРЅС‚СЂР°РєС‚ РЅР° degraded detail snapshot: root-admin РјРѕР¶РµС‚ Р·Р°РїСЂРѕСЃРёС‚СЊ test-only fallback Рё РїРѕР»СѓС‡РёС‚СЊ `meta.degraded = true` Р±РµР· РїР°РґРµРЅРёСЏ РєР°СЂС‚РѕС‡РєРё.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ РѕРїРµСЂР°С‚РѕСЂСЃРєРёР№ tranche: РґРѕР±РёС‚СЊ remaining mojibake Рё timeline/detail РїРѕРґР±Р»РѕРєРё РІРЅСѓС‚СЂРё `admin-user-detail-sections.tsx`, Р»РёР±Рѕ РІРµСЂРЅСѓС‚СЊСЃСЏ Рє AI/data backend audit РїРѕ retrieval / reindex ownership.

## 2026-03-16 admin dashboard fail-open addendum

- [x] `src/app/admin/page.tsx` РїРµСЂРµРІРµРґС‘РЅ РЅР° server-side fail-open: РїСЂРё РІСЂРµРјРµРЅРЅРѕРј СЃР±РѕРµ admin query fan-out hero, quick links Рё operator shell РѕСЃС‚Р°СЋС‚СЃСЏ РґРѕСЃС‚СѓРїРЅС‹РјРё, Р° page РїРѕРєР°Р·С‹РІР°РµС‚ СЏРІРЅС‹Р№ degraded banner РІРјРµСЃС‚Рѕ РїР°РґРµРЅРёСЏ РІСЃРµРіРѕ `/admin`.
- [x] Р’ page РґРѕР±Р°РІР»РµРЅ test-only fallback hook `?__test_admin_dashboard_fallback=1`, С‡С‚РѕР±С‹ СЂРµР·РµСЂРІРЅС‹Р№ СЂРµР¶РёРј РјРѕР¶РЅРѕ Р±С‹Р»Рѕ РїРѕРґС‚РІРµСЂР¶РґР°С‚СЊ РѕС‚РґРµР»СЊРЅС‹Рј e2e Р±РµР· Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ РІРЅРµС€РЅРµРіРѕ timeout.
- [x] `tests/e2e/admin-app.spec.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј СЃС†РµРЅР°СЂРёРµРј `root admin gets degraded fallback for admin dashboard page`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.

## 2026-03-16 AI reindex contract addendum

- [x] `src/app/api/ai/reindex/route.ts` Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРіРёСЂСѓРµС‚ РѕР¶РёРґР°РµРјС‹Рµ `403/400` РєР°Рє warn/error path; logging РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ РЅРµРѕР¶РёРґР°РЅРЅС‹С… `500`.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ РєРѕРЅС‚СЂР°РєС‚РѕРј `ai reindex stays admin-only for authenticated non-admin users`, РїРѕРґС‚РІРµСЂР¶РґР°СЋС‰РёРј `403 ADMIN_REQUIRED`.
- [x] `tests/e2e/admin-app.spec.ts` СЂР°СЃС€РёСЂРµРЅ root-admin СЃС†РµРЅР°СЂРёРµРј РЅР° РЅРµРІР°Р»РёРґРЅС‹Р№ `targetUserId`, РїРѕРґС‚РІРµСЂР¶РґР°СЋС‰РёРј `400 REINDEX_INVALID`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/data tranche: owner-only / RLS coverage РґР»СЏ retrieval / proposal listing Рё Р·Р°С‚РµРј СЂР°СЃС€РёСЂРµРЅРёРµ CI РґРѕ РѕС‚РґРµР»СЊРЅС‹С… DB/advisor verification С€Р°РіРѕРІ.

## 2026-03-16 advisor hardening addendum

- [x] Р§РµСЂРµР· Supabase advisors РїРѕРґС‚РІРµСЂР¶РґС‘РЅ targeted DB-Р°СѓРґРёС‚ РґР»СЏ AI/history/self-service РєРѕРЅС‚СѓСЂРѕРІ: warnings РїРѕ mutable `search_path` Сѓ `public.set_updated_at()` Рё unindexed FK РЅР° `ai_chat_messages`, `export_jobs`, `deletion_requests`, `support_actions`, `admin_audit_logs` Р·Р°РєСЂС‹С‚С‹ РєРѕСЂСЂРµРєС‚РёСЂСѓСЋС‰РµР№ РјРёРіСЂР°С†РёРµР№.
- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260315173518_ai_history_self_service_index_hardening.sql`, РєРѕС‚РѕСЂР°СЏ С„РёРєСЃРёСЂСѓРµС‚ `set_updated_at` СЃ `search_path = public, pg_temp` Рё РґРѕР±Р°РІР»СЏРµС‚ РёРЅРґРµРєСЃС‹ РїРѕРґ AI/history/self-service query paths.
- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260315173725_ai_history_self_service_rls_initplan_hardening.sql`, РєРѕС‚РѕСЂР°СЏ РїРµСЂРµРІРѕРґРёС‚ owner policies AI/history/self-service С‚Р°Р±Р»РёС† РЅР° `(select auth.uid())` Рё Р·Р°РєСЂС‹РІР°РµС‚ `auth_rls_initplan` warnings РґР»СЏ `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, `knowledge_embeddings`, `ai_safety_events`.
- [x] РџРѕСЃР»Рµ DDL РїРѕРІС‚РѕСЂРЅРѕ РїСЂРѕРіРЅР°РЅС‹ Supabase advisors `security` Рё `performance`: targeted warnings РїРѕ СЌС‚РѕР№ РіСЂСѓРїРїРµ С‚Р°Р±Р»РёС† РёСЃС‡РµР·Р»Рё, Р° direct `npm run test:rls` РїРѕРґС‚РІРµСЂРґРёР», С‡С‚Рѕ row-level ownership РїРѕСЃР»Рµ policy-alter РЅРµ СЃР»РѕРјР°Р»СЃСЏ.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ DB tranche: РїСЂРѕР№С‚Рё remaining advisor backlog РїРѕ `auth_rls_initplan`, `rls_enabled_no_policy` РґР»СЏ admin/system tables Рё Р·Р°С‚РµРј РѕС„РѕСЂРјРёС‚СЊ migration/advisor verification РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ CI gate.

## 2026-03-16 internal jobs contracts addendum

- [x] Р”РѕР±Р°РІР»РµРЅ `tests/e2e/internal-jobs.spec.ts` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ contract-suite РґР»СЏ `/api/internal/jobs/*`.
- [x] РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ, С‡С‚Рѕ РѕР±С‹С‡РЅС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРѕР»СѓС‡Р°РµС‚ `403 ADMIN_REQUIRED` РЅР° `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`, `billing-reconcile`.
- [x] РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ, С‡С‚Рѕ root-admin РїРѕР»СѓС‡Р°РµС‚ СЏРІРЅС‹Рµ `400` РЅР° РЅРµРІР°Р»РёРґРЅС‹С… РїР°СЂР°РјРµС‚СЂР°С… `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`.
- [x] `src/app/api/internal/jobs/ai-evals-schedule/route.ts` Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРіРёСЂСѓРµС‚ РѕР¶РёРґР°РµРјС‹Р№ `ZodError` РєР°Рє route-level `error`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `24 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-16 CI regression addendum

- [x] `.github/workflows/quality.yml` СЂР°СЃС€РёСЂРµРЅ secret-guarded jobs `rls` Рё `auth-e2e`.
- [x] `rls` job Р·Р°РїСѓСЃРєР°РµС‚ `npm run test:rls` РїСЂРё РЅР°Р»РёС‡РёРё Supabase Рё Playwright auth secrets.
- [x] `auth-e2e` job Р·Р°РїСѓСЃРєР°РµС‚ `npm run test:e2e:auth` РїСЂРё РЅР°Р»РёС‡РёРё С‚РµС… Р¶Рµ secrets Рё Playwright browser setup.
- [x] `README.md` Рё `docs/RELEASE_CHECKLIST.md` С‚РµРїРµСЂСЊ СЏРІРЅРѕ РїРµСЂРµС‡РёСЃР»СЏСЋС‚ secrets, РЅРµРѕР±С…РѕРґРёРјС‹Рµ РґР»СЏ РїРѕР»РЅРѕРіРѕ CI regression-РєРѕРЅС‚СѓСЂР°.
- [x] Р”РѕР±Р°РІР»РµРЅ migration-aware verification gate РґР»СЏ DB-РёР·РјРµРЅРµРЅРёР№.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ CI tranche: advisor verification gate РґР»СЏ DB-РёР·РјРµРЅРµРЅРёР№.

## 2026-03-16 build warnings addendum

- [x] Р”РѕР±Р°РІР»РµРЅ `docs/BUILD_WARNINGS.md` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ СЂРµРµСЃС‚СЂ РґРѕРїСѓСЃС‚РёРјС‹С… warnings РёР· Sentry/OpenTelemetry instrumentation.
- [x] Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ СѓСЃР»РѕРІРёСЏ, РїСЂРё РєРѕС‚РѕСЂС‹С… С‚РµРєСѓС‰РёР№ webpack warning-С…РІРѕСЃС‚ РѕСЃС‚Р°С‘С‚СЃСЏ РґРѕРїСѓСЃС‚РёРјС‹Рј, Рё СѓСЃР»РѕРІРёСЏ, РїСЂРё РєРѕС‚РѕСЂС‹С… РѕРЅ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ blocker'РѕРј.
- [x] `docs/README.md` Рё РєРѕСЂРЅРµРІРѕР№ `README.md` С‚РµРїРµСЂСЊ СЃСЃС‹Р»Р°СЋС‚СЃСЏ РЅР° СЌС‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РєР°Рє РЅР° source of truth РїРѕ build warning policy.
## 2026-03-16 migration verification addendum

- [x] Р”РѕР±Р°РІР»РµРЅС‹ `scripts/verify-migrations.ps1` Рё `scripts/verify-migrations.mjs`: PowerShell-РѕР±С‘СЂС‚РєР° СЃРѕР±РёСЂР°РµС‚ diff, Р° JS-РІР°Р»РёРґР°С‚РѕСЂ РїСЂРѕРІРµСЂСЏРµС‚ РёР·РјРµРЅРµРЅРёСЏ РІ `supabase/migrations`.
- [x] РЎРєСЂРёРїС‚ РІР°Р»РёРґРёСЂСѓРµС‚ С„РѕСЂРјР°С‚ migration filenames, Р·Р°РїСЂРµС‰Р°РµС‚ РїСѓСЃС‚С‹Рµ `.sql` Рё С‚СЂРµР±СѓРµС‚ СЃРёРЅС…СЂРѕРЅРЅС‹Рµ updates РІ `docs/MASTER_PLAN.md` Рё `docs/AI_WORKLOG.md`.
- [x] `.github/workflows/quality.yml` С‚РµРїРµСЂСЊ Р·Р°РїСѓСЃРєР°РµС‚ СЌС‚РѕС‚ gate РїРµСЂРµРґ РѕСЃРЅРѕРІРЅС‹Рј `quality` job, Р° Р»РѕРєР°Р»СЊРЅРѕ РѕРЅ РґРѕСЃС‚СѓРїРµРЅ С‡РµСЂРµР· `npm run verify:migrations`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ DB tranche: СЂРµР°Р»СЊРЅРѕРµ advisor verification РІ CI РёР»Рё РѕС‚РґРµР»СЊРЅС‹Р№ automation gate РґР»СЏ `security/performance` РїРѕСЃР»Рµ DDL.

## 2026-03-16 test build fallback addendum

- [x] РќР° С‚РµРєСѓС‰РµРј Windows/Next.js 16 СЃС‚РµРєРµ custom `NEXT_DIST_DIR` РґР»СЏ `next build` РґР°С‘С‚ `spawn EPERM`, РїРѕСЌС‚РѕРјСѓ `build:test` Рё `start:test` РІРѕР·РІСЂР°С‰РµРЅС‹ РЅР° СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ `.next`.
- [x] РР·РѕР»СЏС†РёСЏ РЅРµ РїРѕС‚РµСЂСЏРЅР° РїРѕР»РЅРѕСЃС‚СЊСЋ: `typecheck` РїРѕ-РїСЂРµР¶РЅРµРјСѓ РёСЃРїРѕР»СЊР·СѓРµС‚ РѕС‚РґРµР»СЊРЅС‹Р№ `.next_build`, Р° e2e/smoke СЃРµСЂРІРµСЂ РѕСЃС‚Р°С‘С‚СЃСЏ РЅР° РІС‹РґРµР»РµРЅРЅРѕРј РїРѕСЂС‚Сѓ `3100`.

## 2026-03-21 Android / TWA preparation addendum

- [x] Р”РѕР±Р°РІР»РµРЅ Android/TWA release blueprint `android/twa-release.json`: package name `app.fitplatform.mobile`, production host, splash assets, signing placeholders Рё Play metadata С‚РµРїРµСЂСЊ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ РєР°Рє source of truth.
- [x] Р”РѕР±Р°РІР»РµРЅ `npm run verify:android-twa`: СЃРєСЂРёРїС‚ РІР°Р»РёРґРёСЂСѓРµС‚ release blueprint, РёРєРѕРЅРєРё, manifest-Р·Р°РІРёСЃРёРјРѕСЃС‚Рё Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓРµС‚ `public/android-assetlinks.json`.
- [x] `/.well-known/assetlinks.json` С‚РµРїРµСЂСЊ РѕР±СЃР»СѓР¶РёРІР°РµС‚СЃСЏ production-safe rewrite С‡РµСЂРµР· `next.config.ts`, РїРѕСЌС‚РѕРјСѓ Digital Asset Links endpoint РґРѕСЃС‚СѓРїРµРЅ Рё Р»РѕРєР°Р»СЊРЅРѕ, Рё РЅР° Vercel Р±РµР· РЅРµСЃС‚Р°Р±РёР»СЊРЅРѕРіРѕ app-route РїРѕРґ dot-segment.
- [x] `tests/smoke/app-smoke.spec.ts` СЂР°СЃС€РёСЂРµРЅ Android/TWA smoke-check РЅР° `/.well-known/assetlinks.json`.
- [x] РЎР°РЅРёСЂРѕРІР°РЅС‹ Рё РїРѕРІС‚РѕСЂРЅРѕ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РєР»СЋС‡РµРІС‹Рµ release/handoff docs: `README.md`, `docs/README.md`, `docs/PROD_READY.md`, `docs/RELEASE_CHECKLIST.md`, `docs/BUILD_WARNINGS.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, `docs/AI_STACK.md`, `docs/DB_AUDIT.md`, `docs/USER_GUIDE.md`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РєРѕРјР°РЅРґР°РјРё `npm run verify:android-twa`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth` -> `50 passed`.
- [x] РСЃС‚РѕСЂРёС‡РµСЃРєРёР№ blocker РїРѕ `java` Рё `adb` СЃРЅСЏС‚: РЅР° `2026-03-30` JDK 17, Android SDK, `adb` Рё `bubblewrap doctor` РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹, СЂРµР°Р»СЊРЅС‹Р№ TWA wrapper СЃРѕР±СЂР°РЅ Рё РїСЂРѕРІРµСЂРµРЅ РЅР° СЌРјСѓР»СЏС‚РѕСЂРµ.

## 2026-03-30 Android / TWA closure addendum

- [x] Р”Р»СЏ `fit-platform` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ СЂРµР°Р»СЊРЅС‹Р№ Android toolchain: `java -version`, `adb --version` Рё `npx @bubblewrap/cli doctor` РїСЂРѕС…РѕРґСЏС‚ РЅР° С‚РµРєСѓС‰РµР№ РјР°С€РёРЅРµ.
- [x] Р’ [android/twa-shell](/C:/fit/android/twa-shell) СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅ РїРѕР»РЅРѕС†РµРЅРЅС‹Р№ Bubblewrap-РїСЂРѕРµРєС‚ РїРѕ production manifest `https://fit-platform-eta.vercel.app/manifest.webmanifest`, Р° РЅРµ С‚РѕР»СЊРєРѕ JSON-scaffold.
- [x] `npx @bubblewrap/cli build --manifest="C:\fit\android\twa-shell\twa-manifest.json" --skipPwaValidation` СѓСЃРїРµС€РЅРѕ СЃРѕР±СЂР°Р» signed APK Рё AAB С‡РµСЂРµР· Р»РѕРєР°Р»СЊРЅС‹Р№ test keystore РІРЅРµ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ.
- [x] Android smoke РЅР° production URL РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РµСЂРµР· СЌРјСѓР»СЏС‚РѕСЂ `Medium_Phone_API_36.1`: `adb install -r`, `adb shell am start -W -n app.fitplatform.mobile/.LauncherActivity` Рё logcat СЃ `TWALauncherActivity: Using url from Manifest: https://fit-platform-eta.vercel.app/dashboard`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚С‹ РѕСЃРЅРѕРІРЅС‹Рµ checklist-РїСѓРЅРєС‚С‹ `Р“РѕС‚РѕРІ TWA wrapper`, `РЎРѕР±СЂР°С‚СЊ Рё РїСЂРѕРІРµСЂРёС‚СЊ TWA wrapper`, `РџСЂРѕР№С‚Рё Android smoke РЅР° production URL` Рё acceptance-РїСѓРЅРєС‚ `Android wrapper smoke РїСЂРѕР№РґРµРЅ РїРѕСЃР»Рµ СЃС‚Р°Р±РёР»РёР·Р°С†РёРё web/PWA`.

## 2026-03-19 DB audit addendum

- [x] Р§РµСЂРµР· Supabase MCP Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РїРѕР»РЅС‹Р№ СЃРЅРёРјРѕРє repo-controlled DB-РєРѕРЅС‚СѓСЂР°: `list_tables`, `security/performance advisors`, `pg_indexes`, `pg_policies`, `information_schema.routines`.
- [x] РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ, С‡С‚Рѕ РІСЃРµ РёСЃРїРѕР»СЊР·СѓРµРјС‹Рµ `public`-С‚Р°Р±Р»РёС†С‹ РїСЂРёР»РѕР¶РµРЅРёСЏ РЅР°С…РѕРґСЏС‚СЃСЏ РїРѕРґ `RLS`, Р° РєР»СЋС‡РµРІС‹Рµ owner-only Рё deny-all policy-РїР°С‚С‚РµСЂРЅС‹ СЃРѕРІРїР°РґР°СЋС‚ СЃ route-level Рё direct `test:rls` РїРѕРєСЂС‹С‚РёРµРј.
- [x] РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РёРЅРґРµРєСЃРЅС‹Рµ РїСѓС‚Рё РґР»СЏ `sync`, `workout`, `knowledge`, `admin` Рё `billing`; missing-index backlog РїРѕ СЌС‚РёРј РєРѕРЅС‚СѓСЂР°Рј СѓР¶Рµ Р·Р°РєСЂС‹С‚ corrective migrations, Р° РІ advisors РѕСЃС‚Р°Р»РёСЃСЊ С‚РѕР»СЊРєРѕ `unused_index` info.
- [x] РђРєС‚СѓР°Р»СЊРЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ Р°СѓРґРёС‚Р° РІС‹РЅРµСЃРµРЅ РІ `docs/DB_AUDIT.md`, Р° platform-level residuals РїРѕ `vector` РІ `public` Рё `leaked password protection` С„РѕСЂРјР°Р»РёР·РѕРІР°РЅС‹ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Рµ release steps, Р° РЅРµ РєР°Рє РЅРµСЏСЃРЅС‹Р№ С…РІРѕСЃС‚.
- [x] РџРѕСЃР»Рµ rollback test-build РєРѕРЅС‚СѓСЂР° baseline СЃРЅРѕРІР° Р·РµР»С‘РЅС‹Р№ Р»РѕРєР°Р»СЊРЅРѕ: `build`, `test:smoke`, `test:rls`, `test:e2e:auth`.

## 2026-03-16 frontend docs sanitation addendum

- [x] `docs/FRONTEND.md` РїРѕР»РЅРѕСЃС‚СЊСЋ РїРµСЂРµРїРёСЃР°РЅ РІ РЅРѕСЂРјР°Р»СЊРЅРѕРј UTF-8 РІРјРµСЃС‚Рѕ mojibake Рё СЃРЅРѕРІР° РѕРїРёСЃС‹РІР°РµС‚ С‚РµРєСѓС‰РёР№ shell, workspace-РїР°С‚С‚РµСЂРЅ, workouts, nutrition, AI workspace Рё admin UI.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation tranche: РїСЂРѕР№С‚Рё РѕСЃС‚Р°РІС€РёРµСЃСЏ РєР»СЋС‡РµРІС‹Рµ docs/UI-РїРѕРІРµСЂС…РЅРѕСЃС‚Рё РЅР° СЂРµР°Р»СЊРЅС‹Рµ mojibake Рё СѓСЃС‚Р°СЂРµРІС€РёРµ handoff-РѕРїРёСЃР°РЅРёСЏ, РЅРµ С‚СЂРѕРіР°СЏ РѕС‚РґРµР»СЊРЅРѕ triaged `docs/AI_EXPLAINED.md`.

## 2026-03-16 prod-ready definition addendum

- [x] Р”РѕР±Р°РІР»РµРЅ `docs/PROD_READY.md` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ source of truth РїРѕ `prod-ready`: automated gates, manual acceptance, env readiness Рё release blockers.
- [x] `docs/README.md` Рё РєРѕСЂРЅРµРІРѕР№ `README.md` С‚РµРїРµСЂСЊ СЃСЃС‹Р»Р°СЋС‚СЃСЏ РЅР° СЌС‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РІРјРµСЃС‚Рѕ РЅРµСЏРІРЅРѕРіРѕ вЂњР·РµР»С‘РЅС‹Р№ build = РјРѕР¶РЅРѕ РІС‹РєР°С‚С‹РІР°С‚СЊвЂќ.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ release tranche: staging-like verification РґР»СЏ Stripe Рё AI runtime СѓР¶Рµ РїСЂРѕС‚РёРІ СЌС‚РѕРіРѕ СЏРІРЅРѕРіРѕ `prod-ready` РєСЂРёС‚РµСЂРёСЏ.

## 2026-03-16 ui regression addendum

- [x] Р”РѕР±Р°РІР»РµРЅ `tests/e2e/ui-regressions.spec.ts` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ regression-СЃР»РѕР№ РґР»СЏ client-side РїСЂРѕР±Р»РµРј: hydration mismatch, render-loop СЃРѕРѕР±С‰РµРЅРёСЏ Рё runaway `sync/pull` РЅР° workout focus-mode.
- [x] Р”РѕР±Р°РІР»РµРЅ `tests/e2e/helpers/client-regressions.ts`, РєРѕС‚РѕСЂС‹Р№ Р»РѕРІРёС‚ browser console/pageerror СЃРёРіРЅР°Р»С‹ РІСЂРѕРґРµ `Hydration failed`, `Maximum update depth exceeded`, `Recoverable Error`.
- [x] `tests/e2e/helpers/http.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° `browserContext.request`, РїРѕСЌС‚РѕРјСѓ API contract tests Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃСЏС‚ РѕС‚ flaky `page.evaluate` Рё `networkidle`.
- [x] Full authenticated regression contour РїРѕРґС‚РІРµСЂР¶РґС‘РЅ Р·Р°РЅРѕРІРѕ: `npm run test:e2e:auth` -> `27 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ UI reliability tranche: СЂР°СЃС€РёСЂРёС‚СЊ automated coverage РЅР° РѕСЃС‚Р°РІС€РёРµСЃСЏ layout/PWA-specific regressions beyond hydration/loop/polling.

## 2026-03-16 workspace sanitation and AI stability addendum

- [x] `src/components/page-workspace.tsx` Рё `src/components/dashboard-workspace.tsx` РїРµСЂРµРїРёСЃР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8: Р±Р°Р·РѕРІС‹Р№ workspace-РєРѕРЅС‚СѓСЂ `Dashboard / Workouts / Nutrition` Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°РµС‚ mojibake РІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕР№ РїРѕРІРµСЂС…РЅРѕСЃС‚Рё.
- [x] `src/components/ai-workspace.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx` Рё `src/app/ai/page.tsx` СЃР°РЅРёСЂРѕРІР°РЅС‹ РґРѕ С‡РёСЃС‚РѕРіРѕ UTF-8 Рё РїСЂРёРІРµРґРµРЅС‹ Рє РЅРѕСЂРјР°Р»СЊРЅРѕРјСѓ СЂСѓСЃСЃРєРѕРјСѓ UX.
- [x] `src/components/ai-chat-panel.tsx` РїРµСЂРµРІРµРґРµРЅ РЅР° `useSyncExternalStore` РїРѕРІРµСЂС… `sessionStorage` РґР»СЏ web-search toggle, С‡С‚РѕР±С‹ СЂРµР¶РёРј РЅРµ С‚РµСЂСЏР»СЃСЏ РїСЂРё client remount Рё РЅРµ С‚СЂРµР±РѕРІР°Р» `setState` РІРЅСѓС‚СЂРё effect.
- [x] `tests/e2e/ai-workspace.spec.ts`, `tests/e2e/ui-regressions.spec.ts` Рё `tests/e2e/helpers/http.ts` СѓСЃРёР»РµРЅС‹ РїСЂРѕС‚РёРІ flaky modal/admin-detail/auth timing, Р° РїРѕР»РЅС‹Р№ baseline СЃРЅРѕРІР° Р·РµР»РµРЅС‹Р№: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [x] `src/lib/admin-permissions.ts`, `src/components/admin-role-manager.tsx`, `src/components/admin-user-actions.tsx`, `src/components/admin-ai-operations.tsx`, `src/components/admin-ai-eval-runs.tsx` Рё `src/components/admin-operations-inbox.tsx` РїРµСЂРµРїРёСЃР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8: operator surfaces Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake Рё РЅРµ РїРѕРєР°Р·С‹РІР°СЋС‚ Р»РёС€РЅРёРµ role/capability РґРµС‚Р°Р»Рё РЅРµ-root Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°Рј.
- [x] РЎР°РЅРёС‚Р°СЂРЅС‹Р№ tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїРѕРІС‚РѕСЂРЅС‹Рј baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation tranche: РґРѕР±РёС‚СЊ РѕСЃС‚Р°РІС€РёРµСЃСЏ СЃР»РѕРІР°СЂРё/formatters РІ `admin-users-directory-model.ts` Рё `admin-user-detail-model.ts`, Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє СЃР»РµРґСѓСЋС‰РµРјСѓ backend/advisor tranche.

## 2026-03-17 advisor initplan and policy merge addendum

- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260317012000_query_path_and_fk_index_hardening.sql`: Р·Р°РєСЂС‹С‚С‹ targeted `unindexed_foreign_keys` Рё РїРµСЂРІР°СЏ РІРѕР»РЅР° `auth_rls_initplan` РґР»СЏ `profiles`, `subscriptions`, `subscription_events`, `workout_days`, `ai_plan_proposals`.
- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260317014500_owner_policy_initplan_hardening.sql`: owner-policies РЅР° `body_metrics`, `daily_metrics`, `daily_nutrition_summaries`, `entitlements`, `exercise_library`, `foods`, `goals`, `meal_items`, `meal_templates`, `meals`, `nutrition_goals`, `nutrition_profiles`, `onboarding_profiles`, `period_metric_snapshots`, `recipe_items`, `recipes`, `usage_counters`, `user_memory_facts`, `weekly_programs`, `workout_exercises`, `workout_sets`, `workout_templates`, РїР»СЋСЃ `platform_admins_self_select` Рё `user_admin_states_owner_select` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° `(select auth.uid())`.
- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260317015500_foods_select_policy_merge.sql`: РґРІР° permissive select-policy РЅР° `public.foods` СЃС…Р»РѕРїРЅСѓС‚С‹ РІ РѕРґРЅСѓ `foods_access_select`, Рё performance-advisor Р±РѕР»СЊС€Рµ РЅРµ СЂСѓРіР°РµС‚СЃСЏ РЅР° `multiple_permissive_policies`.
- [x] РџРѕСЃР»Рµ DDL РїРѕРІС‚РѕСЂРЅРѕ РїСЂРѕРіРЅР°РЅС‹ Supabase advisors `performance` Рё `security`: performance backlog РѕС‡РёС‰РµРЅ РѕС‚ `auth_rls_initplan`, `multiple_permissive_policies` Рё targeted FK warnings; РІ backlog РѕСЃС‚Р°Р»РёСЃСЊ С‚РѕР»СЊРєРѕ `unused_index` info Рё РѕС‚РґРµР»СЊРЅС‹Р№ security-layer (`rls_enabled_no_policy`, `extension_in_public`, `auth_leaked_password_protection`).
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїРѕР»РЅС‹Рј baseline: `npm run verify:migrations`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ DB tranche: Р»РёР±Рѕ РѕСЃРѕР·РЅР°РЅРЅРѕ СЂР°Р·Р±РёСЂР°С‚СЊ security-advisor backlog РїРѕ service-role/admin tables, Р»РёР±Рѕ РІРІРѕРґРёС‚СЊ advisor-policy document/gate РІРјРµСЃС‚Рѕ СЃР»РµРїРѕРіРѕ РґРѕР±Р°РІР»РµРЅРёСЏ RLS policies РЅР° СЃРёСЃС‚РµРјРЅС‹Рµ С‚Р°Р±Р»РёС†С‹.

## 2026-03-17 ui regression selector hardening addendum

- [x] `tests/e2e/ui-regressions.spec.ts` Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ С…СЂСѓРїРєРѕРіРѕ `button[aria-pressed]` РЅР° РІСЃРµС… user surfaces; suite Р¶РґС‘С‚ РіР°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅС‹Р№ page-root (`main`) С‚Р°Рј, РіРґРµ section-pill РЅРµ СЏРІР»СЏРµС‚СЃСЏ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј DOM-РєРѕРЅС‚СЂР°РєС‚РѕРј.
- [x] РџРѕСЃР»Рµ РїСЂР°РІРєРё full authenticated regression contour СЃРЅРѕРІР° РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С†РµР»РёРєРѕРј Р±РµР· flaky failure РІ `ui regressions`.

## 2026-03-17 security advisor policy baseline addendum

- [x] Р”РѕР±Р°РІР»РµРЅР° РјРёРіСЂР°С†РёСЏ `supabase/migrations/20260317022000_system_table_rls_policy_baseline.sql`: РЅР° `admin_audit_logs`, `ai_eval_results`, `ai_eval_runs`, `feature_flags`, `platform_settings`, `support_actions`, `system_metrics_snapshots` Р·Р°РґР°РЅС‹ СЏРІРЅС‹Рµ deny-all policies `..._deny_all`.
- [x] РџРµСЂРµРґ РјРёРіСЂР°С†РёРµР№ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ РїРѕ РєРѕРґСѓ, С‡С‚Рѕ СЌС‚Рё С‚Р°Р±Р»РёС†С‹ С‡РёС‚Р°СЋС‚СЃСЏ С‡РµСЂРµР· `createAdminSupabaseClient()` РёР»Рё service-role paths, РїРѕСЌС‚РѕРјСѓ СЏРІРЅС‹Рµ deny-all policies РЅРµ РјРµРЅСЏСЋС‚ user-facing runtime-РєРѕРЅС‚СЂР°РєС‚С‹ Рё РЅРµ РјРµС€Р°СЋС‚ admin/service-role РґРѕСЃС‚СѓРїСѓ.
- [x] РџРѕСЃР»Рµ DDL РїРѕРІС‚РѕСЂРЅРѕ РїСЂРѕРіРЅР°РЅС‹ advisors: `security` Р±РѕР»СЊС€Рµ РЅРµ СЃРѕРґРµСЂР¶РёС‚ `rls_enabled_no_policy`, Р° remaining security backlog СЃСѓР¶РµРЅ РґРѕ РґРІСѓС… platform-level warning вЂ” `extension_in_public` РґР»СЏ `vector` Рё `auth_leaked_password_protection`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ verification-РїР°РєРµС‚РѕРј: `npm run verify:migrations`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ DB tranche: РѕС‚РґРµР»СЊРЅРѕ РѕС„РѕСЂРјРёС‚СЊ policy РїРѕ РґРІСѓРј РѕСЃС‚Р°РІС€РёРјСЃСЏ platform-level warning (`vector` schema Рё leaked password protection) Рё СЂРµС€РёС‚СЊ, С‡С‚Рѕ РёР· СЌС‚РѕРіРѕ Р°РІС‚РѕРјР°С‚РёР·РёСЂСѓРµС‚СЃСЏ РІ repo, Р° С‡С‚Рѕ РѕСЃС‚Р°С‘С‚СЃСЏ РІРЅРµС€РЅРёРј release checklist РґР»СЏ Supabase РїСЂРѕРµРєС‚Р°.

## 2026-03-17 workspace surface sanitation addendum

- [x] `src/components/page-workspace.tsx` РїРѕРІС‚РѕСЂРЅРѕ СЃР°РЅРёСЂРѕРІР°РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8: Р±Р»РѕРєРё `РќР°СЃС‚СЂРѕР№РєР° СЌРєСЂР°РЅР°`, `Р Р°Р·РґРµР»С‹`, `РўРµРєСѓС‰РёР№ СЂР°Р·РґРµР»`, `РЎРєСЂС‹С‚СЊ/РџРѕРєР°Р·Р°С‚СЊ` Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake РЅР° `Workouts` Рё `Nutrition`.
- [x] Р’ `page-workspace` РґРѕР±Р°РІР»РµРЅС‹ СЃС‚Р°Р±РёР»СЊРЅС‹Рµ `data-testid` РґР»СЏ mobile section-trigger, mobile section-options Рё visibility toggles, С‡С‚РѕР±С‹ mobile/PWA regression suite РЅРµ Р·Р°РІРёСЃРµР» РѕС‚ copy.
- [x] `src/components/dashboard-workspace.tsx` РїРµСЂРµРїРёСЃР°РЅ РІ С‡РёСЃС‚РѕРј UTF-8: hero, summary, AI context Рё section-menu РЅР° `/dashboard` С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°СЋС‚ РЅРѕСЂРјР°Р»СЊРЅС‹Р№ СЂСѓСЃСЃРєРёР№ С‚РµРєСЃС‚ Рё РЅРµ РґРµСЂР¶Р°С‚ Р±РёС‚С‹Рµ СЃС‚СЂРѕРєРё РІ mobile PWA.
- [x] `src/app/workouts/page.tsx` Рё `src/app/nutrition/page.tsx` СЃРЅРѕРІР° РѕС‚РґР°СЋС‚ С‡РёСЃС‚С‹Р№ user-facing copy РґР»СЏ badges, title, metrics Рё section descriptions.
- [x] `tests/e2e/mobile-pwa-regressions.spec.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РЅРѕРІС‹Рµ stable selectors; regression suite РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ `Dashboard / Workouts / Nutrition / Admin` mobile surfaces РѕСЃС‚Р°СЋС‚СЃСЏ usable Р±РµР· overflow Рё Р±РµР· Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ СЃС‚Р°СЂРѕРіРѕ mojibake.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: РґРѕР±РёС‚СЊ remaining mojibake Рё operator copy РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ user-facing surfaces, Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє `owner-only / idempotency / retrieval` audit РїРѕ AI/data routes.

## 2026-03-17 admin user detail sanitation addendum

- [x] РџРѕР»РЅРѕСЃС‚СЊСЋ СЃР°РЅРёСЂРѕРІР°РЅ `admin user detail` surface: `src/components/admin-user-detail.tsx`, `src/components/admin-user-detail-state.ts`, `src/components/admin-user-detail-model.ts`, `src/components/admin-user-detail-sections.tsx`, `src/components/admin-user-detail-operations.tsx`, `src/components/admin-user-detail-billing.tsx`, `src/app/admin/users/[id]/page.tsx` РїРµСЂРµРїРёСЃР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8.
- [x] РљР°СЂС‚РѕС‡РєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, СЃРµРєС†РёРё `РџСЂРѕС„РёР»СЊ / РђРєС‚РёРІРЅРѕСЃС‚СЊ / РћРїРµСЂР°С†РёРё / РћРїР»Р°С‚Р°`, degraded-banner, summary metrics, role/status СЃР»РѕРІР°СЂРё Рё timeline/billing РєРѕР»Р»РµРєС†РёРё С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°СЋС‚ РЅРѕСЂРјР°Р»СЊРЅС‹Р№ СЂСѓСЃСЃРєРёР№ operator copy Р±РµР· mojibake.
- [x] Р”РѕР¶Р°С‚ flaky admin fallback regression: `src/app/admin/page.tsx` РїРѕР»СѓС‡РёР» СЃС‚Р°Р±РёР»СЊРЅС‹Рµ `data-testid` РґР»СЏ degraded CTA-РєРЅРѕРїРѕРє, Р° `tests/e2e/admin-app.spec.ts` Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ РѕР±С‰РµРіРѕ `href`-Р»РѕРєР°С‚РѕСЂР° РЅР° С„РѕРЅРµ shell/nav DOM.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline: `npx eslint ...admin-user-detail* src/app/admin/page.tsx tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`, `npx playwright test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `3 passed`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: РїСЂРѕР№С‚Рё remaining operator copy РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ admin/user-facing surfaces Рё Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє `owner-only / idempotency / retrieval` audit РїРѕ AI/data routes.

## 2026-03-17 AI route copy sanitation addendum

- [x] РџРѕР»РЅРѕСЃС‚СЊСЋ СЃР°РЅРёСЂРѕРІР°РЅ user-facing copy РІ `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts`, `src/app/api/ai/meal-plan/route.ts`, `src/app/api/ai/workout-plan/route.ts`, `src/app/api/ai/reindex/route.ts`, `src/app/api/ai/sessions/route.ts`, `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`.
- [x] РР· AI API СѓР±СЂР°РЅС‹ Р°РЅРіР»РёР№СЃРєРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ Рё Р»РёС€РЅРёРµ С‚РµС…РЅРёС‡РµСЃРєРёРµ С„РѕСЂРјСѓР»РёСЂРѕРІРєРё РІСЂРѕРґРµ `AI runtime`, `live-Р·Р°РїСЂРѕСЃС‹`, `AI-РїСЂРµРґР»РѕР¶РµРЅРёРµ`; РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєР°СЏ РїРѕРІРµСЂС…РЅРѕСЃС‚СЊ С‚РµРїРµСЂСЊ РІРµР·РґРµ РіРѕРІРѕСЂРёС‚ РїРѕ-СЂСѓСЃСЃРєРё Рё РїРѕРЅСЏС‚РЅРµРµ СЂР°Р·РІРѕРґРёС‚ runtime/config РѕС€РёР±РєРё.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline: `npx eslint ...src/app/api/ai/*`, `npm run typecheck`, `npm run build`, `npm run build:test`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `6 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РІРµСЂРЅСѓС‚СЊСЃСЏ Рє `owner-only / idempotency / retrieval` audit РїРѕ AI/data routes Рё РґРѕР±РёС‚СЊ remaining route-level ownership coverage.

## 2026-03-17 direct RLS ownership expansion addendum

- [x] `tests/rls/helpers/supabase-rls.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹РјРё fixture rows РґР»СЏ `foods`, `recipes`, `recipe_items` Рё `workout_templates`, seeded С‡РµСЂРµР· service-role РїРѕРґ С‚РµСЃС‚РѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
- [x] `tests/rls/ownership.spec.ts` С‚РµРїРµСЂСЊ РЅР°РїСЂСЏРјСѓСЋ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ row-level РёР·РѕР»СЏС†РёСЋ РЅРµ С‚РѕР»СЊРєРѕ РґР»СЏ `ai_plan_proposals`, `exercise_library`, `weekly_programs`, `ai_chat_*`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, РЅРѕ Рё РґР»СЏ `foods`, `recipes`, `workout_templates`.
- [x] Р—Р°РѕРґРЅРѕ РґРѕС‡РёС‰РµРЅ user-facing copy РІ `src/app/api/workout-templates/route.ts`, `src/app/api/foods/route.ts`, `src/app/api/recipes/route.ts`: self-service С‚СЂРµРЅРёСЂРѕРІРєРё Рё РїРёС‚Р°РЅРёРµ Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ Р°РЅРіР»РёР№СЃРєРёРµ login/save/load СЃРѕРѕР±С‰РµРЅРёСЏ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline: `npx eslint tests/rls tests/rls/helpers src/app/api/workout-templates/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts`, `npm run test:rls` -> `1 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ `owner-only / idempotency / retrieval` audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ AI/data routes Рё Р·Р°С‚РµРј СЂРµС€РёС‚СЊ, РЅСѓР¶РµРЅ Р»Рё РµС‰С‘ РѕРґРёРЅ direct RLS СЃР»РѕР№ РґР»СЏ РѕСЃС‚Р°РІС€РёС…СЃСЏ user-scoped tables.

## 2026-03-17 product API sanitation addendum

- [x] РЎР°РЅРёСЂРѕРІР°РЅ user-facing copy РІ `src/app/api/weekly-programs/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/meal-templates/route.ts`, `src/app/api/meals/route.ts`, `src/app/api/settings/billing/route.ts`.
- [x] `weekly programs`, `nutrition targets`, `onboarding`, `legacy chat`, `meal templates`, `meals` Рё `settings billing` Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ Р°РЅРіР»РёР№СЃРєРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ Рё mojibake РІ user-facing error surface.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: РґРѕС‡РёСЃС‚РёС‚СЊ РѕСЃС‚Р°РІС€РёРµСЃСЏ self-service Рё product API routes РІРЅРµ СЌС‚РѕРіРѕ РїР°РєРµС‚Р°, Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє owner-only / retrieval audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ AI/data РєРѕРЅС‚СѓСЂР°Рј.

## 2026-03-17 self-service route sanitation follow-up

- [x] РЎР°РЅРёСЂРѕРІР°РЅ user-facing copy РІ `src/app/api/foods/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/settings/data/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`.
- [x] Delete/update/export РїРѕРІРµСЂС…РЅРѕСЃС‚Рё РґР»СЏ РїСЂРѕРґСѓРєС‚РѕРІ, С€Р°Р±Р»РѕРЅРѕРІ РїРёС‚Р°РЅРёСЏ, РїСЂРёС‘РјРѕРІ РїРёС‰Рё, СЂРµС†РµРїС‚РѕРІ Рё С†РµРЅС‚СЂР° РґР°РЅРЅС‹С… Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake Рё РІС‹СЂРѕРІРЅРµРЅС‹ РїРѕ РїРѕРЅСЏС‚РЅРѕРјСѓ СЂСѓСЃСЃРєРѕРјСѓ self-service UX.
- [x] Follow-up РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: РґРѕС‡РёСЃС‚РёС‚СЊ remaining operator/self-service routes РІРЅРµ СЌС‚РѕРіРѕ РїР°РєРµС‚Р° Рё Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє owner-only / retrieval audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ AI/data РєРѕРЅС‚СѓСЂР°Рј.

## 2026-03-17 billing sync workout copy sanitation addendum

- [x] РЎР°РЅРёСЂРѕРІР°РЅ user-facing copy РІ `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/dashboard/period-compare/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/exercises/[id]/route.ts`, `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts`, `src/app/api/workout-sets/[id]/route.ts`.
- [x] Billing, dashboard compare, exercise library, sync Рё workout execution route surface С‚РµРїРµСЂСЊ РѕС‚РґР°СЋС‚ РїРѕРЅСЏС‚РЅС‹Р№ СЂСѓСЃСЃРєРёР№ copy РІРјРµСЃС‚Рѕ Р°РЅРіР»РёР№СЃРєРёС… login/update/error СЃРѕРѕР±С‰РµРЅРёР№.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: РґРѕС‡РёСЃС‚РёС‚СЊ remaining operator/internal routes СЃ Р°РЅРіР»РёР№СЃРєРёРј copy Рё Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє owner-only / retrieval audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ AI/data РєРѕРЅС‚СѓСЂР°Рј.

## 2026-03-17 operator internal copy sanitation addendum

- [x] РЎР°РЅРёСЂРѕРІР°РЅ operator/internal copy РІ `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/bootstrap/route.ts`, `src/app/api/admin/operations/route.ts`, `src/app/api/admin/operations/process/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts`, `src/app/api/admin/users/[id]/deletion/route.ts`, `src/app/api/admin/users/[id]/export/route.ts`, `src/app/api/admin/users/[id]/restore/route.ts`, `src/app/api/admin/users/[id]/role/route.ts`, `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts`, `src/app/api/billing/webhook/stripe/route.ts`, `src/app/api/internal/jobs/billing-reconcile/route.ts`, `src/app/api/internal/jobs/dashboard-warm/route.ts`, `src/app/api/internal/jobs/knowledge-reindex/route.ts`, `src/app/api/internal/jobs/nutrition-summaries/route.ts`.
- [x] Operator/internal API surface Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°РµС‚ Р°РЅРіР»РёР№СЃРєРёРµ payload/update/queue/error СЃРѕРѕР±С‰РµРЅРёСЏ Рё РІС‹СЂРѕРІРЅРµРЅ РїРѕ СЂСѓСЃСЃРєРѕРјСѓ operator UX.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє owner-only / retrieval audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ AI/data РєРѕРЅС‚СѓСЂР°Рј Рё Р·Р°С‚РµРј Р·Р°РєСЂС‹РІР°С‚СЊ AI quality gate.

## 2026-03-17 AI runtime UX and build reuse addendum

- [x] `src/components/ai-chat-panel-model.ts`, `src/components/ai-chat-notices.tsx`, `src/components/use-ai-chat-actions.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-view-state.ts`, `src/components/ai-chat-panel.tsx` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° typed AI notice-РјРѕРґРµР»СЊ, С‡С‚РѕР±С‹ UI СЏРІРЅРѕ СЂР°Р·Р»РёС‡Р°Р» `provider/config` Рё `runtime` РѕС€РёР±РєРё РІРјРµСЃС‚Рѕ РѕРґРЅРѕРіРѕ РѕР±С‰РµРіРѕ РєСЂР°СЃРЅРѕРіРѕ Р±Р°РЅРЅРµСЂР°.
- [x] `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts` С‚РµРїРµСЂСЊ РѕС‚РґР°СЋС‚ СЃРѕРіР»Р°СЃРѕРІР°РЅРЅС‹Рµ СЂСѓСЃСЃРєРёРµ СЃРѕРѕР±С‰РµРЅРёСЏ Рё РѕС‚РґРµР»СЊРЅС‹Рµ `503 AI_PROVIDER_UNAVAILABLE` / `503 AI_RUNTIME_NOT_CONFIGURED` С‚Р°Рј, РіРґРµ РїСЂРѕР±Р»РµРјР° РёРјРµРЅРЅРѕ РІ РєРѕРЅС„РёРіСѓСЂР°С†РёРё РёР»Рё РІРЅРµС€РЅРµРј РїСЂРѕРІР°Р№РґРµСЂРµ.
- [x] `scripts/run-next-with-dist-dir.mjs` РїРѕР»СѓС‡РёР» memory guard РґР»СЏ `next build`, Р° `scripts/ensure-next-build.mjs` + `package.json` СѓР±СЂР°Р»Рё Р»РёС€РЅРёР№ РїРѕРІС‚РѕСЂРЅС‹Р№ build РїРµСЂРµРґ `test:smoke` Рё `test:e2e:*`: С‚РµСЃС‚РѕРІС‹Рµ РєРѕРјР°РЅРґС‹ С‚РµРїРµСЂСЊ РїРµСЂРµРёСЃРїРѕР»СЊР·СѓСЋС‚ СѓР¶Рµ СЃРѕР±СЂР°РЅРЅС‹Р№ `.next`, РµСЃР»Рё РѕРЅ СЃСѓС‰РµСЃС‚РІСѓРµС‚.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `36 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: Р·Р°РєСЂС‹РІР°С‚СЊ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ AI quality gate (`assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`).

## 2026-03-17 historical retrieval fallback addendum

- [x] `src/lib/ai/knowledge-retrieval.ts` Р±РѕР»СЊС€Рµ РЅРµ РѕРіСЂР°РЅРёС‡РёРІР°РµС‚ text/vector fallback РїРµСЂРІС‹РјРё СЃРѕС‚РЅСЏРјРё СЃС‚СЂРѕРє: Рё `knowledge_chunks`, Рё `knowledge_embeddings` С‚РµРїРµСЂСЊ С‡РёС‚Р°СЋС‚СЃСЏ РїР°РіРёРЅРёСЂРѕРІР°РЅРЅРѕ РїРѕ РІСЃРµР№ РёСЃС‚РѕСЂРёРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, Р° РЅРµ С‚РѕР»СЊРєРѕ РїРѕ СЃРІРµР¶РµРјСѓ С…РІРѕСЃС‚Сѓ.
- [x] РР· vector fallback СѓР±СЂР°РЅ СЃРєСЂС‹С‚С‹Р№ bias РЅР° `limit(400)`, Р° РёР· text fallback СѓР±СЂР°РЅ fresh-only bias РЅР° `order(created_at desc).limit(600)`; РѕР±Р° fallback РїСѓС‚Рё С‚РµРїРµСЂСЊ СЂР°РЅР¶РёСЂСѓСЋС‚ РІРµСЃСЊ paged result set.
- [x] Р”РѕР±Р°РІР»РµРЅ РїСЂСЏРјРѕР№ regression suite `tests/rls/retrieval-history.spec.ts`, РєРѕС‚РѕСЂС‹Р№ Р±РµР· РІРЅРµС€РЅРµРіРѕ AI-РїСЂРѕРІР°Р№РґРµСЂР° РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ С‚СЂРё РІРµС‰Рё: pager РґРѕС…РѕРґРёС‚ РґР°Р»СЊС€Рµ РїРµСЂРІС‹С… СЃС‚СЂР°РЅРёС†, text fallback РїРѕРґРЅРёРјР°РµС‚ СЃС‚Р°СЂС‹Р№ СЂРµР»РµРІР°РЅС‚РЅС‹Р№ chunk, vector fallback РїРѕРґРЅРёРјР°РµС‚ СЃС‚Р°СЂС‹Р№ СЂРµР»РµРІР°РЅС‚РЅС‹Р№ embedding.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint src/lib/ai/knowledge-retrieval.ts tests/rls/retrieval-history.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: Р·Р°РєСЂС‹РІР°С‚СЊ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ AI quality gate (`assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`) Рё РїСЂРёРІСЏР·Р°С‚СЊ РµРіРѕ Рє release baseline.

## 2026-03-17 AI quality gate readiness addendum

- [x] Р’ `src/lib/ai/chat.ts` РґРѕР±Р°РІР»РµРЅ СЏРІРЅС‹Р№ server-contract `createAiChatSession(...)`, Р° `src/app/api/ai/sessions/route.ts` С‚РµРїРµСЂСЊ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ `POST` РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РЅРѕРІРѕРіРѕ РїСѓСЃС‚РѕРіРѕ AI-С‡Р°С‚Р° РґРѕ РїРµСЂРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ.
- [x] `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-actions.ts` Рё `src/components/ai-chat-panel.tsx` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° СЌС‚РѕС‚ РєРѕРЅС‚СЂР°РєС‚: РЅРѕРІС‹Р№ С‡Р°С‚, stale-session recovery Рё Р°РЅР°Р»РёР· С„РѕС‚Рѕ РµРґС‹ Р±РѕР»СЊС€Рµ РЅРµ РіРµРЅРµСЂРёСЂСѓСЋС‚ С„Р°Р»СЊС€РёРІС‹Р№ `sessionId`, РєРѕС‚РѕСЂС‹Р№ СЃРµСЂРІРµСЂ СЂРµР¶РµС‚ РєР°Рє `AI_CHAT_SESSION_NOT_FOUND`.
- [x] `tests/ai-gate/ai-quality-gate.spec.ts` РґРѕРІРµРґС‘РЅ РґРѕ СЂРµР°Р»СЊРЅРѕРіРѕ quality-gate РїРѕРІРµРґРµРЅРёСЏ: assistant workspace Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃР°РµС‚ РЅР° РїСѓСЃС‚РѕРј transcript state Рё С‡РµСЃС‚РЅРѕ РґРѕС…РѕРґРёС‚ РґРѕ provider/runtime surface.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/ai-gate tests/e2e/helpers/ai.ts tests/e2e/helpers/auth.ts`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1` -> `2 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [x] `npm run test:ai-gate` С‚РµРїРµСЂСЊ РїР°РґР°РµС‚ РЅРµ РЅР° РІРЅСѓС‚СЂРµРЅРЅРµРј UI/session Р±Р°РіРµ, Р° РЅР° СЂРµР°Р»СЊРЅРѕРј РІРЅРµС€РЅРµРј Р±Р»РѕРєРµСЂРµ: assistant, retrieval, meal plan, workout plan Рё safety СѓРїРёСЂР°СЋС‚СЃСЏ РІ `OpenRouter 402` РїРѕ РєСЂРµРґРёС‚Р°Рј, Р° retrieval СЃР»РѕР№ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ Р»РѕРіРёСЂСѓРµС‚ `Voyage 403` РїРѕ embeddings.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: СЃРЅСЏС‚СЊ РІРЅРµС€РЅРёР№ blocker РїРѕ `OpenRouter/Voyage` РёР»Рё РїСЂРѕРґРѕР»Р¶Р°С‚СЊ СЃР»РµРґСѓСЋС‰РёРµ РЅРµР·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рµ production tranche РґРѕ РјРѕРјРµРЅС‚Р°, РєРѕРіРґР° live AI providers Р±СѓРґСѓС‚ РіРѕС‚РѕРІС‹.

## 2026-03-18 AI proposal idempotency addendum

- [x] `src/lib/ai/proposal-actions.ts` С‚РµРїРµСЂСЊ РґРµР»Р°РµС‚ `approve` Рё `apply` РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹РјРё: РїРѕРІС‚РѕСЂРЅРѕРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РІРѕР·РІСЂР°С‰Р°РµС‚ СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ proposal Р±РµР· РѕС€РёР±РєРё, Р° РїРѕРІС‚РѕСЂРЅРѕРµ РїСЂРёРјРµРЅРµРЅРёРµ РѕС‚РґР°С‘С‚ С‚РѕС‚ Р¶Рµ applied-result Рё С‚РѕС‚ Р¶Рµ applied meta РІРјРµСЃС‚Рѕ РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ С€Р°Р±Р»РѕРЅРѕРІ РёР»Рё РЅРѕРІРѕР№ РѕС€РёР±РєРё.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ admin-only РєРѕРЅС‚СЂР°РєС‚РѕРј РЅР° РїРѕРІС‚РѕСЂРЅС‹Рµ `POST /api/ai/proposals/[id]/approve` Рё `POST /api/ai/proposals/[id]/apply`; СЃС†РµРЅР°СЂРёР№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РІС‚РѕСЂРѕР№ Р·Р°РїСЂРѕСЃ РѕСЃС‚Р°С‘С‚СЃСЏ `200` Рё РЅРµ РјРµРЅСЏРµС‚ РёС‚РѕРіРѕРІС‹Р№ applied payload.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `7 passed`, `npm run test:e2e:auth` -> `40 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ route-level audit РїРѕ idempotency Рё race conditions РЅР° workout mutation flows, Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє СЃР»РµРґСѓСЋС‰РёРј РЅРµР·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рј AI/data РїСѓРЅРєС‚Р°Рј.

## 2026-03-18 workout idempotency and typecheck contract addendum

- [x] `package.json` Рё `tsconfig.json` СЃРЅРѕРІР° СЃРѕРіР»Р°СЃРѕРІР°РЅС‹ РїРѕ РѕРґРЅРѕРјСѓ `distDir`: `typecheck` С‚РµРїРµСЂСЊ РіРµРЅРµСЂРёСЂСѓРµС‚ route types РІ СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ `.next`, Р° `tsconfig` Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ СѓСЃС‚Р°СЂРµРІС€РµРіРѕ `.next_build/types`, РёР·-Р·Р° РєРѕС‚РѕСЂРѕРіРѕ gate СЃРЅРѕРІР° РїР°РґР°Р» РЅР° `TS6053`.
- [x] `tests/e2e/workout-sync.spec.ts` СЂР°СЃС€РёСЂРµРЅ regression-СЃС†РµРЅР°СЂРёРµРј РЅР° РїРѕРІС‚РѕСЂРЅС‹Рµ direct mutation routes: `PATCH /api/workout-days/[id]` СЃРѕ СЃС‚Р°С‚СѓСЃРѕРј `done` Рё `POST /api/workout-days/[id]/reset` С‚РµРїРµСЂСЊ РѕС‚РґРµР»СЊРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РєР°Рє Р±РµР·РѕРїР°СЃРЅС‹Рµ Рё РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹Рµ РїСЂРё РїРѕРІС‚РѕСЂРЅРѕРј РІС‹Р·РѕРІРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/workout-sync.spec.ts -g "done and reset routes stay idempotent on repeated requests" --workers=1` -> `1 passed`, `npm run test:smoke` -> `3 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ route-level audit РїРѕ idempotency Рё race conditions РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ workout/sync mutation flows, Р·Р°С‚РµРј РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє СЃР»РµРґСѓСЋС‰РёРј РЅРµР·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рј AI/data Рё sanitation РїСѓРЅРєС‚Р°Рј.

## 2026-03-18 nutrition self-service RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` СЂР°СЃС€РёСЂРµРЅ fixture rows РґР»СЏ `meal_templates`, `meals`, `meal_items`, `recipe_items` Рё `daily_nutrition_summaries`, seeded С‡РµСЂРµР· service-role РїРѕРґ РѕР±С‹С‡РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РЅР° С‚РѕРј Р¶Рµ owner-scoped nutrition РєРѕРЅС‚СѓСЂРµ.
- [x] `tests/rls/ownership.spec.ts` С‚РµРїРµСЂСЊ РЅР°РїСЂСЏРјСѓСЋ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ row-level РёР·РѕР»СЏС†РёСЋ РЅРµ С‚РѕР»СЊРєРѕ РґР»СЏ `foods`, `recipes`, `workout_templates`, `ai_chat_*`, `export_jobs`, `deletion_requests`, `knowledge_*`, РЅРѕ Рё РґР»СЏ `meal_templates`, `meals`, `meal_items`, `recipe_items`, `daily_nutrition_summaries`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ direct owner-only / RLS audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ user-scoped РґР°РЅРЅС‹Рј Рё Р·Р°С‚РµРј РІРµСЂРЅСѓС‚СЊСЃСЏ Рє РЅРµР·Р°РєСЂС‹С‚С‹Рј route-level race/idempotency РїСѓРЅРєС‚Р°Рј.

## 2026-03-18 final typecheck runner addendum

- [x] `scripts/typecheck-stable.mjs` РїРµСЂРµРІРµРґС‘РЅ РЅР° СЂРµР°Р»СЊРЅС‹Р№ stable contract: СЃРЅР°С‡Р°Р»Р° `npx next typegen`, Р·Р°С‚РµРј РїСЂРѕРІРµСЂРєР° РїРѕР»РЅРѕС‚С‹ route-type wrappers, Рё РµСЃР»Рё `typegen` РЅРµ РїРѕСЃС‚СЂРѕРёР» РІРµСЃСЊ `app`-РґРµСЂРµРІРѕ С‚РёРїРѕРІ, Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ fallback РЅР° `npm run build`, РїРѕСЃР»Рµ С‡РµРіРѕ СѓР¶Рµ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ `tsc`.
- [x] `package.json` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ СЌС‚РѕС‚ runner РІ `typecheck`, С‚Р°Рє С‡С‚Рѕ baseline СЃРЅРѕРІР° РїСЂРѕС…РѕРґРёС‚ РѕРґРЅРёРј Р·Р°РїСѓСЃРєРѕРј РґР°Р¶Рµ РїРѕСЃР»Рµ РїРѕР»РЅРѕРіРѕ СѓРґР°Р»РµРЅРёСЏ `.next/types`, Р±РµР· СЂСѓС‡РЅРѕРіРѕ РІС‚РѕСЂРѕРіРѕ РїСЂРѕРіРѕРЅР°.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ С‡РёСЃС‚С‹Рј СЃС†РµРЅР°СЂРёРµРј: СѓРґР°Р»РµРЅРёРµ `.next/types` С‡РµСЂРµР· Node, Р·Р°С‚РµРј `npm run typecheck` -> СѓСЃРїРµС€РЅРѕ; РґР°Р»СЊС€Рµ baseline РїРѕРґС‚РІРµСЂР¶РґС‘РЅ `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ engineering tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ РЅРµР·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рµ backend/RLS/route-level hardening slices, РЅРµ С‚РµСЂСЏСЏ РѕРґРЅРѕС€Р°РіРѕРІС‹Р№ quality-gate contract.

## 2026-03-19 nutrition targets Рё remaining nutrition-profile RLS addendum

- [x] `src/app/api/nutrition/targets/route.ts` С‚РµРїРµСЂСЊ РѕР±СЂР°Р±Р°С‚С‹РІР°РµС‚ РѕР¶РёРґР°РµРјС‹Р№ `ZodError` РґРѕ unexpected-failure logging: РЅРµРІР°Р»РёРґРЅС‹Р№ payload РЅР° `PUT /api/nutrition/targets` РІРѕР·РІСЂР°С‰Р°РµС‚ СЏРІРЅС‹Р№ `400 NUTRITION_TARGETS_INVALID` Р±РµР· noisy route-level `logger.error`.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid-payload РєРѕРЅС‚СЂР°РєС‚РѕРј РґР»СЏ `PUT /api/nutrition/targets`, Р° `tests/e2e/helpers/http.ts` РїРѕРґРґРµСЂР¶РёРІР°РµС‚ `PUT` РІ РѕР±С‰РµРј request helper'Рµ.
- [x] `tests/rls/helpers/supabase-rls.ts` Рё `tests/rls/ownership.spec.ts` СЂР°СЃС€РёСЂРµРЅС‹ direct owner-scoped РїРѕРєСЂС‹С‚РёРµРј РґР»СЏ remaining nutrition/body/self-profile С‚Р°Р±Р»РёС†: `goals`, `nutrition_goals`, `nutrition_profiles`, `body_metrics`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint src/app/api/nutrition/targets/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/http.ts tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npm run test:e2e:auth` -> `41 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ РѕСЃС‚Р°РІС€РёР№СЃСЏ route-handler audit РїРѕ owner-only/idempotency/race conditions Рё РґРѕР±РёРІР°С‚СЊ РЅРµР·Р°РєСЂС‹С‚С‹Рµ AI/data hardening РїСѓРЅРєС‚С‹.

## 2026-03-19 profile metrics Рё AI memory RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` СЂР°СЃС€РёСЂРµРЅ fixture rows РґР»СЏ `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, С‡С‚РѕР±С‹ РїСЂСЏРјРѕР№ owner-only СЃР»РѕР№ РїРѕРєСЂС‹РІР°Р» СѓР¶Рµ РЅРµ С‚РѕР»СЊРєРѕ workout/nutrition assets, РЅРѕ Рё РїСЂРѕС„РёР»СЊРЅС‹Р№, Р°РіСЂРµРіР°С‚РЅС‹Р№ Рё AI-memory РєРѕРЅС‚СѓСЂ.
- [x] `tests/rls/ownership.spec.ts` С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РІР»Р°РґРµР»РµС† РІРёРґРёС‚ СЃРІРѕРё `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, Р° РґСЂСѓРіРѕР№ auth-user РЅРµ РІРёРґРёС‚ Рё РЅРµ РјРѕР¶РµС‚ РѕР±РЅРѕРІРёС‚СЊ СЌС‚Рё СЃС‚СЂРѕРєРё С‚РѕС‡РµС‡РЅС‹РјРё `update`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ route-level owner-only audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ self-service/AI/data handlers Рё РґР°Р»СЊС€Рµ РґРѕР±РёРІР°С‚СЊ РѕР±С‰РёР№ database audit С‡РµСЂРµР· Supabase MCP.

## 2026-03-19 billing RLS ownership addendum

- [x] `tests/rls/helpers/supabase-rls.ts` СЂР°СЃС€РёСЂРµРЅ fixture rows РґР»СЏ billing user-scoped С‚Р°Р±Р»РёС†: `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`.
- [x] `tests/rls/ownership.spec.ts` С‚РµРїРµСЂСЊ РЅР°РїСЂСЏРјСѓСЋ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РІР»Р°РґРµР»РµС† РІРёРґРёС‚ СЃРІРѕРё billing rows, Р° РґСЂСѓРіРѕР№ auth-user РЅРµ РІРёРґРёС‚ Рё РЅРµ РјРѕР¶РµС‚ РѕР±РЅРѕРІРёС‚СЊ С…РѕС‚СЏ Р±С‹ `usage_counters` С‚РѕС‡РµС‡РЅС‹Рј `update`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶РёС‚СЊ remaining route-level audit Рё РґРѕР±РёРІР°С‚СЊ РїСЂСЏРјРѕР№ database audit РїРѕ РѕСЃС‚Р°РІС€РёРјСЃСЏ user-scoped/admin-scoped РєРѕРЅС‚СѓСЂР°Рј.

## 2026-03-19 workout execution RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` СЂР°СЃС€РёСЂРµРЅ fixture rows РґР»СЏ `workout_days`, `workout_exercises`, `workout_sets`, РїРѕСЌС‚РѕРјСѓ РїСЂСЏРјРѕР№ owner-only suite С‚РµРїРµСЂСЊ РїРѕРєСЂС‹РІР°РµС‚ Рё execution-С†РµРїРѕС‡РєСѓ С‚СЂРµРЅРёСЂРѕРІРєРё, Р° РЅРµ С‚РѕР»СЊРєРѕ program/template СЃР»РѕР№.
- [x] `tests/rls/ownership.spec.ts` С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РІР»Р°РґРµР»РµС† РІРёРґРёС‚ СЃРІРѕРё workout execution rows, РґСЂСѓРіРѕР№ auth-user РЅРµ РІРёРґРёС‚ РёС… Рё РЅРµ РјРѕР¶РµС‚ С‚РѕС‡РµС‡РЅРѕ РѕР±РЅРѕРІРёС‚СЊ С‡СѓР¶РѕР№ `workout_set`.
- [x] Fixture billing rows СЃРґРµР»Р°РЅС‹ РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹РјРё С‡РµСЂРµР· `upsert` РїРѕ СѓРЅРёРєР°Р»СЊРЅС‹Рј РєР»СЋС‡Р°Рј `entitlements(user_id, feature_key)` Рё `usage_counters(user_id, metric_key, metric_window)`, РїРѕСЌС‚РѕРјСѓ `test:rls` Р±РѕР»СЊС€Рµ РЅРµ С„Р»Р°РєР°РµС‚ РЅР° РЅР°РєРѕРїР»РµРЅРЅС‹С… РґР°РЅРЅС‹С… РїСЂРѕС€Р»С‹С… РїСЂРѕРіРѕРЅРѕРІ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє remaining route-level audit Рё РґРѕР±РёРІР°С‚СЊ РїСЂСЏРјРѕР№ database audit РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ user-scoped/admin-scoped С‚Р°Р±Р»РёС†Р°С….

## 2026-03-19 billing auth-first contract addendum

- [x] `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/settings/billing/route.ts` С‚РµРїРµСЂСЊ СЃС‚СЂРѕРіРѕ auth-first: anonymous requests РїРѕР»СѓС‡Р°СЋС‚ `401 AUTH_REQUIRED` РґРѕ Р»СЋР±С‹С… Stripe/env checks.
- [x] `src/app/api/billing/checkout/reconcile/route.ts` Рё `src/app/api/settings/billing/route.ts` РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚ РѕР¶РёРґР°РµРјС‹Р№ `ZodError` РґРѕ unexpected logger-РІРµС‚РєРё, РїРѕСЌС‚РѕРјСѓ invalid payload РґР°С‘С‚ СЏРІРЅС‹Р№ `400` Р±РµР· noisy route-level error logging.
- [x] User-facing copy РІ `src/app/api/billing/webhook/stripe/route.ts` Рё РІСЃС‘Рј С‚РµРєСѓС‰РµРј billing/settings tranche РїРµСЂРµРІРµРґС‘РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8; auth/config/error messages Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ Р±РёС‚СѓСЋ РєРёСЂРёР»Р»РёС†Сѓ.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ unauthenticated billing/settings contracts Рё invalid payload РїРѕРєСЂС‹С‚РёРµРј РґР»СЏ `POST /api/settings/billing`; `tests/e2e/helpers/auth.ts` РїРѕР»СѓС‡РёР» СѓСЃС‚РѕР№С‡РёРІС‹Р№ `waitForSubmitButtonReady(...)` РґР»СЏ Playwright auth bootstrap.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/auth.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ billing/backend tranche: РґРѕС‡РёСЃС‚РёС‚СЊ remaining mojibake РІ shared billing/AI dictionaries Рё РїСЂРѕРґРѕР»Р¶РёС‚СЊ route-handler audit РїРѕ owner-only/idempotency/retrieval РєРѕРЅС‚СѓСЂР°Рј.

## 2026-03-19 shared billing access sanitation addendum

- [x] `src/lib/billing-access.ts` РїРµСЂРµРІРµРґС‘РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8 РЅР° СѓСЂРѕРІРЅРµ РѕР±С‰РµРіРѕ feature-config СЃР»РѕРІР°СЂСЏ, deny-reason С‚РµРєСЃС‚РѕРІ Рё `FEATURE_ACCESS_DENIED` copy; shared billing snapshot Р±РѕР»СЊС€Рµ РЅРµ С‚СЏРЅРµС‚ mojibake РІ `/settings`, `/ai`, `/nutrition` Рё РґСЂСѓРіРёРµ РїРѕРІРµСЂС…РЅРѕСЃС‚Рё, РєРѕС‚РѕСЂС‹Рµ С‡РёС‚Р°СЋС‚ РѕР±С‰РёР№ access СЃР»РѕР№.
- [x] Tranche РЅРµ РјРµРЅСЏРµС‚ access/fallback/usage-counter РєРѕРЅС‚СЂР°РєС‚С‹ Рё РѕРіСЂР°РЅРёС‡РµРЅ shared user-facing copy РїР»СЋСЃ С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµРј billing layer.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/billing-access.ts`, `npm run typecheck`, `npm run build`; СЃРѕРґРµСЂР¶РёРјРѕРµ С„Р°Р№Р»Р° РѕС‚РґРµР»СЊРЅРѕ РїРµСЂРµРїСЂРѕРІРµСЂРµРЅРѕ РїСЂСЏРјС‹Рј РїРѕРёСЃРєРѕРј РїРѕ РЅРѕСЂРјР°Р»СЊРЅС‹Рј СЂСѓСЃСЃРєРёРј СЃС‚СЂРѕРєР°Рј, С‡С‚РѕР±С‹ РѕС‚СЃРµСЏС‚СЊ Р»РѕР¶РЅС‹Р№ PowerShell misrender.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ sanitation/backend tranche: Р·Р°Р±РёСЂР°С‚СЊ remaining mojibake РІ shared AI dictionaries (`proposal-actions`, AI summaries Рё related preview/error copy), Р·Р°С‚РµРј РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє route-handler audit.

## 2026-03-19 settings surface decomposition addendum

- [x] `src/lib/settings-data-server.ts` СЂР°Р·РіСЂСѓР¶РµРЅ РґРѕ server-data orchestration СЂРѕР»Рё: pure snapshot factories, audit-action constants Рё mapper/formatter helpers РІС‹РЅРµСЃРµРЅС‹ РІ `src/lib/settings-data-server-model.ts`.
- [x] `src/components/settings-billing-center.tsx` РїРµСЂРµРІРµРґС‘РЅ РЅР° РІС‹РЅРµСЃРµРЅРЅС‹Р№ formatter/model СЃР»РѕР№ `src/components/settings-billing-center-model.ts`, РїРѕСЌС‚РѕРјСѓ billing screen Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ РІРЅСѓС‚СЂРё СЃРµР±СЏ date/status/feature/timeline helper-Р»РѕРіРёРєСѓ.
- [x] `src/components/settings-data-center.tsx` РїРµСЂРµРІРµРґС‘РЅ РЅР° РІС‹РЅРµСЃРµРЅРЅС‹Р№ formatter/model СЃР»РѕР№ `src/components/settings-data-center-model.ts`, РїРѕСЌС‚РѕРјСѓ export/deletion surface С‚РѕР¶Рµ Р±Р»РёР¶Рµ Рє orchestrator-СЂРѕР»Рё РІРјРµСЃС‚Рѕ СЃРјРµСЃРё JSX Рё derive helper-С„СѓРЅРєС†РёР№.
- [x] `tests/rls/ownership.spec.ts` РїРѕР»СѓС‡РёР» `test.setTimeout(60_000)`, РїРѕС‚РѕРјСѓ С‡С‚Рѕ РїСЂСЏРјРѕР№ RLS-suite СѓР¶Рµ РїРѕРєСЂС‹РІР°РµС‚ РіРѕСЂР°Р·РґРѕ Р±РѕР»СЊС€Рµ owner-scoped С‚Р°Р±Р»РёС† Рё РїРµСЂРµСЃС‚Р°Р» СЃС‚Р°Р±РёР»СЊРЅРѕ СѓРєР»Р°РґС‹РІР°С‚СЊСЃСЏ РІ СЃС‚Р°СЂС‹Рµ `30s`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `4 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ architecture/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ СЂР°Р·РЅРѕСЃРёС‚СЊ remaining heavy settings/data surfaces Рё РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє РѕСЃС‚Р°РІС€РµРјСѓСЃСЏ route-handler audit РїРѕ owner-only/idempotency/race conditions.

## 2026-03-19 settings self-service lib extraction addendum

- [x] Р”РѕРјРµРЅРЅС‹Рµ self-service РїСЂР°РІРёР»Р° РґР»СЏ `/api/settings/data` РІС‹РЅРµСЃРµРЅС‹ РёР· route handler РІ `src/lib/settings-self-service.ts`: auth-context lookup, audit logging, queue export, request deletion, cancel deletion Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІРїРµСЂРµРјРµС€РєСѓ СЃ HTTP-РѕС‚РІРµС‚Р°РјРё.
- [x] Р”РѕРјРµРЅРЅС‹Рµ self-service РїСЂР°РІРёР»Р° РґР»СЏ `/api/settings/billing` С‚РѕР¶Рµ РІС‹РЅРµСЃРµРЅС‹ РІ `src/lib/settings-self-service.ts`: Р·Р°РіСЂСѓР·РєР° billing center data Рё queue billing access review С‚РµРїРµСЂСЊ РёРґСѓС‚ С‡РµСЂРµР· РµРґРёРЅС‹Р№ lib-СЃР»РѕР№, Р° route handler РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕРЅРєРѕР№ transport-РѕР±С‘СЂС‚РєРѕР№.
- [x] Р­С‚Рѕ СѓРјРµРЅСЊС€Р°РµС‚ РґСѓР±Р»РёСЂРѕРІР°РЅРёРµ РјРµР¶РґСѓ route handlers Рё `lib` РЅР° РѕРґРЅРѕРј РёР· СЃР°РјС‹С… С‚СЏР¶С‘Р»С‹С… self-service РєРѕРЅС‚СѓСЂРѕРІ Рё РґРІРёРіР°РµС‚ РѕС‚РєСЂС‹С‚С‹Р№ РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ СЂР°Р·РЅРѕСЃ РґРѕРјРµРЅРЅС‹С… РїСЂР°РІРёР» РёР· handler-СЃР»РѕСЏ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint src/lib/settings-self-service.ts src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts`, `npm run build`, `npm run typecheck`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ route/lib extraction Рё owner-only/idempotency audit РЅР° remaining self-service Рё AI/data handlers.

## 2026-03-19 billing self-service lib extraction addendum

- [x] Р”РѕРјРµРЅРЅС‹Рµ self-service РїСЂР°РІРёР»Р° РґР»СЏ `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts` Рё `src/app/api/billing/portal/route.ts` РІС‹РЅРµСЃРµРЅС‹ РІ `src/lib/billing-self-service.ts`: Stripe env checks, customer lookup, checkout session creation, checkout reconcile, portal session creation Рё self-service audit logging Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІРЅСѓС‚СЂРё route handlers.
- [x] Р’СЃРµ С‚СЂРё billing routes С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: auth, payload validation Рё API response shape РѕСЃС‚Р°СЋС‚СЃСЏ РІ route handler, Р° Р±РёР·РЅРµСЃ-Р»РѕРіРёРєР° Рё side-effects Р¶РёРІСѓС‚ РІ `lib`.
- [x] Р—Р°РѕРґРЅРѕ РїРѕР»РЅРѕСЃС‚СЊСЋ СѓР±СЂР°РЅ remaining mojibake РёР· user-facing copy РІ `billing/portal`, Р° billing self-service error messages РІ РЅРѕРІРѕРј helper-СЃР»РѕРµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8.
- [x] `src/app/api/settings/data/export/[id]/download/route.ts` С‚РѕР¶Рµ РїРµСЂРµРІРµРґС‘РЅ РЅР° РѕР±С‰РёР№ self-service СЃР»РѕР№: owner-only lookup export job, archive build Рё download audit log С‚РµРїРµСЂСЊ РёРґСѓС‚ С‡РµСЂРµР· `src/lib/settings-self-service.ts`, Р° route handler РѕСЃС‚Р°Р»СЃСЏ transport-РѕР±С‘СЂС‚РєРѕР№.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/billing-self-service.ts src/lib/settings-self-service.ts src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/settings/data/export/[id]/download/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ route/lib extraction Рё owner-only/idempotency audit РЅР° remaining self-service Рё AI/data handlers.

## 2026-03-19 nutrition write-model extraction addendum

- [x] РћР±С‰Р°СЏ owner-scoped nutrition write-Р»РѕРіРёРєР° РґР»СЏ `recipes`, `meal templates` Рё `meals` РІС‹РЅРµСЃРµРЅР° РІ `src/lib/nutrition/nutrition-write-model.ts`: Р·Р°РіСЂСѓР·РєР° РїСЂРѕРґСѓРєС‚РѕРІ РїРѕ `user_id`, РїСЂРѕРІРµСЂРєР° missing-food ids, СЂР°СЃС‡С‘С‚ macro snapshots Рё РїРѕРґРіРѕС‚РѕРІРєР° payload РґР»СЏ `recipe_items`, `meal_items` Рё template `payload.items` Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РІ С‚СЂС‘С… route handlers.
- [x] `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` Рё `src/app/api/meals/route.ts` СЃС‚Р°Р»Рё Р·Р°РјРµС‚РЅРѕ С‚РѕРЅСЊС€Рµ: РІ handlers РѕСЃС‚Р°Р»РёСЃСЊ auth, schema parse, insert/delete orchestration Рё API response shape, Р° reusable nutrition domain rules СѓРµС…Р°Р»Рё РІ `lib`.
- [x] Р—Р°РѕРґРЅРѕ РёР· СЌС‚РёС… create-routes СѓР±СЂР°РЅ remaining mojibake РІ user-facing copy, Р° `meals` create-path С‚РµРїРµСЂСЊ РѕС‚РєР°С‚С‹РІР°РµС‚ СЃРѕР·РґР°РЅРЅСѓСЋ `meal` Р·Р°РїРёСЃСЊ, РµСЃР»Рё РІСЃС‚Р°РІРєР° `meal_items` РЅРµ СѓРґР°Р»Р°СЃСЊ, С‡С‚РѕР±С‹ route РЅРµ РѕСЃС‚Р°РІР»СЏР» СЃРёСЂРѕС‚СЃРєСѓСЋ СЃС‚СЂРѕРєСѓ Р±РµР· item payload.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/nutrition/nutrition-write-model.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts`, `npm run typecheck`, `npm run build`.
- [x] РџРѕРІС‚РѕСЂРЅС‹Рµ browser-suite РїСЂРѕРіРѕРЅС‹ РЅР° СЌС‚РѕР№ РјР°С€РёРЅРµ СЃРЅРѕРІР° СѓРїС‘СЂР»РёСЃСЊ РІ Р»РѕРєР°Р»СЊРЅС‹Р№ Playwright timeout (`npm run test:e2e:auth`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1`, `npm run test:smoke`), РїРѕСЌС‚РѕРјСѓ РґР»СЏ СЌС‚РѕРіРѕ tranche Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ compile/type baseline Р±РµР· РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРіРѕ browser green run.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ route/lib extraction Рё owner-only/idempotency audit РЅР° remaining nutrition/AI/data handlers, РїРѕРєР° РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ РґРѕРјРµРЅРЅС‹Рµ РїСЂР°РІРёР»Р° РІРЅРµ route handlers РЅРµ Р±СѓРґРµС‚ Р·Р°РєСЂС‹С‚ С†РµР»РёРєРѕРј.

## 2026-03-19 nutrition delete/update self-service extraction addendum

- [x] РћР±С‰Р°СЏ owner-scoped self-service Р»РѕРіРёРєР° РґР»СЏ `foods/[id]`, `recipes/[id]`, `meal-templates/[id]` Рё `meals/[id]` РІС‹РЅРµСЃРµРЅР° РІ `src/lib/nutrition/nutrition-self-service.ts`: generic delete helper, delete+summary recalculation РґР»СЏ meal Рё build helper РґР»СЏ food update payload Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РїРѕ route handlers.
- [x] `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts` Рё `src/app/api/meals/[id]/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‚РѕРЅРєРёР№ transport-СЃР»РѕР№ СЃ С‡РёСЃС‚С‹Рј UTF-8 copy: auth, Zod validation Рё API response shape РѕСЃС‚Р°Р»РёСЃСЊ РІ handlers, Р° reusable nutrition domain rules Р¶РёРІСѓС‚ РІ `lib`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/[id]/route.ts src/app/api/recipes/[id]/route.ts src/app/api/meal-templates/[id]/route.ts src/app/api/meals/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ route/lib extraction Рё owner-only/idempotency audit РЅР° remaining nutrition/AI/data handlers, РїРѕРєР° РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ РґРѕРјРµРЅРЅС‹Рµ РїСЂР°РІРёР»Р° РІРЅРµ route handlers РЅРµ Р±СѓРґРµС‚ Р·Р°РєСЂС‹С‚ С†РµР»РёРєРѕРј.

## 2026-03-19 foods list/create sanitation addendum

- [x] `src/app/api/foods/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° С‡РёСЃС‚С‹Р№ UTF-8 Рё Р±РѕР»СЊС€Рµ РЅРµ С‚СЏРЅРµС‚ mojibake РІ nutrition catalog surface.
- [x] Food create payload С‚РµРїРµСЂСЊ С‚РѕР¶Рµ СЃРѕР±РёСЂР°РµС‚СЃСЏ С‡РµСЂРµР· `src/lib/nutrition/nutrition-self-service.ts`: helper `buildFoodCreateData(...)` РґРµСЂР¶РёС‚ rounding Рё barcode normalization РІРЅРµ route handler, Р° СЃР°Рј handler РѕСЃС‚Р°С‘С‚СЃСЏ transport-РѕР±С‘СЂС‚РєРѕР№.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїРµСЂРµС…РѕРґРёС‚СЊ РѕС‚ nutrition self-service Рє remaining AI/data route/lib extraction Рё owner-only/idempotency audit.

## 2026-03-19 shared AI copy sanitation addendum

- [x] `src/lib/ai/chat.ts` РїРµСЂРµРІРµРґС‘РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8: shared session errors Р±РѕР»СЊС€Рµ РЅРµ С‚СЏРЅСѓС‚ Р±РёС‚С‹Р№ copy РІ AI history Рё session recovery surface.
- [x] `src/lib/ai/proposal-actions.ts` РїРѕР»РЅРѕСЃС‚СЊСЋ СЃР°РЅРёСЂРѕРІР°РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8: preview titles, request summaries, timelines, owner-only errors Рё applied/approved copy Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake РІ assistant flow Рё proposal studio.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/chat.ts src/lib/ai/proposal-actions.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РІС‹РЅРµСЃС‚Рё Рё СЃР°РЅРёСЂРѕРІР°С‚СЊ remaining shared runtime/guardrail copy РёР· `ai/chat` Рё `ai/assistant`, Р·Р°С‚РµРј РїСЂРѕРґРѕР»Р¶Р°С‚СЊ route/lib extraction Рё owner-only/idempotency audit.

## 2026-03-19 AI eval surface sanitation addendum

- [x] `src/lib/ai/eval-suites.ts` Рё `src/lib/ai/eval-runs.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: shared labels РїСЂРѕРіРѕРЅРѕРІ, quality-suite СЃР»РѕРІР°СЂСЊ Рё default labels Р±РѕР»СЊС€Рµ РЅРµ С‚СЏРЅСѓС‚ mojibake РІ admin AI eval surface Рё РїР»Р°РЅРѕРІС‹Рµ cron-Р·Р°РїСѓСЃРєРё.
- [x] `src/app/api/admin/ai-evals/route.ts`, `src/app/api/admin/ai-evals/run/route.ts` Рё `src/app/api/internal/jobs/ai-evals-schedule/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‡РёСЃС‚С‹Р№ user-facing copy Р±РµР· РёР·РјРµРЅРµРЅРёСЏ route contracts.
- [x] `src/components/admin-ai-eval-runs.tsx` РїРѕР»РЅРѕСЃС‚СЊСЋ СЃР°РЅРёСЂРѕРІР°РЅ: СЃС‚Р°С‚СѓСЃС‹, notices, РїСѓСЃС‚С‹Рµ СЃРѕСЃС‚РѕСЏРЅРёСЏ Рё quick-run surface Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ Р±РёС‚СѓСЋ РєРёСЂРёР»Р»РёС†Сѓ РѕРїРµСЂР°С‚РѕСЂСѓ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/eval-suites.ts src/lib/ai/eval-runs.ts src/app/api/admin/ai-evals/route.ts src/app/api/admin/ai-evals/run/route.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/components/admin-ai-eval-runs.tsx`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining shared runtime/guardrail sanitation РІ `ai/chat` Рё `ai/assistant`, Р·Р°С‚РµРј РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє route/lib extraction Рё owner-only/idempotency audit.

## 2026-03-19 AI chat runtime copy extraction addendum

- [x] РћР±С‰РёР№ user-facing copy РґР»СЏ `ai/chat` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/chat-runtime-copy.ts`: СЃРѕРѕР±С‰РµРЅРёСЏ Рѕ РЅРµРіРѕС‚РѕРІРѕРј runtime, auth-required, invalid payload, provider/runtime failures Рё safety fallback Р±РѕР»СЊС€Рµ РЅРµ СЂР°Р·РјР°Р·Р°РЅС‹ РїРѕ route handler.
- [x] `src/app/api/ai/chat/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° С‚РѕРЅРєРёР№ transport-СЃР»РѕР№ СЃ С‡РёСЃС‚С‹Рј UTF-8 copy: auth/runtime gates, safety fallback Рё provider error message РёРґСѓС‚ С‡РµСЂРµР· shared helper Р±РµР· РёР·РјРµРЅРµРЅРёСЏ owner-only, billing Рё retrieval РєРѕРЅС‚СЂР°РєС‚РѕРІ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/chat-runtime-copy.ts src/app/api/ai/chat/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining runtime/guardrail sanitation РІ `ai/assistant`, Р·Р°С‚РµРј РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє route/lib extraction Рё owner-only/idempotency audit.

## 2026-03-20 AI plan route copy extraction addendum

- [x] РћР±С‰РёР№ user-facing copy РґР»СЏ `ai/meal-plan` Рё `ai/workout-plan` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/plan-route-copy.ts`: auth-required, runtime-not-configured, invalid payload Рё provider/runtime failure messages Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ РґРІСѓРјСЏ route handlers.
- [x] `src/app/api/ai/meal-plan/route.ts` Рё `src/app/api/ai/workout-plan/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‚РѕРЅРєРёР№ transport-СЃР»РѕР№ СЃ С‡РёСЃС‚С‹Рј UTF-8 copy, Р° safety/provider messaging РґР»СЏ AI plan generation С‚РµРїРµСЂСЊ РёРґС‘С‚ С‡РµСЂРµР· shared helper.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/plan-route-copy.ts src/app/api/ai/meal-plan/route.ts src/app/api/ai/workout-plan/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining runtime/guardrail sanitation РІ `ai/assistant`, Р·Р°С‚РµРј РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє route/lib extraction Рё owner-only/idempotency audit.

## 2026-03-20 AI assistant runtime copy extraction addendum

- [x] РћР±С‰РёР№ user-facing Рё tool-facing copy РґР»СЏ `ai/assistant` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/assistant-runtime-copy.ts`: runtime/auth/invalid messages, safety fallback, stream error copy, tool descriptions Рё summary labels Р±РѕР»СЊС€Рµ РЅРµ СЂР°Р·РјР°Р·Р°РЅС‹ РїРѕ route handler.
- [x] `src/app/api/ai/assistant/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° СЌС‚РѕС‚ helper Р±РµР· РёР·РјРµРЅРµРЅРёСЏ owner-only, billing, retrieval, proposal Рё streaming contracts: route СЃС‚Р°Р» С‚РѕРЅСЊС€Рµ Рё Р±Р»РёР¶Рµ Рє transport/orchestration СЂРѕР»Рё.
- [x] `src/lib/ai/domain-policy.ts` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ С‚РµРєСѓС‰РёРј helper-slice Рё РѕСЃС‚Р°С‘С‚СЃСЏ Р·РµР»С‘РЅС‹Рј РїРѕ compile/lint baseline.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/assistant-runtime-copy.ts src/app/api/ai/assistant/route.ts src/lib/ai/domain-policy.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє remaining route/lib extraction Рё owner-only/idempotency audit РїРѕ AI/data handlers.

## 2026-03-20 AI meal photo runtime copy extraction addendum

- [x] РћР±С‰РёР№ user-facing Рё vision/runtime copy РґР»СЏ `ai/meal-photo` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/meal-photo-runtime-copy.ts`: not-configured/auth/image validation/safety/schema-invalid/provider failure messages Рё С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ СЂР°Р·Р±РѕСЂР° Р±Р»СЋРґР° Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІРЅСѓС‚СЂРё route handler.
- [x] `src/app/api/ai/meal-photo/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° СЌС‚РѕС‚ helper Р±РµР· РёР·РјРµРЅРµРЅРёСЏ owner-only, billing, image-processing Рё chat-session contracts: route РѕСЃС‚Р°Р»СЃСЏ transport-СЃР»РѕРµРј РІРѕРєСЂСѓРі vision flow.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/meal-photo-runtime-copy.ts src/app/api/ai/meal-photo/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РїРѕ AI/data handlers.

## 2026-03-20 AI session route helper extraction addendum

- [x] РћР±С‰РёР№ auth-context Рё user-facing copy РґР»СЏ `src/app/api/ai/sessions/route.ts` Рё `src/app/api/ai/sessions/[id]/route.ts` РІС‹РЅРµСЃРµРЅС‹ РІ `src/lib/ai/session-route-helpers.ts`: auth-required, invalid-id, create/delete/clear failed messages Рё default title РЅРѕРІРѕРіРѕ С‡Р°С‚Р° Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ РґРІСѓРјСЏ route handlers.
- [x] РћР±Р° route handler С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: session auth bootstrap Рё shared copy РёРґСѓС‚ С‡РµСЂРµР· helper, Р° delete-route РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ РІ С‡РёСЃС‚РѕРј UTF-8 Р±РµР· РёР·РјРµРЅРµРЅРёСЏ owner-only contracts.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/session-route-helpers.ts src/app/api/ai/sessions/route.ts src/app/api/ai/sessions/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РїРѕ AI/data handlers.

## 2026-03-20 AI proposal route helper extraction addendum

- [x] РћР±С‰РёР№ auth/proposal lookup/billing feature resolution РґР»СЏ `src/app/api/ai/proposals/[id]/apply/route.ts` Рё `src/app/api/ai/proposals/[id]/approve/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/proposal-route-helpers.ts`: owner-scoped proposal lookup, auth gate, invalid-id parse Рё feature access bootstrap Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ РґРІСѓРјСЏ route handlers.
- [x] РћР±Р° proposal routes С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: РІ handlers РѕСЃС‚Р°Р»РёСЃСЊ С‚РѕР»СЊРєРѕ route-specific action calls (`applyAiPlanProposal` Рё `approveAiPlanProposal`), feature denied response Рё error mapping, Р° shared route access plumbing Р¶РёРІС‘С‚ РІ helper-СЃР»РѕРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/proposal-route-helpers.ts src/app/api/ai/proposals/[id]/apply/route.ts src/app/api/ai/proposals/[id]/approve/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РїРѕ AI/data handlers.

## 2026-03-20 knowledge reindex admin helper extraction addendum

- [x] РћР±С‰РёР№ parse/logging СЃР»РѕР№ РґР»СЏ `src/app/api/ai/reindex/route.ts` Рё `src/app/api/internal/jobs/knowledge-reindex/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/ai/knowledge-reindex-admin.ts`: parse mode, support action logging, audit logging Рё С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ success message Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІ route handlers.
- [x] `src/app/api/ai/reindex/route.ts` Рё `src/app/api/internal/jobs/knowledge-reindex/route.ts` С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport/orchestration СЂРѕР»Рё: route-level auth, validation Рё response shape РѕСЃС‚Р°Р»РёСЃСЊ РІ handlers, Р° shared reindex admin/job plumbing Р¶РёРІС‘С‚ РІ helper-СЃР»РѕРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/ai/knowledge-reindex-admin.ts src/app/api/ai/reindex/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ AI/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РїРѕ AI/data handlers.

## 2026-03-20 admin support action helper extraction addendum

- [x] РћР±С‰РёР№ queue+audit СЃР»РѕР№ РґР»СЏ `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts` Рё `src/app/api/admin/users/[id]/restore/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-support-actions.ts`: insert РІ `support_actions` Рё follow-up audit insert Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ С‚СЂРµРјСЏ route handlers.
- [x] Р’СЃРµ С‚СЂРё admin mutation routes С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: auth, target-user guard Рё payload validation РѕСЃС‚Р°СЋС‚СЃСЏ РІ handlers, Р° shared support-action plumbing Р¶РёРІС‘С‚ РІ helper-СЃР»РѕРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts src/app/api/admin/users/[id]/restore/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ admin/self-service Рё AI/data handlers.

## 2026-03-20 admin export and deletion helper extraction addendum

- [x] РћР±С‰РёР№ export/deletion admin СЃР»РѕР№ РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-user-requests.ts`: queue export job, hold deletion request Рё cancel deletion request С‚РµРїРµСЂСЊ Р¶РёРІСѓС‚ РІРЅРµ route handlers Рё РґРµСЂР¶Р°С‚ queue+audit plumbing РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.
- [x] `src/app/api/admin/users/[id]/export/route.ts` Рё `src/app/api/admin/users/[id]/deletion/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° СЌС‚РѕС‚ helper, Р° `src/app/api/admin/users/bulk/route.ts` РёСЃРїРѕР»СЊР·СѓРµС‚ С‚РѕС‚ Р¶Рµ export queue helper РґР»СЏ РІРµС‚РєРё `queue_export`, С‡С‚РѕР±С‹ РЅРµ РґСѓР±Р»РёСЂРѕРІР°С‚СЊ insert РІ `export_jobs` Рё audit payload.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-user-requests.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route/lib extraction Рё owner-only/idempotency audit РЅР° РѕСЃС‚Р°РІС€РёС…СЃСЏ admin/self-service Рё AI/data handlers.

## 2026-03-20 admin bulk support action follow-up addendum

- [x] `src/app/api/admin/users/bulk/route.ts` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ `src/lib/admin-support-actions.ts` РЅРµ С‚РѕР»СЊРєРѕ РІ single-user surface, РЅРѕ Рё РґР»СЏ bulk-РІРµС‚РѕРє `queue_resync` Рё `queue_suspend`: insert РІ `support_actions` Рё audit payload Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РІРЅСѓС‚СЂРё bulk handler.
- [x] Bulk route СЃРѕС…СЂР°РЅРёР» С‚РµРєСѓС‰РёРµ guard/contracts (`assertUserIsNotPrimarySuperAdmin`, batchId РІ audit payload, owner/admin access), РЅРѕ СЃС‚Р°Р» Р·Р°РјРµС‚РЅРѕ Р±Р»РёР¶Рµ Рє orchestration-СЂРѕР»Рё.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРІРµСЂРёС‚СЊ, РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ Р»Рё СѓР¶Рµ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ route/lib duplication, Рё РµСЃР»Рё РЅРµС‚ вЂ” РґРѕР±РёСЂР°С‚СЊ РѕСЃС‚Р°РІС€РёРµСЃСЏ admin/self-service/AI handlers.

## 2026-03-20 admin billing audit extraction addendum

- [x] РћР±С‰РёР№ audit/event СЃР»РѕР№ РґР»СЏ admin billing mutations РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-billing.ts`: `recordAdminSubscriptionEvent(...)` Рё `recordAdminBillingAudit(...)` С‚РµРїРµСЂСЊ РґРµСЂР¶Р°С‚ insert РІ `subscription_events` Рё `admin_audit_logs` РІРЅРµ route handlers.
- [x] `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts` Рё `src/app/api/admin/users/bulk/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° СЌС‚Рё helper'С‹: billing single-user Рё bulk flows Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚ РѕРґРёРЅ Рё С‚РѕС‚ Р¶Рµ audit/event plumbing.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-billing.ts src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРІРµСЂРёС‚СЊ, РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ Р»Рё СѓР¶Рµ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ route/lib duplication, Рё РµСЃР»Рё РЅРµС‚ вЂ” РґРѕР±РёСЂР°С‚СЊ РѕСЃС‚Р°РІС€РёРµСЃСЏ admin/self-service/AI handlers.

## 2026-03-20 admin role helper extraction addendum

- [x] РћР±С‰РёР№ target lookup Рё audit СЃР»РѕР№ РґР»СЏ `src/app/api/admin/users/[id]/role/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-role-management.ts`: Р·Р°РіСЂСѓР·РєР° target user С‡РµСЂРµР· auth admin API, С‡С‚РµРЅРёРµ `platform_admins`, primary super-admin guards Рё audit insert Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ `PATCH` Рё `DELETE`.
- [x] Admin role route С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: auth, param parse Рё response shape РѕСЃС‚Р°Р»РёСЃСЊ РІ handler, Р° shared role-management rules Рё audit plumbing Р¶РёРІСѓС‚ РІ helper-СЃР»РѕРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїРµСЂРµРѕС†РµРЅРёС‚СЊ РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ route/lib duplication Рё route-handler audit РїРѕСЃР»Рµ СЌС‚РѕР№ СЃРµСЂРёРё admin extraction slices.

## 2026-03-20 admin mutation contract coverage addendum

- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ admin-only contract test РЅР° invalid target ids РґР»СЏ `admin/users/[id]/export`, `deletion`, `support-action`, `suspend`, `restore`, `billing`, `billing/reconcile` Рё `role`.
- [x] РўРµРїРµСЂСЊ route-handler audit СЏРІРЅРѕ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ СЌС‚Рё admin mutation routes СЂРµР¶СѓС‚ РЅРµРІР°Р»РёРґРЅС‹Р№ `userId` РЅР° СѓСЂРѕРІРЅРµ `400 ..._TARGET_INVALID` РґРѕ Р»СЋР±С‹С… side effects Рё РЅРµ РїР°РґР°СЋС‚ РІ РѕР±С‰РёР№ `500`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ baseline-РїР°РєРµС‚РѕРј: `npx eslint tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `9 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: СЂРµС€РёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё СѓР¶Рµ Р·Р°РєСЂС‹С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ route-handler audit РїСѓРЅРєС‚ РїРѕ validation/owner-only/idempotency РґР»СЏ covered admin and AI/data routes, РёР»Рё РЅСѓР¶РµРЅ РµС‰С‘ РѕРґРёРЅ coverage/fix slice.

## 2026-03-20 admin role helper extraction addendum

- [x] РћР±С‰РёР№ target lookup Рё audit СЃР»РѕР№ РґР»СЏ `src/app/api/admin/users/[id]/role/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-role-management.ts`: Р·Р°РіСЂСѓР·РєР° target user С‡РµСЂРµР· auth admin API, С‡С‚РµРЅРёРµ `platform_admins`, primary super-admin guards Рё audit insert Р±РѕР»СЊС€Рµ РЅРµ РґСѓР±Р»РёСЂСѓСЋС‚СЃСЏ РјРµР¶РґСѓ `PATCH` Рё `DELETE`.
- [x] Admin role route С‚РµРїРµСЂСЊ Р·Р°РјРµС‚РЅРѕ Р±Р»РёР¶Рµ Рє transport-СЃР»РѕСЋ: auth, param parse Рё response shape РѕСЃС‚Р°Р»РёСЃСЊ РІ handler, Р° shared role-management rules Рё audit plumbing Р¶РёРІСѓС‚ РІ helper-СЃР»РѕРµ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїРµСЂРµРѕС†РµРЅРёС‚СЊ РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РїСЂРѕ route/lib duplication Рё route-handler audit РїРѕСЃР»Рµ СЌС‚РѕР№ СЃРµСЂРёРё admin extraction slices.

## 2026-03-20 admin user detail data extraction addendum

- [x] РћСЃРЅРѕРІРЅРѕР№ read-model Рё degraded fallback РґР»СЏ `src/app/api/admin/users/[id]/route.ts` РІС‹РЅРµСЃРµРЅС‹ РІ `src/lib/admin-user-detail-data.ts`: heavy fan-out Р·Р°РіСЂСѓР·РєР°, actor reference hydration Рё С„РѕСЂРјРёСЂРѕРІР°РЅРёРµ fallback snapshot Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІРЅСѓС‚СЂРё route handler.
- [x] `src/app/api/admin/users/[id]/route.ts` СЃС‚Р°Р» С‚РѕРЅРєРёРј transport-СЃР»РѕРµРј: РІ handler РѕСЃС‚Р°Р»РёСЃСЊ С‚РѕР»СЊРєРѕ admin access, UUID parse, auth lookup, РІС‹Р·РѕРІ shared loader Рё РѕР±С‰РёР№ error mapping.
- [x] Р’РµСЂС…РЅРёР№ client-state СЌС‚РѕРіРѕ СЌРєСЂР°РЅР° СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ tranche РІ С‡РёСЃС‚РѕРј UTF-8: `src/components/admin-user-detail-state.ts` Рё РІРµСЂС…РЅРёР№ shell `src/components/admin-user-detail.tsx` Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р±РёС‚С‹Р№ copy РІ loading/error/section surface.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-user-detail-data.ts src/app/api/admin/users/[id]/route.ts src/components/admin-user-detail-state.ts src/components/admin-user-detail.tsx`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ owner-only/idempotency/race conditions Рё РґРѕР±РёСЂР°С‚СЊ РµС‰С‘ РѕРґРёРЅ heavy admin/self-service read-surface, РµСЃР»Рё РѕСЃРЅРѕРІРЅРѕР№ РїСѓРЅРєС‚ РІСЃС‘ РµС‰С‘ РЅРµ Р·Р°РєСЂС‹РІР°РµС‚СЃСЏ С†РµР»РёРєРѕРј.

## 2026-03-20 admin users catalog data extraction addendum

- [x] РћСЃРЅРѕРІРЅРѕР№ catalog/read-model СЃР»РѕР№ РґР»СЏ `src/app/api/admin/users/route.ts` РІС‹РЅРµСЃРµРЅ РІ `src/lib/admin-users-data.ts`: parse filters, fallback snapshot, auth user pagination, aggregate assembly, sorting, summary Рё segment building Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІСѓС‚ РІРЅСѓС‚СЂРё route handler.
- [x] `src/app/api/admin/users/route.ts` СЃС‚Р°Р» С‚РѕРЅРєРёРј transport-СЃР»РѕРµРј: handler РґРµСЂР¶РёС‚ С‚РѕР»СЊРєРѕ admin access, С‡С‚РµРЅРёРµ search params, РІС‹Р·РѕРІ shared loader Рё degraded fallback response.
- [x] `tests/e2e/admin-app.spec.ts` СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РїСЂРѕС‚РёРІ РІРЅРµС€РЅРµРіРѕ auth timeout: degraded admin detail scenario Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ `/api/admin/users`, Р° РїРѕР»СѓС‡Р°РµС‚ test user id С‡РµСЂРµР· `findAuthUserIdByEmail(...)`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/lib/admin-users-data.ts src/app/api/admin/users/route.ts tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ owner-only/idempotency/race conditions Рё РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё Р·Р°РєСЂС‹РІР°С‚СЊ РѕР±С‰РёР№ РїСѓРЅРєС‚ РїРѕ С‚СЏР¶С‘Р»С‹Рј admin/self-service read-surfaces.

## 2026-03-20 admin users directory state extraction addendum

- [x] Async/data orchestration РєР°С‚Р°Р»РѕРіР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РІС‹РЅРµСЃРµРЅ РёР· `src/components/admin-users-directory.tsx` РІ `src/components/use-admin-users-directory-state.ts`: fetch РєР°С‚Р°Р»РѕРіР°, deferred search, bulk submit, reload/reset Рё selection state Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°СЋС‚СЃСЏ СЃ JSX.
- [x] `src/components/admin-users-directory.tsx` С‚РµРїРµСЂСЊ Р±Р»РёР¶Рµ Рє С‡РёСЃС‚РѕРјСѓ UI-orchestrator: РІ РєРѕРјРїРѕРЅРµРЅС‚Рµ РѕСЃС‚Р°Р»РёСЃСЊ layout, cards, filters UI Рё wiring Рє СѓР¶Рµ РІС‹РЅРµСЃРµРЅРЅРѕРјСѓ state-hook.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/components/admin-users-directory.tsx src/components/use-admin-users-directory-state.ts`, `npm run build`, `npm run typecheck`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ frontend/backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ СѓР±РёСЂР°С‚СЊ async/data orchestration РёР· remaining heavy self-service screens Рё Р·Р°С‚РµРј РїРµСЂРµРѕС†РµРЅРёС‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ С‚СЏР¶С‘Р»С‹Рј СЌРєСЂР°РЅР°Рј.

## 2026-03-20 settings data center state extraction addendum

- [x] Async/data orchestration `src/components/settings-data-center.tsx` РІС‹РЅРµСЃРµРЅ РІ `src/components/use-settings-data-center-state.ts`: refresh snapshot, queue export, request/cancel deletion, success/error state Рё derived flags Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°СЋС‚СЃСЏ СЃ JSX.
- [x] `src/components/settings-data-center-model.ts` Рё РІРµСЂС…РЅРёР№ surface `src/components/settings-data-center.tsx` РїРµСЂРµРїРёСЃР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8: self-service copy, timeline labels Рё export/deletion СЃС‚Р°С‚СѓСЃС‹ Р±РѕР»СЊС€Рµ РЅРµ РѕС‚РґР°СЋС‚ mojibake.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run build`, `npm run typecheck`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ frontend tranche: РІС‹РЅРµСЃС‚Рё checkout/access-review orchestration РёР· `settings-billing-center.tsx` Рё Р·Р°С‚РµРј РїРµСЂРµРѕС†РµРЅРёС‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ remaining heavy screens.

## 2026-03-20 settings billing center state extraction addendum

- [x] Async/data orchestration `src/components/settings-billing-center.tsx` РІС‹РЅРµСЃРµРЅ РІ `src/components/use-settings-billing-center-state.ts`: checkout return reconcile, retry-loop, URL/session orchestration, access review request flow, feature selection Рё refresh billing snapshot Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°СЋС‚СЃСЏ СЃ JSX.
- [x] `src/components/settings-billing-center-model.ts` Рё `src/components/settings-billing-center.tsx` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8: billing center, request-access surface Рё access timeline Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р±РёС‚С‹Р№ copy.
- [x] РџРѕСЃР»Рµ extraction tranche РѕСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `Async/data orchestration Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°РµС‚СЃСЏ СЃ JSX РІ РѕСЃС‚Р°РІС€РёС…СЃСЏ С‚СЏР¶С‘Р»С‹С… СЌРєСЂР°РЅР°С…` Р·Р°РєСЂС‹С‚: remaining heavy self-service screens РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‚РѕС‚ Р¶Рµ state-hook/model/orchestrator pattern, С‡С‚Рѕ Рё workout/admin/AI surface.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run build`, `npm run typecheck`. Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ targeted UI smoke Р»РѕРєР°Р»СЊРЅРѕ СѓРїС‘СЂСЃСЏ РІ РЅРµСЃС‚Р°Р±РёР»СЊРЅС‹Р№ Playwright webServer bootstrap РЅР° СЌС‚РѕР№ РјР°С€РёРЅРµ, РЅРѕ РєРѕРґРѕРІС‹Р№ baseline РїРѕ settings surface Р·РµР»С‘РЅС‹Р№.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ frontend/backend tranche: РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє РѕСЃС‚Р°РІС€РµРјСѓСЃСЏ route-handler audit Рё remaining mojibake/self-service sanitation РІРЅРµ СѓР¶Рµ Р·Р°РєСЂС‹С‚РѕРіРѕ heavy-screen checkbox.

## 2026-03-20 settings self-service contract hardening addendum

- [x] `src/app/api/settings/data/route.ts` Рё `src/app/api/settings/billing/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8 Рё expected validation path Р±РѕР»СЊС€Рµ РЅРµ СѓС…РѕРґРёС‚ РІ noisy route-level error logging: `SETTINGS_DATA_INVALID` Рё `SETTINGS_BILLING_INVALID` СЂРµР¶СѓС‚СЃСЏ РґРѕ unexpected-failure logging.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ self-service contract-РїРѕРєСЂС‹С‚РёРµРј: invalid `settings/data` payload -> `400 SETTINGS_DATA_INVALID`, РїРѕРІС‚РѕСЂРЅР°СЏ РѕС‚РјРµРЅР° СѓРґР°Р»РµРЅРёСЏ -> `404 SETTINGS_DELETION_NOT_FOUND`, РїРѕРІС‚РѕСЂРЅС‹Р№ billing access review -> `409 SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ owner-only/idempotency/race conditions Р·Р° РїСЂРµРґРµР»Р°РјРё settings self-service routes.

## 2026-03-20 billing self-service route copy and reconcile validation addendum

- [x] `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts` Рё `src/app/api/billing/portal/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: auth-first Рё runtime failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ mojibake РІ billing self-service surface.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ СЏРІРЅС‹Рј validation-РєРѕРЅС‚СЂР°РєС‚РѕРј РґР»СЏ `POST /api/billing/checkout/reconcile`: РїСѓСЃС‚РѕР№ payload С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґРµРЅ РєР°Рє `400 STRIPE_CHECKOUT_RECONCILE_INVALID`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ billing/webhook/admin/self-service РєРѕРЅС‚СѓСЂР°Рј РІРЅРµ СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРЅРѕРіРѕ transport/validation СЃР»РѕСЏ.

## 2026-03-20 admin billing payload contract addendum

- [x] `src/app/api/admin/users/[id]/billing/route.ts` Рё `src/app/api/admin/users/[id]/billing/reconcile/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: operator-facing invalid/failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ mojibake РІ admin billing surface.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј admin billing contract: РїСЂРё РІР°Р»РёРґРЅРѕРј `targetUserId` Рё РЅРµРєРѕСЂСЂРµРєС‚РЅРѕРј payload (`enable_entitlement` Р±РµР· `feature_key`) route РїРѕРґС‚РІРµСЂР¶РґРµРЅ РєР°Рє `400 ADMIN_BILLING_INVALID` РґРѕ Р»СЋР±С‹С… mutation side effects.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ admin/billing/webhook/self-service РєРѕРЅС‚СѓСЂР°Рј, РїРѕРєР° РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ validation/owner-only/idempotency РЅРµ Р±СѓРґРµС‚ Р·Р°РєСЂС‹С‚ С†РµР»РёРєРѕРј.

## 2026-03-20 admin bulk and operations contract sanitation addendum

- [x] `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/[id]/route.ts` Рё `src/app/api/admin/users/[id]/role/route.ts` РґРѕС‡РёС‰РµРЅС‹ РґРѕ С‡РёСЃС‚РѕРіРѕ UTF-8: operator-facing validation/not-found/self-guard copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ mojibake Рё Р°РЅРіР»РёР№СЃРєРёРµ С…РІРѕСЃС‚С‹.
- [x] `src/app/api/admin/operations/[kind]/[id]/route.ts` Р±РѕР»СЊС€Рµ РЅРµ РїРёС€РµС‚ noisy `logger.error` РЅР° РѕР¶РёРґР°РµРјРѕРј `ZodError`: validation path `ADMIN_OPERATION_INVALID` С‚РµРїРµСЂСЊ СЂРµР¶РµС‚СЃСЏ РґРѕ unexpected-failure logging.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ С‚СЂРµРјСЏ admin transport contracts: invalid `GET /api/admin/users/not-a-uuid` -> `400 ADMIN_USER_DETAIL_INVALID`, invalid payload `POST /api/admin/users/bulk` (`enable_entitlement` Р±РµР· `feature_key`) -> `400 ADMIN_BULK_INVALID`, invalid `PATCH /api/admin/operations/support_action/not-a-uuid` -> `400 ADMIN_OPERATION_INVALID`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/admin/users/bulk/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ webhook/internal/admin mutation РєРѕРЅС‚СѓСЂР°Рј, РїРѕРєР° РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ validation/owner-only/idempotency РЅРµ Р±СѓРґРµС‚ Р·Р°РєСЂС‹С‚ С†РµР»РёРєРѕРј.

## 2026-03-21 bootstrap, webhook and billing job contract sanitation addendum

- [x] `src/app/api/admin/bootstrap/route.ts`, `src/app/api/billing/webhook/stripe/route.ts` Рё `src/app/api/internal/jobs/billing-reconcile/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: auth/bootstrap, Stripe webhook Рё billing reconcile job Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р°РЅРіР»РёР№СЃРєРёР№ РёР»Рё Р±РёС‚С‹Р№ transport copy.
- [x] `src/app/api/admin/bootstrap/route.ts` Р±РѕР»СЊС€Рµ РЅРµ РїРёС€РµС‚ noisy `logger.error` РЅР° РѕР¶РёРґР°РµРјРѕРј `ZodError`: validation path `ADMIN_BOOTSTRAP_PAYLOAD_INVALID` С‚РµРїРµСЂСЊ СЂРµР¶РµС‚СЃСЏ РґРѕ unexpected-failure logging.
- [x] `src/app/api/internal/jobs/billing-reconcile/route.ts` С‚РµРїРµСЂСЊ РїР°СЂСЃРёС‚ query РґРѕ env-gate: invalid `userId` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РєР°Рє `400 BILLING_RECONCILE_JOB_INVALID`, Р° РЅРµ РјР°СЃРєРёСЂСѓРµС‚СЃСЏ РІРЅРµС€РЅРёРј `503 STRIPE_BILLING_RECONCILE_NOT_CONFIGURED`.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ transport-РєРѕРЅС‚СЂР°РєС‚Р°РјРё: anonymous `POST /api/admin/bootstrap` -> `401 AUTH_REQUIRED`, anonymous `POST /api/billing/webhook/stripe` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РєР°Рє `400 STRIPE_SIGNATURE_MISSING` РёР»Рё `503 STRIPE_WEBHOOK_NOT_CONFIGURED` РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ env.
- [x] `tests/e2e/internal-jobs.spec.ts` СЂР°СЃС€РёСЂРµРЅ validation-РєРѕРЅС‚СЂР°РєС‚РѕРј РґР»СЏ `POST /api/internal/jobs/billing-reconcile?userId=not-a-uuid` -> `400 BILLING_RECONCILE_JOB_INVALID`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/admin/bootstrap/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts --workers=1` -> `13 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ admin/self-service mutation handlers Рё РґРѕР±РёРІР°С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ validation/owner-only/idempotency.

## 2026-03-21 admin mutation payload contract sanitation addendum

- [x] `src/app/api/admin/users/[id]/billing/route.ts`, `billing/reconcile/route.ts`, `deletion/route.ts`, `export/route.ts`, `restore/route.ts`, `support-action/route.ts`, `suspend/route.ts` РґРѕС‡РёС‰РµРЅС‹ РґРѕ С‡РёСЃС‚РѕРіРѕ UTF-8: target-id, validation Рё failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р°РЅРіР»РёР№СЃРєРёРµ РёР»Рё Р±РёС‚С‹Рµ transport messages.
- [x] Default audit reasons РґР»СЏ admin mutation handlers РїРµСЂРµРІРµРґРµРЅС‹ РЅР° СЂСѓСЃСЃРєРёР№, С‡С‚РѕР±С‹ operator-visible history Р±РѕР»СЊС€Рµ РЅРµ РїРѕРєР°Р·С‹РІР°Р»Р° Р°РЅРіР»РёР№СЃРєРёРµ `manual ... request` С…РІРѕСЃС‚С‹.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid-payload РєРѕРЅС‚СЂР°РєС‚Р°РјРё РґР»СЏ admin queue routes: `ADMIN_DELETION_INVALID`, `ADMIN_EXPORT_INVALID`, `ADMIN_RESTORE_INVALID`, `ADMIN_SUPPORT_ACTION_INVALID`, `ADMIN_SUSPEND_INVALID`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/restore/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `12 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РґРѕР±РёСЂР°С‚СЊ remaining route-handler audit РїРѕ operator/self-service mutation surfaces Рё РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё Р·Р°РєСЂС‹РІР°С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ validation/owner-only/idempotency.

## 2026-03-21 admin operator tooling contract sanitation addendum

- [x] `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/operations/process/route.ts` Рё `src/app/api/admin/observability/sentry-test/route.ts` РґРѕС‡РёС‰РµРЅС‹ РґРѕ С‡РёСЃС‚РѕРіРѕ UTF-8: tooling routes Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р±РёС‚С‹Р№ operator copy РІ validation, audit reason Рё failure paths.
- [x] `src/app/api/admin/operations/process/route.ts` Рё `src/app/api/admin/ai-evals/run/route.ts` С‚РµРїРµСЂСЊ СЂРµР¶СѓС‚ invalid payload РґРѕ expected `400` Р±РµР· noisy route-level failure logging РЅР° validation path.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ direct invalid-payload РєРѕРЅС‚СЂР°РєС‚Р°РјРё РґР»СЏ operator tooling routes: `AI_EVAL_RUN_INVALID` Рё `ADMIN_OPERATIONS_PROCESS_INVALID`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/app/api/admin/ai-evals/run/route.ts src/app/api/admin/operations/process/route.ts src/app/api/admin/observability/sentry-test/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РґРѕС‡РёСЃС‚РёС‚СЊ remaining operator wording Рё audit reasons РІ admin surfaces, Р·Р°С‚РµРј РїРµСЂРµРѕС†РµРЅРёС‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ validation/owner-only/idempotency.

## 2026-03-21 admin operations wording sanitation addendum

- [x] `src/app/api/admin/operations/[kind]/[id]/route.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РµРґРёРЅС‹Р№ operator-facing transport copy: `support action`, `export job`, `deletion request` Рё `operations inbox` Р±РѕР»СЊС€Рµ РЅРµ С‚РѕСЂС‡Р°С‚ РІ validation, transition Рё failure messages.
- [x] Default audit reason РґР»СЏ СЂСѓС‡РЅРѕРіРѕ РѕР±РЅРѕРІР»РµРЅРёСЏ operator queue СѓРЅРёС„РёС†РёСЂРѕРІР°РЅ РєР°Рє `Р СѓС‡РЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ РѕРїРµСЂР°С‚РѕСЂСЃРєРѕР№ РѕС‡РµСЂРµРґРё`, С‡С‚РѕР±С‹ admin audit logs РЅРµ СЃРјРµС€РёРІР°Р»Рё Р°РЅРіР»РёР№СЃРєРёР№ Рё СЂСѓСЃСЃРєРёР№ transport СЃР»РѕР№.
- [x] `src/app/api/admin/operations/route.ts` С‚РµРїРµСЂСЊ РѕС‚РґР°С‘С‚ СЂСѓСЃСЃРєРёРµ titles `Р­РєСЃРїРѕСЂС‚ РґР°РЅРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ` Рё `Р—Р°РїСЂРѕСЃ РЅР° СѓРґР°Р»РµРЅРёРµ РґР°РЅРЅС‹С…`, Р° fallback message Р±РѕР»СЊС€Рµ РЅРµ СЃРѕРґРµСЂР¶РёС‚ `operations inbox`.
- [x] `src/app/api/admin/users/[id]/role/route.ts` Рё `src/app/api/admin/users/[id]/support-action/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‡РёСЃС‚С‹Р№ operator-facing copy: administrative role Рё support action Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р°РЅРіР»РёР№СЃРєРёРµ С…РІРѕСЃС‚С‹ РІ validation, audit reason Рё failure messages.
- [x] `src/app/api/admin/ai-evals/run/route.ts` С‚РµРїРµСЂСЊ СЃРѕР·РґР°С‘С‚ СЂСѓСЃСЃРєРёР№ default label `AI-РїСЂРѕРІРµСЂРєР° ...`, С‡С‚РѕР±С‹ operator queue Рё audit history РЅРµ СЃРјРµС€РёРІР°Р»Рё Р°РЅРіР»РёР№СЃРєРёРµ Рё СЂСѓСЃСЃРєРёРµ РЅР°Р·РІР°РЅРёСЏ.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint -- --quiet src/app/api/admin/operations/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/ai-evals/run/route.ts`, РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅС‹РјРё `npm run typecheck` Рё `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ validation/owner-only/idempotency Рё РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё Р·Р°РєСЂС‹РІР°С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ backend hardening.

## 2026-03-21 internal jobs and queue processing wording sanitation addendum

- [x] `src/app/api/internal/jobs/ai-evals-schedule/route.ts`, `billing-reconcile/route.ts` Рё `knowledge-reindex/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° С‡РёСЃС‚С‹Р№ operator-facing copy: internal job labels Рё success/failure messages Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°СЋС‚ Р°РЅРіР»РёР№СЃРєРёР№ Рё СЂСѓСЃСЃРєРёР№ transport СЃР»РѕР№.
- [x] `src/lib/admin-queue-processing.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РµРґРёРЅС‹Р№ СЂСѓСЃСЃРєРёР№ audit/log СЃР»РѕР№: queue-processing reasons, deletion hold transitions, support queue notes Рё hard-delete workflow labels Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р°РЅРіР»РёР№СЃРєРёРµ `queue processor ...` С…РІРѕСЃС‚С‹.
- [x] РџРѕРІС‚РѕСЂРЅР°СЏ РїСЂРѕРІРµСЂРєР° РїРѕРёСЃРєРѕРј РїРѕРґС‚РІРµСЂРґРёР»Р°, С‡С‚Рѕ РІ `src/app/api` Рё `src/lib` Р±РѕР»СЊС€Рµ РЅРµ РѕСЃС‚Р°Р»РѕСЃСЊ СЃС‚СЂРѕРє `queue processor`, `scheduled AI eval jobs`, `billing reconciliation jobs` Рё `knowledge reindex jobs`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint -- --quiet src/lib/admin-queue-processing.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ validation/owner-only/idempotency Рё РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё Р·Р°РєСЂС‹РІР°С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ backend hardening.

## 2026-03-21 onboarding, weekly programs Рё workout templates contract sanitation addendum

- [x] `src/app/api/onboarding/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts` Рё `src/app/api/workout-templates/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: user-facing auth, validation, not-found, conflict Рё failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ mojibake.
- [x] Р’ `onboarding` Рё `workout templates` validation path С‚РµРїРµСЂСЊ СЂРµР¶РµС‚СЃСЏ РґРѕ expected `400` Р±РµР· noisy route-level `logger.error` РЅР° `ZodError`, Р° clone/template titles Р±РѕР»СЊС€Рµ РЅРµ СЃРјРµС€РёРІР°СЋС‚ Р°РЅРіР»РёР№СЃРєРёР№ Рё СЂСѓСЃСЃРєРёР№ РІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕР№ РїРѕРІРµСЂС…РЅРѕСЃС‚Рё.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid-payload РєРѕРЅС‚СЂР°РєС‚Р°РјРё РґР»СЏ `POST /api/onboarding`, `POST /api/weekly-programs/{id}/clone` Рё `POST /api/workout-templates`, С‡С‚РѕР±С‹ СЌС‚Рё product routes Р±С‹Р»Рё РїРѕРєСЂС‹С‚С‹ С‚РµРј Р¶Рµ predictable `400` СЃР»РѕРµРј, С‡С‚Рѕ Рё РѕСЃС‚Р°Р»СЊРЅС‹Рµ self-service handlers.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint -- --quiet src/app/api/onboarding/route.ts src/app/api/nutrition/targets/route.ts src/app/api/weekly-programs/[id]/lock/route.ts src/app/api/weekly-programs/[id]/clone/route.ts src/app/api/workout-templates/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїСЂРѕРґРѕР»Р¶Р°С‚СЊ remaining route-handler audit РїРѕ validation/owner-only/idempotency Рё РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РјРѕР¶РЅРѕ Р»Рё СѓР¶Рµ Р·Р°РєСЂС‹РІР°С‚СЊ РѕСЃРЅРѕРІРЅРѕР№ checkbox РїРѕ backend hardening.

## 2026-03-21 weekly programs, exercises Рё nutrition create routes sanitation addendum

- [x] `src/app/api/weekly-programs/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/foods/route.ts`, `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` Рё `src/app/api/meals/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: auth, validation, missing-food, duplicate-day Рё failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ mojibake РІ user-facing product API surface.
- [x] Р’ `weekly-programs`, `exercises`, `foods`, `recipes`, `meal-templates` Рё `meals` validation path С‚РµРїРµСЂСЊ СЂРµР¶РµС‚СЃСЏ РґРѕ expected `400` Р±РµР· noisy route-level `logger.error` РЅР° `ZodError`, Р° default title snapshot `Unknown exercise` Р·Р°РјРµРЅС‘РЅ РЅР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ `РќРµРёР·РІРµСЃС‚РЅРѕРµ СѓРїСЂР°Р¶РЅРµРЅРёРµ`.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid-payload РєРѕРЅС‚СЂР°РєС‚Р°РјРё РґР»СЏ `POST /api/weekly-programs`, `POST /api/exercises`, `POST /api/foods`, `POST /api/recipes`, `POST /api/meal-templates` Рё `POST /api/meals`, С‡С‚РѕР±С‹ РІРµСЃСЊ create-surface weekly/workout/nutrition РєРѕРЅС‚СѓСЂР° Р±С‹Р» РїРѕРєСЂС‹С‚ predictable `400` regression suite.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint -- --quiet src/app/api/weekly-programs/route.ts src/app/api/exercises/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїРµСЂРµРѕС†РµРЅРёС‚СЊ, РєР°РєРёРµ route handlers РµС‰С‘ СЂРµР°Р»СЊРЅРѕ РЅРµ Р·Р°РєСЂС‹С‚С‹ РїРѕ validation/owner-only/idempotency, Рё РґРѕР±РёС‚СЊ РїРѕСЃР»РµРґРЅРёР№ С…РІРѕСЃС‚ РїРµСЂРµРґ Р·Р°РєСЂС‹С‚РёРµРј РѕСЃРЅРѕРІРЅРѕРіРѕ checkbox.

## 2026-03-21 workout sync transport sanitation addendum

- [x] `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts` Рё `src/app/api/workout-days/[id]/reset/route.ts` РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃС‚С‹Р№ UTF-8: auth, validation, not-found, duplicate mutation Рё failure copy Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ mojibake РІ workout sync transport surface.
- [x] `sync/push`, `sync/pull` Рё direct workout-day update route С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ predictable invalid-transport РєРѕРЅС‚СЂР°РєС‚Р°РјРё: `SYNC_PUSH_INVALID`, `SYNC_PULL_INVALID` Рё payload-level `WORKOUT_DAY_UPDATE_INVALID` СЂРµР¶СѓС‚СЃСЏ РґРѕ expected `400` Р±РµР· noisy route-level `logger.error`.
- [x] `tests/e2e/api-contracts.spec.ts` СЂР°СЃС€РёСЂРµРЅ invalid contract РїРѕРєСЂС‹С‚РёРµРј РґР»СЏ `POST /api/sync/push`, `GET /api/sync/pull` Рё payload-level `PATCH /api/workout-days/{id}`, С‡С‚РѕР±С‹ sync/day transport СЃР»РѕР№ Р±С‹Р» РІ С‚РѕРј Р¶Рµ regression baseline, С‡С‚Рѕ Рё РѕСЃС‚Р°Р»СЊРЅС‹Рµ owner-scoped mutation routes.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint -- --quiet src/app/api/sync/pull/route.ts src/app/api/sync/push/route.ts src/app/api/workout-days/[id]/route.ts src/app/api/workout-days/[id]/reset/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- [x] РЎР»РµРґСѓСЋС‰РёР№ backend tranche Р·Р°РєСЂС‹С‚ РІРµСЂРёС„РёРєР°С†РёРѕРЅРЅС‹Рј bundle РЅРёР¶Рµ: owner-only, invalid contracts, internal jobs Рё workout sync РїРѕРєСЂС‹С‚С‹ РѕС‚РґРµР»СЊРЅС‹РјРё regression suites, С‚Р°Рє С‡С‚Рѕ РѕР±С‰РёР№ checkbox РїРѕ validation/owner-only/idempotency Рё sync race conditions РјРѕР¶РЅРѕ СЃС‡РёС‚Р°С‚СЊ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рј.

## 2026-03-21 backend audit closure addendum

- [x] РћСЃРЅРѕРІРЅРѕР№ backend checkbox `РџСЂРѕР№С‚Рё РІСЃРµ route handlers РЅР° РІР°Р»РёРґР°С†РёСЋ, owner-only РґРѕСЃС‚СѓРї, РѕС€РёР±РєРё Рё idempotency` Р·Р°РєСЂС‹С‚ РЅР° Р±Р°Р·Рµ РѕР±СЉРµРґРёРЅС‘РЅРЅРѕРіРѕ regression bundle: `tests/e2e/api-contracts.spec.ts`, `tests/e2e/ownership-isolation.spec.ts`, `tests/e2e/internal-jobs.spec.ts`, `tests/e2e/workout-sync.spec.ts` Рё `tests/rls/ownership.spec.ts`.
- [x] РџРѕРІС‚РѕСЂРЅР°СЏ СЂСѓС‡РЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° Р»РѕРєР°Р»СЊРЅРѕ С‡РµСЂРµР· `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`: `29 passed` РґР»СЏ `api-contracts + ownership-isolation + internal-jobs + workout-sync` Рё `4 passed` РґР»СЏ РїСЂСЏРјРѕРіРѕ `RLS`.
- [x] `tests/e2e/workout-sync.spec.ts` СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ С‡РµСЂРµР· `navigateStable(...)`, С‡С‚РѕР±С‹ regression suite РЅРµ С„Р»Р°РєР°Р» РЅР° auth redirect Рё РјРѕРі СЃР»СѓР¶РёС‚СЊ СЂРµР°Р»СЊРЅС‹Рј РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІРѕРј РґР»СЏ checkbox РїСЂРѕ `reset/finish/sync` race conditions, infinite polling Рё idempotent reset/done flow.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ Рё РІС‚РѕСЂРѕР№ РѕСЃРЅРѕРІРЅРѕР№ backend checkbox `РџРѕРґС‚РІРµСЂРґРёС‚СЊ, С‡С‚Рѕ reset/finish/sync СЃС†РµРЅР°СЂРёРё РЅРµ СЃРѕР·РґР°СЋС‚ race conditions Рё Р±РµСЃРєРѕРЅРµС‡РЅС‹Р№ polling`: suite РѕС‚РґРµР»СЊРЅРѕ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ invalid sync mutations, clean `sync -> reset -> sync/pull`, idempotent `done/reset`, РѕС‡РёСЃС‚РєСѓ stale offline queue Рё guard РґР»СЏ unlocked week.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ backend tranche: РїРµСЂРµС…РѕРґРёС‚СЊ Рє РѕСЃС‚Р°РІС€РёРјСЃСЏ quality/release Р±Р»РѕРєР°Рј РІРЅРµ СѓР¶Рµ Р·Р°РєСЂС‹С‚РѕРіРѕ route-handler audit, РІ РїРµСЂРІСѓСЋ РѕС‡РµСЂРµРґСЊ AI eval gate, production billing Рё remaining UX/documentation sanitation.

## 2026-03-20 user-facing billing UX closure addendum

- [x] `src/components/settings-billing-center.tsx` РґРѕРІРµРґС‘РЅ РґРѕ production-copy: РІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРј billing center Р±РѕР»СЊС€Рµ РЅРµС‚ СЃС‹СЂС‹С… СЏСЂР»С‹РєРѕРІ РІСЂРѕРґРµ `super-admin`, usage limit РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РєР°Рє `Р±РµР· Р»РёРјРёС‚Р°`, Р° privileged plan surface РѕСЃС‚Р°С‘С‚СЃСЏ РїРѕРЅСЏС‚РЅС‹Рј СЂСѓСЃСЃРєРёРј СЏР·С‹РєРѕРј.
- [x] `src/components/settings-billing-center-model.ts` Рё `src/components/page-workspace.tsx` РїРѕР»СѓС‡РёР»Рё СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅРЅС‹Р№ formatter/testid СЃР»РѕР№ РґР»СЏ billing surface: desktop section-menu С‚РµРїРµСЂСЊ РёРјРµРµС‚ РїСЂРµРґСЃРєР°Р·СѓРµРјС‹Рµ `data-testid`, Р° privileged subscription status РїРѕРєР°Р·С‹РІР°РµС‚ `РїРѕР»РЅС‹Р№ РєРѕСЂРЅРµРІРѕР№ РґРѕСЃС‚СѓРї`.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite `tests/e2e/settings-billing.spec.ts`: РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ billing section navigation, РІРёРґРёРјРѕСЃС‚СЊ Р±Р»РѕРєРѕРІ `РўРµРєСѓС‰РёР№ РїР»Р°РЅ / Р—Р°РїСЂРѕСЃРёС‚СЊ РґРѕСЃС‚СѓРї / РСЃС‚РѕСЂРёСЏ РґРѕСЃС‚СѓРїР°`, СЂСѓСЃСЃРєРёРµ queued status copy Рё billing review snapshot РЅР° `/settings`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/settings-billing.spec.ts --workers=1` -> `2 passed`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `Р”РѕРІРµСЃС‚Рё user-facing billing UX РґРѕ production-СѓСЂРѕРІРЅСЏ Р±РµР· СЃС‹СЂС‹С… РїСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹С… СЃРѕСЃС‚РѕСЏРЅРёР№`.

## 2026-03-20 admin billing health UX closure addendum

- [x] `src/components/admin-health-dashboard.tsx` РїРѕР»СѓС‡РёР» СЃС‚Р°Р±РёР»СЊРЅС‹Р№ operator surface РґР»СЏ billing health: РєРЅРѕРїРєР° СЂСѓС‡РЅРѕР№ СЃРІРµСЂРєРё Рё РєР»СЋС‡РµРІС‹Рµ billing-РєР°СЂС‚РѕС‡РєРё СЃРЅР°Р±Р¶РµРЅС‹ СЏРІРЅС‹РјРё testid Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РєР°Рє РѕС‚РґРµР»СЊРЅР°СЏ Р°РґРјРёРЅСЃРєР°СЏ РїРѕРІРµСЂС…РЅРѕСЃС‚СЊ.
- [x] `src/components/admin-user-actions.tsx`, `src/components/admin-user-detail.tsx` Рё `src/components/admin-user-detail-sections.tsx` РґРѕС‡РёС‰РµРЅС‹ РґРѕ РЅРѕСЂРјР°Р»СЊРЅРѕРіРѕ billing copy Рё СЃС‚Р°Р±РёР»СЊРЅРѕР№ РЅР°РІРёРіР°С†РёРё: РІРјРµСЃС‚Рѕ `РіР»Р°РІРЅРѕРјСѓ СЃСѓРїРµСЂ-Р°РґРјРёРЅСѓ` С‚РµРїРµСЂСЊ `РєРѕСЂРЅРµРІРѕРјСѓ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂСѓ`, Р° billing section/detail surface РёРјРµРµС‚ РїСЂРµРґСЃРєР°Р·СѓРµРјС‹Рµ `data-testid`.
- [x] `tests/e2e/admin-app.spec.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј operator billing regression: root-admin РІРёРґРёС‚ billing health РЅР° `/admin`, РєРЅРѕРїРєСѓ `РЎРІРµСЂРёС‚СЊ РѕРїР»Р°С‚С‹`, billing controls РІ РєР°СЂС‚РѕС‡РєРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё billing section СЃ РєР°СЂС‚РѕС‡РєР°РјРё `РўРµРєСѓС‰Р°СЏ РїРѕРґРїРёСЃРєР° / РџР»Р°С‚С‘Р¶РЅС‹Р№ РїСЂРѕС„РёР»СЊ / РСЃС‚РѕСЂРёСЏ РїРѕРґРїРёСЃРєРё`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npx eslint src/components/admin-health-dashboard.tsx src/components/admin-user-actions.tsx src/components/admin-user-detail.tsx src/components/admin-user-detail-sections.tsx tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/admin-app.spec.ts --workers=1` -> `6 passed`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `Р”РѕРІРµСЃС‚Рё admin billing health Рё reconcile UX РґРѕ РѕРїРµСЂР°С‚РѕСЂСЃРєРѕРіРѕ СѓСЂРѕРІРЅСЏ`.
- [x] Р—Р°РѕРґРЅРѕ Р·Р°РєСЂС‹С‚ milestone-РїСѓРЅРєС‚ `UI РІ /settings Рё /admin РєРѕСЂСЂРµРєС‚РЅРѕ РїРѕРєР°Р·С‹РІР°РµС‚ СЃС‚Р°С‚СѓСЃ РїРѕРґРїРёСЃРєРё Рё СЂР°СЃС…РѕР¶РґРµРЅРёСЏ`.

## 2026-03-20 reliability gate closure addendum

- [x] `tests/e2e/authenticated-app.spec.ts` СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РЅР° СЃРµРјР°РЅС‚РёС‡РµСЃРєРёС… shell-Р»РѕРєР°С‚РѕСЂР°С…: РїРµСЂРµС…РѕРґС‹ РїРѕ РѕСЃРЅРѕРІРЅС‹Рј РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёРј СЂР°Р·РґРµР»Р°Рј Рё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ СЃРµСЃСЃРёРё Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃСЏС‚ РѕС‚ С…СЂСѓРїРєРѕРіРѕ `a[href="/ai"]`.
- [x] `tests/e2e/ui-regressions.spec.ts` РѕР±РЅРѕРІР»С‘РЅ РЅР° СЃС‚Р°Р±РёР»СЊРЅС‹Рµ admin shell locators `/admin` Рё `/admin/users`, С‡С‚РѕР±С‹ regression suite РѕС‚СЂР°Р¶Р°Р» С‚РµРєСѓС‰РёР№ desktop shell Р±РµР· Р»РѕР¶РЅС‹С… РєСЂР°СЃРЅС‹С… РёР·-Р·Р° РїРµСЂРµРёРјРµРЅРѕРІР°РЅРЅРѕРіРѕ РїСѓРЅРєС‚Р° `Р¦РµРЅС‚СЂ СѓРїСЂР°РІР»РµРЅРёСЏ`.
- [x] РџРѕР»РЅС‹Р№ reliability bundle РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РµРґРёРЅС‹Рј РїСЂРѕРіРѕРЅРѕРј: `authenticated-app + settings-billing + ui-regressions + mobile-pwa-regressions + workout-sync` С‡РµСЂРµР· `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test ... --workers=1` -> `16 passed`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ acceptance checkbox `РќРµС‚ hydration mismatch, render loops, infinite polling Рё state desync РІ Р±Р°Р·РѕРІС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёС… СЃС†РµРЅР°СЂРёСЏС…`.

## 2026-03-21 milestone 1 and PWA installability closure addendum

- [x] `src/app/layout.tsx` Р±РѕР»СЊС€Рµ РЅРµ С…Р°СЂРґРєРѕРґРёС‚ РјС‘СЂС‚РІС‹Р№ `https://fit-platform.vercel.app`: metadata base С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°РµС‚СЃСЏ С‡РµСЂРµР· `src/lib/site-url.ts` РёР· `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` СЃ Р»РѕРєР°Р»СЊРЅС‹Рј fallback `http://localhost:3000`.
- [x] Р’ `.env.example` РґРѕР±Р°РІР»РµРЅ `NEXT_PUBLIC_APP_URL`, С‡С‚РѕР±С‹ production URL РјРѕР¶РЅРѕ Р±С‹Р»Рѕ Р·Р°РґР°С‚СЊ СЏРІРЅРѕ Р±РµР· РїСЂР°РІРєРё РєРѕРґР°.
- [x] `tests/smoke/app-smoke.spec.ts` СЂР°СЃС€РёСЂРµРЅ PWA installability smoke: РїРѕРґС‚РІРµСЂР¶РґР°СЋС‚СЃСЏ `link[rel="manifest"]`, `apple-touch-icon`, `application-name`, `manifest.display=standalone`, `start_url=/dashboard`, `maskable` icon Рё `sw.js` СЃ `skipWaiting`/`clients.claim`.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth` -> `50 passed`.
- [x] Production alias `https://fit-platform-eta.vercel.app` РѕС‚РґРµР»СЊРЅРѕ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ fetch-РїСЂРѕРІРµСЂРєРѕР№: root HTML РѕС‚РґР°С‘С‚ manifest/apple metadata, `/manifest.webmanifest` РІРѕР·РІСЂР°С‰Р°РµС‚ `display=standalone`, `lang=ru`, `theme_color=#14614b`, `background_color=#f5f4ee`, `maskable=true`, Р° `/sw.js`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` РґРѕСЃС‚СѓРїРЅС‹ СЃ `200`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚С‹ РѕСЃРЅРѕРІРЅС‹Рµ checklist-РїСѓРЅРєС‚С‹ `РќРµС‚ mojibake РІ РєР»СЋС‡РµРІРѕР№ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё Рё РѕСЃРЅРѕРІРЅС‹С… СЌРєСЂР°РЅР°С… РїСЂРёР»РѕР¶РµРЅРёСЏ`, `Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ, shell, AI workspace Рё workout flow РґРѕРІРµРґРµРЅС‹ РґРѕ production-РєР°С‡РµСЃС‚РІР°`, `РџРѕРґС‚РІРµСЂРґРёС‚СЊ installability production PWA` Рё milestone-РїСѓРЅРєС‚ `РџРѕРґС‚РІРµСЂР¶РґРµРЅР° installability production PWA`.

## 2026-03-21 sanitation-wave triage closure addendum

- [x] РџРѕРІС‚РѕСЂРЅС‹Р№ РїРѕРёСЃРє РїРѕ `src/` Рё `docs/` (РІРєР»СЋС‡Р°СЏ Р»РѕРєР°Р»СЊРЅС‹Р№ `docs/AI_EXPLAINED.md`) РЅРµ РЅР°С€С‘Р» С…Р°СЂР°РєС‚РµСЂРЅС‹С… mojibake-РјР°СЂРєРµСЂРѕРІ РІСЂРѕРґРµ `Р Сџ`, `Р РЋ`, `РЎРѓ`, `РЎвЂљ`, `Р ВµР `.
- [x] Р›РѕРєР°Р»СЊРЅС‹Р№ dirty С„Р°Р№Р» `docs/AI_EXPLAINED.md` РѕС‚РґРµР»СЊРЅРѕ triaged Р±РµР· РїСЂР°РІРєРё СЃРѕРґРµСЂР¶РёРјРѕРіРѕ: РѕРЅ РЅРµ РїРѕРїР°РґР°РµС‚ РІ РєРѕРјРјРёС‚С‹ slice-СЂР°Р±РѕС‚ Рё РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚ shipped documentation surface.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РІРѕР»РЅРѕРІРѕР№ РїСѓРЅРєС‚ `РћС‚РґРµР»СЊРЅРѕ РїСЂРѕРІРµСЃС‚Рё triage Р»РѕРєР°Р»СЊРЅРѕРіРѕ docs/AI_EXPLAINED.md Рё Р·Р°РІРµСЂС€РёС‚СЊ sanitation-wave РґРѕРєСѓРјРµРЅС‚Р°С†РёРё`, Р° РІРµСЂС…РЅРµСѓСЂРѕРІРЅРµРІС‹Р№ СЃС‚Р°С‚СѓСЃ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё РїРµСЂРµРІРµРґС‘РЅ РІ СЃР°РЅРёСЂРѕРІР°РЅРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ.

## 2026-03-21 staging runtime verification addendum

- [x] Р”РѕР±Р°РІР»РµРЅ РµРґРёРЅС‹Р№ release harness `npm run verify:staging-runtime`: РѕРЅ РґРµР»Р°РµС‚ preflight РїРѕ AI/Stripe env Рё auth-credentials, Р·Р°РїСѓСЃРєР°РµС‚ `npm run test:ai-gate` Рё `npm run test:billing-gate` С‚РѕР»СЊРєРѕ РґР»СЏ СЂРµР°Р»СЊРЅРѕ РіРѕС‚РѕРІС‹С… РєРѕРЅС‚СѓСЂРѕРІ Рё СЏРІРЅРѕ РїРµС‡Р°С‚Р°РµС‚ skip/blocker РїСЂРёС‡РёРЅС‹ РґР»СЏ РѕСЃС‚Р°Р»СЊРЅС‹С….
- [x] Р”РѕР±Р°РІР»РµРЅ `tests/billing-gate/billing-runtime-gate.spec.ts`: staging-like billing suite РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РїСЂРё РіРѕС‚РѕРІРѕРј `STRIPE_SECRET_KEY` Рё `STRIPE_PREMIUM_MONTHLY_PRICE_ID` self-service billing surface РјРѕР¶РµС‚ РїРѕРґРЅСЏС‚СЊ live Stripe Checkout session.
- [x] `package.json`, `docs/PROD_READY.md` Рё `docs/RELEASE_CHECKLIST.md` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹: РІ РїСЂРѕРµРєС‚Рµ С‚РµРїРµСЂСЊ РµСЃС‚СЊ С„РѕСЂРјР°Р»СЊРЅС‹Р№ command-level РІС…РѕРґ РґР»СЏ staging-like verification billing/AI runtime, Р° РЅРµ С‚РѕР»СЊРєРѕ СЂР°Р·СЂРѕР·РЅРµРЅРЅС‹Рµ suites.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npx eslint scripts/verify-staging-runtime.mjs tests/billing-gate/billing-runtime-gate.spec.ts`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 skipped`, `npm run verify:staging-runtime` -> СЏРІРЅС‹Р№ blocker-report (`AI provider unavailable`, `Stripe env missing`) РІРјРµСЃС‚Рѕ РјРѕР»С‡Р°Р»РёРІРѕРіРѕ РѕС‚СЃСѓС‚СЃС‚РІРёСЏ РїСЂРѕС†РµСЃСЃР°.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `Р’РІРµСЃС‚Рё staging-like verification РґР»СЏ Stripe Рё AI runtime`; live rollout Рё AI quality gate РїРѕ-РїСЂРµР¶РЅРµРјСѓ РѕСЃС‚Р°СЋС‚СЃСЏ РѕС‚РґРµР»СЊРЅС‹РјРё РІРЅРµС€РЅРёРјРё Р±Р»РѕРєРµСЂР°РјРё.

## 2026-03-23 billing webhook idempotency gate addendum

- [x] Р’ `docs/MASTER_PLAN.md` СѓСЃРёР»РµРЅРѕ РїСЂР°РІРёР»Рѕ РІРµРґРµРЅРёСЏ execution checklist: РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ tranche РЅСѓР¶РЅРѕ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ РјРµРЅСЏС‚СЊ `[ ]/[x]` РїРѕ С„Р°РєС‚Сѓ Рё РїРµСЂРµСЃС‡РёС‚С‹РІР°С‚СЊ С‚РµРєСѓС‰РёР№ РїСЂРѕС†РµРЅС‚ РІС‹РїРѕР»РЅРµРЅРёСЏ.
- [x] `src/lib/stripe-billing.ts` РїРѕР»СѓС‡РёР» РѕР±С‰РёР№ helper `processStripeWebhookEvent(...)`, РїРѕСЌС‚РѕРјСѓ webhook dispatch Рё duplicate-event short-circuit С‚РµРїРµСЂСЊ Р¶РёРІСѓС‚ РІ С‚РµСЃС‚РёСЂСѓРµРјРѕРј billing-lib СЃР»РѕРµ, Р° `src/app/api/billing/webhook/stripe/route.ts` СЃС‚Р°Р» С‚РѕРЅСЊС€Рµ.
- [x] Р”РѕР±Р°РІР»РµРЅ РїСЂСЏРјРѕР№ regression `tests/billing-gate/stripe-webhook-idempotency.spec.ts`: repeated `customer.subscription.updated` СЃ С‚РµРј Р¶Рµ `provider_event_id` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РєР°Рє РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹Р№, Р° `entitlements` Рё `usage_counters` РѕСЃС‚Р°СЋС‚СЃСЏ РЅРµРёР·РјРµРЅРЅС‹РјРё.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 passed, 1 skipped`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РѕСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `РџСЂРѕРІРµСЂРёС‚СЊ РёРґРµРјРїРѕС‚РµРЅС‚РЅРѕСЃС‚СЊ webhook Рё СЃРѕРіР»Р°СЃРѕРІР°РЅРЅРѕСЃС‚СЊ subscriptions, entitlements, usage counters`.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ billing tranche СѓР¶Рµ РІРЅРµС€РЅРёР№: РЅСѓР¶РЅС‹ СЂРµР°Р»СЊРЅС‹Рµ `production/staging` Stripe env Рё Р¶РёРІРѕР№ `checkout -> return reconcile -> webhook -> portal`, С‡С‚РѕР±С‹ Р·Р°РєСЂС‹С‚СЊ РѕСЃС‚Р°РІС€РёР№СЃСЏ live rollout.

## 2026-03-23 Sentry runtime readiness addendum

- [x] Р”РѕР±Р°РІР»РµРЅ `npm run verify:sentry-runtime`: [verify-sentry-runtime.mjs](/C:/fit/scripts/verify-sentry-runtime.mjs) РґРµР»Р°РµС‚ env preflight РїРѕ admin auth, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` Рё Р»РёР±Рѕ Р·Р°РїСѓСЃРєР°РµС‚ live smoke suite, Р»РёР±Рѕ СЏРІРЅРѕ РїРµС‡Р°С‚Р°РµС‚ blocker РїРѕ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёРј secrets.
- [x] Р”РѕР±Р°РІР»РµРЅ regression gate [sentry-runtime-gate.spec.ts](/C:/fit/tests/sentry-gate/sentry-runtime-gate.spec.ts): РїСЂРё РіРѕС‚РѕРІРѕРј runtime root-admin РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts) РІРѕР·РІСЂР°С‰Р°РµС‚ `eventId` Рё `createdAt`.
- [x] РЎР°РЅРёСЂРѕРІР°РЅС‹ release-policy РґРѕРєСѓРјРµРЅС‚С‹ [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md) Рё РёРЅРґРµРєСЃ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё [README.md](/C:/fit/docs/README.md): observability Рё release blockers СЃРЅРѕРІР° Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ РІ С‡РёСЃС‚РѕРј UTF-8.
- [x] РЎР°РЅРёСЂРѕРІР°РЅС‹ [global-error.tsx](/C:/fit/src/app/global-error.tsx) Рё [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts): global error surface Рё admin Sentry smoke Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶Р°С‚ Р±РёС‚С‹Р№ copy.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:sentry-runtime`; РїРѕСЃР»РµРґРЅРёР№ gate СЃРµР№С‡Р°СЃ РєРѕСЂСЂРµРєС‚РЅРѕ РґР°С‘С‚ СЏРІРЅС‹Р№ skip/blocker С‚РѕР»СЊРєРѕ РїРѕ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёРј runtime env Рё credentials.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РћСЃРЅРѕРІРЅРѕР№ checklist-РїСѓРЅРєС‚ `Р—Р°РІРµСЂС€РёС‚СЊ Sentry rollout РЅР° production env` РѕСЃС‚Р°С‘С‚СЃСЏ РѕС‚РєСЂС‹С‚: РєРѕРґРѕРІС‹Р№ Рё release СЃР»РѕР№ РіРѕС‚РѕРІС‹, РЅРѕ live runtime smoke РІСЃС‘ РµС‰С‘ СѓРїРёСЂР°РµС‚СЃСЏ РІРѕ РІРЅРµС€РЅРёРµ production secrets.

## 2026-03-23 RAG v2 bootstrap addendum

- [x] Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ execution doc [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) СЃ С‡РµРєР±РѕРєСЃР°РјРё `[ ]/[x]`, РїСЂР°РІРёР»Р°РјРё РѕР±РЅРѕРІР»РµРЅРёСЏ Рё СЃРѕР±СЃС‚РІРµРЅРЅС‹Рј РїСЂРѕС†РµРЅС‚РѕРј РїСЂРѕРіСЂРµСЃСЃР°.
- [x] Р”РѕР±Р°РІР»РµРЅ config СЃР»РѕР№ [knowledge-retrieval-config.ts](/C:/fit/src/lib/ai/knowledge-retrieval-config.ts): Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ caps РґР»СЏ semantic candidates, lexical candidates, fused candidates Рё final context.
- [x] Retrieval result type РІ [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts) СЂР°СЃС€РёСЂРµРЅ score-breakdown РїРѕР»СЏРјРё `vectorScore`, `textScore`, `fusedScore`, `rerankScore`, `matchedTerms`, `sourceKind`.
- [x] Р”РѕР±Р°РІР»РµРЅ app-side hybrid ranking [knowledge-hybrid-ranking.ts](/C:/fit/src/lib/ai/knowledge-hybrid-ranking.ts) Рё retrieval pipeline РІ [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) РїРµСЂРµРІРµРґС‘РЅ СЃ fallback-only СЂРµР¶РёРјР° РЅР° `vector + lexical -> fused -> rerank`.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), РєРѕС‚РѕСЂС‹Р№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ fusion, score-breakdown Рё context cap.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ RAG tranche: С„РѕСЂРјР°Р»РёР·РѕРІР°С‚СЊ chunk policy Рё metadata contract РґР»СЏ `knowledge_chunks`, Р·Р°С‚РµРј РїРµСЂРµС…РѕРґРёС‚СЊ Рє incremental indexing Рё hybrid DB search.

## 2026-03-24 RAG v2 chunk metadata addendum

- [x] Р”РѕР±Р°РІР»РµРЅ policy СЃР»РѕР№ [knowledge-chunk-policy.ts](/C:/fit/src/lib/ai/knowledge-chunk-policy.ts): source families `profile`, `workout`, `nutrition`, `memory`, `structured`, `fallback` Рё РёС… importance/recency rules С‚РµРїРµСЂСЊ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ СЏРІРЅРѕ.
- [x] Р”РѕР±Р°РІР»РµРЅ metadata СЃР»РѕР№ [knowledge-document-metadata.ts](/C:/fit/src/lib/ai/knowledge-document-metadata.ts): РєР°Р¶РґС‹Р№ knowledge document С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°РµС‚ `sourceKey`, `chunkVersion`, `contentHash`, `importanceWeight`, `recencyAt`, `sourceFamily`, `tokenCount`.
- [x] [knowledge-documents.ts](/C:/fit/src/lib/ai/knowledge-documents.ts) РїРµСЂРµРІРµРґС‘РЅ РЅР° С„РёРЅР°Р»РёР·Р°С†РёСЋ metadata contract Рё РґРѕРїРѕР»РЅРµРЅ recency keys РґР»СЏ `profile`, `body metrics`, `memory`, `workout day`, `exercise history` Рё `structured facts`.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite [knowledge-document-metadata.spec.ts](/C:/fit/tests/ai-gate/knowledge-document-metadata.spec.ts), РєРѕС‚РѕСЂС‹Р№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ deterministic metadata РґР»СЏ workout Рё fallback chunks.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ RAG tranche: РїРµСЂРµС…РѕРґРёС‚СЊ Рє incremental indexing, stale chunk cleanup Рё hybrid DB search, СѓР¶Рµ РѕРїРёСЂР°СЏСЃСЊ РЅР° РІРІРµРґС‘РЅРЅС‹Р№ metadata contract.

## 2026-03-24 RAG v2 incremental indexing addendum

- [x] Р”РѕР±Р°РІР»РµРЅ sync СЃР»РѕР№ [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts): knowledge reindex С‚РµРїРµСЂСЊ РїР»Р°РЅРёСЂСѓРµС‚ `unchanged / insert / delete` РїРѕ `sourceKey` Рё `contentHash` РІРјРµСЃС‚Рѕ РїРѕР»РЅРѕРіРѕ СѓРґР°Р»РµРЅРёСЏ РІСЃРµС… chunks.
- [x] [knowledge-runtime.ts](/C:/fit/src/lib/ai/knowledge-runtime.ts) РїРµСЂРµРІРµРґС‘РЅ РЅР° incremental chunk sync: unchanged chunks СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ, changed chunks РїРµСЂРµРёРЅРґРµРєСЃРёСЂСѓСЋС‚СЃСЏ С‚РѕС‡РµС‡РЅРѕ, stale chunks СѓРґР°Р»СЏСЋС‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕ.
- [x] [knowledge-indexing.ts](/C:/fit/src/lib/ai/knowledge-indexing.ts) Р±РѕР»СЊС€Рµ РЅРµ РїРµСЂРµСЃРѕР·РґР°С‘С‚ РІРµСЃСЊ embedding СЃР»РѕР№ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ: stale embeddings СѓРґР°Р»СЏСЋС‚СЃСЏ, Р° РЅРѕРІС‹Рµ embeddings СЃС‡РёС‚Р°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС… chunk ids.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), РєРѕС‚РѕСЂС‹Р№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ diff РґР»СЏ `unchanged / changed / stale` chunk flow.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ RAG tranche: РїРµСЂРµС…РѕРґРёС‚СЊ Рє DB migration РґР»СЏ lexical search metadata Рё hybrid RPC, Р·Р°С‚РµРј СЃРІСЏР·С‹РІР°С‚СЊ СЌС‚Рѕ СЃ retrieval eval gate.

## 2026-03-24 RAG v2 retrieval eval addendum

- [x] [eval-suites.ts](/C:/fit/src/lib/ai/eval-suites.ts) РїРµСЂРµРІРµРґС‘РЅ РІ С‡РёСЃС‚С‹Р№ UTF-8 Рё СЂР°СЃС€РёСЂРµРЅ retrieval intent-С‚РµРјР°РјРё `workouts`, `nutrition`, `profile`, `plans`, `recent_history`.
- [x] Р”РѕР±Р°РІР»РµРЅ metrics СЃР»РѕР№ [knowledge-retrieval-evals.ts](/C:/fit/src/lib/ai/knowledge-retrieval-evals.ts): `Recall@5`, `Recall@10`, `nDCG@10`, score per eval case Рё grouping РїРѕ retrieval topics С‚РµРїРµСЂСЊ РІС‹СЂР°Р¶РµРЅС‹ РѕС‚РґРµР»СЊРЅС‹РјРё pure helpers.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite [retrieval-metrics.spec.ts](/C:/fit/tests/ai-gate/retrieval-metrics.spec.ts), РєРѕС‚РѕСЂС‹Р№ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ РјРµС‚СЂРёРєРё Рё topic grouping РѕС‚РґРµР»СЊРЅРѕ РѕС‚ live AI runtime.
- [x] Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ command-level gate `npm run test:retrieval-gate`: РѕРЅ Р·Р°РїСѓСЃРєР°РµС‚ hybrid ranking, metadata, chunk sync, retrieval metrics Рё full-history retrieval fallback suite Р±РµР· web server Рё auth bootstrap.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ RAG tranche: СЃРІСЏР·Р°С‚СЊ retrieval gate СЃ feature-flag rollout Рё release gate РґР»СЏ assistant/plan suites.

## 2026-03-24 RAG v2 rollout gate addendum

- [x] Р”РѕР±Р°РІР»РµРЅ rollout helper [knowledge-retrieval-rollout.ts](/C:/fit/src/lib/ai/knowledge-retrieval-rollout.ts): retrieval pipeline С‚РµРїРµСЂСЊ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЂРµР¶РёРјС‹ `legacy`, `hybrid`, `shadow`, Р° `shadow` Р»РѕРіРёСЂСѓРµС‚ comparison snapshot Р±РµР· СЃРјРµРЅС‹ РёС‚РѕРіРѕРІРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.
- [x] [env.ts](/C:/fit/src/lib/env.ts) Рё [\.env.example](/C:/fit/.env.example) СЂР°СЃС€РёСЂРµРЅС‹ `AI_RETRIEVAL_MODE`, С‡С‚РѕР±С‹ hybrid retrieval РјРѕР¶РЅРѕ Р±С‹Р»Рѕ РІРєР»СЋС‡Р°С‚СЊ Рё РѕС‚РєР°С‚С‹РІР°С‚СЊ РєР°Рє СЏРІРЅС‹Р№ release flag.
- [x] [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) РїРµСЂРµРІРµРґС‘РЅ РЅР° rollout selection layer: `legacy` СЃРѕС…СЂР°РЅСЏРµС‚ РёСЃС‚РѕСЂРёС‡РµСЃРєРёР№ semantic-first fallback, `hybrid` РѕС‚РґР°С‘С‚ fused ranking, `shadow` РІРѕР·РІСЂР°С‰Р°РµС‚ legacy ranking Рё РїРёС€РµС‚ rollout snapshot РІ logs.
- [x] Р”РѕР±Р°РІР»РµРЅ regression suite [retrieval-rollout.spec.ts](/C:/fit/tests/ai-gate/retrieval-rollout.spec.ts) Рё РѕРЅ РІРєР»СЋС‡С‘РЅ РІ `npm run test:retrieval-gate`.
- [x] Р”РѕР±Р°РІР»РµРЅ release harness [verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs) Рё РєРѕРјР°РЅРґР° `npm run verify:retrieval-release`: retrieval regression gate РІСЃРµРіРґР° РёРґС‘С‚ РІ `hybrid` СЂРµР¶РёРјРµ, Р° live `assistant / retrieval / workout plan / meal plan / safety` suites Р·Р°РїСѓСЃРєР°СЋС‚СЃСЏ РїРѕРІРµСЂС… С‚РѕРіРѕ Р¶Рµ СЂРµР¶РёРјР°, РµСЃР»Рё РґРѕСЃС‚СѓРїРЅС‹ auth Рё AI provider credentials.
- [x] [quality.yml](/C:/fit/.github/workflows/quality.yml) С‚РµРїРµСЂСЊ РїСЂРѕРІРѕРґРёС‚ AI quality gate С‡РµСЂРµР· `npm run verify:retrieval-release` Рё С‚СЂРµР±СѓРµС‚ user/admin Playwright credentials, С‡С‚РѕР±С‹ РІ CI РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ РїРѕРєСЂС‹РІР°Р»РёСЃСЊ Рё assistant/safety, Рё admin retrieval/plan suites.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`; `npm run verify:retrieval-release` СЃРµР№С‡Р°СЃ С‡РµСЃС‚РЅРѕ СѓРїРёСЂР°РµС‚СЃСЏ РІРѕ РІРЅРµС€РЅРёР№ provider blocker (`OpenRouter 402`, `Voyage 403`) Рё РїРѕСЌС‚РѕРјСѓ РЅРµ Р·Р°РєСЂС‹РІР°РµС‚ РѕСЃРЅРѕРІРЅРѕР№ master-plan РїСѓРЅРєС‚ РїСЂРѕ live AI quality gate.
- РСЃС‚РѕСЂРёС‡РµСЃРєР°СЏ Р·Р°РјРµС‚РєР°: РЎР»РµРґСѓСЋС‰РёР№ RAG tranche: РїРµСЂРµС…РѕРґРёС‚СЊ Рє step-level telemetry Рё latency baseline РґР»СЏ retrieval СЃР»РѕСЏ.

## 2026-03-24 RAG v2 telemetry and latency addendum

- [x] Р”РѕР±Р°РІР»РµРЅ telemetry СЃР»РѕР№ [knowledge-retrieval-telemetry.ts](/C:/fit/src/lib/ai/knowledge-retrieval-telemetry.ts): runtime С‚РµРїРµСЂСЊ С„РёРєСЃРёСЂСѓРµС‚ `indexRefreshMs`, `queryEmbeddingMs`, `semanticRpcMs`, `semanticFallbackMs`, `lexicalRpcMs`, `lexicalFallbackMs`, `hybridRankMs`, candidate counts Рё rollout summary.
- [x] [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) РїРµСЂРµРІРµРґС‘РЅ РЅР° step-level measurement Рё env-gated telemetry logging С‡РµСЂРµР· `AI_RETRIEVAL_TELEMETRY=1`; `shadow` СЂРµР¶РёРј Р»РѕРіРёСЂСѓРµС‚ telemetry Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.
- [x] Р”РѕР±Р°РІР»РµРЅС‹ regression suites [retrieval-telemetry.spec.ts](/C:/fit/tests/ai-gate/retrieval-telemetry.spec.ts) Рё [retrieval-performance.spec.ts](/C:/fit/tests/ai-gate/retrieval-performance.spec.ts), Р° `npm run test:retrieval-gate` С‚РµРїРµСЂСЊ РІРєР»СЋС‡Р°РµС‚ Рё telemetry contract, Рё deterministic latency budget.
- [x] Р”РѕР±Р°РІР»РµРЅ performance handoff [RETRIEVAL_PERFORMANCE.md](/C:/fit/docs/RETRIEVAL_PERFORMANCE.md): Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ caps `30 / 30 / 20 / 8`, Р»РѕРєР°Р»СЊРЅС‹Р№ baseline (`p50 0.1346 ms`, `p95 0.3964 ms`, `max 0.9397 ms`, `250` samples) Рё С‚РµРєСѓС‰РёРµ tuning decisions РґР»СЏ rollout.
- [x] Р›РѕРєР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`; РїСЂРѕС„РёР»СЊРЅС‹Р№ РїР»Р°РЅ [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) РїРѕСЃР»Рµ РїРµСЂРµСЃС‡С‘С‚Р° С„Р°РєС‚РёС‡РµСЃРєРёС… checklist-РїСѓРЅРєС‚РѕРІ РЅР°С…РѕРґРёС‚СЃСЏ РЅР° `17 / 19` (`89%`).
- [x] РСЃС‚РѕСЂРёС‡РµСЃРєРёР№ DB-blocker СЃРЅСЏС‚: РґР»СЏ `fit` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ canonical MCP target `mcp__supabase_mcp_server__*` РЅР° РїСЂРѕРµРєС‚Рµ `nactzaxrjzsdkyfqwecf`, РїРѕСЌС‚РѕРјСѓ С„РёРЅР°Р»СЊРЅС‹Рµ knowledge DDL Рё advisors РјРѕР¶РЅРѕ РїСЂРёРјРµРЅСЏС‚СЊ Р±РµР·РѕРїР°СЃРЅРѕ.

## 2026-03-30 RAG v2 DB closure addendum

- [x] Р§РµСЂРµР· `mcp__supabase_mcp_server__get_project_url` РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїСЂР°РІРёР»СЊРЅС‹Р№ Supabase target РїСЂРѕРµРєС‚Р° `fit`: `https://nactzaxrjzsdkyfqwecf.supabase.co`.
- [x] РњРёРіСЂР°С†РёСЏ [20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql](/C:/fit/supabase/migrations/20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql) РїСЂРёРјРµРЅРµРЅР° РЅР° СЂРµР°Р»СЊРЅС‹Р№ `fit`-РїСЂРѕРµРєС‚ С‡РµСЂРµР· Supabase MCP Рё РґРѕР±Р°РІРёР»Р° metadata contract, generated `search_vector`, РёРЅРґРµРєСЃС‹ Рё user-scoped hybrid RPC `search_knowledge_chunks_hybrid(...)`.
- [x] Runtime РїРµСЂРµРІРµРґС‘РЅ РЅР° DB-backed hybrid retrieval СЃ app-side fallback РІ [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts), Р° incremental chunk sync С‚РµРїРµСЂСЊ Р·Р°РїРёСЃС‹РІР°РµС‚ metadata columns С‡РµСЂРµР· [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts).
- [x] Regression Рё RLS fixtures РѕР±РЅРѕРІР»РµРЅС‹ РїРѕРґ РЅРѕРІС‹Р№ contract: [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), [supabase-rls.ts](/C:/fit/tests/rls/helpers/supabase-rls.ts).
- [x] Р¤РёРЅР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run verify:migrations`, `npm run test:retrieval-gate`, `npm run test:rls`, `npm run typecheck`, `npm run build`; РїРѕСЃР»Рµ СЌС‚РѕРіРѕ execution-РїР»Р°РЅ `RAG v2` Р·Р°РєСЂС‹С‚ РЅР° `19 / 19` (`100%`).

## 2026-03-30 remaining external blockers revalidation addendum

- [x] `npm run verify:staging-runtime` РїРѕРІС‚РѕСЂРЅРѕ РїСЂРѕРіРЅР°РЅ РїРѕСЃР»Рµ Р·Р°РєСЂС‹С‚РёСЏ Android/RAG tranche: live AI gate РїРѕ-РїСЂРµР¶РЅРµРјСѓ СѓРїРёСЂР°РµС‚СЃСЏ РІ `OpenRouter 402` Рё `Voyage 403`, Р° Stripe runtime РІСЃС‘ РµС‰С‘ РЅРµ СЃС‚Р°СЂС‚СѓРµС‚ Р±РµР· `STRIPE_SECRET_KEY` Рё `STRIPE_PREMIUM_MONTHLY_PRICE_ID`.
- [x] `npm run verify:sentry-runtime` РїРѕРІС‚РѕСЂРЅРѕ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ РєРѕРґРѕРІС‹Р№ rollout РіРѕС‚РѕРІ, Р° live smoke РІСЃС‘ РµС‰С‘ Р±Р»РѕРєРёСЂСѓРµС‚СЃСЏ РѕС‚СЃСѓС‚СЃС‚РІРёРµРј `NEXT_PUBLIC_SENTRY_DSN` Рё `SENTRY_PROJECT`.
- [x] `npm run verify:retrieval-release` РїРѕРІС‚РѕСЂРЅРѕ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ retrieval regression Р·РµР»С‘РЅС‹Р№, Р° РЅРµР·Р°РєСЂС‹С‚С‹Р№ РѕСЃРЅРѕРІРЅРѕР№ AI quality gate РѕСЃС‚Р°С‘С‚СЃСЏ РІРЅРµС€РЅРёРј provider-blocker, Р° РЅРµ РєРѕРґРѕРІРѕР№ РґРµРіСЂР°РґР°С†РёРµР№.
- [x] РџРѕСЃР»Рµ СЌС‚РѕР№ РїРµСЂРµРїСЂРѕРІРµСЂРєРё С‚РµРєСѓС‰РёРµ РЅРµР·Р°РєСЂС‹С‚С‹Рµ main checklist-РїСѓРЅРєС‚С‹ РѕСЃС‚Р°СЋС‚СЃСЏ С‡РёСЃС‚Рѕ РІРЅРµС€РЅРёРјРё: live Stripe env/runtime, live AI providers/credits Рё production Sentry env.

## 2026-03-31 premium redesign closure addendum

- [x] `Workouts` Рё `Nutrition` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° premium fitness-РїРѕРґР°С‡Сѓ Р±РµР· РїРѕС‚РµСЂРё С‚РµРєСѓС‰РёС… flows: РѕР±РЅРѕРІР»РµРЅС‹ hero-СЃРµРєС†РёРё, action-buttons, section chips, focus-header С‚СЂРµРЅРёСЂРѕРІРєРё, exercise cards Рё nutrition capture/import surfaces.
- [x] `Admin` Рё remaining detail surfaces РґРѕРІРµРґРµРЅС‹ РґРѕ С‚РѕРіРѕ Р¶Рµ РІРёР·СѓР°Р»СЊРЅРѕРіРѕ СЏР·С‹РєР°: summary/detail shells, health/inbox/operator surfaces Рё directory metric cards РёСЃРїРѕР»СЊР·СѓСЋС‚ РµРґРёРЅС‹Р№ premium surface/button contract.
- [x] Playwright regression harness СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РїСЂРѕС‚РёРІ stale webServer reuse: `playwright.config.ts` Р±РѕР»СЊС€Рµ РЅРµ РїРµСЂРµРёСЃРїРѕР»СЊР·СѓРµС‚ СЃС‚Р°СЂС‹Р№ СЃРµСЂРІРµСЂ, Р° `scripts/run-playwright.mjs` РѕС‡РёС‰Р°РµС‚ Р·Р°РЅСЏС‚С‹Р№ РїРѕСЂС‚ РїРµСЂРµРґ СЃС‚Р°СЂС‚РѕРј, С‡С‚Рѕ СЃРЅРёРјР°РµС‚ Р»РѕР¶РЅС‹Рµ CSS/chunk regressions.
- [x] Р¤РёРЅР°Р»СЊРЅР°СЏ verification-СЃРІСЏР·РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`, `npm run test:e2e:auth` -> `52 passed`, РїР»СЋСЃ С†РµР»РµРІС‹Рµ `admin/mobile/ui` regression suites Р·РµР»С‘РЅС‹Рµ.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ РѕР±С‰РёР№ execution checklist РІС‹СЂРѕСЃ РґРѕ `178 / 186` (`96%`), Р° РІСЃРµ РѕСЃС‚Р°РІС€РёРµСЃСЏ РЅРµР·Р°РєСЂС‹С‚С‹Рµ main-РїСѓРЅРєС‚С‹ РЅРѕСЃСЏС‚ РІРЅРµС€РЅРёР№ runtime/env С…Р°СЂР°РєС‚РµСЂ: live Stripe env, live AI provider access Рё production Sentry secrets.

## 2026-04-01 AI runtime preflight addendum

- [x] `test:ai-gate` Рё `test:sentry-gate` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РѕР±С‰РёР№ `scripts/run-playwright.mjs`, РїРѕСЌС‚РѕРјСѓ release-gates Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРјР°СЋС‚СЃСЏ Рѕ reused Playwright webServer Рё Р·Р°РЅСЏС‚С‹Р№ РїРѕСЂС‚ `3100`.
- [x] Р”РѕР±Р°РІР»РµРЅ Р±С‹СЃС‚СЂС‹Р№ provider preflight РІ [scripts/ai-runtime-preflight.mjs](/C:/fit/scripts/ai-runtime-preflight.mjs), Р° [verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs) Рё [verify-staging-runtime.mjs](/C:/fit/scripts/verify-staging-runtime.mjs) С‚РµРїРµСЂСЊ РїСЂРѕРІРµСЂСЏСЋС‚ РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ OpenRouter/Voyage РґРѕ Р·Р°РїСѓСЃРєР° С‚СЏР¶С‘Р»РѕРіРѕ `ai-gate`.
- [x] РџРѕСЃР»Рµ СЌС‚РѕРіРѕ `npm run verify:retrieval-release` Рё `npm run verify:staging-runtime` С‡РµСЃС‚РЅРѕ Рё Р±С‹СЃС‚СЂРѕ СѓРїРёСЂР°СЋС‚СЃСЏ РІ РІРЅРµС€РЅРёР№ blocker `Voyage 403`, Р° РЅРµ РІ Р»РѕРєР°Р»СЊРЅС‹Рµ timeout/webServer РєРѕРЅС„Р»РёРєС‚С‹; `npm run verify:sentry-runtime` РїРѕ-РїСЂРµР¶РЅРµРјСѓ РґР°С‘С‚ СЏРІРЅС‹Р№ skip РїРѕ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёРј `NEXT_PUBLIC_SENTRY_DSN` Рё `SENTRY_PROJECT`.
- [x] РћР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): РєРѕРґРѕРІС‹Р№ backlog РЅРµ РёР·РјРµРЅРёР»СЃСЏ, РЅРѕ release verification С‚РµРїРµСЂСЊ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅРѕ РѕС‚РґРµР»СЏРµС‚ СЂРµР°Р»СЊРЅС‹Рµ РІРЅРµС€РЅРёРµ Р±Р»РѕРєРµСЂС‹ РѕС‚ Р»РѕРєР°Р»СЊРЅРѕР№ РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂРЅРѕР№ РѕР±РІСЏР·РєРё.

## 2026-04-01 runtime env matrix addendum

- [x] Р”РѕР±Р°РІР»РµРЅ [scripts/verify-runtime-env.mjs](/C:/fit/scripts/verify-runtime-env.mjs) Рё РєРѕРјР°РЅРґР° `npm run verify:runtime-env`: РїСЂРѕРµРєС‚ С‚РµРїРµСЂСЊ СѓРјРµРµС‚ РѕРґРЅРёРј Р·Р°РїСѓСЃРєРѕРј РїРѕРєР°Р·Р°С‚СЊ missing env РїРѕ РіСЂСѓРїРїР°Рј `Web/PWA`, `AI`, `Billing`, `Sentry`, `CI`, `Android/TWA`.
- [x] [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) Рё [README.md](/C:/fit/README.md) СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ СЌС‚РёРј preflight: Сѓ РІР»Р°РґРµР»СЊС†Р° РѕРєСЂСѓР¶РµРЅРёСЏ С‚РµРїРµСЂСЊ РµСЃС‚СЊ СЏРІРЅС‹Р№ СЃРїРёСЃРѕРє С‚РѕРіРѕ, С‡С‚Рѕ РЅР°РґРѕ РІС‹СЃС‚Р°РІРёС‚СЊ РґР»СЏ Р·Р°РєСЂС‹С‚РёСЏ РїРѕСЃР»РµРґРЅРёС… release-blocker РїСѓРЅРєС‚РѕРІ.
- [x] Р¤Р°РєС‚РёС‡РµСЃРєРёР№ РїСЂРѕРіРѕРЅ `npm run verify:runtime-env` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ С‚РµРєСѓС‰РёР№ РІРЅРµС€РЅРёР№ РѕСЃС‚Р°С‚РѕРє: РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ `CRON_SECRET`, runtime env Р°РєС‚РёРІРЅРѕРіРѕ billing-РїСЂРѕРІР°Р№РґРµСЂР°, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_PROJECT` Рё Android release fingerprints; РїСЂРё СЌС‚РѕРј CI auth/secrets Рё AI РєР»СЋС‡Рё СѓР¶Рµ РїРѕРґС…РІР°С‡РµРЅС‹.
- [x] РћР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): РєРѕРґРѕРІС‹Рµ Рё РґРѕРєСѓРјРµРЅС‚Р°Р»СЊРЅС‹Рµ tranche Р·Р°РєСЂС‹С‚С‹, Р° remaining main-РїСѓРЅРєС‚С‹ РїРѕ-РїСЂРµР¶РЅРµРјСѓ Р·Р°РІРёСЃСЏС‚ РѕС‚ СЂРµР°Р»СЊРЅС‹С… env/secrets Рё provider access.

## 2026-04-01 AI chat transcript stability addendum

- [x] РќР° Р¶РёРІРѕР№ AI-РїРѕРІРµСЂС…РЅРѕСЃС‚Рё СѓСЃС‚СЂР°РЅС‘РЅ runtime-Р±Р°Рі СЃ РґСѓР±Р»РёСЂСѓСЋС‰РёРјРёСЃСЏ React keys: [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) С‚РµРїРµСЂСЊ РЅРѕСЂРјР°Р»РёР·СѓРµС‚ РјР°СЃСЃРёРІ `messages` С‡РµСЂРµР· `dedupeUiMessages(...)` РёР· [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts) РґРѕ СЂРµРЅРґРµСЂР° transcript.
- [x] РћС‡РёС‰РµРЅС‹ РѕС‚ mojibake Рё РїСЂРёРІРµРґРµРЅС‹ Рє РЅРѕСЂРјР°Р»СЊРЅРѕРјСѓ СЂСѓСЃСЃРєРѕРјСѓ UX С‚РµРєСЃС‚С‹ РІ [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx), [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx), [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx), [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx), [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts).
- [x] РџСЂРѕРІРµСЂРєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅР° РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run typecheck`, `npm run build`, Р° С‚Р°РєР¶Рµ С‚Р°СЂРіРµС‚РЅС‹Рј `tests/e2e/ai-workspace.spec.ts:91` -> `1 passed`; РІС‚РѕСЂРѕР№ history-СЃС†РµРЅР°СЂРёР№ СЌС‚РѕРіРѕ suite РїРѕ-РїСЂРµР¶РЅРµРјСѓ РјРѕР¶РµС‚ СѓРїРёСЂР°С‚СЊСЃСЏ РІРѕ РІРЅРµС€РЅРёР№ СЃРµС‚РµРІРѕР№ timeout РЅР° С„РѕРЅРѕРІРѕР№ dashboard-Р·Р°РіСЂСѓР·РєРµ Рё РЅРµ СЃРІСЏР·Р°РЅ СЃ transcript bugfix.
- [x] РћР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): СЌС‚Рѕ production fix Рё UI sanitation РїРѕРІРµСЂС… СѓР¶Рµ Р·Р°РєСЂС‹С‚РѕРіРѕ milestone, Р° РЅРµ РЅРѕРІС‹Р№ РѕСЃРЅРѕРІРЅРѕР№ tranche.

## 2026-04-01 Russian billing provider migration planning addendum

- [x] Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ РёР·РјРµРЅРµРЅРёРµ billing-РІРµРєС‚РѕСЂР°: РґР»СЏ СЂРѕСЃСЃРёР№СЃРєРѕРіРѕ live rollout `fit` Р±РѕР»СЊС€Рµ РЅРµ С†РµР»РёС‚СЃСЏ РІ `Stripe` РєР°Рє РІ С„РёРЅР°Р»СЊРЅРѕРіРѕ production-РїСЂРѕРІР°Р№РґРµСЂР°.
- [x] Р’ [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) РѕС„РѕСЂРјР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ С‚РµС…РїР»Р°РЅ РјРёРіСЂР°С†РёРё СЃ С‡РµРєР±РѕРєСЃР°РјРё; primary-РєР°РЅРґРёРґР°С‚ РІС‹Р±СЂР°РЅ `CloudPayments`, fallback вЂ” `Р®Kassa`.
- [x] РћС‚РєСЂС‹С‚С‹Рµ main-checklist РїСѓРЅРєС‚С‹ `Milestone 2` Рё acceptance-РєСЂРёС‚РµСЂРёР№ РѕР±РЅРѕРІР»РµРЅС‹ РЅР° provider-neutral wording, С‡С‚РѕР±С‹ РґР°Р»СЊРЅРµР№С€РµРµ РІС‹РїРѕР»РЅРµРЅРёРµ РїР»Р°РЅР° С€Р»Рѕ СѓР¶Рµ РЅРµ РѕС‚ `Stripe`, Р° РѕС‚ РІС‹Р±СЂР°РЅРЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР° Р Р¤.
- [x] РћР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): СЌС‚Рѕ РґРѕРєСѓРјРµРЅС‚Р°Р»СЊРЅС‹Р№ Рё Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ reframe billing-РЅР°РїСЂР°РІР»РµРЅРёСЏ Р±РµР· Р·Р°РєСЂС‹С‚РёСЏ РЅРѕРІС‹С… main-РїСѓРЅРєС‚РѕРІ.

## 2026-04-01 CloudPayments runtime migration addendum

- [x] Р РµР°Р»РёР·РѕРІР°РЅ provider-neutral billing runtime: checkout, reconcile, billing-center action, admin reconcile Рё internal billing job С‚РµРїРµСЂСЊ РІС‹Р±РёСЂР°СЋС‚ Р°РєС‚РёРІРЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР° С‡РµСЂРµР· [billing-provider.ts](/C:/fit/src/lib/billing-provider.ts) Рё Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІСЏР·Р°РЅС‹ РёСЃРєР»СЋС‡РёС‚РµР»СЊРЅРѕ РЅР° `Stripe`.
- [x] Р”РѕР±Р°РІР»РµРЅС‹ CloudPayments transport/runtime surfaces: [cloudpayments-billing.ts](/C:/fit/src/lib/cloudpayments-billing.ts), [billing/cloudpayments intent route](/C:/fit/src/app/api/billing/cloudpayments/intent/route.ts), [billing webhook cloudpayments route](/C:/fit/src/app/api/billing/webhook/cloudpayments/[kind]/route.ts), [billing/cloudpayments page](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx).
- [x] `/settings`, `/admin`, `admin stats` Рё billing handoff/release docs РїРµСЂРµРІРµРґРµРЅС‹ РЅР° provider-neutral wording: Р°РєС‚РёРІРЅС‹Р№ billing runtime С‚РµРїРµСЂСЊ РѕС‚РѕР±СЂР°Р¶Р°РµС‚СЃСЏ РєР°Рє `CloudPayments`, Р° РЅРµ РєР°Рє СЃРєСЂС‹С‚РѕРµ РґРѕРїСѓС‰РµРЅРёРµ РїСЂРѕ `Stripe`.
- [x] Tranche РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РїР°РєРµС‚Р°РјРё `npm run lint`, `npm run typecheck`, `npm run build`, Р° live billing flow РїРѕ-РїСЂРµР¶РЅРµРјСѓ РѕСЃС‚Р°С‘С‚СЃСЏ РІРЅРµС€РЅРёРј Р±Р»РѕРєРµСЂРѕРј РґРѕ РїРѕСЏРІР»РµРЅРёСЏ СЂРµР°Р»СЊРЅС‹С… env РІС‹Р±СЂР°РЅРЅРѕРіРѕ РїСЂРѕРІР°Р№РґРµСЂР° Рё webhook/runtime smoke.
- [x] РћР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): РєРѕРґРѕРІС‹Р№ migration-slice Р·Р°РєСЂС‹С‚, РЅРѕ РѕСЃРЅРѕРІРЅС‹Рµ РЅРµР·Р°РєСЂС‹С‚С‹Рµ РїСѓРЅРєС‚С‹ `Milestone 2` РІСЃС‘ РµС‰С‘ Р·Р°РІРёСЃСЏС‚ РѕС‚ Р¶РёРІРѕРіРѕ provider env Рё end-to-end smoke.

## 2026-04-01 CloudPayments contract and mobile/TWA verification addendum

- [x] Р”Р»СЏ Р»РѕРєР°Р»СЊРЅРѕРіРѕ deterministic billing gate РґРѕР±Р°РІР»РµРЅ `CLOUDPAYMENTS_TEST_MODE=mock`: [cloudpayments-billing.ts](/C:/fit/src/lib/cloudpayments-billing.ts), [env.ts](/C:/fit/src/lib/env.ts), [\.env.example](/C:/fit/.env.example).
- [x] Р’ [billing-runtime-gate.spec.ts](/C:/fit/tests/billing-gate/billing-runtime-gate.spec.ts) Р·Р°РєСЂС‹С‚ РїРѕР»РЅС‹Р№ CloudPayments regression contour: `checkout -> intent -> webhook -> return reconcile -> billing center`.
- [x] Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ mobile/PWA regression guard РґР»СЏ hosted billing page: mobile viewport РїСЂРѕРІРµСЂСЏРµС‚ [billing/cloudpayments page](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx) Рё РѕС‚СЃСѓС‚СЃС‚РІРёРµ horizontal overflow.
- [x] РћС‚РґРµР»СЊРЅРѕ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ Android/TWA billing deep-link smoke РЅР° СЌРјСѓР»СЏС‚РѕСЂРµ `Medium_Phone_API_36.1`: `adb` Рё `logcat` С„РёРєСЃРёСЂСѓСЋС‚ `TWALauncherActivity` СЃ `capturedLink=https://fit-platform-eta.vercel.app/billing/cloudpayments?...`.
- [x] РџРѕРґРїР»Р°РЅ [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) РїРѕСЃР»Рµ СЌС‚РѕРіРѕ Р·Р°РєСЂС‹С‚ РЅР° `21 / 21` (`100%`), Р° РѕСЃРЅРѕРІРЅРѕР№ progress execution checklist РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`), РїРѕС‚РѕРјСѓ С‡С‚Рѕ `Milestone 2` РІСЃС‘ РµС‰С‘ Р±Р»РѕРєРёСЂСѓРµС‚СЃСЏ РЅРµ РєРѕРґРѕРј, Р° Р¶РёРІС‹РјРё provider env РґР»СЏ production/staging.

## 2026-04-01 docs sanitation follow-up addendum

- [x] [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) РїРµСЂРµРїРёСЃР°РЅ РІ С‡РёСЃС‚РѕРј UTF-8 Рё СЃРЅРѕРІР° РїСЂРёРіРѕРґРµРЅ РєР°Рє developer-facing handoff РїРѕ visual language Рё mobile acceptance.
- [x] Р’ Р°СЂС…РёРІРЅС‹С… addendum-Р±Р»РѕРєР°С… СЌС‚РѕРіРѕ master plan historical `РЎР»РµРґСѓСЋС‰РёР№ ... tranche` Р·Р°РїРёСЃРё РїРµСЂРµРІРµРґРµРЅС‹ РёР· Р»РѕР¶РЅС‹С… `[ ]`-С‡РµРєР±РѕРєСЃРѕРІ РІ РѕР±С‹С‡РЅС‹Рµ РёСЃС‚РѕСЂРёС‡РµСЃРєРёРµ Р·Р°РјРµС‚РєРё, С‡С‚РѕР±С‹ `source of truth` Р±РѕР»СЊС€Рµ РЅРµ РІС‹РіР»СЏРґРµР» РєР°Рє Р±СѓРґС‚Рѕ Р»РѕРєР°Р»СЊРЅРѕ РѕСЃС‚Р°Р»РѕСЃСЊ РґРµСЃСЏС‚РєРё РЅРµР·Р°РєСЂС‹С‚С‹С… tranche.
- [x] РћСЃРЅРѕРІРЅРѕР№ progress execution checklist РЅРµ РјРµРЅСЏРµС‚СЃСЏ Рё РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): docs cleanup СѓР±РёСЂР°РµС‚ РїСѓС‚Р°РЅРёС†Сѓ РІ handoff, РЅРѕ РЅРµ Р·Р°РєСЂС‹РІР°РµС‚ РІРЅРµС€РЅРёРµ runtime/env Р±Р»РѕРєРµСЂС‹.

## 2026-04-01 runtime env handoff addendum

- [x] Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ developer-facing handoff [RUNTIME_ENV_HANDOFF.md](/C:/fit/docs/RUNTIME_ENV_HANDOFF.md) СЃ С‚РѕС‡РЅС‹Рј СЃРїРёСЃРєРѕРј Vercel env, С€Р°РіР°РјРё РЅР°СЃС‚СЂРѕР№РєРё `CloudPayments`, `Sentry`, `AI runtime` Рё post-setup verification.
- [x] [docs/README.md](/C:/fit/docs/README.md) Рё [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ СЌС‚РёРј handoff: СЃР»РµРґСѓСЋС‰РёР№ СЂР°Р·СЂР°Р±РѕС‚С‡РёРє РёР»Рё DevOps Р±РѕР»СЊС€Рµ РЅРµ РґРѕР»Р¶РµРЅ СЃРѕР±РёСЂР°С‚СЊ release env РїРѕ РєРѕРґСѓ РІСЂСѓС‡РЅСѓСЋ.
- [x] РћСЃРЅРѕРІРЅРѕР№ progress execution checklist РЅРµ РјРµРЅСЏРµС‚СЃСЏ Рё РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): СЌС‚Рѕ documentation tranche, РєРѕС‚РѕСЂС‹Р№ СѓСЃРєРѕСЂСЏРµС‚ Р·Р°РєСЂС‹С‚РёРµ РїРѕСЃР»РµРґРЅРёС… РІРЅРµС€РЅРёС… Р±Р»РѕРєРµСЂРѕРІ, РЅРѕ РЅРµ Р·Р°РјРµРЅСЏРµС‚ СЃР°РјРё Р¶РёРІС‹Рµ env Рё provider access.

## 2026-04-02 designer handoff package addendum

- [x] Р”РѕР±Р°РІР»РµРЅР° РѕС‚РґРµР»СЊРЅР°СЏ РїР°РїРєР° [design-handoff](/C:/fit/docs/design-handoff/README.md) СЃ РґРёР·Р°Р№РЅРµСЂСЃРєРёРј handoff-РїР°РєРµС‚РѕРј, РєРѕС‚РѕСЂС‹Р№ РјРѕР¶РЅРѕ РїРµСЂРµРґР°С‚СЊ Р±РµР· СѓСЃС‚РЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.
- [x] Р’ [FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md) РїРѕРґСЂРѕР±РЅРѕ РѕРїРёСЃР°РЅС‹ РІСЃРµ СЂРµР°Р»СЊРЅС‹Рµ СЌРєСЂР°РЅС‹ РїСЂРѕРґСѓРєС‚Р°: `11` РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёС… Рё `3` admin-only, РІРєР»СЋС‡Р°СЏ С†РµР»Рё, РєРѕРЅС‚РµРЅС‚РЅС‹Рµ Р±Р»РѕРєРё, mobile/desktop-РїРѕРІРµРґРµРЅРёРµ, states Рё РёРЅС‚РµРіСЂР°С†РёРѕРЅРЅС‹Рµ РѕРіСЂР°РЅРёС‡РµРЅРёСЏ.
- [x] [docs/README.md](/C:/fit/docs/README.md) СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ РЅРѕРІС‹Рј РїР°РєРµС‚РѕРј, РїРѕСЌС‚РѕРјСѓ СЌРєСЂР°РЅРЅС‹Р№ РґРёР·Р°Р№РЅ-Р±СЂРёС„ С‚РµРїРµСЂСЊ РІРєР»СЋС‡С‘РЅ РІ РѕС„РёС†РёР°Р»СЊРЅС‹Р№ handoff surface РїСЂРѕРµРєС‚Р°.
- [x] РћСЃРЅРѕРІРЅРѕР№ progress execution checklist РЅРµ РјРµРЅСЏРµС‚СЃСЏ Рё РѕСЃС‚Р°С‘С‚СЃСЏ `178 / 186` (`96%`): СЌС‚Рѕ documentation tranche РґР»СЏ РїРµСЂРµРґР°С‡Рё РґРёР·Р°Р№РЅРµСЂСѓ, Р° РЅРµ Р·Р°РєСЂС‹С‚РёРµ РІРЅРµС€РЅРёС… runtime/env Р±Р»РѕРєРµСЂРѕРІ.

## 2026-04-13 stitch redesign execution block

- [x] Открыт отдельный execution-doc [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) и привязан к [docs/README.md](/C:/fit/docs/README.md) как официальный handoff-документ по visual refactor.
- [x] Глобальный visual foundation переведён на reference pack `stitch_`: [layout.tsx](/C:/fit/src/app/layout.tsx) подключает `Lexend + Manrope`, а [globals.css](/C:/fit/src/app/globals.css) получил новый editorial canvas, electric blue и обновлённые primitives.
- [x] Shell, top bar, drawer и mobile bottom nav переведены на тот же язык в [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx) и [sign-out-button.tsx](/C:/fit/src/components/sign-out-button.tsx).
- [x] Закрыт anchor-screen tranche для [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx): blue hero, stat plates, AI quote и section rail собраны в stitch-style композицию.
- [x] Закрыт anchor-screen tranche для [workouts/day/[dayId]/page.tsx](/C:/fit/src/app/workouts/day/[dayId]/page.tsx), [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx), [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-day-context-card.tsx](/C:/fit/src/components/workout-session/workout-day-context-card.tsx): focus-mode стал ближе к reference `workouts_day`.
- [x] Закрыт stitch-tranche для `Nutrition` и `AI` как пары anchor user screens: [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx), nutrition capture/import компоненты, [ai/page.tsx](/C:/fit/src/app/ai/page.tsx), [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx) и связанные chat-surface компоненты приведены к новому языку и очищены от mojibake.
- [x] Закрыт stitch-tranche для remaining user screens: [page.tsx](/C:/fit/src/app/page.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx), [onboarding-form.tsx](/C:/fit/src/components/onboarding-form.tsx), [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx), [history/page.tsx](/C:/fit/src/app/history/page.tsx), [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx), [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx) и [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) переведены на тот же UI contract.
- [x] Закрыт stitch-tranche для admin surfaces: `/admin`, `/admin/users`, `/admin/users/[id]` переведены на тот же editorial/operator language через [admin/page.tsx](/C:/fit/src/app/admin/page.tsx), [admin-dashboard-workspace.tsx](/C:/fit/src/components/admin-dashboard-workspace.tsx), [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx), [admin-users-bulk-actions.tsx](/C:/fit/src/components/admin-users-bulk-actions.tsx), [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx), [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx), [admin-ai-eval-runs.tsx](/C:/fit/src/components/admin-ai-eval-runs.tsx).
- [x] Закрыт stitch-tranche по visible-copy sanitation и developer handoff: [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md), [FRONTEND.md](/C:/fit/docs/FRONTEND.md) и [design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md) синхронизированы с реально внедрённым stitch-style baseline.
- [ ] Открыт только финальный auth-based visual regression tranche: нужно повторно прогнать [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts) и [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts), как только внешний Supabase Auth runtime перестанет падать по `ERR_CONNECTION`.
- [x] Текущий slice подтверждён пакетами `npm run lint`, `npm run typecheck`, `npm run build`; таргетированные Playwright suites в этой среде по-прежнему могут упираться в локальный auth-bootstrap redirect на `/`, а не в compile/layout regression нового UI.
- [x] После закрытия admin surfaces, visible-copy sanitation и handoff sync общий execution checklist пересчитан честно: `188 / 196` (`96%`).

## 2026-04-13 stitch redesign admin detail follow-up

- [x] В [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx) и [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) переведена на новый visual language операторская карточка пользователя: hero, summary metrics, degraded banners, section switcher и верхний operator copy теперь без mojibake и в том же stitch-style contract.
- [x] Проверка по этому подэтапу зелёная: `npm run lint`, `npm run typecheck`, `npm run build`.
- [x] Общий progress execution checklist не меняется и остаётся `185 / 196` (`94%`): admin surfaces всё ещё не закрыты целиком, потому что dashboard, inbox и health/evals экраны остаются в следующем tranche.

## 2026-04-13 stitch redesign admin ai-evals follow-up

- [x] В [admin-ai-eval-runs.tsx](/C:/fit/src/components/admin-ai-eval-runs.tsx) переведены на новый visual language queue controls и история запусков AI-проверок; operator copy очищен от mojibake.
- [x] Проверка по этому подэтапу зелёная: `npm run lint`, `npm run typecheck`.
- [x] Общий progress execution checklist не меняется и остаётся `185 / 196` (`94%`): admin surfaces всё ещё не закрыты целиком.

## 2026-04-13 stitch redesign auth entry + branding follow-up

- [x] В проект добавлен реальный брендовый логотип [fit-logo.svg](/C:/fit/public/fit-logo.svg) из утверждённого SVG-референса; он подключён в [page.tsx](/C:/fit/src/app/page.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx) и [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), чтобы входной поток и shell опирались уже на настоящий brand asset.
- [x] Полностью пересобраны stitch-style входной экран и онбординг: [page.tsx](/C:/fit/src/app/page.tsx), [auth-form.tsx](/C:/fit/src/components/auth-form.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx), [onboarding-form.tsx](/C:/fit/src/components/onboarding-form.tsx) теперь следуют референсу `stitch_`, но сохраняют текущие product contracts для sign-in/sign-up и e2e-friendly структуру полей.
- [x] В auth transport добавлено ожидание клиентской сессии перед переходом на защищённые маршруты: [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) теперь ждёт `supabase.auth.getSession()` перед redirect, чтобы уменьшить race между sign-in и server-side `viewer`.
- [x] Проверка по этому slice зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`.
- [x] Таргетированный auth e2e всё ещё не подтверждён как закрытый visual regression gate: `tests/e2e/authenticated-app.spec.ts` в этой среде продолжает застревать на `/` после sign-in bootstrap без видимой UI-ошибки, поэтому финальный auth-based regression checkbox в stitch-workstream остаётся открытым.
- [x] Общий progress execution checklist по-прежнему остаётся `188 / 196` (`96%`): slice завершает branding и входной поток внутри уже закрытого user-screen tranche, но не закрывает последний внешний auth-regression blocker.

## 2026-04-13 stitch redesign branded manifest + icon follow-up

- [x] Брендовый знак протянут в browser/PWA metadata: [icon.svg](/C:/fit/public/icon.svg) теперь совпадает с утверждённым логотипом, а [layout.tsx](/C:/fit/src/app/layout.tsx) и [manifest.ts](/C:/fit/src/app/manifest.ts) отдают тот же asset как основной SVG icon/shortcut icon.
- [x] В PWA metadata обновлены визуальные токены нового редизайна: [manifest.ts](/C:/fit/src/app/manifest.ts) теперь использует `background_color=#fcf9f8` и `theme_color=#0040e0`, чтобы install surface и browser chrome соответствовали stitch-style visual system.
- [x] Проверка по этому slice зелёная: `npm run lint`, `npm run typecheck`, `npm run test:smoke` -> `5 passed`.
- [x] Общий progress execution checklist не меняется и остаётся `188 / 196` (`96%`): это branded PWA polish поверх уже закрытого redesign baseline, а незакрытым остаётся всё тот же внешний auth-regression blocker.
