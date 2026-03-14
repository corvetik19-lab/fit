# AI Worklog

## 2026-03-14

### Production hardening: восьмой tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) view/media state в новый hook [use-ai-chat-view-state.ts](/C:/fit/src/components/use-ai-chat-view-state.ts).
- В hook ушли `selectedImage`, preview URL, `messageTimes`, `scrollViewportRef`, `lastAssistantMessageId`, cleanup object URL и auto-scroll transcript viewport.
- После этого [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) ещё ближе к orchestration-компоненту: toolbar, notices, transcript, composer, session-state, runtime-actions и view-state уже разведены по отдельным слоям.

### Production hardening: пятый tranche декомпозиции `knowledge.ts`

- Вынес из [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) document builders и knowledge corpus assembly в новый модуль [knowledge-documents.ts](/C:/fit/src/lib/ai/knowledge-documents.ts).
- В новый слой ушли profile/body/nutrition/memory/workout/structured knowledge document builders, а сам [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) теперь ближе к orchestration-роли вокруг reindex, embeddings refresh и retrieval.
- Следующий логичный tranche по AI-knowledge: выносить оставшиеся structured summary helpers или отдельный indexing/reindex contract для тестов без реального провайдера.

### Production hardening: седьмой tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) submit/composer helper-слой в новый hook [use-ai-chat-composer.ts](/C:/fit/src/components/use-ai-chat-composer.ts).
- В hook ушли `submitText`, `handleSubmit` и `handleComposerKeyDown`, включая orchestration вокруг `sendMessage`, `allowWebSearch`, `rememberLocalSession`, `draft`, `selectedImage` и `setNotice`.
- После этого основной [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) ещё сильнее свёлся к orchestration-компоненту: toolbar, notices, transcript, composer, session-state и runtime-actions уже вынесены, а в самом файле остаётся в основном сборка этих слоёв.
- Следующий логичный tranche по AI-чату: добить последний runtime-plumbing слой вокруг `selectedImage`/preview или переключиться обратно на `knowledge.ts` и document builders.

### Production hardening: шестой tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) runtime helper-слой `proposal actions + meal-photo analysis` в новый hook [use-ai-chat-actions.ts](/C:/fit/src/components/use-ai-chat-actions.ts).
- В hook ушли `runProposalAction`, `analyzeMealPhoto`, локальные `actionBusyKey` / `isAnalyzingImage` и orchestration вокруг `setMessages`, `setMessageTimes`, `rememberLocalSession`, `setNotice` и `router.refresh`.
- Заодно дочистил object URL lifecycle для фото в [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx): теперь preview строится через `useMemo` и cleanup effect без `setState` внутри эффекта, что закрывает lint-rule `react-hooks/set-state-in-effect`.
- Следующий логичный tranche по AI-чату: вынос submit/composer helper-слоя или переход обратно к `knowledge.ts` для document builders.

### Production hardening: пятый tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) local session/prompt state и URL/session helper-слой в новый hook [use-ai-chat-session-state.ts](/C:/fit/src/components/use-ai-chat-session-state.ts).
- В hook ушли `sessionId`, `sessionTitle`, `draft`, `notice`, `isPromptLibraryOpen`, а также локальная session URL orchestration, `rememberLocalSession`, `insertPromptTemplate` и `resetLocalSessionState`.
- После этого [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) ещё ближе к runtime-orchestrator роли: chat transport, submit/analyze/proposal actions и message pipeline остаются внутри, а локальное session/prompt plumbing больше не размазано по тому же компоненту.
- Следующий логичный tranche по AI-чату: вынос meal-photo / proposal-action runtime helper-слоя или окончательное разделение history/session runtime orchestration.

### Production hardening: четвертый tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) панели доступа, ошибок и локальных notice-сообщений в новый модуль [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx).
- После этого в основном chat-orchestrator компоненте стало меньше смешения control state и статических feedback-panels: toolbar, transcript, composer и notices уже живут отдельными surface-модулями.
- Это упрощает следующий tranche по AI-чату: теперь можно отдельно выносить session/history helper-слой и локальную session URL orchestration, не таская за собой большие JSX-блоки.

### Production hardening: третий tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) верхний chat toolbar в новый модуль [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx).
- В отдельный UI-слой ушли переключатель web search, триггер prompt library, открытие загрузки фото еды и reset текущего чата.
- После этого [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) ещё ближе к orchestrator-компоненту: session/draft/image/runtime state остаются внутри, а верхняя chat-control surface больше не размазана по тому же файлу, где живут submit/analyze/proposal действия.
- Следующий логичный tranche по AI-чату: history/session helper-слой и notices/access panels, чтобы основной компонент окончательно свести к orchestration-логике.

### Production hardening: четвертый tranche декомпозиции `knowledge.ts`

- Вынес из [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) indexing/embeddings refresh слой в новый модуль [knowledge-indexing.ts](/C:/fit/src/lib/ai/knowledge-indexing.ts).
- В новый модуль ушли refresh embeddings, проверка готовности knowledge index и fallback-поведение, когда vector-слой ещё не собран или embeddings временно недоступны.
- После этого [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) ещё ближе к orchestrator-роли: retrieval вынесен отдельно, source data вынесена отдельно, indexing тоже живёт отдельно, а основной модуль всё больше сводится к document assembly и верхнеуровневой orchestration-логике.
- Следующий логичный tranche по этому модулю: вынести document builders и structured summary surface из основного AI knowledge orchestrator.

### Production hardening: третий tranche декомпозиции `knowledge.ts`

- Вынес из [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) слой загрузки и подготовки исходных данных в новый модуль [knowledge-source-data.ts](/C:/fit/src/lib/ai/knowledge-source-data.ts).
- В новый data-слой ушли `fetchAllRows`, загрузка `onboarding / goals / nutrition / workouts / meals / memory / snapshots`, а также подготовка `workoutSets`, `totalTonnageKg` и `bestSetWeightKg`.
- После этого [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) стал ближе к orchestrator-роли: retrieval уже живёт отдельно, исходные данные собираются отдельно, а основной модуль всё меньше смешивает query/fetch работу с indexing/document assembly.
- Следующий логичный tranche по этому модулю: вынос самих document builders и structured summary surface из основного knowledge orchestrator.

### Production hardening: шестой tranche декомпозиции `workout-day-session.tsx`

- Вынес из [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) ещё два больших surface-блока в отдельные client-модули: [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx) и [workout-day-context-card.tsx](/C:/fit/src/components/workout-session/workout-day-context-card.tsx).
- Non-focus экран тренировки теперь собирается из отдельных обзорной и контекстной карточек, а основной файл больше не держит у себя длинные KPI/day-summary/day-context секции.
- Это ещё сильнее приближает [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) к orchestrator-роли: в нём остаются timer/focus flow, status actions, notices, derive state и orchestration между уже вынесенными surface-модулями.
- Следующий логичный tranche по этому экрану: отдельный focus-header/status-notices surface или окончательная зачистка оставшегося copy/runtime-plumbing.

### Production hardening: пятый tranche декомпозиции `workout-day-session.tsx`

- Вынес из [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) два крупных UI-блока в отдельные client-модули: [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx) и [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx).
- Step strip теперь отдельно отвечает за пошаговую навигацию между упражнениями, а карточка упражнения — за inputs, сохранение, read-only состояние и last-known performance summary.
- После этого основной execution-экран стал заметно ближе к orchestrator-роли: step-surface и большая exercise-card разметка больше не размазаны по тому же файлу, где живут derive state, sync и action orchestration.
- Критичный экран тренировки стал проще для следующего tranche: дальше можно отдельно выносить focus header / overview / day context surface или целенаправленно дочищать copy и mobile UX.

### Production hardening: четвертый tranche декомпозиции `workout-day-session.tsx`

- Вынес из [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) action-слой `save/status/finish/reset` в новый hook [use-workout-session-actions.ts](/C:/fit/src/components/workout-session/use-workout-session-actions.ts).
- В новый hook ушли сохранение контекста тренировки, сохранение упражнения, перевод статуса дня, завершение тренировки, сброс тренировки, а также сохранение и сброс таймера с offline/server orchestration.
- После этого [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) ещё сильнее приблизился к orchestrator-роли: derive state, timer, sync и action-поток теперь живут в отдельных модулях, а сам экран больше сосредоточен на step-based UX и разметке.
- Полную декомпозицию execution-экрана ещё не считаю завершённой: следующим логичным tranche остаётся вынос крупных exercise/day surface-блоков в отдельные UI-модули.

### Production hardening: третий tranche декомпозиции `admin-users-directory.tsx`

- Вынес из [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx) bulk actions/history UI в новый модуль [admin-users-bulk-actions.tsx](/C:/fit/src/components/admin-users-bulk-actions.tsx).
- После этого основной каталог пользователей ещё сильнее приблизился к orchestrator-роли: fetch/filter/selection state остаются в нём, а bulk panel и история wave-операций живут отдельно и могут развиваться без раздувания основного JSX-файла.
- Этот tranche логически продолжает уже вынесенные model/helper слои каталога и закрывает ещё один крупный кусок `Wave 1` без рискованного полного переписывания страницы.

## 2026-03-14

### Production hardening: второй tranche декомпозиции `knowledge.ts`

- Вынес из [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) retrieval pipeline в новый модуль [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts).
- В новый слой ушли RPC retrieval, vector fallback, text RPC fallback и финальная orchestration-цепочка `ensure -> embeddings -> rpc -> fallback`.
- Сам [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) после этого снова ближе к indexing/document assembly orchestrator-роли, а retrieval теперь можно развивать и тестировать отдельно от пересборки knowledge corpus.
- Это закрывает ещё один крупный кусок `Wave 1`; следующим логичным tranche остаётся либо дальнейшее дробление `workout-day-session.tsx`, либо вынос indexing/document builders из `knowledge.ts`.

## 2026-03-14

### Production hardening: второй tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) chat surface и composer UI в новые модули [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx) и [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx).
- Сам [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) после этого стал ближе к orchestrator-компоненту: session/draft/image/proposal действия остаются в нём, а разметка сообщений и ввод пользователя живут отдельно и проверяются изолированно.
- Заодно очистил [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts) и user-facing строки AI-чата от битой кириллицы: статусы, markdown по фото еды, пустые/ошибочные тексты и кнопки снова в нормальном русском UTF-8.
- Этот tranche закрывает ещё один кусок `Wave 1`: дальше для AI workspace логично выносить history/session runtime orchestration и web-search / meal-photo actions в отдельный hook-слой.

## 2026-03-14

### Production hardening: третий tranche декомпозиции `admin-user-detail.tsx`

- Вынес из [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) крупные секционные блоки `profile / activity / operations / billing` в новый UI-модуль [admin-user-detail-sections.tsx](/C:/fit/src/components/admin-user-detail-sections.tsx).
- Сам [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) стал заметно ближе к orchestrator-компоненту: загрузка карточки, summary-метрики, переключение секций и выбор нужного section surface теперь собраны компактно, а большие карточки и timeline-блоки живут отдельно.
- Заодно полностью очистил [admin-user-detail-model.ts](/C:/fit/src/components/admin-user-detail-model.ts) и [admin-user-detail-state.ts](/C:/fit/src/components/admin-user-detail-state.ts) от битой кириллицы: словари ролей, статусов, section copy и fallback-тексты теперь снова в чистом UTF-8.
- Этот tranche закрывает основной UI-долг карточки пользователя: дальше по `Wave 1` уже можно дробить либо сам `workout-day-session.tsx`, либо оставшиеся монолиты вроде `knowledge.ts` и `ai-chat-panel.tsx` на более мелкие orchestration/data/UI слои.

## 2026-03-14

### Production hardening: третий tranche декомпозиции `workout-day-session.tsx`

- Продолжил раскладывать [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) и вынес sync/hydration/offline orchestration в новый hook [use-workout-day-sync.ts](/C:/fit/src/components/workout-session/use-workout-day-sync.ts).
- В новый hook ушли локальный snapshot cache, hydration из offline-состояния, pull/throttle логика, flush очереди, online/offline listeners, bootstrap sync и состояние `isSyncing / pendingMutationCount / isOnline / lastSnapshotAt`.
- В основном экране тренировки теперь меньше смешения concerns: UI, workout execution и domain actions остаются внутри [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx), а офлайн-sync plumbing больше не размазано по тому же файлу.
- Этот tranche логически продолжает уже вынесенные [session-utils.ts](/C:/fit/src/components/workout-session/session-utils.ts), [derived-state.ts](/C:/fit/src/components/workout-session/derived-state.ts) и [use-workout-session-timer.ts](/C:/fit/src/components/workout-session/use-workout-session-timer.ts).

### Production hardening: второй tranche декомпозиции `workout-day-session.tsx`

- Продолжил раскладывать [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) и вынес timer/focus-header state в новый hook [use-workout-session-timer.ts](/C:/fit/src/components/workout-session/use-workout-session-timer.ts).
- В hook ушли timer base/live state, persisted timer restore, auto-expire logic на 2 часа, управление collapse-состоянием focus-header и локальные timer helper’ы вроде `startSessionTimer`, `clearActiveTimer` и `getResolvedCurrentSessionDurationSeconds`.
- Сам экран тренировки стал ближе к orchestrator-компоненту: там осталось меньше таймерного plumbing и легче отделить следующий tranche с sync/hydration orchestration.
- После выноса отдельно подчистил lint-замечания вокруг hook dependencies и убрал лишний `setState` внутри timer effect.

### Production hardening: второй tranche декомпозиции `admin-user-detail.tsx`

- Продолжил раскладывать [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) и вынес fetch/state слой в новый [admin-user-detail-state.ts](/C:/fit/src/components/admin-user-detail-state.ts).
- В новый hook-модуль ушли загрузка карточки пользователя, `reload`-механика, локальный section state и конфиг разделов `profile / activity / operations / billing`.
- Это упростило основной компонент: в нём осталась в основном визуальная композиция, а route-fetch orchestration и section plumbing больше не смешаны с JSX-разметкой.
- Полную декомпозицию карточки пользователя всё ещё не считаю завершённой: сами крупные секционные блоки пока остаются в одном UI-модуле и пойдут отдельным tranche'ом.

### Production hardening: закрыт repo-tracked шум вокруг `tsconfig.json`

- Проверил оставшийся `Wave 0` hygiene-долг: `tsconfig.json` не содержал реального текстового diff относительно `HEAD`, но индекс продолжал держать stale `needs update` state после старых запусков quality gates.
- После refresh индекса и повторного `next typegen` рабочее дерево перестало получать ложный repo-tracked шум, а baseline снова подтверждён без реального изменения `tsconfig.json`.
- Этот пункт плана считаю закрытым: текущие quality gates больше не оставляют искусственный tracked-noise в `tsconfig.json`.

### Production hardening: второй tranche декомпозиции `admin-users-directory.tsx`

- Продолжил раскладывать [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx) и вынес второй слой чистой логики в [admin-users-directory-model.ts](/C:/fit/src/components/admin-users-directory-model.ts).
- В model-модуль ушли helper’ы для query-параметров каталога, синхронизации выделения, переключения видимых пользователей и сборки bulk-action request/notice payload’ов.
- Сам каталог стал чище как orchestrator-компонент: fetch и UI остались внутри, а selection/filter/bulk plumbing больше не размазаны по клиентскому JSX-файлу.
- Полную декомпозицию каталога всё ещё не считаю закрытой: крупные секции `каталог / приоритеты / массовые действия` и часть локального state management пойдут отдельными tranche'ами.

### Production hardening: первый tranche декомпозиции `ai-chat-panel.tsx`

- Вынес из [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) типы, форматтеры и markdown helper-слой в новый [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts).
- Вынес tool/proposal card UI в новый [ai-chat-panel-cards.tsx](/C:/fit/src/components/ai-chat-panel-cards.tsx), чтобы основной AI-чат стал ближе к orchestrator-компоненту, а не к монолиту со смешанными типами, форматтерами и презентационными блоками.
- Заодно убрал мёртвый `quickPrompts` шум и поправил битый `aria-label` у кнопки библиотеки шаблонов, не меняя внешний runtime-контракт чата.
- Полную декомпозицию AI-чата ещё не считаю завершённой: composer/history controls и session/runtime orchestration всё ещё живут в одном client-компоненте и пойдут следующими tranche'ами.

### Production hardening: санация `docs/FRONTEND.md`

- Полностью переписал [FRONTEND.md](/C:/fit/docs/FRONTEND.md) в чистом UTF-8 вместо старого файла с реальной битой кодировкой.
- Новый документ синхронизирован с текущей frontend-архитектурой проекта: shell, workspace-паттерн, workout focus-mode, AI workspace, admin UI, PWA/offline slice и текущий набор quality gates.
- Это закрывает реальный hygiene-долг в docs-слое и убирает один из источников mojibake в ключевой документации.

### Проверка: AI chat decomposition и docs hygiene

- `npx eslint src/components/ai-chat-panel.tsx src/components/ai-chat-panel-model.ts src/components/ai-chat-panel-cards.tsx`
- `npm run lint`
- `npx next typegen`
- `npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm run build`

### Production hardening: первый tranche декомпозиции `knowledge.ts`

- Вынес из [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) типы строк и pure helper-слой в новый [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts).
- В новый модуль ушли row/document types, retrieval result contracts, форматтеры целей и дней недели, JSON/vector/search helpers, safe number utilities и summary builder для meal items.
- Сам [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts) стал ближе к orchestrator-роли: там осталось меньше локального model/search шума и больше фокуса на indexing, retrieval и knowledge document assembly.
- Сохранил внешний контракт модуля через re-export `RetrievedKnowledgeItem` и `KnowledgeReindexResult`, чтобы helper-рефакторинг не ломал текущие импорты из других AI-модулей.
- Заодно подтвердил важное правило baseline: прямой `tsc` без `next typegen` по-прежнему шумит на `.next/types`, поэтому правильная воспроизводимая последовательность для gate-проверок — `next typegen -> tsc -> build`.

### Проверка: knowledge decomposition

- `npx eslint src/lib/ai/knowledge.ts src/lib/ai/knowledge-model.ts`
- `npx next typegen`
- `npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm run lint`
- `npm run build`

### Production hardening: line ending policy для release hygiene

