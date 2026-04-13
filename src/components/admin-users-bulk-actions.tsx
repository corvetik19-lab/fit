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
    <div className="rounded-[32px] bg-[#12131a] p-6 text-white shadow-[0_30px_80px_-50px_rgba(0,0,0,0.58)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
            Массовые действия
          </p>
          <h3 className="mt-3 text-xl font-bold">
            Запускай пакетные сценарии по выбранным пользователям
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill border-white/15 bg-white/10 text-white">
            Выбрано: {selectedUserCount}
          </span>
          <button
            className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/12"
            onClick={onToggleVisibleSelection}
            type="button"
          >
            {allVisibleSelected ? "Снять видимые" : "Выбрать видимые"}
          </button>
          <button
            className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/12"
            onClick={onClearSelection}
            type="button"
          >
            Очистить
          </button>
        </div>
      </div>

      {!canRunBulkActions ? (
        <p className="mt-5 rounded-[24px] border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          Массовые действия доступны только закреплённому супер-админу{" "}
          {PRIMARY_SUPER_ADMIN_EMAIL}.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 lg:grid-cols-[220px_1fr_220px_220px]">
        <label className="grid gap-2 text-sm text-white/70">
          Действие
          <select
            className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
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

        <label className="grid gap-2 text-sm text-white/70">
          Причина
          <input
            className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            disabled={!canRunBulkActions || isBulkPending}
            onChange={(event) => onBulkReasonChange(event.target.value)}
            placeholder="Например: пробный доступ для группы теста"
            type="text"
            value={bulkReason}
          />
        </label>

        <label className="grid gap-2 text-sm text-white/70">
          Дней доступа
          <input
            className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            disabled={!canRunBulkActions || isBulkPending || bulkAction !== "grant_trial"}
            onChange={(event) => onBulkTrialDaysChange(event.target.value)}
            placeholder="14"
            type="number"
            value={bulkTrialDays}
          />
        </label>

        <label className="grid gap-2 text-sm text-white/70">
          Функция
          <input
            className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
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
          <label className="grid gap-2 text-sm text-white/70">
            Лимит
            <input
              className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
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
          className="rounded-full bg-[#e53935] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canRunBulkActions || isBulkPending || !selectedUserCount}
          onClick={onSubmit}
          type="button"
        >
          {isBulkPending ? "Запускаю..." : "Запустить пакет"}
        </button>
        {bulkNotice ? (
          <p className="rounded-[22px] border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
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
    <div className="rounded-[32px] bg-white p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.22)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            История пакетов
          </p>
          <h3 className="mt-3 text-xl font-bold text-foreground">
            Последние массовые операции
          </h3>
        </div>
        <span className="pill">{recentBulkWaves.length}</span>
      </div>

      <div className="mt-5 grid gap-3">
        {recentBulkWaves.length ? (
          recentBulkWaves.map((wave) => (
            <article
              className="rounded-[24px] bg-[color-mix(in_srgb,var(--surface-container-low)_78%,white)] px-4 py-4 text-sm"
              key={wave.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {formatBulkAction(wave.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Пакет: {wave.batch_id ?? "не указан"} · {formatDateTime(wave.created_at)}
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
