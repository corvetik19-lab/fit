"use client";

import {
  formatBulkAction,
  formatDateTime,
  type BulkAction,
  type RecentBulkWave,
} from "@/components/admin-users-directory-model";

export function AdminUsersBulkActionsPanel({
  allVisibleSelected,
  bulkAction,
  bulkFeatureKey,
  bulkLimitValue,
  bulkNotice,
  bulkReason,
  bulkTrialDays,
  canRunBulkActions,
  isBulkPending,
  onBulkActionChange,
  onBulkFeatureKeyChange,
  onBulkLimitValueChange,
  onBulkReasonChange,
  onBulkTrialDaysChange,
  onClearSelection,
  onSubmit,
  onToggleVisibleSelection,
  selectedUserCount,
}: {
  allVisibleSelected: boolean;
  bulkAction: BulkAction;
  bulkFeatureKey: string;
  bulkLimitValue: string;
  bulkNotice: string | null;
  bulkReason: string;
  bulkTrialDays: string;
  canRunBulkActions: boolean;
  isBulkPending: boolean;
  onBulkActionChange: (value: BulkAction) => void;
  onBulkFeatureKeyChange: (value: string) => void;
  onBulkLimitValueChange: (value: string) => void;
  onBulkReasonChange: (value: string) => void;
  onBulkTrialDaysChange: (value: string) => void;
  onClearSelection: () => void;
  onSubmit: () => void;
  onToggleVisibleSelection: () => void;
  selectedUserCount: number;
}) {
  return (
    <div className="surface-panel surface-panel--accent p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Массовые действия
          </p>
          <h3 className="mt-3 text-xl font-bold">
            Запускай пакетные сценарии по выбранным пользователям
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">Выбрано: {selectedUserCount}</span>
          <button
            className="action-button action-button--secondary px-3 py-2 text-xs"
            onClick={onToggleVisibleSelection}
            type="button"
          >
            {allVisibleSelected ? "Снять видимые" : "Выбрать видимые"}
          </button>
          <button
            className="action-button action-button--secondary px-3 py-2 text-xs"
            onClick={onClearSelection}
            type="button"
          >
            Очистить
          </button>
        </div>
      </div>

      {!canRunBulkActions ? (
        <p className="mt-4 rounded-[1rem] border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-900">
          Массовые действия доступны только роли super-admin.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_220px_220px]">
        <label className="grid gap-2 text-sm text-muted">
          Действие
          <select
            className="rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,white)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            disabled={!canRunBulkActions || isBulkPending}
            onChange={(event) => onBulkActionChange(event.target.value as BulkAction)}
            value={bulkAction}
          >
            <option value="queue_export">Поставить выгрузку</option>
            <option value="queue_resync">Пересобрать контекст</option>
            <option value="queue_suspend">Ограничить аккаунт</option>
            <option value="grant_trial">Выдать пробный доступ</option>
            <option value="enable_entitlement">Открыть доступ к функции</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Причина
          <input
            className="rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,white)] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
            disabled={!canRunBulkActions || isBulkPending}
            onChange={(event) => onBulkReasonChange(event.target.value)}
            placeholder="Например: пробный доступ для тестовой группы"
            type="text"
            value={bulkReason}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Дней доступа
          <input
            className="rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,white)] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
            disabled={!canRunBulkActions || isBulkPending || bulkAction !== "grant_trial"}
            onChange={(event) => onBulkTrialDaysChange(event.target.value)}
            placeholder="14"
            type="number"
            value={bulkTrialDays}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Функция
          <input
            className="rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,white)] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
            disabled={
              !canRunBulkActions ||
              isBulkPending ||
              bulkAction !== "enable_entitlement"
            }
            onChange={(event) => onBulkFeatureKeyChange(event.target.value)}
            placeholder="Например: ai_chat"
            type="text"
            value={bulkFeatureKey}
          />
        </label>
      </div>

      {bulkAction === "enable_entitlement" ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
          <label className="grid gap-2 text-sm text-muted">
            Лимит
            <input
              className="rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,white)] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending}
              onChange={(event) => onBulkLimitValueChange(event.target.value)}
              placeholder="1000"
              type="number"
              value={bulkLimitValue}
            />
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="action-button action-button--primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canRunBulkActions || isBulkPending || !selectedUserCount}
          onClick={onSubmit}
          type="button"
        >
          {isBulkPending ? "Запускаю..." : "Запустить пакет"}
        </button>
        {bulkNotice ? (
          <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-900">
            {bulkNotice}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminUsersBulkHistoryPanel({
  recentBulkWaves,
}: {
  recentBulkWaves: RecentBulkWave[];
}) {
  return (
    <div className="surface-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            История пакетов
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            Последние массовые операции
          </h3>
        </div>
        <span className="pill">{recentBulkWaves.length}</span>
      </div>

      <div className="mt-4 grid gap-3">
        {recentBulkWaves.length ? (
          recentBulkWaves.map((wave) => (
            <article className="metric-tile px-3.5 py-3 text-sm" key={wave.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {formatBulkAction(wave.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Пакет: {wave.batch_id ?? "не указан"} ·{" "}
                    {formatDateTime(wave.created_at)}
                  </p>
                  <p className="mt-1 text-muted">
                    Причина: {wave.reason ?? "без пояснения"}
                  </p>
                </div>
                <div className="text-left text-sm text-muted sm:text-right">
                  <p className="font-semibold text-foreground">
                    {wave.succeeded}/{wave.processed}
                  </p>
                  <p className="mt-1">успешно / обработано</p>
                  <p className="mt-1">
                    ошибок: {wave.failed} · пользователей: {wave.user_count}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            История массовых действий пока пустая.
          </p>
        )}
      </div>
    </div>
  );
}