- Добавил [/.gitattributes](/C:/fit/.gitattributes), чтобы закрепить LF policy для исходников, docs, config и SQL-файлов.
- Это не переписывает пользовательские локальные правки, но уменьшает ложный line-ending шум в `git status` и stabilizes workspace hygiene для Windows-разработки и CI.
- После этого baseline по-прежнему нужно оценивать через `git diff --name-only`, а не только по предупреждениям из working tree, потому что пользовательские локальные файлы всё ещё могут оставаться изменёнными отдельно от quality-gate шума.

### Production hardening: первый tranche декомпозиции `admin-user-detail.tsx`

- Вынес из [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) model/helper слой в новый [admin-user-detail-model.ts](/C:/fit/src/components/admin-user-detail-model.ts).
- В новом модуле теперь живут типы карточки пользователя, словари ролей/статусов/действий, форматтеры дат и статусов, а также payload helpers для audit/support/billing timeline.
- Сам [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) стал ближе к orchestrator-компоненту: визуальная композиция, fetch и section state остались в UI, а presentation-independent model logic больше не размазана по файлу.
- Заодно санацировал новый model-модуль до нормального UTF-8, чтобы этот tranche одновременно снижал размер монолита и убирал часть mojibake из admin-поверхности.
- Полную декомпозицию карточки пользователя ещё не считаю завершённой: профиль, активность, операции и billing/timeline блоки всё ещё живут в одном компоненте и пойдут отдельными tranche'ами.

### Проверка: admin user detail decomposition

- `npx eslint src/components/admin-user-detail.tsx src/components/admin-user-detail-model.ts`
- `npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 2026-03-13

### Production hardening: первый tranche декомпозиции `admin-users-directory.tsx`

- Вынес из [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx) model/helper слой в [admin-users-directory-model.ts](/C:/fit/src/components/admin-users-directory-model.ts).
- В новом модуле теперь живут типы каталога пользователей, сегментов и bulk-wave истории, статические словари ролей/активности, format helpers и derive helpers для summary/filter pills.
- Сам [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx) стал ближе к orchestrator-компоненту: fetch/state/UI остались внутри, а data-model и presentation-independent logic больше не дублируются прямо в файле.
- Полную декомпозицию каталога ещё не считаю завершённой: selection state, bulk action orchestration и крупные UI-секции ещё пойдут отдельными tranche'ами.

### Проверка: admin users directory decomposition

- `npx eslint src/components/admin-users-directory.tsx src/components/admin-users-directory-model.ts`
- `npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Production hardening: первый tranche декомпозиции `metrics.ts`

- Вынес из [metrics.ts](/C:/fit/src/lib/dashboard/metrics.ts) два независимых слоя в [dashboard-utils.ts](/C:/fit/src/lib/dashboard/dashboard-utils.ts) и [dashboard-snapshot.ts](/C:/fit/src/lib/dashboard/dashboard-snapshot.ts).
- В `dashboard-utils` теперь живут date/math/trend helper’ы для аналитики: UTC-даты, безопасное числовое приведение, тоннаж, estimate 1RM, momentum и related utilities.
- В `dashboard-snapshot` вынес create/parse helpers для runtime и aggregate snapshot payload’ов, чтобы snapshot-контур не был размазан по главному analytics-модулю.
- Сам [metrics.ts](/C:/fit/src/lib/dashboard/metrics.ts) стал компактнее и ближе к orchestrator-роли: там осталось меньше локальных утилит и больше фокуса на сборке конкретных dashboard metrics.
- Полную декомпозицию модуля ещё не считаю завершённой: workout/nutrition aggregates, snapshot persistence flow и server-side bundles ещё пойдут отдельными tranche'ами.

### Проверка: dashboard metrics decomposition

- `npx eslint src/lib/dashboard/metrics.ts src/lib/dashboard/dashboard-utils.ts src/lib/dashboard/dashboard-snapshot.ts`
- `npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Production hardening: первый tranche декомпозиции `workout-day-session`

- Вынес из [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) крупный слой чистой логики в новые модули [session-utils.ts](/C:/fit/src/components/workout-session/session-utils.ts) и [derived-state.ts](/C:/fit/src/components/workout-session/derived-state.ts).
- В `session-utils` теперь живут timer/persistence helpers, форматтеры, parsing/validation, optimistic apply helpers и hydration утилиты для workout day.
- В `derived-state` собран единый `buildWorkoutDayDerivedState(...)`, который вычисляет шаги, доступность упражнений, completed/progress метрики, тоннаж, средний RPE и флаги завершения/сброса.
- Сам [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) стал заметно тоньше: JSX и orchestration остались в компоненте, а доменные вычисления и локальные утилиты больше не размазаны по файлу.
- Полную декомпозицию модуля ещё не считаю завершённой: timer/focus hooks и sync orchestration пока остаются в основном orchestrator-компоненте и пойдут в следующие tranche'и.

### Проверка: workout session decomposition

- `npx eslint src/components/workout-day-session.tsx src/components/workout-session/session-utils.ts src/components/workout-session/derived-state.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Production hardening: release checklist и smoke baseline

- Добавил [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) как единый чеклист для merge, deploy и post-deploy smoke.
- Поднял минимальный smoke-контур без логина и без живого Supabase: [src/app/smoke/page.tsx](/C:/fit/src/app/smoke/page.tsx) и [src/app/api/health/route.ts](/C:/fit/src/app/api/health/route.ts).
- Добавил Playwright baseline: [playwright.config.ts](/C:/fit/playwright.config.ts), [tests/smoke/app-smoke.spec.ts](/C:/fit/tests/smoke/app-smoke.spec.ts), новые npm-скрипты `test:e2e` и `test:smoke`.
- Расширил CI в [quality.yml](/C:/fit/.github/workflows/quality.yml): теперь кроме `lint`, `typecheck`, `build` есть и отдельный smoke job.
- Почистил рабочее дерево от устаревших временных каталогов `.next_codex_*` и `.next_stale_*`, чтобы они больше не мешали локальной разработке и release-гейтам.

### Проверка: smoke baseline

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`
- `npm run test:smoke` проходит по `smoke page`, `health api` и `PWA assets`; в логах сервера возможен не-блокирующий шум от отсутствующей тестовой Supabase-сессии

### Production hardening: инженерный baseline и CI

- Перевёл `package.json` на стабильные quality-gates: `lint` теперь проверяет только поддерживаемые исходники, а `typecheck` использует `npx next typegen && npx tsc -p tsconfig.json --noEmit --incremental false`, чтобы проходить без ручных повторов.
- Обновил `eslint.config.mjs` и `.gitignore` под production-hardening: меньше build-мусора в рабочем цикле, меньше ложных целей для линта, отдельная защита от временных `.next*` артефактов.
- Добавил GitHub Actions workflow [quality.yml](/C:/fit/.github/workflows/quality.yml) с обязательными шагами `lint`, `typecheck`, `build`.
- Переписал корневой [README.md](/C:/fit/README.md) в нормальный UTF-8 и синхронизировал его с текущим состоянием проекта, env и документацией.

### Проверка: engineering baseline

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Подтверждено, что все три quality-gate команды проходят подряд без ручного второго запуска.

### Production hardening: базовый документационный каркас

- Полностью заменил старый повреждённый `docs/MASTER_PLAN.md` на новый production-hardening backlog с понятными чекбоксами и этапами.
- Пересобрал `docs/README.md`, чтобы у папки `docs/` снова был один нормальный вход: где план, где ворклог, где пользовательская и техническая документация.
- Зафиксировал первую волну работ как docs-first этап: сначала engineering hygiene, release gates, UX hardening, backend/AI verification, billing rollout и только потом Android wrapper.

### Проверка: документационный baseline

- Перед переписыванием плана сверил текущее состояние репозитория через `git status`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vercel.json` и ключевые документы в `docs/`.
- Зафиксировал в новом плане реальные факты: `build` проходит, `typecheck` нестабилен, `lint` ещё не доведён до CI-уровня, автотестов почти нет, а документация требует отдельной санации.

### 30-second workout motion demo

- Rebuilt `public/fit-demo-motion.svg` as a longer 30-second looping promo focused on the workout journey instead of a short generic product tour.
- The animation now walks through six scenes in order: opening the current workout, entering focus mode, running the live timer, completing step-by-step exercises, confirming save at finish, and showing the saved history plus AI coaching summary.
- The SVG was designed to stay self-contained for voice-over use: soft branded background, phone mockup, animated timeline, timer states, exercise-step progression, finish modal, history cards, and final AI recommendation.

### Verification: 30-second workout motion demo

- Parsed `public/fit-demo-motion.svg` as XML to confirm the file is valid SVG markup.
- Kept the asset in `public/` as a standalone demo file ready for browser playback or export workflows.

## 2026-03-12

### Workout focus mode, timer persistence, and mobile section menus

- Added `session_duration_seconds` end-to-end for workout execution: local migration `supabase/migrations/20260312193000_workout_day_session_duration.sql`, remote apply on the fit Supabase project, route support in `src/app/api/workout-days/[id]/route.ts` and `src/app/api/sync/push/route.ts`, server persistence in `src/lib/workout/execution.ts`, data loading in `src/lib/workout/weekly-programs.ts`, and offline queue support in `src/lib/offline/db.ts` plus `src/lib/offline/workout-sync.ts`.
- Reworked `src/components/workout-day-session.tsx` for the mobile fullscreen workout flow. The sticky focus header now has collapse/expand behavior, live workout timer controls, progress pills, step-by-step exercise switching for only the unlocked exercises, and a single-exercise surface instead of dumping the entire workout onto one screen.
- Tightened the mobile workout card layout so inputs and saved stats stay inside the screen width: smaller card padding, full-width save buttons on narrow screens, less aggressive grid breakpoints, and no leftover mojibake in the focus header copy.
- Rebuilt the inner workout and nutrition section switchers in `src/components/weekly-program-builder.tsx` and `src/components/nutrition-tracker.tsx`. Phones now get a clean dropdown-style section picker instead of horizontally overflowing cards, while desktop keeps the full segmented menu.

### Verification: workout focus mode and mobile section menus

- `npx eslint src/components/workout-day-session.tsx src/components/weekly-program-builder.tsx src/components/nutrition-tracker.tsx src/components/page-workspace.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx`
- `npm run typecheck`
- `npm run build`
- Playwright mobile pass on local `http://127.0.0.1:3060/workouts`, `http://127.0.0.1:3060/nutrition`, and `http://127.0.0.1:3060/workouts/day/609c0fce-af84-4701-a08d-2d5152a5177c?focus=1`: verified dropdown section menus on phones, readable Russian labels, sticky workout focus header with timer controls, and one-exercise-at-a-time rendering in focus mode.
- Added a follow-up PWA cache-bust in `public/sw.js` by bumping the shell/static cache names. This forces installed clients to drop stale cached JS bundles after the next deploy, which protects the workout screen from old `visibleExercises` references lingering in service worker cache.

### Mobile app shell cleanup for PWA

- Reworked `src/components/app-shell-frame.tsx` so phones now use one compact top bar with a burger button and page title instead of the previous floating compact-shell trigger. The full-width mobile bottom navigation is removed, and the app no longer keeps a second mobile navigation layer on top of the drawer.
- Simplified `src/components/app-shell-nav.tsx` into a single drawer-first mobile navigation model. On phones the user now opens sections only through the side menu, which makes the layout closer to a real PWA app shell instead of stacked floating controls.
- Moved the mobile drawer into a portal in `src/components/app-shell-nav.tsx`, so the side menu is no longer clipped by the compact header container and can fully slide over the page.
- Restored the floating AI chat widget in `src/components/app-shell-frame.tsx`, but kept the old cluttering shell strip removed. AI is again available as a separate chat button without taking the top navigation space.
- Playwright mobile verification on local `/dashboard` confirmed the new burger button, visible drawer sections, and the absence of the old floating AI button over the content area.

### AI prompt library stability and mobile shell polish

- Rebuilt `src/components/ai-prompt-library.tsx` so prompt persistence now happens only inside explicit create/delete actions instead of a `useEffect` sync loop. This removed the remaining `Maximum update depth exceeded` path and also cleaned the whole modal copy back to readable Russian.
- Updated `src/components/ai-assistant-widget.tsx` so the floating AI widget always opens as a clean new quick chat instead of restoring the previous conversation into the small modal. Chat history remains available on the full `/ai` screen.
- Cleaned `src/components/app-shell-frame.tsx` labels and tightened mobile shell spacing in `src/components/app-shell-nav.tsx` plus `src/app/globals.css`: narrower drawer width on phones, smaller bottom-nav spacing, and more stable menu button sizing on narrow PWA screens.
- Rebuilt `src/components/page-workspace.tsx` and `src/components/dashboard-workspace.tsx` so mobile section navigation is now a compact expandable selector instead of a permanent wall of section cards. On phones the current section opens via a simple menu and closes immediately after selection; desktop still keeps the richer multi-card switcher.

### Verification: prompt library and mobile PWA hotfix

- `npx eslint src/components/ai-prompt-library.tsx src/components/ai-assistant-widget.tsx src/components/app-shell-frame.tsx src/components/app-shell-nav.tsx`
- `npm run typecheck`
- `npm run build`
- Playwright mobile pass on local `http://127.0.0.1:3000/dashboard`: verified that the floating AI widget now opens with a clean empty chat, the prompt library modal opens without console errors, and the mobile drawer/bottom-nav layout remains stable at `390x844`
- `npx eslint src/components/page-workspace.tsx src/components/dashboard-workspace.tsx`
- `npm run typecheck` (rerun after `build`, due the existing `.next/types` race in this repo)
- Playwright mobile pass on local `http://127.0.0.1:3000/dashboard` and `http://127.0.0.1:3000/workouts`: verified that section menus open as compact selectors, switch the active section, and collapse back correctly on tap

### Collapsed shell trigger instead of full-width fixed bar

- Reworked `src/components/app-shell-frame.tsx` so the collapsed app shell no longer leaves a full-width fixed header strip over the page. In compact mode it now shows only a small floating control in the corner: one button opens navigation, the other restores the full header.
- Reduced compact-mode top padding accordingly, so section menus inside `/dashboard`, `/workouts`, and similar screens can expand without fighting a wide fixed bar across the top.

### Verification: collapsed shell trigger

- `npx eslint src/components/app-shell-frame.tsx`
- `npm run build`
- `npm run typecheck`
- Playwright mobile pass on local `http://127.0.0.1:3000/dashboard`: after collapsing the header, only the small floating control remains and the page content/menu selectors are no longer covered by a full-width fixed shell bar

### AI chat history reset and session management

- Changed `src/app/ai/page.tsx` and `src/lib/ai/chat.ts` so `/ai` now opens as a clean new chat by default instead of automatically loading the latest saved session into the main conversation area.
- Added AI chat history management routes in `src/app/api/ai/sessions/route.ts` and `src/app/api/ai/sessions/[id]/route.ts` for bulk history clearing and single-session deletion.
- Reworked `src/components/ai-workspace.tsx`, `src/components/ai-workspace-sidebar.tsx`, and `src/components/ai-chat-panel.tsx` so chat history updates locally when a new session is created, sessions can be deleted one by one, and the whole history can be cleared from the sidebar.

### Verification: AI chat history reset

- `npx eslint src/app/ai/page.tsx src/app/api/ai/sessions/route.ts src/app/api/ai/sessions/[id]/route.ts src/components/ai-workspace.tsx src/components/ai-workspace-sidebar.tsx src/components/ai-chat-panel.tsx src/lib/ai/chat.ts`
- `npm run build`
- `npm run typecheck`
- Playwright local pass on `http://127.0.0.1:3030/ai`: verified that `/ai` opens with an empty new chat, the old starter chat stays only in history, and single-session deletion clears it from the sidebar

### AI sidebar hydration hotfix

- Replaced `next/link` navigation inside `src/components/ai-workspace-sidebar.tsx` with explicit `router.push(...)` buttons for `Новый чат` and `Открыть`.
- This removes the header/history navigation nodes that were hydrating inconsistently between server HTML and client render in the AI sidebar.

### Verification: AI sidebar hydration hotfix

- `npx eslint src/components/ai-workspace-sidebar.tsx src/components/ai-workspace.tsx src/app/ai/page.tsx`
- `npm run build`
- `npm run typecheck`

### AI prompt library and cleaner chat composer

- Moved the built-in AI starter prompts out of the inline chat body and into a dedicated modal prompt library in `src/components/ai-prompt-library.tsx`, with search, local custom prompt storage, create/delete actions, and reusable behavior for both the full-page AI workspace and the floating widget.
- Updated `src/components/ai-chat-panel.tsx` so the full-page chat now opens templates from a single `Шаблоны` action in the top bar, keeps the empty state clean, and inserts the chosen prompt directly into the composer instead of auto-sending it.
- Updated `src/components/ai-assistant-widget.tsx` to match the same template-library flow: no more inline starter prompt wall inside the widget, just a dedicated icon action that opens the same modal without cluttering the chat surface.

### Verification: AI prompt library

- `npx eslint src/components/ai-prompt-library.tsx src/components/ai-chat-panel.tsx src/components/ai-assistant-widget.tsx`
- `npm run build`
- `npm run typecheck`
- `npm run typecheck` (rerun after `build`, due the existing `.next/types` race in this repo)
- Playwright mobile pass on local `http://127.0.0.1:3030/ai`: verified that inline starter prompts no longer render in the chat body and that the prompt library opens as a separate modal with search and built-in templates

### AI prompt library hotfix

- Removed the local custom sync event from `src/components/ai-prompt-library.tsx`. The same-window event loop was causing `Maximum update depth exceeded` by reloading local prompt state immediately after each save.
- Kept prompt persistence via `localStorage`, but stopped the component from re-triggering its own `setCustomPrompts(...)` cycle on every update.

### Verification: AI prompt library hotfix

- `npx eslint src/components/ai-prompt-library.tsx src/components/ai-chat-panel.tsx src/components/ai-assistant-widget.tsx`
- `npm run build`
- `npm run typecheck`

### Admin copy cleanup and role visibility

- Simplified admin copy in `src/app/admin/page.tsx`, `src/app/admin/users/page.tsx`, `src/components/admin-user-detail.tsx`, `src/components/admin-users-directory.tsx`, `src/components/admin-role-manager.tsx`, and `src/components/admin-user-actions.tsx`: removed overly internal wording, cleaned visible Russian text, and made the screens read like product UI instead of internal ops terminology.
- Restricted role visibility to the primary super-admin flow: ordinary admins no longer see role labels in the drawer account card, the admin users hero, or the user detail header. Root-only role controls remain available only to `corvetik1@yandex.ru`.
- Normalized dashboard entry copy in `src/app/dashboard/page.tsx`, so the top-level dashboard badge and page title no longer show broken text.

