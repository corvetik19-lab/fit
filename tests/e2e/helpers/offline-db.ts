import type { Page } from "@playwright/test";

type OfflineWorkoutMutation = {
  createdAt: string;
  entity: string;
  id: string;
  op: string;
  payload: {
    actualReps?: number | null;
    actualRpe?: number | null;
    actualWeightKg?: number | null;
    bodyWeightKg?: number | null;
    dayId: string;
    sessionDurationSeconds?: number | null;
    sessionNote?: string | null;
    setId?: string;
    status?: string;
  };
};

type OfflineWorkoutSnapshot = Record<string, unknown>;

type ReadWorkoutDayOfflineStateResult = {
  queuedMutations: OfflineWorkoutMutation[];
  snapshot: OfflineWorkoutSnapshot | null;
};

export async function seedWorkoutDayOfflineState(
  page: Page,
  input: {
    dayId: string;
    mutations: OfflineWorkoutMutation[];
    snapshot: OfflineWorkoutSnapshot;
  },
) {
  return page.evaluate(async ({ dayId, mutations, snapshot }) => {
    function openDb() {
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open("fit-offline");
        

        request.onupgradeneeded = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains("mutationQueue")) {
            db.createObjectStore("mutationQueue", { keyPath: "id" });
          }

          if (!db.objectStoreNames.contains("cacheSnapshots")) {
            db.createObjectStore("cacheSnapshots", { keyPath: "key" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    const db = await openDb();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        ["mutationQueue", "cacheSnapshots"],
        "readwrite",
      );
      const mutationStore = transaction.objectStore("mutationQueue");
      const snapshotStore = transaction.objectStore("cacheSnapshots");
      const getAllRequest = mutationStore.getAll();

      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => {
        const existingMutations = (getAllRequest.result ?? []) as OfflineWorkoutMutation[];

        for (const mutation of existingMutations) {
          if (mutation?.payload?.dayId === dayId) {
            mutationStore.delete(mutation.id);
          }
        }

        snapshotStore.put({
          key: `workout-day:${dayId}`,
          updatedAt: new Date().toISOString(),
          value: snapshot,
        });

        for (const mutation of mutations) {
          mutationStore.put(mutation);
        }
      };

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }, input);
}

export async function readWorkoutDayOfflineState(page: Page, dayId: string) {
  return page.evaluate(
    async ({ dayId }) => {
      function openDb() {
        return new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open("fit-offline");

          request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("mutationQueue")) {
              db.createObjectStore("mutationQueue", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("cacheSnapshots")) {
              db.createObjectStore("cacheSnapshots", { keyPath: "key" });
            }
          };

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }

      const db = await openDb();

      const result = await new Promise<ReadWorkoutDayOfflineStateResult>(
        (resolve, reject) => {
          const transaction = db.transaction(
            ["mutationQueue", "cacheSnapshots"],
            "readonly",
          );
          const mutationStore = transaction.objectStore("mutationQueue");
          const snapshotStore = transaction.objectStore("cacheSnapshots");
          const getAllRequest = mutationStore.getAll();
          const snapshotRequest = snapshotStore.get(`workout-day:${dayId}`);

          let queuedMutations: OfflineWorkoutMutation[] = [];
          let snapshot: OfflineWorkoutSnapshot | null = null;

          getAllRequest.onerror = () => reject(getAllRequest.error);
          snapshotRequest.onerror = () => reject(snapshotRequest.error);

          getAllRequest.onsuccess = () => {
            const existingMutations =
              (getAllRequest.result ?? []) as OfflineWorkoutMutation[];
            queuedMutations = existingMutations.filter(
              (mutation) => mutation?.payload?.dayId === dayId,
            );
          };

          snapshotRequest.onsuccess = () => {
            snapshot =
              ((snapshotRequest.result as { value?: OfflineWorkoutSnapshot } | undefined)
                ?.value ?? null) as OfflineWorkoutSnapshot | null;
          };

          transaction.oncomplete = () => {
            db.close();
            resolve({
              queuedMutations,
              snapshot,
            });
          };
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        },
      );

      return result;
    },
    { dayId },
  );
}
