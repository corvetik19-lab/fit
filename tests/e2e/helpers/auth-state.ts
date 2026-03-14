import fs from "node:fs";
import path from "node:path";

type EmptyStorageState = {
  cookies: [];
  origins: [];
};

export const AUTH_STATE_DIR = path.join(process.cwd(), "playwright", ".auth");
export const USER_STORAGE_STATE_PATH = path.join(AUTH_STATE_DIR, "user.json");
export const ADMIN_STORAGE_STATE_PATH = path.join(AUTH_STATE_DIR, "admin.json");

export function ensureAuthStateDir() {
  fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
}

export function writeEmptyStorageState(filePath: string) {
  const emptyState: EmptyStorageState = {
    cookies: [],
    origins: [],
  };

  ensureAuthStateDir();
  fs.writeFileSync(filePath, JSON.stringify(emptyState, null, 2));
}