### Verification: admin copy and role visibility

- `npx eslint src/app/dashboard/page.tsx src/app/admin/page.tsx src/app/admin/users/page.tsx src/components/app-shell-nav.tsx src/components/admin-role-manager.tsx src/components/admin-user-actions.tsx src/components/admin-user-detail.tsx src/components/admin-users-directory.tsx`
- `npm run build`

### 2026-03-12 17:55 - AI workspace: full-page chat, cleaner widget, and image-first nutrition flow

- Rebuilt `/ai` into a chat-first workspace with compact shell chrome, section pills for `История / Контекст / Планы`, and a clean mobile layout where the chat remains the main surface instead of being buried under large headers.
- Rewrote the full-page AI chat panel so it now has a minimal header, icon-only web-search toggle, persistent session URL handling, image upload for food analysis, streamed markdown answers, inline proposal cards, and a mobile-friendly composer.
- Updated `/api/ai/assistant` so user-facing texts, tool descriptions, safety fallback, and provider error states are now clean Russian instead of broken technical strings.
- Rebuilt the floating AI widget into a lighter quick-access modal with the same chat runtime, quick prompts, proposal actions, and a direct jump into the full-screen AI workspace.
- Simplified recent proposal rendering inside the chat so the UI no longer depends on older preview strings with broken copy.

### Verification: AI workspace refresh

- `npx eslint src/components/ai-chat-panel.tsx src/components/ai-assistant-widget.tsx src/components/ai-workspace.tsx src/components/ai-workspace-sidebar.tsx src/app/ai/page.tsx src/app/api/ai/assistant/route.ts`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 18:20 - Immersive AI mode and collapse back to app

- Switched `/ai` to an immersive shell mode so the compact floating shell header no longer sits on top of the full-page chat.
- Added an explicit `Свернуть чат` action inside the AI workspace that returns the user back into the regular application flow via browser history with `/dashboard` fallback.
- Cleaned the shell frame labels in the same pass so the collapse/expand actions and account chip no longer show broken copy.

### Verification: immersive AI mode

- `npx eslint src/components/app-shell.tsx src/components/app-shell-frame.tsx src/components/ai-workspace.tsx src/app/ai/page.tsx`
- `npm run build`
- `npm run typecheck`
- `npm run typecheck` (after `build`, due the existing `.next/types` race in this repo)

### Admin UI recovery and shell restore

- Cleaned committed mojibake/garbled Russian copy in `src/app/admin/page.tsx`, `src/components/admin-users-directory.tsx`, `src/components/admin-user-detail.tsx`, and `src/app/admin/users/[id]/page.tsx`, so `/admin`, `/admin/users`, and the user detail card read like product UI again instead of broken encoding output.
- Restored the richer shell layer in `src/components/app-shell.tsx`, `src/components/app-shell-frame.tsx`, and `src/components/app-shell-nav.tsx`: compact collapsed header, floating expand control, AI assistant widget mount, background workout sync monitor, and better mobile admin drawer routes.
- Fixed remaining broken Russian snippets in `src/lib/ai/knowledge.ts`, so AI knowledge summaries no longer store corrupted text in the runtime context/retrieval layer.

### Verification: admin recovery pass

- `npx eslint src/components/app-shell.tsx src/components/app-shell-frame.tsx src/components/app-shell-nav.tsx src/app/admin/page.tsx src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/admin/users/[id]/page.tsx src/lib/ai/knowledge.ts`
- `npm run typecheck`
- `npm run build` did not finish within the local timeout window in a temporary `NEXT_DIST_DIR`, but it did not produce a concrete compile error before timing out
- Ran a project-wide mojibake sweep over `src/`; after the fixes, no remaining cp1251→utf8 recoverable corruption was left in the source tree
## 2026-03-11

### Mobile PWA section workspaces

- Added a reusable `src/components/page-workspace.tsx` pattern for mobile-first section switching: compact hero, summary metrics, and one active section at a time instead of stacked long pages.
- Rebuilt `src/app/workouts/page.tsx`, `src/app/nutrition/page.tsx`, and `src/app/settings/page.tsx` on top of this workspace so `workouts`, `nutrition`, and `settings` open as logical product menus on phones rather than long vertical walls of cards.
- Rebuilt `src/app/ai/page.tsx` into the same mobile workspace model with explicit sections for `Чат`, `Предложения`, `Контекст`, and `Доступ`, while keeping the existing AI chat, proposals, and context components intact.
- Reworked `src/components/admin-users-directory.tsx` and `src/components/admin-user-detail.tsx` into the same mobile-first section pattern, so admin user management now opens as logical sections instead of one long stack of admin blocks.
- Simplified `src/app/admin/users/page.tsx` and `src/app/admin/users/[id]/page.tsx` so the admin user-management flow no longer wastes top-of-screen space on duplicate hero content.
- Updated `src/components/dashboard-workspace.tsx` so the dashboard section menu also behaves like a mobile-friendly logical menu instead of a horizontal strip.
- Fixed a real runtime loop in `src/components/settings-billing-center.tsx`: opening `/settings -> Данные` no longer triggers `Maximum update depth exceeded`.
- Cleaned visible billing/data-center copy in `src/app/settings/page.tsx`, `src/components/settings-data-center.tsx`, `src/components/ai-workspace-sidebar.tsx`, and `src/lib/billing-access.ts` so mobile screens expose less mixed English/technical wording.

### Verification: mobile section workspace pass

- `npx eslint src/app/ai/page.tsx src/components/ai-workspace-sidebar.tsx src/components/dashboard-workspace.tsx src/components/page-workspace.tsx src/components/settings-billing-center.tsx src/components/settings-data-center.tsx src/app/settings/page.tsx src/lib/billing-access.ts`
- `npm run typecheck`
- Live Playwright browser pass on local `http://127.0.0.1:3022` for `/dashboard`, `/workouts`, `/nutrition`, `/settings`, and `/ai` at mobile viewport `390x844`
- `$env:NEXT_DIST_DIR='.next_codex_mobile_workspace2'; npm run build`
- `npx eslint src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/admin/users/page.tsx src/app/admin/users/[id]/page.tsx`
- `npm run typecheck`
- `$env:NEXT_DIST_DIR='.next_codex_admin_mobile'; npm run build`
- After the alternate-distDir build, `tsconfig.json` was normalized back to wildcard `.next*/types` includes so future temporary build directories do not keep expanding the file diff

### CAG runtime snapshots and embeddings refresh

- `src/lib/ai/user-context.ts` now has a dedicated AI runtime cache layer on top of `user_context_snapshots`. AI routes and plan generation can reuse a recent snapshot instead of rebuilding the full long-history context every time, while a lightweight freshness cursor checks recent workout, nutrition, goal, meal, and body-metric updates so the snapshot is automatically invalidated when the user has newer data.
- `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/chat/route.ts`, `src/lib/ai/plan-generation.ts`, and `src/app/ai/page.tsx` now use this runtime snapshot flow. `/ai` also reflects whether the workspace context came from a saved runtime snapshot or was rebuilt live.
- `src/lib/ai/knowledge.ts` now separates full knowledge reindex from embeddings-only refresh. `reindexUserKnowledgeBase(...)` supports `mode: "full" | "embeddings"`, `ensureKnowledgeIndex(...)` can repair missing current-model embeddings automatically, and full reindex refreshes the runtime snapshot while rebuilding the corpus.
- `src/app/api/ai/reindex/route.ts` and `src/components/admin-ai-operations.tsx` now expose the two modes operationally, so admin can run either a full rebuild or a lighter embeddings refresh from the UI instead of only one opaque reindex action.

### Verification: runtime snapshot and embeddings refresh

- `npx eslint src/lib/ai/user-context.ts src/lib/ai/knowledge.ts src/lib/ai/plan-generation.ts src/app/api/ai/assistant/route.ts src/app/api/ai/chat/route.ts src/app/ai/page.tsx src/app/api/ai/reindex/route.ts src/components/admin-ai-operations.tsx`
- `npm run build`
- `npm run typecheck`

### Admin knowledge health dashboard

- `src/app/api/admin/stats/route.ts` now reports a dedicated `knowledgeHealth` slice for `/admin`: runtime snapshot count, structured fact coverage, embeddings coverage ratio, recent reindex activity, and the latest runtime/reindex timestamps with the last reindex mode.
- `src/components/admin-health-dashboard.tsx` now surfaces this operationally in two new cards, so super-admin can see whether the AI knowledge layer is fresh and complete instead of only seeing raw chunk/embedding counters.
- This closes the "admin knowledge base management" visibility gap without introducing a new migration: the slice is built on top of `user_context_snapshots`, `knowledge_chunks`, `knowledge_embeddings`, and `support_actions`.

### Verification: admin knowledge health

- `npx eslint src/app/api/admin/stats/route.ts src/components/admin-health-dashboard.tsx`
- `npm run build`
- `npm run typecheck`

### Dashboard runtime snapshots for faster charts

- `src/lib/dashboard/metrics.ts` now has a dedicated runtime snapshot wrapper on top of `user_context_snapshots`. The dashboard can reuse a recent precomputed package of `snapshot`, `periodComparison`, `workoutCharts`, and `nutritionCharts` instead of rebuilding every heavy query on each page load.
- Snapshot freshness is checked against the latest changes in weekly programs, workout history, templates, exercise library, AI sessions, nutrition summaries, goals, nutrition targets, meals, and body metrics. If the user has newer data, the dashboard falls back to live recomputation and stores a fresh snapshot automatically.
- `src/app/dashboard/page.tsx` now reads from `getDashboardRuntimeMetrics(...)` and pairs it with `getAiRuntimeContext(...)`, so both dashboard analytics and AI-facing overview sections can reuse server snapshots. The page also exposes a simple user-facing "срез обновлён / пересчитан" badge instead of technical cache wording.

### Verification: dashboard runtime snapshot layer

- `npx eslint src/lib/dashboard/metrics.ts src/app/dashboard/page.tsx src/app/api/admin/stats/route.ts src/components/admin-health-dashboard.tsx`
- `npm run build`
- `npm run typecheck`

### Dashboard precomputed aggregates

- `src/lib/dashboard/metrics.ts` now has a dedicated aggregate bundle layer on top of `user_context_snapshots`. It precomputes daily bins for completed workouts, logged sets, tonnage, nutrition macros, nutrition tracking flags, and AI session counts over a 180-day lookback window.
- `getDashboardPeriodComparison(...)` now reads from this aggregate bundle first, so `/api/dashboard/period-compare` can answer 7/30/90-day comparisons from precomputed daily facts instead of re-running raw historical queries every time.
- The aggregate bundle reuses the same freshness guard as the dashboard runtime snapshot, so it automatically refreshes when workouts, nutrition, templates, goals, programs, AI sessions, meals, or body metrics have newer data.
- No migration was required: aggregates are stored as a new snapshot reason in `user_context_snapshots`, which keeps the implementation job-friendly for later cron/background recompute work.

### Verification: dashboard aggregate layer

- `npx eslint src/lib/dashboard/metrics.ts src/app/dashboard/page.tsx src/app/api/dashboard/period-compare/route.ts`
- `npm run build`
- `npm run typecheck`

### Scheduled dashboard warm job and Vercel Cron

- Added `src/app/api/internal/jobs/dashboard-warm/route.ts` as a cron-ready internal job. It warms dashboard aggregate snapshots, dashboard runtime snapshots, and AI runtime context for a recent batch of users, using `SUPABASE_SERVICE_ROLE_KEY` and the same snapshot storage layer already built on `user_context_snapshots`.
- The route supports both production cron auth via `CRON_SECRET` and manual execution from the root super-admin session, so the admin console can trigger the same warm-up flow without shell access.
- `src/components/admin-health-dashboard.tsx` and `src/app/admin/page.tsx` now expose a root-only `Прогреть snapshots` action next to the existing refresh / Sentry controls, turning snapshot warm-up into an operational admin task rather than an internal-only endpoint.
- Added `vercel.json` with a daily cron for `/api/internal/jobs/dashboard-warm` and set `maxDuration = 60` on the route so the nightly warm-up is already deploy-ready.

### Verification: scheduled dashboard warm job

- `npx eslint src/app/api/internal/jobs/dashboard-warm/route.ts src/lib/admin-auth.ts src/lib/admin-permissions.ts src/components/admin-health-dashboard.tsx src/app/admin/page.tsx src/lib/dashboard/metrics.ts src/lib/env.ts`
- `npm run build`
- `npm run typecheck`

### Daily nutrition summaries job

- Added `src/app/api/internal/jobs/nutrition-summaries/route.ts` as a cron-ready internal job for rebuilding `daily_nutrition_summaries` over the last few days for a recent batch of users. The job uses the shared internal-job auth model (`CRON_SECRET` or root admin session) and reuses `recalculateDailyNutritionSummary(...)` instead of duplicating nutrition math.
- Added a manual root-only trigger to `src/components/admin-health-dashboard.tsx`, so super-admin can recalculate nutrition summaries from `/admin` without shell access.
- Updated `vercel.json` with a scheduled nightly call to `/api/internal/jobs/nutrition-summaries?days=3`, which closes the background recompute gap for nutrition aggregates.

### Verification: nutrition summaries job

- `npx eslint src/app/api/internal/jobs/nutrition-summaries/route.ts src/components/admin-health-dashboard.tsx src/lib/nutrition/meal-logging.ts src/lib/admin-auth.ts src/lib/admin-permissions.ts src/lib/env.ts`
- `npm run build`
- `npm run typecheck`

### Scheduled knowledge refresh / reindex job

- Added `src/lib/internal-jobs.ts` as a shared helper for cron-secret validation, root-admin access checks, positive-int parsing, and target-user resolution for internal operational jobs. `dashboard-warm` and `nutrition-summaries` now reuse the same path instead of each carrying their own auth/selection copy.
- Added `src/app/api/internal/jobs/knowledge-reindex/route.ts` as a batch job for recent-user AI knowledge refresh. By default it runs `mode=embeddings`, but it also supports full reindex and writes `support_actions` records with `source = cron | admin`, so the existing admin health dashboard keeps seeing fresh reindex activity.
- Added a root-only manual trigger to `src/components/admin-health-dashboard.tsx` and wired a nightly Vercel cron for `/api/internal/jobs/knowledge-reindex?mode=embeddings&limit=20`, so embeddings refresh is no longer only a manual per-user action from the AI ops panel.

### Verification: scheduled knowledge job

- `npx eslint src/lib/internal-jobs.ts src/app/api/internal/jobs/dashboard-warm/route.ts src/app/api/internal/jobs/nutrition-summaries/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts src/components/admin-health-dashboard.tsx src/lib/ai/knowledge.ts`
- `npm run build`
- `npm run typecheck`

### Stale offline mutation retry and cleanup

- `src/lib/offline/workout-sync.ts` now has a proper stale-state maintenance layer: old queued mutations and old workout-day snapshots get TTL cleanup, and `flushOfflineMutations()` deduplicates concurrent flushes so the queue cannot be pushed twice in parallel from different screens.
- Added `src/components/workout-sync-monitor.tsx` and mounted it from `src/components/app-shell-frame.tsx`. The monitor runs a silent sync pass on shell mount, on reconnect, on tab focus/visibility return, and on a 60-second interval while the app is visible, so offline workout mutations are retried even when the user is no longer on the workout-day screen.
- `src/components/workout-day-session.tsx` now cleans stale local queue state before hydrating a day from Dexie and surfaces a user-facing notice when only stale local changes were cleaned up instead of being sent.

### Verification: stale offline queue maintenance

- `npx eslint src/lib/offline/workout-sync.ts src/components/workout-sync-monitor.tsx src/components/app-shell-frame.tsx src/components/workout-day-session.tsx`
- `npm run build`
- `npm run typecheck` (second pass after the known `.next/types` race)

### Scheduled AI eval queue

- Added `src/lib/ai/eval-runs.ts` as a shared queueing helper for `ai_eval_runs`, so manual admin queueing and scheduled queueing now use one insert/dedupe path instead of duplicating raw Supabase writes.
- `src/app/api/admin/ai-evals/run/route.ts` now uses that helper for ordinary admin-triggered benchmark runs.
- Added `src/app/api/internal/jobs/ai-evals-schedule/route.ts` as a cron-ready queueing route. It defaults to the no-spend `tool_calls` suite, supports root-admin manual execution or `CRON_SECRET`, and deduplicates scheduled runs inside a 24-hour window so the queue does not grow with duplicate smoke checks.
- `src/components/admin-ai-eval-runs.tsx` and `src/app/admin/page.tsx` now expose a root-only `smoke-eval` action for the scheduled queue path, and scheduled runs are marked in the run history UI.
- Updated `vercel.json` with a nightly cron for `/api/internal/jobs/ai-evals-schedule?suite=tool_calls`.

### Verification: scheduled AI eval queue

- `npx eslint src/lib/ai/eval-runs.ts src/app/api/admin/ai-evals/run/route.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/components/admin-ai-eval-runs.tsx src/app/admin/page.tsx`
- `npm run build`
- `npm run typecheck`

### Scheduled Stripe billing reconciliation job

- `src/lib/stripe-billing.ts` now exposes a shared per-user Stripe reconciliation helper, so the manual `/admin/users/[id]/billing/reconcile` route and background billing reconciliation use the same lookup and sync logic instead of maintaining separate customer/subscription fetch paths.
- Added `src/app/api/internal/jobs/billing-reconcile/route.ts` as a cron-ready billing normalization job. It targets recent Stripe-linked users, reconciles their latest Stripe subscription state, and records the outcome in `support_actions` as `reconcile_billing_state` with `source = admin | cron`.
- `src/app/api/admin/stats/route.ts` and `src/components/admin-health-dashboard.tsx` now surface billing reconciliation health: recent reconcile count, failed reconcile count, latest reconcile timestamp, and a root-only manual trigger from `/admin`.
- Updated `vercel.json` with a daily cron for `/api/internal/jobs/billing-reconcile?limit=20`, so billing state can be normalized even when a webhook or checkout-return path was missed.

### Verification: billing reconciliation job

- `npx eslint src/lib/stripe-billing.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts src/app/api/admin/stats/route.ts src/components/admin-health-dashboard.tsx src/components/admin-user-detail.tsx`
- `npm run build`
- `npm run typecheck`

### Assistant proposal agent flow

