"use client";

import type { ReactNode } from "react";

import { AdminRoleManager } from "@/components/admin-role-manager";
import { AdminUserActions } from "@/components/admin-user-actions";
import {
  fitnessLevelLabels,
  formatAuditAction,
  formatDateTime,
  formatSnakeLabel,
  formatStatus,
  formatSupportAction,
  getPayloadBoolean,
  getPayloadString,
  getPayloadStringList,
  getUserLabel,
  goalTypeLabels,
  renderList,
  sexLabels,
  type AdminUserDetailData,
  type PlatformAdminRole,
} from "@/components/admin-user-detail-model";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="text-muted">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </article>
  );
}

function KeyValueCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <p className="text-muted" key={row.label}>
            {row.label}: <span className="text-foreground">{row.value}</span>
          </p>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-7 text-muted">{children}</p>;
}

export function AdminUserProfileSection({
  canViewRoleDetails,
  currentAdminRole,
  currentUserEmail,
  currentUserId,
  detail,
  onUpdated,
  userId,
}: {
  canViewRoleDetails: boolean;
  currentAdminRole: PlatformAdminRole;
  currentUserEmail: string | null;
  currentUserId: string;
  detail: AdminUserDetailData;
  onUpdated: () => void;
  userId: string;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Профиль
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Основные данные и цели
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KeyValueCard
            title="Профиль"
            rows={[
              { label: "Email", value: detail.authUser?.email ?? "Нет данных" },
              {
                label: "Последний вход",
                value: formatDateTime(detail.authUser?.last_sign_in_at),
              },
              {
                label: "Создан",
                value: formatDateTime(detail.authUser?.created_at),
              },
              {
                label: "Профиль обновлен",
                value: formatDateTime(detail.profile?.updated_at),
              },
              {
                label: "Состояние аккаунта",
                value: detail.adminState?.is_suspended ? "Ограничен" : "Активен",
              },
            ]}
          />

          <KeyValueCard
            title="Цели"
            rows={[
              {
                label: "Тип цели",
                value: detail.latestGoal?.goal_type
                  ? goalTypeLabels[detail.latestGoal.goal_type] ??
                    detail.latestGoal.goal_type
                  : "Не заполнено",
              },
              {
                label: "Тренировок в неделю",
                value: String(
                  detail.latestGoal?.weekly_training_days ?? "Не заполнено",
                ),
              },
              {
                label: "Целевой вес",
                value:
                  detail.latestGoal?.target_weight_kg !== null &&
                  detail.latestGoal?.target_weight_kg !== undefined
                    ? `${detail.latestGoal.target_weight_kg} кг`
                    : "Не заполнено",
              },
            ]}
          />

          <KeyValueCard
            title="Онбординг"
            rows={[
              {
                label: "Возраст",
                value: String(detail.onboarding?.age ?? "Не заполнено"),
              },
              {
                label: "Пол",
                value: detail.onboarding?.sex
                  ? sexLabels[detail.onboarding.sex] ?? detail.onboarding.sex
                  : "Не заполнено",
              },
              {
                label: "Рост",
                value:
                  detail.onboarding?.height_cm !== null &&
                  detail.onboarding?.height_cm !== undefined
                    ? `${detail.onboarding.height_cm} см`
                    : "Не заполнено",
              },
              {
                label: "Вес",
                value:
                  detail.onboarding?.weight_kg !== null &&
                  detail.onboarding?.weight_kg !== undefined
                    ? `${detail.onboarding.weight_kg} кг`
                    : "Не заполнено",
              },
              {
                label: "Уровень",
                value: detail.onboarding?.fitness_level
                  ? fitnessLevelLabels[detail.onboarding.fitness_level] ??
                    detail.onboarding.fitness_level
                  : "Не заполнено",
              },
            ]}
          />

          <KeyValueCard
            title="Дополнительно"
            rows={[
              {
                label: "Оборудование",
                value: renderList(detail.onboarding?.equipment),
              },
              {
                label: "Ограничения",
                value: renderList(detail.onboarding?.injuries),
              },
              {
                label: "Питание",
                value: renderList(detail.onboarding?.dietary_preferences),
              },
            ]}
          />
        </div>
      </section>

      <div className="grid gap-6">
        {canViewRoleDetails ? (
          <AdminRoleManager
            currentAdminRole={currentAdminRole}
            currentUserEmail={currentUserEmail}
            isSelf={currentUserId === userId}
            onUpdated={onUpdated}
            targetAdminRole={detail.adminRole?.role as PlatformAdminRole | null}
            userEmail={detail.authUser?.email ?? null}
            userId={userId}
          />
        ) : null}

        <AdminUserActions
          currentAdminRole={currentAdminRole}
          currentUserEmail={currentUserEmail}
          onUpdated={onUpdated}
          userId={userId}
        />
      </div>
    </div>
  );
}

