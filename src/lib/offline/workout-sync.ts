import {
  offlineDb,
  type OfflineMutation,
  type WorkoutDayExecutionOfflineMutation,
  type WorkoutDayStatusOfflineMutation,
  type WorkoutSetActualRepsOfflineMutation,
} from "@/lib/offline/db";
import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";

const WORKOUT_DAY_CACHE_KEY_PREFIX = "workout-day:";
const OFFLINE_MUTATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OFFLINE_CACHE_SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

let flushPromise:
  | Promise<{
      applied: number;
      cleanedSnapshots: number;
      discardedStale: number;
      processed: Array<{
        id: string;
        status: "applied" | "rejected";
        code?: string;
        message?: string;
      }>;
      rejected: number;
    }>
  | null = null;

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

function getWorkoutMutationIdsForDay(
  mutations: OfflineMutation[],
  dayId: string,
) {
  return mutations
    .filter((mutation) => mutation.payload.dayId === dayId)
    .map((mutation) => mutation.id);
}

export async function queueWorkoutDayStatusMutation(
  payload: WorkoutDayStatusOfflineMutation["payload"],
) {
  return queueWorkoutDayExecutionMutation({
    dayId: payload.dayId,
    status: payload.status,
    bodyWeightKg: null,
    sessionNote: null,
    sessionDurationSeconds: null,
  });
}

export async function queueWorkoutDayExecutionMutation(
  payload: WorkoutDayExecutionOfflineMutation["payload"],
) {
  const mutation: WorkoutDayExecutionOfflineMutation = {
    id: generateOfflineMutationId(),
    entity: "workout_day_execution",
    op: "update",
    payload,
    createdAt: new Date().toISOString(),
  };

  await replaceQueuedMutation(
    (queued) =>
      (queued.entity === "workout_day_execution" ||
        queued.entity === "workout_day_status") &&
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

export async function clearQueuedWorkoutMutationsForDay(dayId: string) {
  const mutations = await offlineDb.mutationQueue.toArray();
  const mutationIds = getWorkoutMutationIdsForDay(mutations, dayId);

  if (mutationIds.length) {
    await offlineDb.mutationQueue.bulkDelete(mutationIds);
  }

  return mutationIds.length;
}

export async function getPendingOfflineMutationCount() {
  return offlineDb.mutationQueue.count();
}

function isOlderThan(
  value: string,
  maxAgeMs: number,
  nowTimestamp: number,
) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return nowTimestamp - timestamp > maxAgeMs;
}

export async function cleanupStaleOfflineState(options?: {
  mutationMaxAgeMs?: number;
  nowTimestamp?: number;
  snapshotMaxAgeMs?: number;
}) {
  const nowTimestamp = options?.nowTimestamp ?? Date.now();
  const mutationMaxAgeMs =
    options?.mutationMaxAgeMs ?? OFFLINE_MUTATION_MAX_AGE_MS;
  const snapshotMaxAgeMs =
    options?.snapshotMaxAgeMs ?? OFFLINE_CACHE_SNAPSHOT_MAX_AGE_MS;
  const [mutations, snapshots] = await Promise.all([
    offlineDb.mutationQueue.toArray(),
    offlineDb.cacheSnapshots.toArray(),
  ]);
  const staleMutationIds = mutations
    .filter((mutation) =>
      isOlderThan(mutation.createdAt, mutationMaxAgeMs, nowTimestamp),
    )
    .map((mutation) => mutation.id);
  const staleSnapshotKeys = snapshots
    .filter((snapshot) =>
      isOlderThan(snapshot.updatedAt, snapshotMaxAgeMs, nowTimestamp),
    )
    .map((snapshot) => snapshot.key);

  await offlineDb.transaction(
    "rw",
    offlineDb.mutationQueue,
    offlineDb.cacheSnapshots,
    async () => {
      if (staleMutationIds.length) {
        await offlineDb.mutationQueue.bulkDelete(staleMutationIds);
      }

      if (staleSnapshotKeys.length) {
        await offlineDb.cacheSnapshots.bulkDelete(staleSnapshotKeys);
      }
    },
  );

  return {
    cleanedSnapshots: staleSnapshotKeys.length,
    discardedStale: staleMutationIds.length,
  };
}

function getWorkoutDayCacheKey(dayId: string) {
  return `${WORKOUT_DAY_CACHE_KEY_PREFIX}${dayId}`;
}

export async function cacheWorkoutDaySnapshot(day: WorkoutDayDetail) {
  const updatedAt = new Date().toISOString();

  await offlineDb.cacheSnapshots.put({
    key: getWorkoutDayCacheKey(day.id),
    value: day as unknown as Record<string, unknown>,
    updatedAt,
  });

  return updatedAt;
}

export async function replaceWorkoutDayOfflineState(day: WorkoutDayDetail) {
  const updatedAt = new Date().toISOString();
  const snapshotKey = getWorkoutDayCacheKey(day.id);
  const mutations = await offlineDb.mutationQueue.toArray();
  const mutationIds = getWorkoutMutationIdsForDay(mutations, day.id);

  await offlineDb.transaction(
    "rw",
    offlineDb.mutationQueue,
    offlineDb.cacheSnapshots,
    async () => {
      if (mutationIds.length) {
        await offlineDb.mutationQueue.bulkDelete(mutationIds);
      }

      await offlineDb.cacheSnapshots.put({
        key: snapshotKey,
        value: day as unknown as Record<string, unknown>,
        updatedAt,
      });
    },
  );

  return {
    clearedMutations: mutationIds.length,
    updatedAt,
  };
}

export async function getCachedWorkoutDaySnapshot(dayId: string) {
  const snapshot = await offlineDb.cacheSnapshots.get(getWorkoutDayCacheKey(dayId));

  return {
    day: (snapshot?.value as WorkoutDayDetail | undefined) ?? null,
    updatedAt: snapshot?.updatedAt ?? null,
  };
}

export async function pullWorkoutDaySnapshot(
  dayId: string,
  cursor?: string | null,
) {
  const searchParams = new URLSearchParams({
    scope: "workout_day",
    dayId,
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  const response = await fetch(`/api/sync/pull?${searchParams.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: {
          cursor?: string | null;
          nextCursor?: string | null;
          snapshot?: WorkoutDayDetail | null;
        };
        message?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Unable to pull workout snapshot.");
  }

  const snapshot = payload?.data?.snapshot ?? null;
  let updatedAt: string | null = null;

  if (snapshot) {
    updatedAt = await cacheWorkoutDaySnapshot(snapshot);
  }

  return {
    cursor: payload?.data?.cursor ?? cursor ?? null,
    nextCursor: payload?.data?.nextCursor ?? null,
    snapshot,
    updatedAt,
  };
}

export async function flushOfflineMutations() {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    const cleanup = await cleanupStaleOfflineState();
    const mutations = await offlineDb.mutationQueue.orderBy("createdAt").toArray();

    if (!mutations.length) {
      return {
        applied: 0,
        cleanedSnapshots: cleanup.cleanedSnapshots,
        discardedStale: cleanup.discardedStale,
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
      cleanedSnapshots: cleanup.cleanedSnapshots,
      discardedStale: cleanup.discardedStale,
      rejected: payload?.data?.rejected ?? 0,
      processed,
    };
  })();

  try {
    return await flushPromise;
  } finally {
    flushPromise = null;
  }
}