- `src/lib/ai/proposal-actions.ts` now holds one shared proposal lifecycle layer for listing, resolving, approving, and applying AI workout/meal proposals. Route handlers and assistant tools now reuse the same logic instead of diverging between chat flow and direct API actions.
- `src/app/api/ai/assistant/route.ts` now exposes assistant tools for `listRecentProposals`, `approveProposal`, and `applyProposal`, so the assistant can move from “show me my latest draft” to “confirm it” and “apply it” in one guided flow when the user explicitly asks.
- `src/components/ai-chat-panel.tsx` and `src/components/ai-assistant-widget.tsx` now render compact result cards for proposal history, confirmation, and apply actions, with direct buttons for confirm/apply when the next action is obvious. Tool results no longer disappear into plain text only; both `/ai` and the floating assistant now show a readable operational state for proposal actions.

### Verification: assistant proposal agent flow

- `npx eslint src/lib/ai/proposal-actions.ts src/app/api/ai/proposals/[id]/approve/route.ts src/app/api/ai/proposals/[id]/apply/route.ts src/lib/ai/domain-policy.ts src/app/api/ai/assistant/route.ts src/components/ai-chat-panel.tsx src/components/ai-assistant-widget.tsx`
- `npm run build`
- `npm run typecheck`

### AI workspace with recent sessions and structured context

- `src/lib/ai/chat.ts` now supports listing chat sessions and loading a specific session state by id, so the full AI page can work like a saved workspace instead of always reopening only the latest thread.
- `src/components/ai-workspace-sidebar.tsx` adds a dedicated sidebar for `/ai`: recent chat sessions, workspace quick actions, and the top structured facts that the assistant is currently using.
- `src/app/ai/page.tsx` now reads `?session=` from the URL, loads the selected conversation on the server, and presents the AI surface as a two-column workspace around chat, proposal work, and structured knowledge.
- `src/components/ai-chat-panel.tsx` and `src/components/ai-proposal-studio.tsx` now connect chat output to proposal handling more cleanly: proposal tool cards link directly into the proposal studio anchor instead of leaving the user to hunt for drafts manually.

### Verification: AI workspace flow

- `npx eslint src/lib/ai/chat.ts src/components/ai-workspace-sidebar.tsx src/components/ai-chat-panel.tsx src/components/ai-proposal-studio.tsx src/app/ai/page.tsx`
- `npm run build`
- `npm run typecheck`

### Structured knowledge facts for prompts and retrieval

- `src/lib/ai/structured-knowledge.ts` adds a normalized knowledge-facts layer over user profile, workout load, recovery, nutrition adherence, meal patterns, and strategy priorities. Instead of relying only on raw history blocks, the AI stack now gets compact facts with topic, priority, evidence, and next-step guidance.
- `src/lib/ai/user-context.ts` now stores the same structured knowledge snapshot inside `AiUserContext`, so assistant prompts and proposal generation use one canonical interpretation layer instead of rebuilding ad hoc summaries.
- `src/lib/ai/domain-policy.ts` and `src/lib/ai/plan-generation.ts` now inject these normalized facts into assistant and meal/workout proposal prompts, while `src/lib/ai/knowledge.ts` writes `structured_fact_sheet` and `structured_fact` documents into the retrieval corpus for reindex/search.
- No migration was required for this slice: the structured layer is stored as new knowledge document types on top of the existing AI/RAG schema.

### Verification: structured knowledge layer

- `npx eslint src/lib/ai/structured-knowledge.ts src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts src/lib/ai/knowledge.ts`
- `npm run build`
- `npm run typecheck`

### Nutrition strategy recommendations for dashboard and AI

- `src/lib/nutrition/strategy-recommendations.ts` adds a shared strategy layer over nutrition coaching signals and meal-level patterns. Instead of only exposing raw analytics, the app now builds prioritized food-strategy actions such as stabilizing logging, shifting calories earlier, improving protein distribution, or creating repeatable food templates.
- `src/lib/dashboard/metrics.ts` and `src/components/dashboard-nutrition-charts.tsx` now expose these recommendations directly on the dashboard as a dedicated “what to fix first” block, so the nutrition surface behaves more like a coach than a passive report.
- `src/lib/ai/user-context.ts`, `src/lib/ai/domain-policy.ts`, and `src/lib/ai/plan-generation.ts` now feed the same strategy layer into assistant and proposal prompts, while `src/lib/ai/knowledge.ts` stores a dedicated `nutrition_strategy` retrieval document next to `nutrition_meal_patterns`.

### Verification: nutrition strategy slice

- `npx eslint src/lib/nutrition/strategy-recommendations.ts src/lib/dashboard/metrics.ts src/components/dashboard-nutrition-charts.tsx src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts src/lib/ai/knowledge.ts`
- `npm run typecheck`
- `npm run build`

### Dashboard workspace and collapsed-shell polish

- Rebuilt `/dashboard` into a section-based workspace with `Сводка`, `Тренировки`, `Питание`, and `AI` views so the mobile PWA no longer opens as one very long analytics report.
- Added a dedicated `DashboardWorkspace` client layer that keeps the hero shorter, moves section switching to a visible app-like control row, and keeps drilldown analytics behind the selected section instead of rendering everything at once.
- Tightened the collapsed shell again so the fixed header becomes a compact floating control row (`menu + expand`) and gives more vertical space back to the content area.
- Live browser verification on authenticated `http://127.0.0.1:3022/dashboard` confirmed section switching and the new collapsed-shell behavior.

### Verification: dashboard workspace polish

- `npx eslint src/app/dashboard/page.tsx src/components/dashboard-workspace.tsx src/components/app-shell-frame.tsx`
- `npm run typecheck`
- `$env:NEXT_DIST_DIR='.next_codex_dashboard'; npm run build`
- Playwright live check on authenticated `http://127.0.0.1:3022/dashboard` at mobile viewport `390x844`

### Meal-level nutrition patterns for dashboard, AI, and retrieval

- `src/lib/nutrition/meal-patterns.ts` adds a dedicated nutrition pattern layer over real meals and meal items: average meals per tracked day, average calories and protein per meal, protein-dense meal share, evening calorie share, dominant meal window, and repeated-food anchors.
- `src/lib/dashboard/metrics.ts` and `src/components/dashboard-nutrition-charts.tsx` now expose these meal-level patterns directly in dashboard analytics, so nutrition is no longer limited to daily macro totals and now explains how the user actually distributes meals, protein, and repeated foods across the day.
- `src/lib/ai/user-context.ts`, `src/lib/ai/domain-policy.ts`, and `src/lib/ai/plan-generation.ts` now feed meal-pattern summaries into the coaching prompts, while `src/lib/ai/knowledge.ts` stores a dedicated `nutrition_meal_patterns` retrieval document alongside historical meal logs.
- No migration was required for this slice: it reuses existing `meals` and `meal_items` history and turns it into higher-level coaching and retrieval signals.

### Verification: meal pattern analytics

- `npx eslint src/lib/nutrition/meal-patterns.ts src/lib/dashboard/metrics.ts src/components/dashboard-nutrition-charts.tsx src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts src/lib/ai/knowledge.ts`
- `npm run typecheck`
- `npm run build`

### Workout day context, RPE, and deeper strength drilldown

- `src/components/workout-day-session.tsx` now supports full execution logging for each locked workout day: `actual_reps`, `actual_weight_kg`, `actual_rpe`, plus day-level `body_weight_kg` and `session_note`. The same screen keeps optimistic updates, offline queueing, and sync-push behavior for the full execution payload instead of reps-only logging.
- `src/lib/workout/execution.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-sets/[id]/route.ts`, `src/lib/offline/db.ts`, `src/lib/offline/workout-sync.ts`, and `src/app/api/sync/push/route.ts` now share one server/offline contract for workout day context and set RPE, so online and offline execution stay consistent.
- `src/lib/ai/user-context.ts`, `src/lib/ai/domain-policy.ts`, `src/lib/ai/plan-generation.ts`, and `src/lib/ai/knowledge.ts` now feed AI with historical `actual_rpe`, recent heavy-set share, workout-day body weight, and session notes. The assistant can rely on the user’s full archived training history instead of recent reps-only fragments.
- `src/lib/dashboard/metrics.ts` and `src/components/dashboard-workout-charts.tsx` now expose `avgActualRpe`, heavy-set share, recent-day body weight, session notes, and RPE-aware drilldown in dashboard analytics.
- Applied remote SQL migration `20260311121500_workout_day_context_and_set_rpe.sql` to the linked Supabase project via CLI fallback, because Supabase MCP is still pointing at `gwqvolspdzhcutvzsdbo` instead of `nactzaxrjzsdkyfqwecf`.

### Weight-aware workout analytics and AI context

- `src/components/workout-day-session.tsx` now logs `actual_weight_kg` together with `actual_reps`, keeps the same optimistic/offline queue flow, and surfaces saved set performance in the session UI.
- `src/lib/dashboard/metrics.ts`, `src/components/dashboard-workout-charts.tsx`, and `src/app/dashboard/page.tsx` were extended with weight-aware strength analytics: tonnage, average working weight, best set weight, estimated 1RM, and recent-session drilldown by exercise.
- `src/lib/ai/user-context.ts`, `src/lib/ai/plan-generation.ts`, and `src/lib/ai/knowledge.ts` now feed historical load signals into the AI layer, so workout recommendations can rely on working weight, tonnage, and best recorded sets instead of reps-only summaries.
- Applied remote SQL migration `20260311103000_workout_set_actual_weight.sql` to Supabase project `nactzaxrjzsdkyfqwecf`; this also preserved locked-program protections while allowing `actual_reps` and `actual_weight_kg` updates on completed sets.

## 2026-03-10

### AI proposal studio и workout drilldown

- `src/components/ai-proposal-studio.tsx` переработан в полноценный proposal-first экран: у каждого AI-предложения теперь видны структура плана, исходный запрос, исторический сигнал, timeline `draft -> approved -> applied` и результат применения без технических ID-шумов.
- `src/lib/dashboard/metrics.ts` расширен более глубокими workout-метриками: recovery signal, consistency ratio к целевому числу тренировок, сравнение упражнений по последним `4 недели vs 4 недели`, а также детальный exercise-level drilldown по последним сессиям.
- `src/components/dashboard-workout-charts.tsx` теперь показывает не только weekly trend, но и coach-facing аналитику по ритму, восстановлению, прогрессии упражнений и выбранной сессии с разбивкой по упражнениям и диапазонам повторов.

### Verification: proposal history and workout analytics

- `npx eslint src/components/ai-proposal-studio.tsx src/components/dashboard-workout-charts.tsx src/lib/dashboard/metrics.ts`
- `npm run build`
- `npm run typecheck`

### OpenRouter chat runtime and direct Voyage embeddings

- Added provider abstraction in `src/lib/ai/gateway.ts`: chat can now run through OpenRouter via an OpenAI-compatible endpoint, while Vercel AI Gateway remains as a fallback.
- Added direct Voyage embedding helpers in `src/lib/ai/embeddings.ts`, so retrieval/reindex no longer depends only on AI Gateway for embedding generation.
- Updated `src/lib/env.ts` and `.env.example` with `OPENROUTER_*` and `VOYAGE_*` runtime keys.
- Switched runtime-gated AI routes from `hasAiGatewayEnv()` to `hasAiRuntimeEnv()` for assistant/chat/workout-plan/meal-plan flows.
- Expanded admin readiness diagnostics so `/api/admin/stats` and `AdminHealthDashboard` now show AI runtime, OpenRouter, Voyage, and embedding readiness separately from pure AI Gateway readiness.

### Verification: OpenRouter and Voyage runtime slice

- `npx eslint src/lib/env.ts src/lib/ai/gateway.ts src/lib/ai/embeddings.ts src/lib/ai/knowledge.ts src/app/api/ai/assistant/route.ts src/app/api/ai/chat/route.ts src/app/api/ai/meal-plan/route.ts src/app/api/ai/workout-plan/route.ts src/app/api/chat/route.ts src/app/api/admin/stats/route.ts src/components/admin-health-dashboard.tsx`
- `npm run typecheck`
- `npm run build`

### Stripe checkout return retry flow

- `src/components/settings-billing-center.tsx` теперь не останавливается на одном `checkout/reconcile` после возврата из Stripe: billing center делает несколько auto-retry попыток с backoff, показывает текущий sync state и сохраняет ручной retry как fallback.
- `POST /api/billing/checkout/reconcile` остаётся источником истины для прямой post-checkout синхронизации, но UX вокруг него стал app-like: пользователь на телефоне видит session/payment/sync status вместо немого ожидания webhook.

### Billing health для super-admin

- `GET /api/admin/stats` расширен новым `billingHealth` slice: Stripe subscription counters, linked customer coverage, queued/completed `billing_access_review`, recent checkout return reconcile за 24 часа и последние timestamps по billing activity.
- `src/components/admin-health-dashboard.tsx` теперь показывает отдельный billing operations блок рядом с sync queues, а `src/components/admin-user-detail.tsx` раскрывает self-service billing audit logs с полезными payload-полями (`requestedFeatures`, `paymentStatus`, `sessionStatus`, `reconciled`).

### Проверка billing ops slice

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- отдельный `npm run build` через `NEXT_DIST_DIR=.next_codex_ops_health` не завершился за timeout и был остановлен; основной `.next` build по-прежнему нежелательно трогать, пока в workspace работает локальный `next dev`

## 2026-03-09

### Mobile app shell и admin control center

- `src/components/app-shell-nav.tsx` переведён на контекстный mobile bottom-nav: на телефоне нижняя навигация всегда остаётся в пяти слотах и не ломает сетку на `/history` и `/admin`, а текущий раздел подменяет пятый таб вместо переполнения.
- В `src/app/globals.css` добавлены мобильные polish-правки для app-shell: скрытие scrollbar у route strip, обрезка длинных подписей в нижней навигации и более явное active-состояние для app-like bottom bar.
- `/admin` расширен до control center: экран теперь показывает текущую admin-сессию, быстрые переходы в каталог пользователей, roster действующих админов с email и last sign-in, а также последние изменения доступов из `admin_audit_logs`.
- `/admin/users` усилен под реальное управление доступами: каталог поддерживает поиск по email/UUID, фильтр по роли, summary-карточки по текущей выборке и прямой CTA в карточку управления доступом.
- `AdminRoleManager` упрощён до прямого server-backed flow без ручного ввода SQL: супер-админ может выдать, подтвердить, изменить и отозвать admin-role, а UI подчёркивает actor role и аудит изменений.

### Проверка mobile/admin slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### Mobile burger drawer для PWA shell

- `src/components/app-shell.tsx` теперь сам подтягивает `viewer` и прокидывает его в shell-навигацию, чтобы телефонный PWA-режим видел email, имя и admin-role без ручной передачи этих данных по страницам.
- `src/components/app-shell-nav.tsx` переделан под mobile drawer: на телефоне появился burger trigger, затемнение фона, slide-in панель, сгруппированные разделы, account block и выход из сессии прямо из выезжающего меню.
- Нижний tab bar сохранён для core-разделов, а расширенная навигация и admin-входы переехали в drawer, чтобы не перегружать экран телефона и не ломать app-like UX.
- `src/app/globals.css` дополнен стилями `app-drawer*` и `app-drawer-link*`, чтобы drawer открывался как нативный sheet, а не как обычный список ссылок.
- `src/components/sign-out-button.tsx` получил `className`, чтобы кнопка выхода могла переиспользоваться и в settings-экране, и в mobile drawer без дублирования логики.

### Проверка mobile drawer slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### Role-based permission matrix для admin panel

- Добавлен единый контракт `src/lib/admin-permissions.ts` с ролями `super_admin`, `support_admin`, `analyst` и capability-matrix для чтения админских экранов, support actions, knowledge reindex, AI eval runs и управления admin-ролями.
- `src/lib/admin-auth.ts` теперь умеет требовать не просто факт admin-доступа, а конкретную capability, и отдаёт типизированные `401/403` ошибки для route handlers.
- Admin API routes переведены на capability-checks: user directory/detail, support actions, role management, admin stats, AI eval list/run и `POST /api/ai/reindex`.
- `AdminUserActions` и `AdminAiOperations` больше не притворяются доступными всем admin-ролям: `support_admin` и `super_admin` могут выполнять operational actions, а `analyst` видит read-only состояние с явным объяснением ограничений.
- `/admin` теперь показывает capability-статус текущей роли, чтобы из overview было видно, кто может запускать support actions, reindex и AI eval операции.

### Проверка admin permission slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально

### PWA service worker и offline shell

- Добавлен `public/sw.js` с предкешем `offline.html`, `manifest.webmanifest` и `icon.svg`, а также с runtime-кешем для критичных `/_next/static`-ассетов, шрифтов, стилей и изображений.
- Добавлен `public/offline.html` как безопасный offline fallback без кеширования приватных SSR-страниц пользователя.
- В `src/app/layout.tsx` подключена клиентская регистрация service worker через `src/components/service-worker-registration.tsx`.
- Service worker намеренно не кеширует защищённые HTML-страницы, чтобы не сохранять user-scoped SSR-срез между сессиями в общем кеше браузера.

### Проверка PWA/offline slice

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- `npm run build` завершился успешно локально
- Через Playwright CLI подтверждено, что страница находится под `navigator.serviceWorker.controller`
- Через Playwright CLI подтверждено, что offline navigation на `/dashboard` отдаёт `fit offline`, а не сетевую ошибку

### Диапазоны повторов в workout flow

- Добавлена миграция `supabase/migrations/20260309121000_workout_rep_ranges.sql`, которая расширяет `workout_sets` колонками `planned_reps_min` и `planned_reps_max`.
- В `src/lib/workout/rep-ranges.ts` вынесен общий доменный контракт диапазонов повторов с пресетами `1-6`, `6-10`, `6-12`, `10-15`, `15-20`, `20-25`.
- Weekly program builder больше не просит вручную вводить плановые повторы: вместо этого пользователь выбирает пресет диапазона, который потом хранится в workout-срезе.
- На `/workouts/day/[dayId]` поле `actual_reps` переведено с числового ввода на выпадающий список, ограниченный значениями выбранного диапазона.
- Для legacy-сетов без сохранённого диапазона сохранён безопасный fallback `1..25`, чтобы старые программы не ломались после миграции.
- Template flow, history clone и AI apply-поток обновлены так, чтобы сохранять или восстанавливать диапазон повторов вместе со структурой тренировки.

