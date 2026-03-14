"use client";

import { PRIMARY_SUPER_ADMIN_EMAIL } from "@/lib/admin-permissions";
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
    <div className="rounded-[30px] border border-border bg-white/72 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Массовые действия
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            Массовые действия по выбранным пользователям
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">Выбрано: {selectedUserCount}</span>
          <button
            className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
            onClick={onToggleVisibleSelection}
            type="button"
          >
            {allVisibleSelected ? "Снять видимые" : "Выбрать видимые"}
          </button>
          <button
            className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
            onClick={onClearSelection}
            type="button"
          >
            Очистить
          </button>
        </div>
      </div>

      {!canRunBulkActions ? (
        <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Массовые действия доступны только основному супер-админу{" "}
          {PRIMARY_SUPER_ADMIN_EMAIL}.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_220px_220px]">
        <label className="grid gap-2 text-sm text-muted">
          Действие
          <select
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
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
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            disabled={!canRunBulkActions || isBulkPending}
            onChange={(event) => onBulkReasonChange(event.target.value)}
            placeholder="Например: весенний триал или повторная синхронизация"
            type="text"
            value={bulkReason}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Дней доступа
          <input
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
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
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
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
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending}
              onChange={(event) => onBulkLimitValueChange(event.target.value)}
              placeholder="1000"
              type="number"
              value={bulkLimitValue}
            />
          </label>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canRunBulkActions || isBulkPending || !selectedUserCount}
          onClick={onSubmit}
          type="button"
        >
          {isBulkPending ? "Обработка..." : "Запустить действие"}
        </button>
        {bulkNotice ? (
          <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
    <div className="rounded-[30px] border border-border bg-white/72 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            История массовых действий
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            Последние групповые операции
          </h3>
        </div>
        <div className="pill">{recentBulkWaves.length}</div>
      </div>

      <div className="mt-4 grid gap-3">
        {recentBulkWaves.length ? (
          recentBulkWaves.map((wave) => (
            <article
              className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm"
              key={wave.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {formatBulkAction(wave.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Пакет: {wave.batch_id ?? "нет"} ·{" "}
                    {formatDateTime(wave.created_at)}
                  </p>
                  <p className="mt-1 text-muted">
                    Причина: {wave.reason ?? "без причины"}
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
            История массовых действий пока пуста.
          </p>
        )}
      </div>
    </div>
  );
}
