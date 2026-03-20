import { logger } from "@/lib/logger";
import {
  PRIMARY_SUPER_ADMIN_GUARD_MESSAGE,
  assertUserIsNotPrimarySuperAdmin,
  getAuthUserById,
} from "@/lib/admin-target-guard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_EXPORT_LIMIT = 5;
const DEFAULT_DELETION_LIMIT = 5;
const DEFAULT_SUPPORT_LIMIT = 8;
const DEFAULT_DELETION_HOLD_DAYS = 14;

const PROCESSABLE_SUPPORT_ACTIONS = [
  "suspend_user",
  "restore_user",
  "resync_user_context",
  "purge_user_data",
] as const;

type QueueProcessingOptions = {
  actorUserId: string;
  deletionLimit?: number;
  exportLimit?: number;
  supportLimit?: number;
};

type JsonRecord = Record<string, unknown>;
type ProcessableSupportAction = (typeof PROCESSABLE_SUPPORT_ACTIONS)[number];
type SupportActionRow = {
  action: string;
  actor_user_id: string | null;
  id: string;
  payload: unknown;
  status: string;
  target_user_id: string | null;
};

const PURGE_MANIFEST_TABLES = [
  { column: "user_id", key: "profiles", table: "profiles" },
  { column: "user_id", key: "onboardingProfiles", table: "onboarding_profiles" },
  { column: "user_id", key: "goals", table: "goals" },
  { column: "user_id", key: "exerciseLibrary", table: "exercise_library" },
  { column: "user_id", key: "workoutTemplates", table: "workout_templates" },
  { column: "user_id", key: "weeklyPrograms", table: "weekly_programs" },
  { column: "user_id", key: "workoutDays", table: "workout_days" },
  { column: "user_id", key: "workoutExercises", table: "workout_exercises" },
  { column: "user_id", key: "workoutSets", table: "workout_sets" },
  { column: "user_id", key: "bodyMetrics", table: "body_metrics" },
  { column: "user_id", key: "nutritionProfiles", table: "nutrition_profiles" },
  { column: "user_id", key: "nutritionGoals", table: "nutrition_goals" },
  { column: "user_id", key: "foods", table: "foods" },
  { column: "user_id", key: "meals", table: "meals" },
  { column: "user_id", key: "mealItems", table: "meal_items" },
  { column: "user_id", key: "mealTemplates", table: "meal_templates" },
  { column: "user_id", key: "recipes", table: "recipes" },
  { column: "user_id", key: "recipeItems", table: "recipe_items" },
  {
    column: "user_id",
    key: "dailyNutritionSummaries",
    table: "daily_nutrition_summaries",
  },
  { column: "user_id", key: "dailyMetrics", table: "daily_metrics" },
  {
    column: "user_id",
    key: "periodMetricSnapshots",
    table: "period_metric_snapshots",
  },
  { column: "user_id", key: "aiChatSessions", table: "ai_chat_sessions" },
  { column: "user_id", key: "aiChatMessages", table: "ai_chat_messages" },
  { column: "user_id", key: "aiPlanProposals", table: "ai_plan_proposals" },
  { column: "user_id", key: "knowledgeChunks", table: "knowledge_chunks" },
  {
    column: "user_id",
    key: "knowledgeEmbeddings",
    table: "knowledge_embeddings",
  },
  { column: "user_id", key: "userMemoryFacts", table: "user_memory_facts" },
  {
    column: "user_id",
    key: "userContextSnapshots",
    table: "user_context_snapshots",
  },
  { column: "user_id", key: "subscriptions", table: "subscriptions" },
  {
    column: "user_id",
    key: "subscriptionEvents",
    table: "subscription_events",
  },
  { column: "user_id", key: "entitlements", table: "entitlements" },
  { column: "user_id", key: "usageCounters", table: "usage_counters" },
  { column: "user_id", key: "exportJobs", table: "export_jobs" },
  { column: "user_id", key: "deletionRequests", table: "deletion_requests" },
  { column: "user_id", key: "userAdminStates", table: "user_admin_states" },
  { column: "user_id", key: "platformAdmins", table: "platform_admins" },
  { column: "user_id", key: "aiSafetyEvents", table: "ai_safety_events" },
  {
    column: "target_user_id",
    key: "adminAuditLogs",
    table: "admin_audit_logs",
  },
  {
    column: "target_user_id",
    key: "supportActions",
    table: "support_actions",
  },
] as const;