### Проверка workout rep range slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` прошёл локально после повторного запуска на уже сгенерированных `.next/types`

### Production hotfix для отстающей Supabase-схемы

- После деплоя обнаружено, что production `/workouts` падает server-side ошибкой, потому что удалённая таблица `workout_sets` ещё не содержит `planned_reps_min/max`.
- Причина подтверждена прямым запросом к remote Supabase: `column workout_sets.planned_reps_min does not exist`.
- Добавлен совместимый fallback в `src/lib/workout/workout-sets.ts`: чтение и запись `workout_sets` теперь автоматически откатываются на legacy-схему без новых колонок, если remote БД ещё не мигрирована.
- Обновлены `listWeeklyPrograms`, `Workout Day`, workout templates, history clone, AI workout apply и knowledge-сборка так, чтобы production не падал до применения SQL-миграции.
- Полная функциональность диапазонов повторов на production всё ещё зависит от применения миграции `20260309121000_workout_rep_ranges.sql` в удалённой Supabase БД.

### Дополнительный hotfix для legacy PostgREST и диапазонов без миграции

- Выяснено, что для `insert` в `workout_sets` remote PostgREST возвращает не `42703`, а `PGRST204` (`Could not find the 'planned_reps_max' column ... in the schema cache`).
- Fallback-детектор обновлён: теперь он ловит и `42703`, и `PGRST204`, поэтому создание новой weekly program больше не должно падать на legacy-схеме.
- `formatPlannedRepTarget` и `getActualRepOptions` теперь умеют восстанавливать выбранный диапазон повторов по `planned_reps`, если в БД пока нет `planned_reps_min/max`, но в `planned_reps` лежит верхняя граница пресета.
- Это даёт ограниченный список повторов даже без применённой remote-миграции для новых программ, созданных после перехода на rep range presets.

### Workout offline logging и sync queue

- Добавлен `src/lib/workout/execution.ts`, который выносит общий server-side контракт обновления статуса дня и `actual_reps` из route handlers.
- `PATCH /api/workout-days/[id]` и `PATCH /api/workout-sets/[id]` переведены на общий execution helper, чтобы online-обновления и sync push использовали одну и ту же валидацию.
- `POST /api/sync/push` больше не заглушка: route теперь принимает офлайн-мутации `workout_day_status` и `workout_set_actual_reps`, применяет их на сервере и возвращает список `applied/rejected`.
- `src/lib/offline/db.ts` типизирован под реальные workout-мутации, а `src/lib/offline/workout-sync.ts` добавляет enqueue, dedupe по цели мутации, чтение очереди по дню и flush в `/api/sync/push`.
- `WorkoutDaySession` теперь поддерживает optimistic updates, локальное сохранение статуса дня и `actual_reps` при отсутствии сети, отображение состояния очереди и автосинхронизацию при возвращении сети.
- Локальный queue slice сделан только для workout day execution; `sync/pull` и остальные домены по-прежнему не доведены до полного incremental sync.

