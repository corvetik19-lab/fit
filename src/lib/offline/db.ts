import Dexie, { type Table } from "dexie";

export interface OfflineMutation {
  id: string;
  entity: string;
  op: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  createdAt: string;
}

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