type QueueProcessingSummary = {
  deletions: {
    failed: number;
    normalizedToHold: number;
    releasedToPurge: number;
    skippedActiveHold: number;
  };
  exports: {
    completed: number;
    failed: number;
    processingTransitions: number;
  };
  support: {
    completed: number;
    failed: number;
    purgeManifestsCreated: number;
    restored: number;
    skipped: number;
    snapshotsCreated: number;
    suspended: number;
  };
  supportActionsQueued: number;
};

function buildExportArtifactPath(userId: string, jobId: string) {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  return `admin-exports/${userId}/${jobId}/snapshot-${timestamp}.zip`;
}

function getDefaultHoldUntil() {
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + DEFAULT_DELETION_HOLD_DAYS);
  return holdUntil.toISOString();
}

function isPastDue(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  return new Date(value).getTime() <= Date.now();
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

async function insertAuditLog(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    action,
    actorUserId,
    payload,
    reason,
    targetUserId,
  }: {
    action: string;
    actorUserId: string;
    payload: JsonRecord;
    reason: string;
    targetUserId?: string | null;
  },
) {
  const { error } = await adminSupabase.from("admin_audit_logs").insert({
    action,
    actor_user_id: actorUserId,
    payload,
    reason,
    target_user_id: targetUserId ?? null,
  });

  if (error) {
    throw error;
  }
}

async function resolveAuditTargetUserId(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string | null,
) {
  if (!userId) {
    return null;
  }

  try {
    const authUser = await getAuthUserById(adminSupabase, userId);
    return authUser ? userId : null;
  } catch (error) {
    logger.warn("обработчик очереди не смог определить целевой user id для аудита", {
      error,
      userId,
    });
    return null;
  }
}

async function processExportJobs(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  actorUserId: string,
  exportLimit: number,
) {
  const summary: QueueProcessingSummary["exports"] = {
    completed: 0,
    failed: 0,
    processingTransitions: 0,
  };

  const { data: queuedJobs, error: queuedJobsError } = await adminSupabase
    .from("export_jobs")
    .select("id, user_id, status, format, updated_at")
    .eq("status", "queued")
    .order("updated_at", { ascending: true })
    .limit(exportLimit);

  if (queuedJobsError) {
    throw queuedJobsError;
  }

  for (const job of queuedJobs ?? []) {
    try {
      const { error: markProcessingError } = await adminSupabase
        .from("export_jobs")
        .update({
          status: "processing",
        })
        .eq("id", job.id);

      if (markProcessingError) {
        throw markProcessingError;
      }

      summary.processingTransitions += 1;

      await insertAuditLog(adminSupabase, {
        action: "export_job_status_updated",
        actorUserId,
        payload: {
          format: job.format,
          fromStatus: job.status,
          kind: "export_job",
          note: "автоматическая обработка очереди",
          processor: true,
          toStatus: "processing",
        },
        reason: "Очередь перевела задачу выгрузки данных в обработку",
        targetUserId: job.user_id,
      });

      const artifactPath = buildExportArtifactPath(job.user_id, job.id);

      const { error: markCompletedError } = await adminSupabase
        .from("export_jobs")
        .update({
          artifact_path: artifactPath,
          status: "completed",
        })
        .eq("id", job.id);

      if (markCompletedError) {
        throw markCompletedError;
      }

      await insertAuditLog(adminSupabase, {
        action: "export_job_status_updated",
        actorUserId,
        payload: {
          artifactPath,
          format: job.format,
          fromStatus: "processing",
          kind: "export_job",
          note: "автоматическая обработка очереди",
          processor: true,
          toStatus: "completed",
        },
        reason: "Очередь завершила выгрузку данных",
        targetUserId: job.user_id,
      });

      summary.completed += 1;
    } catch (error) {
      logger.error("обработчик очереди не смог завершить элемент выгрузки", {
        error,
        exportJobId: job.id,
        userId: job.user_id,
      });

      const { error: markFailedError } = await adminSupabase
        .from("export_jobs")
        .update({
          status: "failed",
        })
        .eq("id", job.id);

      if (!markFailedError) {
        await insertAuditLog(adminSupabase, {
          action: "export_job_status_updated",
          actorUserId,
          payload: {
            format: job.format,
            fromStatus: "processing",
            kind: "export_job",
            note: error instanceof Error ? error.message : "сбой обработчика очереди",
            processor: true,
            toStatus: "failed",
          },
          reason: "Очередь завершила выгрузку данных с ошибкой",
          targetUserId: job.user_id,
        }).catch((auditError) => {
          logger.error("обработчик очереди не смог записать аудит ошибки выгрузки", {
            auditError,
            exportJobId: job.id,
          });
        });
      }

      summary.failed += 1;
    }
  }

  return summary;
}

