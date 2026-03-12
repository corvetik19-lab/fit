import Dexie, { type Table } from "dexie";

export type WorkoutDayStatusOfflineMutation = {
  id: string;
  entity: "workout_day_status";
  op: "update";
  payload: {
    dayId: string;
    status: "planned" | "in_progress" | "done";
  };
  createdAt: string;
};

export type WorkoutDayExecutionOfflineMutation = {
  id: string;
  entity: "workout_day_execution";
  op: "update";
  payload: {
    dayId: string;
    status: "planned" | "in_progress" | "done";
    bodyWeightKg: number | null;
    sessionNote: string | null;
  };
  createdAt: string;
};

export type WorkoutSetActualRepsOfflineMutation = {
  id: string;
  entity: "workout_set_actual_reps";
  op: "update";
  payload: {
    dayId: string;
    setId: string;
    actualReps: number | null;
    actualWeightKg: number | null;
    actualRpe: number | null;
    restSeconds: number | null;
    setNote: string | null;
  };
  createdAt: string;
};

export type OfflineMutation =
  | WorkoutDayStatusOfflineMutation
  | WorkoutDayExecutionOfflineMutation
  | WorkoutSetActualRepsOfflineMutation;

export interface CacheSnapshot {
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

export class FitOfflineDatabase extends Dexie {
  mutationQueue!: Table<OfflineMutation, string>;
  cacheSnapshots!: Table<CacheSnapshot, string>;

  constructor() {
    super("fit-offline");

    this.version(1).stores({
      mutationQueue: "id, entity, createdAt",
      cacheSnapshots: "key, updatedAt",
    });
  }
}

export const offlineDb = new FitOfflineDatabase();
