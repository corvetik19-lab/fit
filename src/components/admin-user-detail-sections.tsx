"use client";

import { AdminRoleManager } from "@/components/admin-role-manager";
import {
  AdminUserBillingSection as AdminUserBillingDetailsSection,
} from "@/components/admin-user-detail-billing";
import {
  AdminUserAdminAuditSection,
  AdminUserExportHistoryCard,
  AdminUserOperationAuditSection,
  AdminUserSupportActionsCard,
} from "@/components/admin-user-detail-operations";
import { AdminUserActions } from "@/components/admin-user-actions";
import {
  fitnessLevelLabels,
  formatDateTime,
  formatStatus,
  getUserLabel,
  goalTypeLabels,
  renderList,
  sexLabels,
  type AdminUserDetailData,
  type PlatformAdminRole,
} from "@/components/admin-user-detail-model";
import {
  KeyValueCard,
  MetricCard,
} from "@/components/admin-user-detail-primitives";

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
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="surface-panel p-4 sm:p-5">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Профиль
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-foreground">
            Основные данные и цели
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KeyValueCard
            rows={[
              {
                label: "Email",
                value: detail.authUser?.email ?? "Нет данных",
              },
              {
                label: "Последний вход",
                value: formatDateTime(detail.authUser?.last_sign_in_at),
              },
              {
                label: "Создан",
                value: formatDateTime(detail.authUser?.created_at),
              },
              {
                label: "Профиль обновлён",
                value: formatDateTime(detail.profile?.updated_at),
              },
              {
                label: "Состояние аккаунта",
                value: detail.adminState?.is_suspended ? "Ограничен" : "Активен",
              },
            ]}
            title="Профиль"
          />

          <KeyValueCard
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
            title="Цели"
          />

          <KeyValueCard
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
            title="Онбординг"
          />

          <KeyValueCard
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
            title="Дополнительно"
          />
        </div>
      </section>

      <div className="grid gap-4">
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
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Тренировки
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-foreground">
              Статистика тренировок
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Активные упражнения", String(detail.stats.workout.activeExercises)],
              ["Шаблоны", String(detail.stats.workout.templates)],
              ["Программы", String(detail.stats.workout.programs)],
              ["Активные недели", String(detail.stats.workout.activePrograms)],
              ["Завершённые дни", String(detail.stats.workout.completedDays)],
              ["Дни в процессе", String(detail.stats.workout.inProgressDays)],
              ["Сохранённые подходы", String(detail.stats.workout.loggedSets)],
              [
                "Последняя активность",
                formatDateTime(detail.stats.workout.latestWorkoutAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Питание
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-foreground">
              Статистика питания
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Продукты", String(detail.stats.nutrition.foods)],
              ["Приёмы пищи", String(detail.stats.nutrition.meals)],
              ["Позиции в приёмах", String(detail.stats.nutrition.mealItems)],
              ["Рецепты", String(detail.stats.nutrition.recipes)],
              ["Шаблоны питания", String(detail.stats.nutrition.templates)],
              ["Сводки по дням", String(detail.stats.nutrition.summaryDays)],
              [
                "Последний приём пищи",
                formatDateTime(detail.stats.nutrition.latestMealAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              ИИ
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-foreground">
              ИИ и база знаний
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Диалоги", String(detail.stats.ai.chatSessions)],
              ["Сообщения", String(detail.stats.ai.chatMessages)],
              ["Планы", String(detail.stats.ai.proposals)],
              ["События безопасности", String(detail.stats.ai.safetyEvents)],
              ["Контекстные снимки", String(detail.stats.ai.contextSnapshots)],
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

        <section className="surface-panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Жизненный цикл
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-foreground">
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
                "Счётчики использования",
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
      <section className="surface-panel p-4 sm:p-5">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Операции
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-foreground">
            Очереди, выгрузки и ручные действия
          </h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="grid gap-4">
            <KeyValueCard
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
                    detail.stats.lifecycle.latestExportJob?.requested_by_user ??
                      null,
                    detail.stats.lifecycle.latestExportJob?.requested_by ?? null,
                  ),
                },
                {
                  label: "Обновлено",
                  value: formatDateTime(
                    detail.stats.lifecycle.latestExportJob?.updated_at,
                  ),
                },
              ]}
              title="Текущая выгрузка"
            />

            <KeyValueCard
              rows={[
                {
                  label: "Статус",
                  value: formatStatus(
                    detail.stats.lifecycle.deletionRequest?.status,
                  ),
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
                    detail.stats.lifecycle.deletionRequest?.requested_by_user ??
                      null,
                    detail.stats.lifecycle.deletionRequest?.requested_by ?? null,
                  ),
                },
                {
                  label: "Обновлено",
                  value: formatDateTime(
                    detail.stats.lifecycle.deletionRequest?.updated_at,
                  ),
                },
              ]}
              title="Текущий запрос на удаление"
            />
          </div>

          <AdminUserExportHistoryCard detail={detail} />
          <AdminUserSupportActionsCard detail={detail} />
        </div>
      </section>

      <AdminUserOperationAuditSection detail={detail} />
      <AdminUserAdminAuditSection detail={detail} />
    </>
  );
}

export function AdminUserBillingSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return <AdminUserBillingDetailsSection detail={detail} />;
}