async function processDeletionRequests(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  actorUserId: string,
  deletionLimit: number,
) {
  const summary = {
    failed: 0,
    normalizedToHold: 0,
    releasedToPurge: 0,
    skippedActiveHold: 0,
    supportActionsQueued: 0,
  };

  const { data: requests, error: requestsError } = await adminSupabase
    .from("deletion_requests")
    .select("id, user_id, requested_by, status, hold_until, updated_at")
    .in("status", ["queued", "holding"])
    .order("updated_at", { ascending: true })
    .limit(deletionLimit);

  if (requestsError) {
    throw requestsError;
  }

  for (const request of requests ?? []) {
    try {
      if (request.status === "queued") {
        const holdUntil = request.hold_until ?? getDefaultHoldUntil();

        const { error: holdError } = await adminSupabase
          .from("deletion_requests")
          .update({
            hold_until: holdUntil,
            requested_by: actorUserId,
            status: "holding",
          })
          .eq("id", request.id);

        if (holdError) {
          throw holdError;
        }

        await insertAuditLog(adminSupabase, {
          action: "deletion_request_status_updated",
          actorUserId,
          payload: {
            fromStatus: "queued",
            holdUntil,
            kind: "deletion_request",
            note: "очередь перевела запрос в режим удержания",
            processor: true,
            toStatus: "holding",
          },
          reason: "Очередь перевела запрос на удаление в удержание",
          targetUserId: request.user_id,
        });

        summary.normalizedToHold += 1;
        continue;
      }

      if (!isPastDue(request.hold_until)) {
        summary.skippedActiveHold += 1;
        continue;
      }

      const { error: markCompletedError } = await adminSupabase
        .from("deletion_requests")
        .update({
          requested_by: actorUserId,
          status: "completed",
        })
        .eq("id", request.id);

      if (markCompletedError) {
        throw markCompletedError;
      }

      const { data: supportAction, error: supportActionError } = await adminSupabase
        .from("support_actions")
        .insert({
          action: "purge_user_data",
          actor_user_id: actorUserId,
          payload: {
            deletionRequestId: request.id,
            holdUntil: request.hold_until,
            processor: true,
            releasedAt: new Date().toISOString(),
          },
          status: "queued",
          target_user_id: request.user_id,
        })
        .select("id")
        .single();

      if (supportActionError) {
        const { error: rollbackError } = await adminSupabase
          .from("deletion_requests")
          .update({
            requested_by: request.requested_by,
            status: "holding",
          })
          .eq("id", request.id);

        if (rollbackError) {
          logger.error("обработчик очереди не смог откатить состояние запроса на удаление", {
            deletionRequestId: request.id,
            error: rollbackError,
          });
        }

        throw supportActionError;
      }

      await insertAuditLog(adminSupabase, {
        action: "deletion_request_status_updated",
        actorUserId,
        payload: {
          fromStatus: "holding",
          holdUntil: request.hold_until,
          kind: "deletion_request",
          note: "очередь выпустила запрос на удаление в очередь очистки",
          processor: true,
          supportActionId: supportAction.id,
          toStatus: "completed",
        },
        reason: "Очередь завершила удержание и отправила данные в очистку",
        targetUserId: request.user_id,
      });

      await insertAuditLog(adminSupabase, {
        action: "queue_deletion_purge_action",
        actorUserId,
        payload: {
          deletionRequestId: request.id,
          processor: true,
          supportActionId: supportAction.id,
        },
        reason: "Очередь поставила очистку данных пользователя в очередь поддержки",
        targetUserId: request.user_id,
      });

      summary.releasedToPurge += 1;
      summary.supportActionsQueued += 1;
    } catch (error) {
      logger.error("обработчик очереди не смог обработать элемент удаления данных", {
        deletionRequestId: request.id,
        error,
        userId: request.user_id,
      });
      summary.failed += 1;
    }
  }

  return summary;
}