### Проверка production hotfix

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` повторно прошёл локально после отдельного запуска на уже сгенерированных `.next/types`

### Проверка workout offline/sync slice

- `npm run lint` прошёл локально
- `npm run build` прошёл локально
- `npm run typecheck` повторно прошёл локально после отдельного запуска на уже сгенерированных `.next/types`

## 2026-03-08

### Бутстрап платформы

- Репозиторий был переведён с пустого bootstrap-состояния в web-first Next.js 16 foundation.
- Добавлены продуктовые поверхности для `dashboard`, `workouts`, `nutrition`, `history`, `ai`, `settings` и `admin`.
- Добавлены базовые Supabase browser/server-клиенты, env-парсинг, safety helper, offline Dexie DB и API error response helper.
- Добавлены AI route scaffolds для chat, workout plans, meal plans, photo flow, reindex, admin stats, admin users и AI eval orchestration.
- Обновлены `.env.example`, `README.md` и `AGENTS.md` под фактическое направление проекта.

### Data plane и схема

- Созданы и применены первые две миграции Supabase.
- Добавлены таблицы для workout, nutrition, AI, SaaS readiness, admin operations, export/delete flows и AI eval tracking.
- Добавлены owner-based RLS policies.
- Добавлены lock-guard triggers для immutable weekly programs и связанных workout-таблиц.

### Инфраструктура и секреты

- Создан Supabase project `fit-dev`.
- Создан и привязан Vercel project `fit-platform`.
- Локально настроен `SUPABASE_SERVICE_ROLE_KEY`.
- Через Playwright MCP создан локальный `AI_GATEWAY_API_KEY`.
- Работы по деплою намеренно остановлены после решения продолжать локальную разработку.

### Локальный auth и onboarding slice

- Добавлена страница `/auth` с регистрацией и входом через Supabase Auth.
- Добавлена страница `/onboarding` для заполнения базового профиля.
- Добавлен `/api/onboarding`, который сохраняет `profiles`, `onboarding_profiles`, `goals` и `user_context_snapshots`.
- Добавлены `viewer` helpers для текущего пользователя, статуса onboarding и проверки admin-роли.
- Продуктовые маршруты защищены редиректами для незалогиненных пользователей и пользователей без завершённого onboarding.
- В settings добавлен локальный sign-out flow.

### Документационный контур

- Добавлен `docs/README.md` как индекс документации.
- Добавлен `docs/MASTER_PLAN.md` с текущими статусами фаз.
- Добавлены `docs/FRONTEND.md`, `docs/BACKEND.md` и `docs/AI_STACK.md`.
- В `AGENTS.md` зафиксировано правило: после существенных изменений документацию нужно обновлять.
- План из `План фит.docx` перенесён в `docs/MASTER_PLAN.md` и переведён в чек-листы с `[x]` и `[ ]`.

### Проверка

- `npm run lint` прошёл локально
- `npm run typecheck` прошёл локально
- `npm run build` прошёл локально

### Admin bootstrap и exercise library CRUD

- `/admin` теперь умеет назначать первого `super_admin` через локальный `ADMIN_BOOTSTRAP_TOKEN`, не через временный header-костыль.
- Остатки старой схемы `x-admin-token` убраны из privileged routes; admin API теперь проверяет реальную запись в `platform_admins`.
- `/workouts` переведён из текстовой заглушки в рабочий экран библиотеки упражнений.
- Подключён существующий `exercise` API-контур: создание, редактирование, архивация и восстановление упражнений.
- `GET /api/admin/ai-evals` теперь отдаёт реальные записи `ai_eval_runs`, а `POST /api/admin/ai-evals/run` ставит eval run в очередь и пишет audit log.
- `POST /api/ai/reindex`, `POST /api/admin/users/[id]/suspend`, `POST /api/admin/users/[id]/restore` и `POST /api/admin/users/[id]/support-action` теперь создают реальные queued actions и audit logs вместо старых заглушек с bootstrap-header.
- `GET /api/admin/users/[id]` теперь отдаёт реальный admin detail snapshot по пользователю.

### Дополнительная проверка

- `npm run lint` повторно прошёл после admin/workout правок
- `npm run typecheck` повторно прошёл после admin/workout правок
- `npm run build` повторно прошёл после admin/workout правок

### Nutrition recipes, templates и adherence

- В nutrition-модуль добавлены полноценные рецепты с составом из пользовательских продуктов и расчётом КБЖУ по позициям.
- Добавлены шаблоны приёмов пищи, которые можно сохранить из текущего draft и повторно применять в ручной лог приёма пищи.
- На `/nutrition` добавлен отдельный блок выполнения целей по питанию: остаток до цели на сегодня и тренд adherence за последние 7 дней.
- В `src/lib/nutrition/meal-logging.ts` добавлены выборки для recipes, meal templates и 7-дневного nutrition trend.
- Добавлены route handlers для `recipes` и `meal_templates`.
- Исправлен технический хвост со stale `.next/dev/types`: `tsconfig.json` больше не тянет dev-generated types в `tsc`, а временные `.next_stale_*` исключены из `eslint` и `.gitignore`.

### Проверка nutrition-среза

- `npm run lint` прошёл локально после nutrition recipes/templates/adherence
- `npm run typecheck` прошёл локально после nutrition recipes/templates/adherence
- `npm run build` прошёл локально после nutrition recipes/templates/adherence

### Barcode flow и стабилизация локальной верификации

- В `/nutrition` добавлен быстрый поиск по штрихкоду внутри собственной базы продуктов пользователя.
- Найденный по штрихкоду продукт теперь можно сразу добавить в текущий draft приёма пищи без ручного выбора из списка.
- `package.json` обновлён: `typecheck` теперь использует `next typegen && tsc --noEmit`, чтобы route types генерировались автоматически.
- `build` переключён на `next build --webpack`, потому что локальный Turbopack падал внутренней ошибкой на CSS/PostCSS-стадии.

### Проверка barcode flow и toolchain

- `npm run typecheck` прошёл локально после перехода на `next typegen`
- `npm run lint` прошёл локально после добавления barcode flow
- `npm run build` прошёл локально через webpack

### Photo meal analysis flow

- `/api/ai/meal-photo` больше не является 501-заглушкой: route принимает фото блюда через `FormData`, отправляет его в Vercel AI Gateway через OpenResponses image input и возвращает структурированную proposal-оценку.
- Добавлена схема `mealPhotoAnalysisSchema` для валидации ответа AI и защиты UI от произвольного формата.
- На `/nutrition` добавлен отдельный блок AI-анализа фото блюда с загрузкой изображения, дополнительным контекстом и выводом ориентировочных калорий, КБЖУ, состава блюда и подсказок для ручного логирования.
- Photo flow сделан proposal-first: результат не пишет meal log автоматически и служит только опорой для ручного внесения питания.

### Проверка photo meal analysis flow

- `npm run typecheck` прошёл локально после добавления photo analysis route и UI
- `npm run lint` прошёл локально после добавления photo analysis route и UI
- `npm run build` прошёл локально после добавления photo analysis route и UI

### AI proposal flow с user context

- `meal-plan` и `workout-plan` routes переведены с простых prompt-заглушек на реальный server-side proposal flow.
- Добавлен `src/lib/ai/user-context.ts`, который собирает профиль, onboarding, goals, nutrition targets, body metrics и текущую nutrition summary для AI-контекста пользователя.
- Добавлен `src/lib/ai/proposals.ts` для выборки и сохранения `ai_plan_proposals`.
- `/api/ai/meal-plan` теперь генерирует proposal плана питания из реального пользовательского контекста и сохраняет результат в `ai_plan_proposals`.
- `/api/ai/workout-plan` теперь генерирует proposal тренировочного плана из реального пользовательского контекста и сохраняет результат в `ai_plan_proposals`.
- `/ai` переведена из статической заглушки в рабочий AI proposal-центр с формами генерации meal/workout proposals и историей последних AI-предложений.
- Proposal flow остаётся безопасным: данные сохраняются как предложения и не применяются автоматически к workout или nutrition домену.

### Проверка AI proposal flow

- `npm run typecheck` прошёл локально после AI proposal-правок
- `npm run lint` прошёл локально после AI proposal-правок
- `npm run build` прошёл локально после AI proposal-правок

### AI proposal confirmation и controlled apply

- Добавлены `POST /api/ai/proposals/[id]/approve` и `POST /api/ai/proposals/[id]/apply`.
- Workout proposal теперь можно не только подтвердить, но и применить в реальную draft weekly program с автоматическим созданием недостающих упражнений в `exercise_library`.
- Meal proposal теперь можно применить в nutrition-домен как набор reference-only `meal_templates`, чтобы использовать AI-план как управляемый артефакт, а не как автологирование.
- В `NutritionMealTemplatesManager` добавлена явная обработка reference-only AI-шаблонов, чтобы они не выглядели как обычные food-mapped шаблоны.
- AI proposal UI на `/ai` теперь поддерживает подтверждение и применение предложений прямо из интерфейса.

### Проверка confirmation/apply flow

- `npm run typecheck` прошёл локально после confirmation/apply flow
- `npm run lint` прошёл локально после confirmation/apply flow
- `npm run build` прошёл локально после confirmation/apply flow

### Admin user directory и detail UI

- Добавлены страницы `/admin/users` и `/admin/users/[id]`.
- `admin/page.tsx` теперь даёт переход в полноценный user directory и ссылки в карточки пользователей.
- Добавлен client-side user directory, который читает реальные данные из `/api/admin/users`.
- Добавлена карточка пользователя с profile/onboarding/goal snapshot, статистикой по упражнениям и программам, а также историей queued support actions.
- Добавлен `AdminUserActions` с кнопками `suspend`, `restore`, `queue resync` и кастомным support action.
- Под этот UI использованы уже реализованные server routes на `support_actions` и `admin_audit_logs`.

### Дополнительная проверка после admin UI

- `npm run lint` прошёл после добавления `/admin/users` UI
- `npm run typecheck` прошёл после добавления `/admin/users` UI
- `npm run build` прошёл после добавления `/admin/users` UI

### Weekly program builder

- Добавлен `/api/weekly-programs` для загрузки и создания draft weekly programs.
- Добавлен server helper `listWeeklyPrograms`, который собирает программу из `weekly_programs`, `workout_days`, `workout_exercises` и `workout_sets`.
- На `/workouts` добавлен рабочий weekly program builder с днями недели, упражнениями, количеством подходов и плановыми повторами.
- Builder создаёт draft-неделю на реальных workout-таблицах и сразу показывает её в списке последних программ.
- Срез сделан без lock/execution UI: это останется следующими шагами домена.

### Проверка weekly program builder

- `npm run lint` прошёл после добавления weekly program builder
- `npm run typecheck` прошёл после добавления weekly program builder
- `npm run build` прошёл после добавления weekly program builder

### Immutable lock UI и My Week

- Добавлен `POST /api/weekly-programs/[id]/lock`, который переводит draft week в `active` и выставляет `is_locked = true`.
- В списке weekly programs появилась кнопка `Lock week` для draft-программ.
- На `/workouts` добавлен блок `My Week`, который показывает текущую активную неделю и её дни.
- Теперь workout flow выглядит так: библиотека упражнений -> draft week -> lock -> active week snapshot.

### Проверка lock и My Week

- `npm run lint` прошёл после добавления lock flow и My Week
- `npm run typecheck` прошёл после добавления lock flow и My Week
- `npm run build` прошёл после добавления lock flow и My Week

### Workout Day и actual reps

- Добавлена страница `/workouts/day/[dayId]` для выполнения конкретного тренировочного дня.
- Добавлен `WorkoutDaySession`, который показывает упражнения, подходы, плановые повторы и позволяет сохранять `actual_reps`.
- Добавлены API routes `PATCH /api/workout-days/[id]` и `PATCH /api/workout-sets/[id]`.
- Status дня теперь можно переводить между `planned`, `in_progress` и `done`.
- Сохранение фактических повторов доступно только для locked week и работает через реальные обновления `workout_sets.actual_reps`.
- Из `My Week` и из списка locked-программ появились переходы в выполнение дня тренировки.

### Проверка Workout Day

- `npm run lint` прошёл после добавления Workout Day
- `npm run typecheck` прошёл после добавления Workout Day
- `npm run build` прошёл после добавления Workout Day

### History cloning flow

- Добавлен `POST /api/weekly-programs/[id]/clone`, который создаёт новый draft на основе существующей недели.
- В UI weekly programs появилась кнопка `Clone +7d`.
- Клонирование переносит дни, упражнения и плановые повторы, но не переносит `actual_reps`.
- Новый draft автоматически получает `source_program_id` и дату старта на неделю позже исходной.

### Проверка history cloning

- `npm run lint` прошёл после добавления cloning flow
- `npm run typecheck` прошёл после добавления cloning flow
- `npm run build` прошёл после добавления cloning flow

### Workout templates

- Добавлен `GET/POST /api/workout-templates`.
- Любую сохранённую weekly program теперь можно сохранить как template через `Save template`.
- На `/workouts` появился список `Workout templates`.
- Template можно применить обратно в builder и быстро собрать новый draft без ручного повторного ввода.

### Проверка workout templates

- `npm run lint` прошёл после добавления workout templates
- `npm run typecheck` прошёл после добавления workout templates
- `npm run build` прошёл после добавления workout templates

### Dashboard metrics queries и period comparison UI

- `src/lib/dashboard/metrics.ts` переведён на реальные запросы к Supabase вместо mock-данных.
- `/dashboard` теперь показывает живой snapshot по active/draft программам, упражнениям, logged sets, AI-сессиям и nutrition days.
- Добавлен client-side `DashboardPeriodComparison` с переключением `7 / 30 / 90` дней через `/api/dashboard/period-compare`.
- На dashboard появились визуальные сравнения текущего периода с предыдущим интервалом такой же длины по тренировкам, калориям и AI-сессиям.

### Русификация пользовательского UI

- Навигация `AppShell`, landing, dashboard, admin, settings, workouts, history, nutrition, AI и страницы выполнения тренировки приведены к русской пользовательской поверхности.
- Кнопки, заголовки, статусы и подсказки в workout/admin/dashboard контуре переведены на русский, включая `Lock week`, `Clone +7d`, `Save template`, `Workout Day` и route-level captions.
- Для отображаемых goal/fitness/sex/admin-role значений добавлены русские маппинги, чтобы UI не показывал пользователю сырой enum из БД.

### Проверка dashboard и русификации UI

- `npm run lint` прошёл после dashboard/UI-правок
- `npm run typecheck` прошёл после dashboard/UI-правок
- `npm run build` прошёл после dashboard/UI-правок

### Workout charts на dashboard

- В `src/lib/dashboard/metrics.ts` добавлен `getDashboardWorkoutCharts`, который собирает недельные workout-тренды по `workout_days` и `workout_sets`.
- На `/dashboard` добавлен `DashboardWorkoutCharts` с двумя графиками: завершённые тренировочные дни по неделям и логи подходов по неделям.
- Графики работают без внешней chart-библиотеки и строятся прямо на данных Supabase, поэтому текущий analytics slice остаётся лёгким и локально проверяемым.

### Проверка workout charts

- `npm run lint` прошёл после добавления workout charts
- `npm run typecheck` прошёл после добавления workout charts
- `npm run build` прошёл после добавления workout charts

### Nutrition charts на dashboard

- В `src/lib/dashboard/metrics.ts` добавлен `getDashboardNutritionCharts`, который собирает 7-дневный nutrition trend по `daily_nutrition_summaries`.
- На `/dashboard` добавлен `DashboardNutritionCharts` с графиком калорий по дням и визуализацией средних КБЖУ за день.
- Analytics dashboard теперь закрывает оба графических среза из текущего плана: тренировки и питание.

### Проверка nutrition charts

- `npm run lint` прошёл после добавления nutrition charts
- `npm run typecheck` прошёл после добавления nutrition charts
- `npm run build` прошёл после добавления nutrition charts

### Nutrition tracker и исправление cookie helper

- В `src/lib/supabase/server.ts` добавлена безопасная обработка cookie writes: Server Components больше не падают на `cookieStore.set`, а helper не ломает рендер в защищённых server pages.
- На `/nutrition` вместо заглушки появился рабочий nutrition-срез с ручным логированием приёмов пищи.
- Добавлены API routes `src/app/api/foods/*`, `src/app/api/meals/*` и `src/app/api/nutrition/targets/route.ts`.
- Добавлен `src/lib/nutrition/meal-logging.ts` для выборки продуктов, последних приёмов пищи, nutrition targets и пересчёта `daily_nutrition_summaries`.
- Добавлен `src/components/nutrition-tracker.tsx` с формами для базы продуктов, дневных целей по КБЖУ и ручного логирования питания.
- После создания и удаления приёма пищи дневная nutrition summary пересчитывается автоматически, а экран `/nutrition` показывает текущую сводку и историю последних логов.
- `npm run lint` прошёл после nutrition-правок и фикса cookie helper.
- `npm run typecheck` прошёл после nutrition-правок и фикса cookie helper.
- `npm run build` прошёл после nutrition-правок и фикса cookie helper.
### AI-чат и базовый RAG pipeline

- Добавлен реальный AI-чат с сохранением сессий и сообщений в `ai_chat_sessions` и `ai_chat_messages`.
- Добавлен knowledge/retrieval слой в `src/lib/ai/knowledge.ts` поверх `knowledge_chunks` и `knowledge_embeddings`.
- Индексация пользовательской базы знаний теперь собирает документы из onboarding, целей, nutrition targets, nutrition summaries, body metrics, user memory facts, context snapshots и последних weekly programs.
- Добавлен route `POST /api/ai/chat`, который сохраняет user message, поднимает retrieval по knowledge base, генерирует ответ через AI Gateway и сохраняет assistant message.
- Добавлен route `POST /api/ai/reindex`, который теперь реально переиндексирует базу знаний выбранного пользователя и пишет support/audit записи.
- На `/ai` добавлена клиентская панель чата с историей диалога, запуском нового чата и отображением источников retrieval для assistant-ответов.
- На AI-экране добран русский текст в пользовательских подписях, чтобы не оставлять смешанный English/Russian интерфейс.

### Проверка AI-чата и RAG

- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Live admin UX для AI eval runs

- На `/admin` статичная карточка последних eval runs заменена на живой client-side блок `AdminAiEvalRuns`.
- Админ теперь может вручную поставить новый `ai_eval_run` в очередь прямо из control center и сразу увидеть его в списке без полного обновления страницы.
- `GET /api/admin/ai-evals` и `POST /api/admin/ai-evals/run` теперь используются как единый live-контур для списка и queue action.
- UI уважает capability `queue_ai_eval_runs`: `analyst` и `super_admin` могут ставить eval runs в очередь, остальные роли видят read-only состояние.

### Проверка live admin UX для AI eval runs

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### User detail operations timeline

- `GET /api/admin/users/[id]` расширен actor-aware payload для super-admin карточки пользователя: теперь route отдает `recentExportJobs`, `recentOperationAuditLogs`, обогащенные `recentSupportActions`, а также actor refs для lifecycle/export/deletion/subscription history.
- В карточке пользователя `AdminUserDetail` собран полноценный operations view: текущий export/deletion state, история export jobs, support actions с resolution info, отдельный timeline по status transitions и расширенный billing/subscription timeline.
- `src/app/admin/users/[id]/page.tsx` переписан с чистым admin shell title, чтобы detail route выглядел как полноценный раздел панели, а не временный debug screen.

### Проверка user detail operations timeline

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Queue processor для admin operations

- Добавлен server-side helper `processAdminOperationQueues` и новый route `POST /api/admin/operations/process`, чтобы support-admin / super-admin могли прогонять admin queues не только ручными status clicks, но и пакетной обработкой.
- Export lifecycle теперь имеет автоматический wave flow: queued export jobs переводятся в `processing`, получают synthetic `artifact_path` и завершаются в `completed` с audit trail по обеим transition-точкам.
- Deletion lifecycle получил server wave logic: legacy `queued` requests нормализуются в `holding`, а просроченные hold-записи релизятся в queued support action `purge_user_data` с отдельным audit событием `queue_deletion_purge_action`.
- На `/admin` `AdminOperationsInbox` теперь умеет запускать `Прогнать wave`, а `AdminHealthDashboard` показывает due deletion holds и последние export/deletion timestamps.

### Проверка queue processor

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Support action execution и suspended state

- Добавлена миграция `user_admin_states`, чтобы `suspend_user` / `restore_user` имели реальный persisted account state, а не оставались только support queue action.
- `getViewer` теперь учитывает `user_admin_states`: suspended пользователь без admin-прав уходит на `/suspended`, где видит reason/state и может выйти из сессии.
- `processAdminOperationQueues` расширен support execution flow: wave теперь обрабатывает `suspend_user`, `restore_user`, `resync_user_context` и `purge_user_data`.
- `resync_user_context` создает `admin_support_resync` snapshot в `user_context_snapshots`, а `purge_user_data` формирует `admin_purge_manifest` snapshot с реальным inventory по user-scoped таблицам.
- В user detail появился текущий suspended state, так что super-admin видит не только timeline очереди, но и фактическое состояние аккаунта.

### Проверка support action execution

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Operations inbox и manual status workflow

- Добавлен `AdminOperationsInbox` на `/admin`: единый inbox по `support_actions`, `export_jobs` и `deletion_requests` с KPI, переходом в карточку пользователя и ручным refresh.
- Добавлен `GET /api/admin/operations`, который собирает pending/recent operations, подтягивает actor/target identity из Auth и profiles и возвращает summary для super-admin dashboard.
- Добавлен `PATCH /api/admin/operations/[kind]/[id]` для ручного разбора очередей: support actions переводятся из `queued` в `completed/failed`, export jobs — в `processing/completed/failed`, deletion requests — в `holding/completed/canceled`.
- Все ручные status transitions пишутся в `admin_audit_logs` с `fromStatus`, `toStatus`, `kind` и operator note.
- `GET /api/admin/stats` и `AdminHealthDashboard` приведены к реальной support-схеме: больше нет ложного `running` для `support_actions`, вместо этого считаются `queued/completed/failed`, а также отдельно показываются export backlog и deletion holds.

### Проверка operations inbox и admin health

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Workout offline sync pull и cache snapshots

- `GET /api/sync/pull` больше не заглушка для workout execution slice: route поддерживает scope `workout_day` и отдаёт канонический snapshot конкретного тренировочного дня.
- В `src/lib/offline/workout-sync.ts` добавлены helpers для `cacheWorkoutDaySnapshot`, чтения локального snapshot и server pull без полного обновления страницы.
- `WorkoutDaySession` теперь гидратится из Dexie snapshot + локальной очереди, а после online sync подтягивает свежий server state через `sync/pull`, а не через `router.refresh()`.
- На экране дня тренировки показывается время последнего локального snapshot, что полезно для phone-first PWA сценария с нестабильной сетью.

### Проверка workout offline sync pull и cache snapshots

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin system health и sync health dashboards

- `GET /api/admin/stats` расширен из простого counters endpoint в health API с отдельными срезами `systemHealth` и `syncHealth`.
- На `/admin` добавлен живой client-side блок `AdminHealthDashboard`, который умеет вручную обновлять runtime readiness, workload counters, support/eval backlog и workout sync activity.
- В health dashboard выведены readiness-флаги для `SUPABASE_PUBLIC`, `AI_GATEWAY`, `SUPABASE_SERVICE_ROLE_KEY` и scoped `workout sync pull`, а также свежесть последних профилей, программ, support actions, eval runs и сохранённых `actual_reps`.
- `/admin` теперь закрывает не только user management и AI operations, но и базовую operational observability для текущей PWA/offline архитектуры.

### Проверка admin system health и sync health dashboards

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Primary super-admin policy и расширенный user analytics

- Root-политика закреплена серверно: `super_admin` можно bootstrap/назначить только для `corvetik1@yandex.ru`, а снять или понизить этот доступ нельзя.
- `manage_admin_roles` теперь реально является root-only capability: UI и route handlers больше не считают любой `super_admin` в таблице достаточным для управления ролями.
- `/admin` получил отдельный root-only `Super-admin контур`, который виден только основному владельцу платформы и показывает policy drift по root-доступу.
- `GET /api/admin/users/[id]` расширен до полноценного analytics payload по пользователю: workout, nutrition, AI и lifecycle counters вместе с последними activity timestamps.
- Клиентская карточка пользователя на `/admin/users/[id]` теперь показывает подробную операционную статистику по аккаунту, а каталог пользователей прямо сообщает root-policy для `super_admin`.

### Проверка primary super-admin policy и user analytics

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin user operations: export и deletion

- Добавлены admin routes `POST /api/admin/users/[id]/export` и `POST` / `DELETE` `/api/admin/users/[id]/deletion` для живого управления export jobs и deletion hold flow без SQL.
- `AdminUserActions` теперь умеет ставить экспорт данных в очередь, переводить deletion request в `holding` и отменять его из карточки пользователя.
- User detail payload дополнен текущими состояниями `latestExportJob`, `deletionRequest` и `latestSubscription`, чтобы у админа был не только счётчик, но и реальный operational state.
- Карточка пользователя показывает отдельный operations/billing блок с export status, deletion hold, subscription state и access counters.

### Проверка admin user operations: export и deletion

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin users catalog: activity, backlog и billing signals

- `GET /api/admin/users` расширен до операционного каталога: route теперь обходит все страницы Supabase Auth users и агрегирует по каждому пользователю workout, nutrition, AI, support backlog, export/deletion state и subscription state.
- Каталог пользователей на `/admin/users` получил дополнительные фильтры `activity` и `paid`, server-driven сортировки по активности, входам, workout, AI и backlog, а также KPI summary по активным за 7 дней, backlog, пользователям без входов и платящим аккаунтам.
- Каждая карточка пользователя в списке теперь показывает mobile-friendly ops snapshot: роль, activity bucket, root/backlog/billing badges, workout/nutrition/AI/operations мини-панели и footer с источником последней активности.

### Проверка admin users catalog: activity, backlog и billing signals

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Admin users catalog: cohort analytics и priority segments

- `/api/admin/users` теперь возвращает не только `data`, но и server-side `summary` и `segments` для super-admin панели: activity buckets, backlog totals, billing hygiene и приоритетные выборки пользователей.
- В `/admin/users` добавлены cohort-блоки по активности, operational summary по backlog/export/deletion/subscriptions, а также три приоритетных сегмента: `priorityQueue`, `inactivePaid`, `newestUsers` и `topWorkoutUsers`.
- Панель позволяет супер-админу сразу видеть, кого нужно разбирать в первую очередь: пользователей с backlog, платящих без активности, новых аккаунтов без входов и самых активных workout users.

### Проверка admin users catalog: cohort analytics и priority segments

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Root billing controls и bulk user actions

- Добавлены root-only admin routes `POST /api/admin/users/[id]/billing` и `POST /api/admin/users/bulk` для server-backed управления subscription state, entitlements и массовыми действиями по выбранным пользователям.
- В user detail появился billing/access control block: root super-admin может выдать `trial`, активировать/отменить подписку, пометить `past_due`, а также включать и выключать entitlements по `feature_key`.
- В `/admin/users` добавлена bulk-панель с выбором пользователей прямо из каталога. Root super-admin теперь может массово запускать `queue_export`, `queue_resync`, `queue_suspend`, `grant_trial` и `enable_entitlement`.
- User detail payload расширен `recentEntitlements` и `recentUsageCounters`, чтобы billing/access state был не только редактируемым, но и наблюдаемым из UI.

### Проверка root billing controls и bulk user actions

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Billing timeline и bulk wave history

- `POST /api/admin/users/[id]/billing` теперь пишет subscription-side audit не только в `admin_audit_logs`, но и в `subscription_events`, чтобы user detail показывал реальную timeline по admin billing actions.
- `POST /api/admin/users/bulk` теперь формирует `batchId`, добавляет его в per-user audit payload и пишет отдельную summary-запись `bulk_wave_completed` в `admin_audit_logs`.
- `/api/admin/users` возвращает `recentBulkWaves`, а `/api/admin/users/[id]` возвращает `recentSubscriptionEvents`, поэтому super-admin видит и историю массовых операций, и историю billing updates на уровне пользователя.
- В UI это отображено как `Bulk history` на `/admin/users` и `Subscription timeline` в user detail.

### Проверка billing timeline и bulk wave history

- `npm run lint`
- `npm run build`
- `npm run typecheck`
### Settings data center and self-service export

- Added a real self-service data center in `Settings`: users can queue a data export, request account deletion with a 14-day hold, cancel that deletion request, and refresh statuses without leaving the screen.
- Added `GET/POST/DELETE /api/settings/data` for authenticated user-scoped export/deletion actions and `GET /api/settings/data/export/[id]/download` for completed export downloads.
- Added server helpers to load the settings snapshot and build a JSON export bundle across profile, onboarding, workouts, nutrition, AI history, billing, snapshots, and privacy records.
- Applied remote Supabase migrations before this slice: `20260309121000_workout_rep_ranges.sql` and `20260309173000_user_admin_states.sql`.

### Verification: settings data center

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Settings export archive upgrade

- Upgraded self-service export delivery from a raw JSON response to a real ZIP archive.
- Added a server-side archive builder that ships `export.json`, `summary.csv`, and CSV slices for workouts, nutrition, AI, billing, and privacy records.
- Updated the download route in settings to return `application/zip` and aligned the settings UI with ZIP-first copy.

### Verification: settings export archive

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Settings privacy timeline

- Extended the settings data snapshot with user-facing privacy events derived from `admin_audit_logs`.
- `/settings` now shows a privacy timeline for export/deletion lifecycle plus next-step summaries for the current export and deletion state.
- Timeline intentionally exposes actor scope as `you / support / system` instead of leaking internal admin identity fields.

### Verification: settings privacy timeline

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Hard-delete purge worker and protected primary admin

- `purge_user_data` in the admin queue processor now executes a real hard-delete via `auth.admin.deleteUser(..., false)` instead of stopping at a manifest-only placeholder.
- Purge manifests are now persisted in surviving `support_actions` and audit payloads before deletion, because `user_context_snapshots` are cascaded away with the deleted account and cannot serve as a durable audit artifact.
- Added protection for the root account `corvetik1@yandex.ru`: self-service deletion, admin deletion requests, direct destructive support actions, and bulk suspend now reject the primary super admin.

### Verification: hard-delete purge worker

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Sentry and Vercel observability

- Added `@sentry/nextjs`, `@vercel/analytics`, and `@vercel/speed-insights` to the app and wired them into the App Router shell.
- Added current Sentry manual setup for Next.js App Router: `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, and `src/app/global-error.tsx`.
- `next.config.ts` now conditionally wraps the app with `withSentryConfig(...)` when build-time Sentry credentials are present, including source-map upload support, a tunnel route, and automatic Vercel monitors.
- `logger.error(...)` now forwards handled server-side errors into Sentry so route failures show up in monitoring even when they are caught and converted to API responses.
- `/api/admin/stats` and the admin health dashboard now expose readiness for Sentry runtime/build config and Vercel runtime observability next to the existing Supabase and AI readiness checks.
- No new SQL migration was required for this slice.

### Verification: Sentry and Vercel observability

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Sentry smoke test and readiness diagnostics

- Added root-only `POST /api/admin/observability/sentry-test`, which emits a real Sentry smoke-test event and returns the resulting event id for operational verification.
- Expanded `/api/admin/stats` with non-secret observability diagnostics: missing Sentry runtime/build env keys, configured Sentry org/project/environment, and current Vercel runtime environment.
- `AdminHealthDashboard` now shows those diagnostics directly in `/admin` and exposes a smoke-test button to the primary super-admin.

### Verification: Sentry smoke test and readiness diagnostics

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Runtime entitlements, AI usage accounting and settings billing center

- Added `src/lib/billing-access.ts` as the runtime contract for subscriptions, entitlements, monthly usage counters, and per-feature access snapshots for `ai_chat`, `meal_plan`, `workout_plan`, and `meal_photo`.
- AI routes now enforce plan access and increment usage counters on success: `POST /api/ai/chat`, `POST /api/ai/meal-plan`, `POST /api/ai/workout-plan`, `POST /api/ai/meal-photo`, plus proposal `approve/apply` flows.
- `/ai` and `/nutrition` no longer act as if every AI feature is always available: the UI now shows access source, monthly usage, reset window, and blocked reasons directly in the product surface.
- `/settings` now includes a dedicated `SettingsBillingCenter` with plan summary, feature usage cards, billing timeline, and a self-service `billing_access_review` request flow for blocked premium AI features.
- Added `GET/POST /api/settings/billing` for user-scoped billing refresh and access-review requests; those requests are written into `support_actions` plus `admin_audit_logs`, so they are visible to the admin inbox.
- Admin billing mutations now also write entitlement changes into `subscription_events`, so user-facing billing history is not limited to subscription status changes only.
- Production Sentry rollout is intentionally deferred until `SENTRY_PROJECT` and `NEXT_PUBLIC_SENTRY_DSN` are provided; runtime diagnostics already surface this gap in `/admin`.

### Verification: runtime entitlements and settings billing center

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe billing integration foundation

- Added Stripe SDK integration and shared billing helpers in `src/lib/stripe-billing.ts` for customer creation, subscription reconciliation, event idempotency, and local subscription upserts.
- Added user-facing Stripe routes: `POST /api/billing/checkout`, `POST /api/billing/portal`, and `POST /api/billing/webhook/stripe`.
- `/settings` billing center now exposes Stripe-aware CTAs for checkout and subscription management when runtime env is ready, and shows configuration warnings when Stripe env is incomplete.
- `/api/admin/stats` and `AdminHealthDashboard` now surface readiness for Stripe checkout, Stripe portal, and Stripe webhook configuration alongside the existing observability diagnostics.
- Added admin reconcile route `POST /api/admin/users/[id]/billing/reconcile` so a root admin can force local subscription state to match Stripe after manual provider changes.
- Added SQL migration `20260310121500_stripe_provider_customer.sql` and applied it to remote Supabase project `nactzaxrjzsdkyfqwecf`.
- Remaining external dependency for this slice is production Stripe env rollout: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PREMIUM_MONTHLY_PRICE_ID`.

### Verification: Stripe billing integration foundation

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe admin UX and live billing refresh

- Fixed a real settings bug in `SettingsBillingCenter`: `GET/POST /api/settings/billing` now return both billing snapshot and live access state, so refresh/update flows no longer leave subscription-feature cards stale until a full page reload.
- Added root-admin Stripe reconcile action to `AdminUserActions`, so billing operators can trigger provider-to-local sync from the user card instead of relying on direct API calls only.
- Extended `/api/admin/users/[id]` and `AdminUserDetail` with Stripe-specific references: latest `provider_customer_id`, latest `provider_subscription_id`, and `provider_event_id` visibility inside the subscription timeline.
- Manual reconcile now also writes `admin_reconcile_stripe_subscription` into `admin_audit_logs`, so billing corrections remain visible in the super-admin audit trail.

### Verification: Stripe admin UX and live billing refresh

- `npm run lint`
- `npm run build`
- `npm run typecheck`

### Stripe return flow and in-product billing CTA

- `SettingsBillingCenter` now handles `?billing=success|canceled|portal_return` on `/settings`, clears the query state after handling, and performs a live refresh so the user sees current subscription access instead of stale cards after returning from Stripe.
- Added direct `Открыть billing center` links from blocked AI surfaces: `AiChatPanel`, `AiProposalStudio`, and `NutritionPhotoAnalysis`, so mobile users can move from a paywall state straight into `/settings#billing-center`.
- Added `id="billing-center"` to the settings billing section so those deep links land on the right surface in the PWA.
- `GET/POST /api/settings/billing` now act as a combined refresh endpoint for both timeline snapshot data and runtime feature access.

### Verification: Stripe return flow and in-product billing CTA

- `npm run lint`
- `npm run typecheck`
- `npm run build` could not be re-run on the default `.next` because the local `next dev` process is active, and a separate env-driven build directory run hung after manifest generation.

### Direct Stripe checkout return reconcile

- `POST /api/billing/checkout/reconcile` now lets the signed-in user reconcile a just-completed Stripe checkout session by `session_id` immediately after returning from Stripe, without waiting for webhook timing.
- Checkout success URLs now include `session_id={CHECKOUT_SESSION_ID}`, so `/settings` can perform direct provider reconciliation on successful return.
- `SettingsBillingCenter` now prefers the direct reconcile route on `billing=success&session_id=...`; plain refresh remains the fallback for cancel and portal-return flows.
- Added best-effort audit logging for `user_reconciled_stripe_checkout_return` so self-service billing recovery is visible to operators.

### Verification: direct Stripe checkout return reconcile

- `npm run lint`
- `npm run typecheck`

### Stripe checkout return status banner

- `SettingsBillingCenter` now keeps a local `checkoutReturn` state and renders a dedicated banner for checkout return outcomes instead of only showing a generic success notice.
- Success returns now show whether the Stripe session has already been reconciled into a local subscription or is still waiting for confirmation.
- If the checkout session exists but local subscription state is not confirmed yet, the user gets a direct `Проверить Stripe ещё раз` retry action in `/settings`.
- Portal and canceled return flows now also show explicit status messaging inside the billing center instead of silently falling back to a generic refresh.

### Verification: Stripe checkout return status banner

- `npm run lint`
- `npm run typecheck`
- Separate compile-build in an alternative `distDir` was attempted again but hung and was stopped manually; default `npm run build` is still blocked by the active local `next dev` process using `.next`.

### Primary super-admin root policy and admin shell refresh

- Added migration `20260310164000_primary_super_admin_root_policy.sql` and applied it to remote Supabase project `nactzaxrjzsdkyfqwecf`.
- The migration now enforces `corvetik1@yandex.ru` as the only `super_admin`: it upserts the matching `platform_admins` row, demotes any other `super_admin` rows to `support_admin`, writes `primary_super_admin_enforced` into `admin_audit_logs`, and creates a partial unique index for `role = 'super_admin'`.
- Verified against the linked remote project that `corvetik1@yandex.ru` exists in `auth.users`, has a `platform_admins` row, and is the only current `super_admin`.
- Reworked the public landing page `/` into a cleaner product-first PWA entry screen with lighter copy, clearer CTAs, and a more professional mobile-first composition.
- Reworked `/admin` into a wider, less compressed control-center layout with a root summary hero, KPI strip, health dashboard, operations inbox, user-management entry point, AI ops, admin roster, audit stream, and product-signal panels.
- Expanded the global app shell width to `max-w-[1500px]` so admin and settings surfaces have more usable room on desktop without changing the mobile PWA rhythm.

### Verification: root-admin policy and landing/admin shell

- `npx supabase db push --linked --include-all`
- `npx eslint src/app/page.tsx src/app/admin/page.tsx src/components/app-shell.tsx`
- `npm run typecheck`
- `cmd /c "set NEXT_DIST_DIR=.next_codex_root_admin_ui&& npm run build"`

### Login-first app shell and PWA icon polish

- `/` is now the real entry point of the product: signed-out users see a compact Russian auth screen with `AuthForm`, while signed-in users are redirected straight to `/dashboard` or `/onboarding`.
- `/auth` now collapses into the same entry flow by redirecting back to `/`, and unauthenticated protected routes now also return to `/` instead of a separate auth surface.
- The shared `AppShell` now uses a fixed, collapsible top bar with persisted local state, which gives the mobile PWA more vertical space and keeps the navigation behavior consistent between phone and desktop.
- Reworked `/dashboard`, `/workouts`, `/nutrition`, `/settings`, and the main admin wrappers so they read like product screens in Russian rather than technical internal checklists.
- Fixed the broken PWA icon pipeline: `public/icon.svg` now closes correctly, generated real `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`, and updated metadata/manifest to use PNG icons so install surfaces stop warning about invalid images.
- Browser verification on local `http://127.0.0.1:3000/` confirmed the new root auth screen, and both `/dashboard` and `/auth` now redirect back to the unified root login flow when no session exists.

### Verification: login-first shell and PWA polish

- `npx eslint src/app/page.tsx src/app/auth/page.tsx src/app/dashboard/page.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx src/app/settings/page.tsx src/app/admin/page.tsx src/app/admin/users/page.tsx src/components/auth-form.tsx src/components/app-shell.tsx src/components/app-shell-frame.tsx src/components/app-shell-nav.tsx src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/layout.tsx src/app/manifest.ts src/lib/viewer.ts`
- `npm run typecheck`
- `npm run build`
- Playwright manual verification on `http://127.0.0.1:3000/`, `/dashboard`, and `/auth`

### Admin UX language cleanup

- Continued the product polish pass for the super-admin workflow so admin surfaces read like a finished product instead of an internal console.
- `AdminUsersDirectory` now uses more product-facing Russian labels for user queue, paid risk, bulk actions, subscription summaries, and footer state chips.
- Bulk-action history and controls now present Russian labels instead of enum-like phrases, including clearer success/error notices and queue wording.
- `AdminUserDetail` now uses more user-facing Russian copy for support actions, export/deletion history, subscription history, Stripe references, and admin audit sections.
- The admin detail page now describes billing/access state, opened features, and manual actions in a calmer product tone rather than mixed English/internal wording.

### Verification: admin UX language cleanup

- `npx eslint src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx src/app/admin/page.tsx src/app/admin/users/page.tsx src/app/admin/users/[id]/page.tsx`
- `npm run typecheck`
- `npm run build`

### AI, billing, and workout product copy cleanup

- Reworked `/ai` so the page reads like a user-facing AI workspace in Russian instead of a mixed internal billing/debug panel.
- Simplified the access wording in `/ai`: subscription state, provider, feature availability, and usage reset copy now use product language rather than raw `Provider / Active / reset` labels.
- Cleaned `/settings` billing center copy around checkout return, payment status, feature access review, and access history so the screen feels like a real billing section rather than Stripe/session diagnostics.
- Reduced technical wording inside the workout day session: local save state, reconnect notices, pending changes, and send actions now speak about device saving and sending changes instead of snapshots/queues/sync internals.

### Verification: AI/billing/workout polish

- `npx eslint src/app/ai/page.tsx src/components/settings-billing-center.tsx src/components/workout-day-session.tsx src/components/admin-users-directory.tsx src/components/admin-user-detail.tsx`
- `npm run build`
- `npm run typecheck` (rerun after build because `.next/types` is still occasionally flaky on the first pass)

### AI widget, privileged access, and dashboard drilldown

- Added privileged billing/runtime access for the primary super-admin email `corvetik1@yandex.ru`: runtime billing access now reports `source = privileged`, all AI features stay open, and the AI/settings surfaces render product copy for root access instead of ordinary subscription wording.
- Switched AI runtime defaults to `google/gemini-3.1-pro-preview` for chat and `voyage/voyage-3-large` for embeddings.
- Enriched AI planning context with recent workout and nutrition signals, then extracted shared proposal-generation helpers so workout-plan and meal-plan routes, plus the new assistant route, all use the same context-aware generation path.
- Added a new streaming assistant route at `/api/ai/assistant` with tool-based plan generation, optional internet lookup, knowledge retrieval, and one-click proposal apply support.
- Mounted a floating AI widget into the app shell: it opens a modal chat, supports streaming responses, internet on/off, quick prompts, and direct proposal application back into the product.
- Tightened the collapsible shell so the fixed header now collapses into a much smaller top control row, preserving more vertical space on phone-sized screens.
- Rebuilt dashboard analytics into a more drillable product surface: clickable weekly workout bars, top exercises, recent workout sessions, clickable nutrition days, target deltas, body-weight signals, and an AI-readiness summary block that explains what the assistant is currently using.
- Fixed `AuthForm` to use a real `<form>` so the password field is semantically contained and Enter submission works correctly.
- Scoped Vercel Analytics and Speed Insights to actual Vercel runtime only, which removes local browser-console noise on self-hosted/local `next start` verification.

### Verification: assistant and dashboard product slice

- `npx eslint src/components/auth-form.tsx src/app/layout.tsx src/app/dashboard/page.tsx src/components/app-shell-frame.tsx src/components/ai-assistant-widget.tsx src/components/dashboard-workout-charts.tsx src/components/dashboard-nutrition-charts.tsx src/lib/dashboard/metrics.ts src/components/settings-billing-center.tsx`
- `npm run typecheck`
- `npm run build`
- Playwright CLI browser-check on fresh local `next start` for `/`: page opened successfully, registration toggle still works, and console log is clean (`0 errors, 0 warnings`) on the refreshed build.

### AI retrieval hardening, strict owner isolation, and live workspace check

- Rebuilt AI retrieval into a hybrid path: vector search first, then database text search, then app-side text ranking as a final fallback. This keeps historical workout/nutrition context available even when embeddings are temporarily unavailable.
- AI knowledge indexing now stores the full personal history across body metrics, nutrition summaries, meal logs, weekly programs, workout days, exercises, and sets. Reindex no longer hard-fails the whole feature when embeddings are unavailable; it can complete in text-only mode.
- Added database function `search_knowledge_chunks_text(...)` and applied remote migration `20260310200000_ai_text_search_and_force_rls.sql`.
- Tightened AI data isolation in Supabase: `knowledge_chunks`, `knowledge_embeddings`, `ai_chat_sessions`, `ai_chat_messages`, `ai_plan_proposals`, and `ai_safety_events` now all run with forced RLS, and knowledge select policies are owner-only.
- The streaming assistant route now surfaces a user-facing chat message when the upstream AI provider is unavailable instead of collapsing into a generic app error.
- Live browser verification on authenticated `/ai` confirmed the new behavior: `/api/ai/assistant` returns `200`, retrieval no longer crashes the route, and the chat now shows a clear “AI service temporarily unavailable” message when AI Gateway billing is not activated.

### Verification: AI retrieval hardening

- `npx eslint src/lib/ai/knowledge.ts src/app/api/ai/assistant/route.ts src/app/api/ai/reindex/route.ts`
- `npm run typecheck`
- Supabase MCP checks for AI-table RLS and policy state on project `nactzaxrjzsdkyfqwecf`
- Playwright live check on authenticated `http://127.0.0.1:3021/ai`

### Ragas benchmark workspace and admin suite routing

- Added a dedicated Python `ai-evals` workspace for Ragas-based quality checks, including a reusable runner, OpenRouter/Voyage provider adapters, dataset loaders, Supabase result persistence, and a CLI entrypoint at `ai-evals/run_ragas_eval.py`.
- Added first benchmark datasets for assistant QA, historical retrieval, meal plans, workout plans, safety red-team prompts, and tool-call accuracy under `ai-evals/datasets/`.
- Wired `/api/admin/ai-evals/run` and `/api/admin/ai-evals` to carry a typed `suite` value inside `ai_eval_runs.summary`, so queued runs can target a single suite or the full benchmark pack.
- Rebuilt the admin AI eval panel so root/analyst can choose a suite explicitly and see which suite each run belongs to, alongside quality-gate badges once the worker writes results back.
- Stored the user-provided OpenRouter and Voyage keys in ignored local env so the direct runtime and the new eval workspace share the same provider configuration without checking secrets into git.

### Verification: Ragas workspace foundation

- `ai-evals\.venv\Scripts\python ai-evals\run_ragas_eval.py --suite tool_calls --no-supabase`
- `npx eslint src/app/api/admin/ai-evals/run/route.ts src/app/api/admin/ai-evals/route.ts src/components/admin-ai-eval-runs.tsx src/lib/ai/eval-suites.ts`
- `npm run typecheck`

### OpenRouter/Voyage runtime completion without live spend

- Moved `meal-photo` off the old hardcoded AI Gateway `responses` fetch and onto the shared multimodal runtime layer, so photo analysis is now prepared to use the same OpenRouter-powered provider path as the rest of the AI product surface.
- Added a separate `vision` model slot to the runtime gateway config and exposed `OPENROUTER_VISION_MODEL` in env handling for future provider tuning without code changes.
- Rebuilt the legacy `/api/ai/chat` route to use the same sports-only guardrails, confidentiality policy, owner-only historical context, and provider error handling as the newer streaming assistant route.
- Kept all of this in a no-spend state: code paths, envs, and prompts are ready, but no live multimodal/provider calls were forced while credits are unavailable.

### Verification: provider-neutral runtime hardening

- `npx eslint src/app/api/ai/chat/route.ts src/app/api/ai/meal-photo/route.ts src/lib/ai/gateway.ts src/lib/env.ts`
- `npm run typecheck`
- `npm run build`

### Workout execution enrichment: body weight, RPE, rest, and set notes

- Extended workout execution capture so a completed day can now store `body_weight_kg` and `session_note`, while each set stores `actual_reps`, `actual_weight_kg`, `actual_rpe`, `rest_seconds`, and `set_note`.
- Updated the locked-program mutation guard so execution-only edits on locked plans still permit `body_weight_kg`, `session_note`, `actual_reps`, `actual_weight_kg`, `actual_rpe`, `rest_seconds`, and `set_note` without allowing structural changes.
- Rebuilt the workout day session UI to support all of the above with optimistic updates, offline queue persistence, and recovery of queued values after reconnect.
- Expanded workout analytics with tonnage, estimated 1RM, average working weight, recovery signals, average rest time, recent execution notes, and richer recent-session drilldown lines.
- Fed the new execution signals into AI context and knowledge retrieval so coaching answers and program generation can reason over historical load, intensity, rest behavior, body weight, and quality notes across the user's full archive.
- Applied remote migrations `20260311103000_workout_set_actual_weight.sql`, `20260311121500_workout_day_context_and_set_rpe.sql`, and `20260311134500_workout_set_rest_and_notes.sql` to the linked fit database via CLI fallback because the active Supabase MCP server is currently pointed at a different project.

### Verification: workout execution enrichment

- `npx eslint src/components/workout-day-session.tsx src/lib/workout/execution.ts src/app/api/workout-days/[id]/route.ts src/app/api/workout-sets/[id]/route.ts src/lib/offline/db.ts src/lib/offline/workout-sync.ts src/app/api/sync/push/route.ts src/lib/workout/workout-sets.ts src/lib/workout/weekly-programs.ts src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts src/lib/ai/knowledge.ts src/lib/dashboard/metrics.ts`
- `npm run typecheck`
- `npm run build`
- `npx supabase db push`
- `npx supabase migration list`

### Коуч-сигналы по прогрессии и восстановлению

- Добавлен общий слой `workout coaching signals`: теперь серверная аналитика считает не только сырые метрики, но и готовые сигналы по прогрессии нагрузки, восстановлению, регулярности и ключевому упражнению.
- Эти сигналы выведены в дашборд как отдельный coaching-блок с коротким выводом и следующим действием, чтобы пользователь видел уже интерпретацию своей истории, а не только графики тоннажа и RPE.
- AI-контекст пользователя и промпты генерации планов теперь получают те же коуч-сигналы, поэтому рекомендации и proposals могут опираться не только на набор чисел, но и на уже собранный вывод по темпу прогресса и риску перегруза.

### Проверка: коуч-сигналы

- `npx eslint src/lib/workout/coaching-signals.ts src/lib/dashboard/metrics.ts src/components/dashboard-workout-charts.tsx src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts`
- `npm run typecheck`
- `npm run build`

### Пищевые коуч-сигналы и nutrition analytics layer

- Добавлен отдельный nutrition coaching layer: теперь серверная аналитика считает готовые сигналы по дисциплине логирования, попаданию в калории, попаданию в белок и движению веса тела, а не только отдаёт сырые КБЖУ.
- Эти сигналы выведены в дашборде как отдельный actionable-блок по питанию, чтобы пользователь видел, что именно сейчас мешает прогрессу: редкие логи, системный перелёт по калориям, недобор белка или нейтральную/проблемную динамику веса.
- AI-контекст и промпты генерации планов теперь получают и пищевые коуч-сигналы, поэтому assistant и meal/workout proposals опираются уже не только на средние значения, но и на интерпретацию adherence по рациону.

### Проверка: nutrition coaching layer

- `npx eslint src/lib/nutrition/coaching-signals.ts src/lib/dashboard/metrics.ts src/components/dashboard-nutrition-charts.tsx src/lib/ai/user-context.ts src/lib/ai/domain-policy.ts src/lib/ai/plan-generation.ts`
- `npm run typecheck`
- `npm run build`

### 2026-03-12 11:31 - Русификация и упрощение админ-панели

- Полностью вычистил битую кодировку и смешанный английский из основных admin-экранов: обзорной панели, очередей операций, проверок ИИ, базы знаний, ролей, карточки пользователя и служебных действий.
- Заменил технические подписи на понятные управленческие формулировки: вместо сырых названий окружения, root/admin-жаргона и англоязычных очередей теперь используются простые русские названия разделов и состояний.
- Упростил admin health dashboard: в интерфейсе больше не светятся сырые ключи окружения и низкоуровневые ярлыки, пользователю показываются готовность сервисов, состояние оплат, очередей и базы знаний в человеческом виде.
- Вычистил верхний admin shell и каталог пользователей от смешанных ярлыков вроде `admin`, `root`, `UUID`, `billing` там, где это было видно в интерфейсе.

### Проверка: русификация админ-панели

- `npx eslint src/app/admin/page.tsx src/app/admin/users/page.tsx src/components/admin-health-dashboard.tsx src/components/admin-ai-eval-runs.tsx src/components/admin-ai-operations.tsx src/components/admin-operations-inbox.tsx src/components/admin-role-manager.tsx src/components/admin-user-actions.tsx src/components/admin-user-detail.tsx src/components/admin-users-directory.tsx src/components/app-shell-nav.tsx`
- `npm run typecheck`
- `npm run build`

### 2026-03-12 12:08 - Упрощение пустого состояния AI-чата

- Убрал из AI-чата лишние пояснения про автоматическое сохранение истории и специализацию ассистента, чтобы верхняя часть экрана не забирала место у переписки.
- Убрал длинный текст пустого состояния и отдельную кнопку `Открыть шаблоны запросов` из тела чата. Шаблоны остались доступны только через компактную иконку.
- Почистил те же подписи в плавающем AI-виджете, чтобы новый чат открывался без лишнего текста.

### Проверка: упрощение AI-чата

- `npx eslint src/components/ai-chat-panel.tsx src/components/ai-assistant-widget.tsx`
- `npm run typecheck`
- `npm run build`

### 2026-03-12 12:42 - Внутренние меню для тренировок и питания

- Внутри [страницы тренировок](/C:/fit/src/components/weekly-program-builder.tsx) конструктор теперь разбит на собственные вкладки: `Конструктор`, `Активная неделя`, `Шаблоны`, `История`. Это убрало длинную смешанную ленту внутри одного раздела.
- Внутри [страницы питания](/C:/fit/src/components/nutrition-tracker.tsx) журнал теперь тоже работает через внутреннее меню: `Баланс`, `Продукты`, `Лог дня`, `История`.
- Для мобильной PWA-версии обе страницы теперь открывают только один логический блок за раз, а переключение идёт через горизонтальное меню секций.

### Проверка: внутренние меню разделов

- `npx eslint src/components/weekly-program-builder.tsx src/components/nutrition-tracker.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 13:02 - Исправление гидрации мобильного меню

- Убрал hydration mismatch в [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx): mobile drawer через `portal` теперь подключается только после client mount через `useSyncExternalStore`, а не меняет дерево уже на первой гидрации.
- Это убирает recoverable error на страницах вроде `/admin/users`, где сервер не рендерил drawer-portal, а клиент пытался добавить его сразу.

### Проверка: гидрация mobile drawer

- `npx eslint src/components/app-shell-nav.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 13:34 - Чистые разделы в тренировках и питании

- Исправил битую кириллицу в общих разделах страниц и в экранах [тренировок](/C:/fit/src/app/workouts/page.tsx), [питания](/C:/fit/src/app/nutrition/page.tsx), [конструктора недели](/C:/fit/src/components/weekly-program-builder.tsx), [журнала питания](/C:/fit/src/components/nutrition-tracker.tsx) и [общего workspace](/C:/fit/src/components/page-workspace.tsx).
- Сократил верхние подписи разделов, чтобы на мобильной PWA сразу было видно активный блок, а не длинное пояснение.
- Для внутренних меню уменьшил ширину карточек на узких экранах, чтобы переключение между блоками выглядело аккуратнее.

### Проверка: русские разделы и мобильное меню

- `npx eslint src/components/page-workspace.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx src/components/weekly-program-builder.tsx src/components/nutrition-tracker.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 18:32 - Desktop-меню и мобильная укладка экранов

- Перестроил [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), чтобы компактная desktop-шапка больше не прятала меню целиком. Теперь даже в свернутом состоянии остаются название страницы, полное меню и кнопка разворота.
- Обновил [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx): для супер-админа в desktop-навигации теперь видны и `Админ`, и `Пользователи`, а не только часть маршрутов.
- Поджал [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) и [globals.css](/C:/fit/src/app/globals.css): бейджи не ломаются внутри строки, карточки не вылезают по ширине, а на мобильной версии разделы остаются в пределах экрана.
- Живую проверку прогнал через Playwright на `/workouts` и `/nutrition`: в desktop-режиме меню отображается полностью, а на ширине `390px` горизонтального вылеза страницы нет.

### Проверка: desktop-меню и мобильный layout

- `npx eslint src/components/app-shell-nav.tsx src/components/app-shell-frame.tsx src/components/page-workspace.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 19:20 - Скрытие блоков и полноэкранная тренировка в PWA

- Переписал [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx) на нормальный русский и добавил запоминаемое скрытие верхних блоков `Обзор` и `Меню`. Это уже работает для [Тренировок](/C:/fit/src/app/workouts/page.tsx) и [Питания](/C:/fit/src/app/nutrition/page.tsx).
- На [странице дня тренировки](/C:/fit/src/app/workouts/day/[dayId]/page.tsx) добавил `focus=1` режим: shell становится immersive, AI-виджет скрывается, а [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) показывает только компактную шапку тренировки и сами упражнения.
- В обычном мобильном режиме у текущей тренировки появилась кнопка `Развернуть на весь экран`, а в focus-режиме — `Обычный вид`, чтобы быстро возвращаться обратно в приложение.
- Живую проверку прогнал на мобильной ширине через Playwright: `/workouts` и `/nutrition` показывают новые controls для скрытия блоков, а `/workouts/day/[dayId]?focus=1` открывает уже компактный экран без лишнего контекста.

### Проверка: скрытие блоков и workout focus mode

- `npx eslint src/components/page-workspace.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx src/app/workouts/day/[dayId]/page.tsx src/components/workout-day-session.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-12 20:55 - Sync pull hotfix и сохранение таймера в locked day

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) убрал цикл автосинхронизации: `sync/pull` больше не привязан к меняющемуся cursor-state, добавлены bootstrap-guard, in-flight dedupe и throttling для фонового pull.
- На стороне БД добавил миграции [20260312211000_allow_locked_day_session_duration.sql](/C:/fit/supabase/migrations/20260312211000_allow_locked_day_session_duration.sql) и [20260312211500_lock_guard_search_path.sql](/C:/fit/supabase/migrations/20260312211500_lock_guard_search_path.sql), чтобы locked day разрешал обновлять `session_duration_seconds`, а trigger был с фиксированным `search_path`.
- Обновил [sw.js](/C:/fit/public/sw.js) до новой версии кеша, чтобы установленная PWA не держала старый бандл с уже исправленными workout-ошибками.
- Живая проверка через Playwright на `http://127.0.0.1:3062/workouts/day/609c0fce-af84-4701-a08d-2d5152a5177c?focus=1` показала один `GET /api/sync/pull` после открытия экрана без бесконечного повторения.

### Проверка: hotfix sync pull и locked timer

- `npx eslint src/components/workout-day-session.tsx public/sw.js`
- `npm run build`
- `npm run typecheck`
- `Playwright browser network requests`

### 2026-03-12 21:12 - Таймер с лимитом 2 часа и сохранением при завершении тренировки

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) таймер тренировки теперь хранит локально `startedAt` для конкретного дня, восстанавливается после повторного открытия приложения и продолжает считать время в реальном времени.
- Добавил жёсткий лимит `2 часа`: если таймер дошёл до лимита или пользователь вернулся позже, он автоматически сбрасывается в `0` и это значение сохраняется для дня тренировки.
- При нажатии `Завершить` экран теперь спрашивает, сохранять время тренировки или нет. Если пользователь подтверждает сохранение, `session_duration_seconds` прикрепляется к завершённой тренировке; если нет, день завершается с нулевым временем.

### 2026-03-13 00:15 - Упрощение тренировки: сохранение по упражнению и удаление rest/note

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) убрал поля `Отдых, сек` и `Заметка к подходу`, оставил только `Повторы`, `Вес, кг` и `RPE`.
- Сохранение теперь идёт один раз на всё упражнение: пока упражнение не сохранено, следующее не открывается, а кнопка `Завершить` не активируется.
- После сохранения упражнение закрывается от редактирования, но рядом появляется `Редактировать`, чтобы при необходимости открыть его снова.
- В аналитике и AI-контексте убрал зависимость от `rest_seconds` и `set_note`: обновлены [metrics.ts](/C:/fit/src/lib/dashboard/metrics.ts), [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts), [user-context.ts](/C:/fit/src/lib/ai/user-context.ts), [execution.ts](/C:/fit/src/lib/workout/execution.ts) и связанные API routes.
- Добавил и применил миграцию [20260312223210_drop_workout_set_rest_and_note.sql](/C:/fit/supabase/migrations/20260312223210_drop_workout_set_rest_and_note.sql), которая удаляет `rest_seconds` и `set_note` из `workout_sets` и обновляет lock guard для фиксированных недель.

### Проверка: сохранение по упражнению и drop rest/note

- `npx eslint src/components/workout-day-session.tsx src/lib/offline/db.ts src/lib/workout/execution.ts src/app/api/workout-sets/[id]/route.ts src/app/api/sync/push/route.ts src/lib/workout/workout-sets.ts src/lib/workout/weekly-programs.ts src/app/api/weekly-programs/route.ts src/app/api/weekly-programs/[id]/clone/route.ts src/lib/ai/proposal-actions.ts src/lib/ai/user-context.ts src/lib/ai/knowledge.ts src/lib/dashboard/metrics.ts`
- `npm run build`
- `npm run typecheck`
- `Supabase MCP: apply_migration + security advisors + performance advisors`

### 2026-03-13 01:05 - Полная валидация упражнения и чистый пошаговый экран тренировки

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) сохранение упражнения теперь доступно только после заполнения всех подходов: обязательны `Повторы`, `Вес` и `RPE` в каждом подходе.
- Следующий шаг тренировки не открывается, пока текущее упражнение не сохранено. В шаговой ленте завершённые упражнения помечаются зелёной галочкой и статусом `Сохранено`.
- Исправил прогресс-блок и тексты на экране тренировки: вместо битой кодировки и неясных счётчиков теперь показаны понятные подписи `Заполнено подходов` и `Сохранено упражнений`.

### Проверка: обязательные вес и RPE перед сохранением упражнения

- `npx eslint src/components/workout-day-session.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 01:32 - Все шаги тренировки видны сразу и текущий день сброшен

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) шаговая лента в focus-режиме теперь показывает все упражнения сразу. Будущие шаги видны заранее, но закрыты до сохранения предыдущего упражнения.
- Закрытые шаги помечаются отдельным статусом и замком, а завершённые — зелёной галочкой.
- Через Supabase MCP обнулил текущий день тренировки `609c0fce-af84-4701-a08d-2d5152a5177c`: статус возвращён в `planned`, таймер сброшен в `0`, заполненные подходы очищены до `0 из 8`.

### Проверка: видимость всех шагов и сброс текущего дня

- `npx eslint src/components/workout-day-session.tsx`
- `npm run build`
- `npm run typecheck`
- `Supabase MCP execute_sql: confirm workout day reset to 0 filled sets`

### 2026-03-13 09:12 - Кнопка полного сброса тренировки

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) добавил кнопку `Обнулить тренировку`: она очищает повторы, вес, RPE, статус дня, таймер, вес тела и заметку, после чего шаги снова начинаются с первого упражнения.
- Для reset-flow очистил локальную offline-очередь по дню через [workout-sync.ts](/C:/fit/src/lib/offline/workout-sync.ts), чтобы старые локальные изменения не возвращались поверх уже обнулённой тренировки.
- Добавил серверный reset endpoint [route.ts](/C:/fit/src/app/api/workout-days/[id]/reset/route.ts) и helper [execution.ts](/C:/fit/src/lib/workout/execution.ts), который сбрасывает `workout_sets.actual_*` и `workout_days` обратно в исходное состояние `planned`.

### Проверка: полный сброс тренировки

- `npx eslint src/components/workout-day-session.tsx src/lib/workout/execution.ts src/lib/offline/workout-sync.ts "src/app/api/workout-days/[id]/reset/route.ts"`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 09:18 - Упрощён текст предупреждения при сбросе тренировки

- В [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx) из confirm-окна для `Обнулить тренировку` убрал слово `заметки`, потому что на экране тренировки этого поля больше нет.

### 2026-03-13 09:34 - Развёл скрытие меню и скрытие раздела на внутренних страницах

- Полностью обновил [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx): теперь `Скрыть меню` скрывает только блок выбора разделов, а `Скрыть раздел` скрывает только содержимое текущего раздела.
- Добавил независимое сохранение трёх состояний `Обзор / Меню / Раздел` в `localStorage`, с обратной совместимостью для старого поля `sections`.
- Нормализовал тексты workspace-переключателей и мобильного меню, чтобы одинаковая логика работала на страницах `Тренировки`, `Питание` и других экранах, которые используют `PageWorkspace`.

### Проверка: скрытие меню и раздела отдельно

- `npx eslint src/components/page-workspace.tsx src/app/workouts/page.tsx src/app/nutrition/page.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 09:48 - Осветлил выделение активных разделов и табов

- В [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx), [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx), [weekly-program-builder.tsx](/C:/fit/src/components/weekly-program-builder.tsx) и [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx) сделал активные состояния заметными, но светлее: мягкий фон, спокойная тень и без тёмных плашек с белым текстом.
- Для выбранных пунктов меню и табов заменил тёмные иконки и чек-маркеры на светлые акцентные/зелёные варианты, чтобы текст читался лучше и на мобильной PWA, и на десктопе.

### Проверка: светлые active-состояния

- `npx eslint src/components/page-workspace.tsx src/components/dashboard-workspace.tsx src/components/weekly-program-builder.tsx src/components/nutrition-tracker.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 10:02 - Осветлил ещё и desktop-активные состояния

- В [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx) убрал тёмную заливку у активного пункта верхнего desktop-меню и перевёл его на светлое акцентное состояние.
- В [admin-ai-operations.tsx](/C:/fit/src/components/admin-ai-operations.tsx) осветлил toggle-кнопки режимов обновления.
- В [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx) сделал светлее активные табы карточки пользователя, чтобы десктопный интерфейс выглядел так же мягко, как обновлённые workspace-разделы.

### Проверка: desktop active-state hotfix

- `npx eslint src/components/app-shell-nav.tsx src/components/admin-ai-operations.tsx src/components/admin-user-detail.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 10:12 - Убрал последние тёмные action-кнопки

- В [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) осветлил кнопку `Открыть AI` в блоке разделов дашборда, чтобы она соответствовала общему светлому стилю интерфейса.
- В [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) осветлил активный переключатель `Вход / Регистрация`, чтобы в видимых пользовательских сценариях больше не оставалось тёмных капсул с белым текстом.

### Проверка: последние тёмные кнопки

- `npx eslint src/components/dashboard-workspace.tsx src/components/auth-form.tsx`
- `npm run build`
- `npm run typecheck`

### 2026-03-13 10:28 - Осветлил все primary-pill кнопки глобально

- В [globals.css](/C:/fit/src/app/globals.css) добавил глобальный светлый стиль для action-кнопок и ссылок с `bg-accent + text-white`, чтобы тёмные капсулы больше не оставались на дашборде, в AI, админке и остальных экранах.
- Локальные точечные осветления в [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) и [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) сохранены, но теперь визуальный результат закреплён на уровне общего UI-слоя.

### Проверка: глобальный светлый стиль кнопок

- `npm run build`
- `npm run typecheck`

### 2026-03-13 13:22 - Добавил подробное руководство пользователя

- Создан новый файл [USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md) с подробной пользовательской инструкцией: вход, онбординг, обзор, тренировки, питание, AI, история, настройки, PWA и офлайн-сценарии.
- В [README.md](/C:/fit/README.md) добавлена ссылка на новый гайд, чтобы его можно было быстро найти из корня репозитория.

### Проверка: документация пользователя

- Проверена актуальность маршрутов и разделов по текущим страницам `src/app`
- Проверен охват пользовательских сценариев по текущим компонентам `PageWorkspace`, `WorkoutDaySession`, `AiWorkspace`, `SettingsBillingCenter`

### 2026-03-13 13:41 - Добавил подробное техническое объяснение AI-слоя

- Создан новый файл [AI_EXPLAINED.md](/C:/fit/docs/AI_EXPLAINED.md) с подробным объяснением `RAG`, `CAG`, `KAG` и `Ragas`, а также полного пути AI-запроса внутри `fit`.
- В [README.md](/C:/fit/README.md) добавлена ссылка на новый AI-гайд, чтобы его можно было быстро открыть из корня репозитория.

### Проверка: AI-документация

- Сверены текущие runtime-файлы: `assistant/route.ts`, `domain-policy.ts`, `user-context.ts`, `knowledge.ts`, `gateway.ts`, `chat.ts`, `structured-knowledge.ts`, `proposal-actions.ts`
- Сверен eval-контур по `ai-evals/README.md` и `ai-evals/fit_eval/runner.py`

### 2026-03-13 14:03 - Добавил SVG motion demo для презентации приложения

- Создан файл [fit-demo-motion.svg](/C:/fit/public/fit-demo-motion.svg) как зацикленный демонстрационный ролик по приложению `fit`.
- Внутри анимированы 4 логических сцены: `Обзор`, `Тренировки`, `Питание`, `AI`.
- SVG сделан как самодостаточный промо-ролик под озвучку: мягкий фон, phone mockup, KPI-карточки, пошаговая тренировка, AI-разбор питания и AI-коуч.

### Проверка: SVG demo

- Проверен XML-парсинг SVG-файла
- Проверен доступ к файлу в `public/` как standalone demo asset
