import {
  offlineDb,
  type OfflineMutation,
  type WorkoutDayStatusOfflineMutation,
  type WorkoutSetActualRepsOfflineMutation,
} from "@/lib/offline/db";

function generateOfflineMutationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function replaceQueuedMutation(
  matcher: (mutation: OfflineMutation) => boolean,
  nextMutation: OfflineMutation,
) {
  const existingMutations = await offlineDb.mutationQueue.toArray();
  const duplicateIds = existingMutations
    .filter(matcher)
    .map((mutation) => mutation.id);

  await offlineDb.transaction("rw", offlineDb.mutationQueue, async () => {
    if (duplicateIds.length) {
      await offlineDb.mutationQueue.bulkDelete(duplicateIds);
    }

    await offlineDb.mutationQueue.put(nextMutation);
  });
}

export async function queueWorkoutDayStatusMutation(
  payload: WorkoutDayStatusOfflineMutation["payload"],
) {
  const mutation: WorkoutDayStatusOfflineMutation = {
    id: generateOfflineMutationId(),
    entity: "workout_day_status",
    op: "update",
    payload,
    createdAt: new Date().toISOString(),
  };

  await replaceQueuedMutation(
    (queued) =>
      queued.entity === "workout_day_status" &&
      queued.payload.dayId === payload.dayId,
    mutation,
  );

  return mutation;
}

export async function queueWorkoutSetActualRepsMutation(
  payload: WorkoutSetActualRepsOfflineMutation["payload"],
) {
  const mutation: WorkoutSetActualRepsOfflineMutation = {
    id: generateOfflineMutationId(),
    entity: "workout_set_actual_reps",
    op: "update",
    payload,
    createdAt: new Date().toISOString(),
  };

  await replaceQueuedMutation(
    (queued) =>
      queued.entity === "workout_set_actual_reps" &&
      queued.payload.setId === payload.setId,
    mutation,
  );

  return mutation;
}

export async function listQueuedWorkoutMutationsForDay(dayId: string) {
  const mutations = await offlineDb.mutationQueue.orderBy("createdAt").toArray();

  return mutations.filter((mutation) => mutation.payload.dayId === dayId);
}

export async function getPendingOfflineMutationCount() {
  return offlineDb.mutationQueue.count();
}

export async function flushOfflineMutations() {
  const mutations = await offlineDb.mutationQueue.orderBy("createdAt").toArray();

  if (!mutations.length) {
    return {
      applied: 0,
      rejected: 0,
      processed: [] as Array<{
        id: string;
        status: "applied" | "rejected";
        code?: string;
        message?: string;
      }>,
    };
  }

  const response = await fetch("/api/sync/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mutations,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: {
          applied?: number;
          rejected?: number;
          processed?: Array<{
            id: string;
            status: "applied" | "rejected";
            code?: string;
            message?: string;
          }>;
        };
        message?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Unable to flush offline mutations.");
  }

  const processed = payload?.data?.processed ?? [];
  const processedIds = processed.map((entry) => entry.id);

  if (processedIds.length) {
    await offlineDb.mutationQueue.bulkDelete(processedIds);
  }

  return {
    applied: payload?.data?.applied ?? 0,
    rejected: payload?.data?.rejected ?? 0,
    processed,
  };
}