async function buildAdminResyncSnapshot(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const [
    profileResult,
    onboardingResult,
    goalResult,
    programsCountResult,
    mealsCountResult,
    aiMessagesCountResult,
    adminStateResult,
  ] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("full_name, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("onboarding_profiles")
      .select(
        "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("goals")
      .select("goal_type, target_weight_kg, weekly_training_days, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("weekly_programs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("meals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("ai_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("user_admin_states")
      .select("is_suspended, suspended_at, restored_at, state_reason")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const failedResult = [
    profileResult,
    onboardingResult,
    goalResult,
    programsCountResult,
    mealsCountResult,
    aiMessagesCountResult,
    adminStateResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    adminState: adminStateResult.data ?? null,
    ai: {
      messages: aiMessagesCountResult.count ?? 0,
    },
    generatedAt: new Date().toISOString(),
    goal: goalResult.data ?? null,
    nutrition: {
      meals: mealsCountResult.count ?? 0,
    },
    profile: profileResult.data ?? null,
    programs: {
      total: programsCountResult.count ?? 0,
    },
    source: "admin_support_resync",
    userId,
    onboarding: onboardingResult.data ?? null,
  };
}

async function buildPurgeManifest(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const manifestResults = await Promise.all(
    PURGE_MANIFEST_TABLES.map(async ({ column, key, table }) => {
      const result = await adminSupabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, userId);

      if (result.error) {
        throw result.error;
      }

      return [key, result.count ?? 0] as const;
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    source: "admin_purge_manifest",
    tables: Object.fromEntries(manifestResults),
    userId,
  };
}

async function completeSupportAction(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    actorUserId,
    action,
    note,
    payloadExtras,
    targetUserIdOverride,
  }: {
    actorUserId: string;
    action: SupportActionRow;
    note: string;
    payloadExtras?: JsonRecord;
    targetUserIdOverride?: string | null;
  },
) {
  const currentPayload = asRecord(action.payload);
  const nextPayload: JsonRecord = {
    ...currentPayload,
    ...(payloadExtras ?? {}),
    processor: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: actorUserId,
    resolutionAction: "processor_completed",
    resolutionNote: note,
  };

  const { error: updateError } = await adminSupabase
    .from("support_actions")
    .update({
      payload: nextPayload,
      status: "completed",
    })
    .eq("id", action.id);

  if (updateError) {
    throw updateError;
  }

  await insertAuditLog(adminSupabase, {
    action: "support_action_status_updated",
    actorUserId,
    payload: {
      fromStatus: action.status,
      kind: "support_action",
      note,
      processor: true,
      supportAction: action.action,
      supportActionId: action.id,
      toStatus: "completed",
    },
    reason: note,
    targetUserId:
      targetUserIdOverride === undefined
        ? action.target_user_id
        : targetUserIdOverride,
  });
}

async function failSupportAction(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    action,
    actorUserId,
    errorMessage,
    targetUserIdOverride,
  }: {
    action: SupportActionRow;
    actorUserId: string;
    errorMessage: string;
    targetUserIdOverride?: string | null;
  },
) {
  const currentPayload = asRecord(action.payload);
  const { error: updateError } = await adminSupabase
    .from("support_actions")
    .update({
      payload: {
        ...currentPayload,
        processor: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: actorUserId,
        resolutionAction: "processor_failed",
        resolutionNote: errorMessage,
      },
      status: "failed",
    })
    .eq("id", action.id);

  if (updateError) {
    throw updateError;
  }

  await insertAuditLog(adminSupabase, {
    action: "support_action_status_updated",
    actorUserId,
    payload: {
      fromStatus: action.status,
      kind: "support_action",
      note: errorMessage,
      processor: true,
      supportAction: action.action,
      supportActionId: action.id,
      toStatus: "failed",
    },
    reason: errorMessage,
    targetUserId:
      targetUserIdOverride === undefined
        ? action.target_user_id
        : targetUserIdOverride,
  });
}

async function processSupportActions(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  actorUserId: string,
  supportLimit: number,
) {
  const summary: QueueProcessingSummary["support"] = {
    completed: 0,
    failed: 0,
    purgeManifestsCreated: 0,
    restored: 0,
    skipped: 0,
    snapshotsCreated: 0,
    suspended: 0,
  };

  const { data: queuedActions, error: queuedActionsError } = await adminSupabase
    .from("support_actions")
    .select("id, action, status, payload, target_user_id, actor_user_id, updated_at")
    .eq("status", "queued")
    .in("action", [...PROCESSABLE_SUPPORT_ACTIONS])
    .order("updated_at", { ascending: true })
    .limit(supportLimit);

  if (queuedActionsError) {
    throw queuedActionsError;
  }

  for (const action of queuedActions ?? []) {
    try {
      if (!action.target_user_id) {
        await failSupportAction(adminSupabase, {
          action,
          actorUserId,
          errorMessage:
            "Обработчик очереди не смог определить целевого пользователя для действия поддержки",
          targetUserIdOverride: null,
        });

        summary.failed += 1;
        continue;
      }

      switch (action.action as ProcessableSupportAction) {
        case "suspend_user": {
          const initiatedBy = action.actor_user_id ?? actorUserId;
          const currentPayload = asRecord(action.payload);
          const { error: suspendError } = await adminSupabase
            .from("user_admin_states")
            .upsert(
              {
                is_suspended: true,
                metadata: {
                  lastSupportActionId: action.id,
                  processor: true,
                  source: currentPayload.source ?? "admin_queue_processor",
                },
                restored_at: null,
                restored_by: null,
                state_reason: "Очередь поддержки применила блокировку пользователя",
                suspended_at: new Date().toISOString(),
                suspended_by: initiatedBy,
                user_id: action.target_user_id,
              },
              { onConflict: "user_id" },
            );

          if (suspendError) {
            throw suspendError;
          }

          await completeSupportAction(adminSupabase, {
            actorUserId,
            action,
            note: "Очередь применила состояние блокировки аккаунта",
            payloadExtras: {
              stateApplied: "suspended",
            },
          });

          summary.completed += 1;
          summary.suspended += 1;
          break;
        }
        case "restore_user": {
          const initiatedBy = action.actor_user_id ?? actorUserId;
          const currentPayload = asRecord(action.payload);
          const { error: restoreError } = await adminSupabase
            .from("user_admin_states")
            .upsert(
              {
                is_suspended: false,
                metadata: {
                  lastSupportActionId: action.id,
                  processor: true,
                  source: currentPayload.source ?? "admin_queue_processor",
                },
                restored_at: new Date().toISOString(),
                restored_by: initiatedBy,
                state_reason: "Очередь поддержки восстановила доступ пользователя",
                suspended_at: null,
                suspended_by: null,
                user_id: action.target_user_id,
              },
              { onConflict: "user_id" },
            );

          if (restoreError) {
            throw restoreError;
          }

          await completeSupportAction(adminSupabase, {
            actorUserId,
            action,
            note: "Очередь восстановила доступ к аккаунту",
            payloadExtras: {
              stateApplied: "active",
            },
          });

          summary.completed += 1;
          summary.restored += 1;
          break;
        }
        case "resync_user_context": {
          const snapshotPayload = await buildAdminResyncSnapshot(
            adminSupabase,
            action.target_user_id,
          );
          const { data: snapshot, error: snapshotError } = await adminSupabase
            .from("user_context_snapshots")
            .insert({
              payload: snapshotPayload,
              snapshot_reason: "admin_support_resync",
              user_id: action.target_user_id,
            })
            .select("id")
            .single();

          if (snapshotError) {
            throw snapshotError;
          }

          await completeSupportAction(adminSupabase, {
            actorUserId,
            action,
            note: "Очередь создала снимок для повторной синхронизации",
            payloadExtras: {
              snapshotId: snapshot.id,
              snapshotReason: "admin_support_resync",
            },
          });

          summary.completed += 1;
          summary.snapshotsCreated += 1;
          break;
        }
        case "purge_user_data": {
          const targetUser =
            await assertUserIsNotPrimarySuperAdmin(
              adminSupabase,
              action.target_user_id,
            );

          if (!targetUser) {
            await completeSupportAction(adminSupabase, {
              actorUserId,
              action,
              note: "Очередь обнаружила, что auth-пользователь уже удалён",
              payloadExtras: {
                deletedAuthUser: false,
                purgeMode: "already_deleted",
              },
              targetUserIdOverride: null,
            });

            summary.completed += 1;
            break;
          }

          const currentPayload = asRecord(action.payload);
          const manifest = await buildPurgeManifest(
            adminSupabase,
            action.target_user_id,
          );
          const manifestPayload = {
            ...manifest,
            targetEmail: targetUser.email ?? null,
          };

          const { error: preparePayloadError } = await adminSupabase
            .from("support_actions")
            .update({
              payload: {
                ...currentPayload,
                manifest: manifestPayload,
                processor: true,
                purgePreparedAt: new Date().toISOString(),
                targetEmail: targetUser.email ?? null,
              },
            })
            .eq("id", action.id);

          if (preparePayloadError) {
            throw preparePayloadError;
          }

          await insertAuditLog(adminSupabase, {
            action: "purge_user_data_started",
            actorUserId,
            payload: {
              deletedUserId: action.target_user_id,
              manifest: manifestPayload,
              processor: true,
              supportAction: action.action,
              supportActionId: action.id,
              targetEmail: targetUser.email ?? null,
            },
            reason: "Очередь запустила сценарий полной очистки данных",
            targetUserId: action.target_user_id,
          });

          const deleteResult = await adminSupabase.auth.admin.deleteUser(
            action.target_user_id,
            false,
          );

          if (deleteResult.error) {
            throw deleteResult.error;
          }

          const { error: markCompletedError } = await adminSupabase
            .from("support_actions")
            .update({
              payload: {
                ...currentPayload,
                deletedAuthUser: true,
                manifest: manifestPayload,
                processor: true,
                purgeMode: "hard_delete",
                purgedAt: new Date().toISOString(),
                resolutionAction: "processor_completed",
                resolutionNote: "Очередь выполнила сценарий полной очистки данных",
                resolvedAt: new Date().toISOString(),
                resolvedBy: actorUserId,
                targetEmail: targetUser.email ?? null,
              },
              status: "completed",
            })
            .eq("id", action.id);

          if (markCompletedError) {
            throw markCompletedError;
          }

          await insertAuditLog(adminSupabase, {
            action: "purge_user_data_executed",
            actorUserId,
            payload: {
              deletedAuthUser: true,
              deletedUserId: action.target_user_id,
              manifest: manifestPayload,
              processor: true,
              supportActionId: action.id,
              targetEmail: targetUser.email ?? null,
            },
            reason: "Очередь выполнила сценарий полной очистки данных",
            targetUserId: null,
          }).catch((auditError) => {
            logger.warn("обработчик очереди не смог записать аудит полной очистки данных", {
              auditError,
              supportActionId: action.id,
            });
          });

          summary.completed += 1;
          summary.purgeManifestsCreated += 1;
          break;
        }
        default:
          summary.skipped += 1;
          break;
      }
    } catch (error) {
      logger.error("обработчик очереди не смог обработать элемент очереди поддержки", {
        error,
        supportAction: action.action,
        supportActionId: action.id,
        userId: action.target_user_id,
      });

      const targetUserIdOverride =
        action.action === "purge_user_data" &&
        !(error instanceof Error && error.message === PRIMARY_SUPER_ADMIN_GUARD_MESSAGE)
          ? await resolveAuditTargetUserId(adminSupabase, action.target_user_id)
          : undefined;

      await failSupportAction(adminSupabase, {
        action,
        actorUserId,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Обработчик очереди завершил действие поддержки с ошибкой",
        targetUserIdOverride,
      }).catch((auditError) => {
        logger.error("обработчик очереди не смог отметить элемент поддержки как ошибочный", {
          auditError,
          supportActionId: action.id,
        });
      });

      summary.failed += 1;
    }
  }

  return summary;
}

export async function processAdminOperationQueues(
  options: QueueProcessingOptions,
): Promise<QueueProcessingSummary> {
  const adminSupabase = createAdminSupabaseClient();
  const exportLimit = options.exportLimit ?? DEFAULT_EXPORT_LIMIT;
  const deletionLimit = options.deletionLimit ?? DEFAULT_DELETION_LIMIT;
  const supportLimit = options.supportLimit ?? DEFAULT_SUPPORT_LIMIT;

  const [exportsSummary, deletionsSummary] = await Promise.all([
    processExportJobs(adminSupabase, options.actorUserId, exportLimit),
    processDeletionRequests(adminSupabase, options.actorUserId, deletionLimit),
  ]);
  const supportSummary = await processSupportActions(
    adminSupabase,
    options.actorUserId,
    supportLimit,
  );

  return {
    deletions: {
      failed: deletionsSummary.failed,
      normalizedToHold: deletionsSummary.normalizedToHold,
      releasedToPurge: deletionsSummary.releasedToPurge,
      skippedActiveHold: deletionsSummary.skippedActiveHold,
    },
    exports: exportsSummary,
    support: supportSummary,
    supportActionsQueued: deletionsSummary.supportActionsQueued,
  };
}