export function AdminUserActivitySection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Тренировки
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Статистика тренировок
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Активные упражнения", String(detail.stats.workout.activeExercises)],
              ["Шаблоны", String(detail.stats.workout.templates)],
              ["Программы", String(detail.stats.workout.programs)],
              ["Активные недели", String(detail.stats.workout.activePrograms)],
              ["Завершенные дни", String(detail.stats.workout.completedDays)],
              ["Дни в процессе", String(detail.stats.workout.inProgressDays)],
              ["Сохраненные подходы", String(detail.stats.workout.loggedSets)],
              [
                "Последняя активность",
                formatDateTime(detail.stats.workout.latestWorkoutAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Питание
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Статистика питания
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Продукты", String(detail.stats.nutrition.foods)],
              ["Приемы пищи", String(detail.stats.nutrition.meals)],
              ["Позиции в приемах", String(detail.stats.nutrition.mealItems)],
              ["Рецепты", String(detail.stats.nutrition.recipes)],
              ["Шаблоны питания", String(detail.stats.nutrition.templates)],
              ["Сводки по дням", String(detail.stats.nutrition.summaryDays)],
              [
                "Последний прием пищи",
                formatDateTime(detail.stats.nutrition.latestMealAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              ИИ
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              ИИ и база знаний
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Диалоги", String(detail.stats.ai.chatSessions)],
              ["Сообщения", String(detail.stats.ai.chatMessages)],
              ["Планы", String(detail.stats.ai.proposals)],
              ["События безопасности", String(detail.stats.ai.safetyEvents)],
              ["Сохраненные сводки", String(detail.stats.ai.contextSnapshots)],
              ["Фрагменты базы", String(detail.stats.ai.knowledgeChunks)],
              [
                "Последняя активность ИИ",
                formatDateTime(detail.stats.ai.latestAiAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Жизненный цикл
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Данные, оплата и жизненный цикл
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Измерения тела", String(detail.stats.lifecycle.bodyMetrics)],
              ["Выгрузки", String(detail.stats.lifecycle.exportJobs)],
              ["Удаления", String(detail.stats.lifecycle.deletionRequests)],
              ["Подписки", String(detail.stats.lifecycle.subscriptions)],
              ["Доступы", String(detail.stats.lifecycle.entitlements)],
              [
                "Счетчики использования",
                String(detail.stats.lifecycle.usageCounters),
              ],
              [
                "Последнее обновление профиля",
                formatDateTime(detail.stats.lifecycle.latestProfileUpdateAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function AdminUserOperationsSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <>
      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Операции
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Очереди, выгрузки и ручные действия
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid gap-4">
            <KeyValueCard
              title="Текущая выгрузка"
              rows={[
                {
                  label: "Статус",
                  value: formatStatus(detail.stats.lifecycle.latestExportJob?.status),
                },
                {
                  label: "Формат",
                  value: detail.stats.lifecycle.latestExportJob?.format ?? "Нет данных",
                },
                {
                  label: "Кто запросил",
                  value: getUserLabel(
                    detail.stats.lifecycle.latestExportJob?.requested_by_user ?? null,
                    detail.stats.lifecycle.latestExportJob?.requested_by ?? null,
                  ),
                },
                {
                  label: "Обновлен",
                  value: formatDateTime(
                    detail.stats.lifecycle.latestExportJob?.updated_at,
                  ),
                },
              ]}
            />

            <KeyValueCard
              title="Текущий запрос на удаление"
              rows={[
                {
                  label: "Статус",
                  value: formatStatus(detail.stats.lifecycle.deletionRequest?.status),
                },
                {
                  label: "Удержание до",
                  value: formatDateTime(
                    detail.stats.lifecycle.deletionRequest?.hold_until,
                  ),
                },
                {
                  label: "Последний оператор",
                  value: getUserLabel(
                    detail.stats.lifecycle.deletionRequest?.requested_by_user ?? null,
                    detail.stats.lifecycle.deletionRequest?.requested_by ?? null,
                  ),
                },
                {
                  label: "Обновлен",
                  value: formatDateTime(
                    detail.stats.lifecycle.deletionRequest?.updated_at,
                  ),
                },
              ]}
            />
          </div>

          <article className="rounded-3xl border border-border bg-white/60 p-4 text-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">История выгрузок</p>
                <p className="mt-1 text-xs text-muted">
                  Последние выгрузки и их текущий статус
                </p>
              </div>
              <div className="pill">{detail.recentExportJobs.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentExportJobs.length ? (
                detail.recentExportJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                    key={job.id}
                  >
                    <p className="font-medium text-foreground">
                      {job.format} · {formatStatus(job.status)}
                    </p>
                    <p className="mt-1 text-muted">
                      Запросил:{" "}
                      <span className="text-foreground">
                        {getUserLabel(job.requested_by_user, job.requested_by)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Создан:{" "}
                      <span className="text-foreground">
                        {formatDateTime(job.created_at)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Обновлен:{" "}
                      <span className="text-foreground">
                        {formatDateTime(job.updated_at)}
                      </span>
                    </p>
                    {job.artifact_path ? (
                      <p className="mt-1 break-all text-muted">
                        Файл: <span className="text-foreground">{job.artifact_path}</span>
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState>Экспортов по этому пользователю пока не было.</EmptyState>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/60 p-4 text-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  История служебных действий
                </p>
                <p className="mt-1 text-xs text-muted">
                  Очередь, решения и комментарии по ручным действиям
                </p>
              </div>
              <div className="pill">{detail.recentSupportActions.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentSupportActions.length ? (
                detail.recentSupportActions.map((action) => {
                  const resolutionNote = getPayloadString(
                    action.payload,
                    "resolutionNote",
                  );
                  const resolvedAt = getPayloadString(action.payload, "resolvedAt");

                  return (
                    <div
                      className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                      key={action.id}
                    >
                      <p className="font-medium text-foreground">
                        {formatSupportAction(action.action)}
                      </p>
                      <p className="mt-1 text-muted">
                        Статус:{" "}
                        <span className="text-foreground">
                          {formatStatus(action.status)}
                        </span>
                      </p>
                      <p className="mt-1 text-muted">
                        Инициатор:{" "}
                        <span className="text-foreground">
                          {getUserLabel(action.actor_user, action.actor_user_id)}
                        </span>
                      </p>
                      {action.resolved_by_user ? (
                        <p className="mt-1 text-muted">
                          Закрыл:{" "}
                          <span className="text-foreground">
                            {getUserLabel(action.resolved_by_user)}
                          </span>
                        </p>
                      ) : null}
                      {resolutionNote ? (
                        <p className="mt-1 text-muted">
                          Комментарий:{" "}
                          <span className="text-foreground">{resolutionNote}</span>
                        </p>
                      ) : null}
                      <p className="mt-1 text-muted">
                        Создан:{" "}
                        <span className="text-foreground">
                          {formatDateTime(action.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 text-muted">
                        Обновлен:{" "}
                        <span className="text-foreground">
                          {formatDateTime(action.updated_at)}
                        </span>
                      </p>
                      {resolvedAt ? (
                        <p className="mt-1 text-muted">
                          Решено:{" "}
                          <span className="text-foreground">
                            {formatDateTime(resolvedAt)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <EmptyState>
                  Для этого пользователя пока не запускались служебные действия.
                </EmptyState>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              История операций
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Выгрузка данных и удаление аккаунта
            </h2>
          </div>
          <div className="pill">{detail.recentOperationAuditLogs.length}</div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {detail.recentOperationAuditLogs.length ? (
            detail.recentOperationAuditLogs.map((entry) => {
              const fromStatus = getPayloadString(entry.payload, "fromStatus");
              const toStatus = getPayloadString(entry.payload, "toStatus");
              const holdUntil = getPayloadString(entry.payload, "holdUntil");
              const format = getPayloadString(entry.payload, "format");
              const note = getPayloadString(entry.payload, "note");

              return (
                <article
                  className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                  key={entry.id}
                >
                  <p className="font-semibold text-foreground">
                    {formatAuditAction(entry.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Оператор:{" "}
                    <span className="text-foreground">
                      {getUserLabel(entry.actor_user, entry.actor_user_id)}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    Когда:{" "}
                    <span className="text-foreground">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </p>
                  {fromStatus || toStatus ? (
                    <p className="mt-1 text-muted">
                      Переход:{" "}
                      <span className="text-foreground">
                        {formatStatus(fromStatus)} → {formatStatus(toStatus)}
                      </span>
                    </p>
                  ) : null}
                  {format ? (
                    <p className="mt-1 text-muted">
                      Формат: <span className="text-foreground">{format}</span>
                    </p>
                  ) : null}
                  {holdUntil ? (
                    <p className="mt-1 text-muted">
                      Удержание до:{" "}
                      <span className="text-foreground">
                        {formatDateTime(holdUntil)}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-muted">
                    Причина:{" "}
                    <span className="text-foreground">
                      {entry.reason ?? "Без пояснения"}
                    </span>
                  </p>
                  {note ? (
                    <p className="mt-1 text-muted">
                      Комментарий: <span className="text-foreground">{note}</span>
                    </p>
                  ) : null}
                </article>
              );
            })
          ) : (
            <EmptyState>
              История выгрузок и удаления для этого пользователя пока пуста.
            </EmptyState>
          )}
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Аудит
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Последние административные изменения
            </h2>
          </div>
          <div className="pill">{detail.recentAdminAuditLogs.length}</div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {detail.recentAdminAuditLogs.length ? (
            detail.recentAdminAuditLogs.map((entry) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                key={entry.id}
              >
                <p className="font-semibold text-foreground">
                  {formatAuditAction(entry.action)}
                </p>
                <p className="mt-1 text-muted">
                  Оператор:{" "}
                  <span className="text-foreground">
                    {getUserLabel(entry.actor_user, entry.actor_user_id)}
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  Причина:{" "}
                  <span className="text-foreground">
                    {entry.reason ?? "Без пояснения"}
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  Когда:{" "}
                  <span className="text-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </p>
                {getPayloadStringList(entry.payload, "requestedFeatures").length ? (
                  <p className="mt-1 text-muted">
                    Запрошенные функции:{" "}
                    <span className="text-foreground">
                      {getPayloadStringList(entry.payload, "requestedFeatures")
                        .map(formatSnakeLabel)
                        .join(", ")}
                    </span>
                  </p>
                ) : null}
                {getPayloadString(entry.payload, "paymentStatus") ? (
                  <p className="mt-1 text-muted">
                    Статус оплаты:{" "}
                    <span className="text-foreground">
                      {getPayloadString(entry.payload, "paymentStatus")}
                    </span>
                  </p>
                ) : null}
                {getPayloadString(entry.payload, "sessionStatus") ? (
                  <p className="mt-1 text-muted">
                    Статус сессии:{" "}
                    <span className="text-foreground">
                      {getPayloadString(entry.payload, "sessionStatus")}
                    </span>
                  </p>
                ) : null}
                {getPayloadBoolean(entry.payload, "reconciled") !== null ? (
                  <p className="mt-1 text-muted">
                    Синхронизировано:{" "}
                    <span className="text-foreground">
                      {getPayloadBoolean(entry.payload, "reconciled")
                        ? "да"
                        : "нет"}
                    </span>
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState>
              Для этого пользователя пока нет административных изменений и смен
              ролей.
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}

export function AdminUserBillingSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <section className="card p-6">
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Оплата и доступ
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Подписка, лимиты и история доступа
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KeyValueCard
          title="Текущая подписка"
          rows={[
            {
              label: "Статус",
              value: formatStatus(detail.stats.lifecycle.latestSubscription?.status),
            },
            {
              label: "Провайдер",
              value: detail.stats.lifecycle.latestSubscription?.provider ?? "Нет данных",
            },
            {
              label: "Период до",
              value: formatDateTime(
                detail.stats.lifecycle.latestSubscription?.current_period_end,
              ),
            },
            {
              label: "Обновлено",
              value: formatDateTime(detail.stats.lifecycle.latestSubscription?.updated_at),
            },
          ]}
        />

        <KeyValueCard
          title="Платежный профиль"
          rows={[
            {
              label: "Клиент",
              value:
                detail.stats.lifecycle.latestSubscription?.provider_customer_id ??
                "Нет данных",
            },
            {
              label: "Подписка",
              value:
                detail.stats.lifecycle.latestSubscription?.provider_subscription_id ??
                "Нет данных",
            },
            {
              label: "Период с",
              value: formatDateTime(
                detail.stats.lifecycle.latestSubscription?.current_period_start,
              ),
            },
            {
              label: "Способ оплаты",
              value:
                detail.stats.lifecycle.latestSubscription?.provider === "stripe"
                  ? "Stripe"
                  : detail.stats.lifecycle.latestSubscription?.provider ??
                    "Нет данных",
            },
          ]}
        />

        <KeyValueCard
          title="Доступ и счетчики"
          rows={[
            {
              label: "Доступы",
              value: String(detail.stats.lifecycle.entitlements),
            },
            {
              label: "Счетчики использования",
              value: String(detail.stats.lifecycle.usageCounters),
            },
            {
              label: "Выгрузки",
              value: String(detail.stats.lifecycle.exportJobs),
            },
            {
              label: "Удаления",
              value: String(detail.stats.lifecycle.deletionRequests),
            },
          ]}
        />

        <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm md:col-span-2">
          <p className="font-semibold text-foreground">Открытые функции</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {detail.stats.lifecycle.recentEntitlements.length ? (
              detail.stats.lifecycle.recentEntitlements.map((entitlement) => (
                <div
                  className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                  key={entitlement.id}
                >
                  <p className="font-medium text-foreground">
                    {entitlement.feature_key}
                  </p>
                  <p className="mt-1 text-muted">
                    Статус:{" "}
                    <span className="text-foreground">
                      {entitlement.is_enabled ? "включено" : "выключено"}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    Лимит:{" "}
                    <span className="text-foreground">
                      {entitlement.limit_value ?? "без лимита"}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    Обновлено:{" "}
                    <span className="text-foreground">
                      {formatDateTime(entitlement.updated_at)}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>Для этого пользователя пока нет настроенных доступов.</EmptyState>
            )}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
          <p className="font-semibold text-foreground">Счетчики использования</p>
          <div className="mt-3 grid gap-3">
            {detail.stats.lifecycle.recentUsageCounters.length ? (
              detail.stats.lifecycle.recentUsageCounters.map((counter) => (
                <div
                  className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                  key={counter.id}
                >
                  <p className="font-medium text-foreground">
                    {counter.metric_key}
                  </p>
                  <p className="mt-1 text-muted">
                    Период:{" "}
                    <span className="text-foreground">{counter.metric_window}</span>
                  </p>
                  <p className="mt-1 text-muted">
                    Использовано:{" "}
                    <span className="text-foreground">{counter.usage_count}</span>
                  </p>
                  <p className="mt-1 text-muted">
                    Сброс:{" "}
                    <span className="text-foreground">
                      {formatDateTime(counter.reset_at)}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>Счетчики использования пока не созданы.</EmptyState>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
          <p className="font-semibold text-foreground">История подписки</p>
          <div className="mt-3 grid gap-3">
            {detail.stats.lifecycle.recentSubscriptionEvents.length ? (
              detail.stats.lifecycle.recentSubscriptionEvents.map((event) => (
                <div
                  className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                  key={event.id}
                >
                  <p className="font-medium text-foreground">
                    {formatSnakeLabel(event.event_type)}
                  </p>
                  <p className="mt-1 text-muted">
                    Когда:{" "}
                    <span className="text-foreground">
                      {formatDateTime(event.created_at)}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    Кто изменил:{" "}
                    <span className="text-foreground">
                      {getUserLabel(event.actor_user, event.actor_user_id)}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    Статус:{" "}
                    <span className="text-foreground">
                      {formatStatus(getPayloadString(event.payload, "status"))}
                    </span>
                  </p>
                  {getPayloadString(event.payload, "provider") ? (
                    <p className="mt-1 text-muted">
                      Провайдер:{" "}
                      <span className="text-foreground">
                        {getPayloadString(event.payload, "provider")}
                      </span>
                    </p>
                  ) : null}
                  {getPayloadString(event.payload, "batchId") ? (
                    <p className="mt-1 text-muted">
                      Пакет:{" "}
                      <span className="text-foreground">
                        {getPayloadString(event.payload, "batchId")}
                      </span>
                    </p>
                  ) : null}
                  {getPayloadString(event.payload, "providerSubscriptionId") ? (
                    <p className="mt-1 break-all text-muted">
                      ID подписки:{" "}
                      <span className="text-foreground">
                        {getPayloadString(event.payload, "providerSubscriptionId")}
                      </span>
                    </p>
                  ) : null}
                  {getPayloadString(event.payload, "providerCustomerId") ? (
                    <p className="mt-1 break-all text-muted">
                      ID клиента:{" "}
                      <span className="text-foreground">
                        {getPayloadString(event.payload, "providerCustomerId")}
                      </span>
                    </p>
                  ) : null}
                  {event.provider_event_id ? (
                    <p className="mt-1 break-all text-muted">
                      ID события:{" "}
                      <span className="text-foreground">
                        {event.provider_event_id}
                      </span>
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState>События по подписке пока не зафиксированы.</EmptyState>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
