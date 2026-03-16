import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = "supabase/migrations/";
const MIGRATION_NAME_PATTERN = /^\d{14}_[a-z0-9_]+\.sql$/;
const REQUIRED_DOCS = ["docs/MASTER_PLAN.md", "docs/AI_WORKLOG.md"];

function readChangedFiles() {
  const changedFilesFile = process.env.MIGRATION_CHANGED_FILES_FILE?.trim();

  if (changedFilesFile) {
    if (!fs.existsSync(changedFilesFile)) {
      throw new Error(`Changed files list "${changedFilesFile}" was not found.`);
    }

    return fs
      .readFileSync(changedFilesFile, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const changedFilesValue = process.env.MIGRATION_CHANGED_FILES?.trim();

  if (changedFilesValue) {
    return changedFilesValue
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  throw new Error(
    "Changed files list is missing. Run scripts/verify-migrations.ps1 or provide MIGRATION_CHANGED_FILES_FILE.",
  );
}

function assertMigrationFiles(changedMigrations) {
  for (const migrationPath of changedMigrations) {
    const fileName = path.basename(migrationPath);

    if (!MIGRATION_NAME_PATTERN.test(fileName)) {
      throw new Error(
        `Migration "${migrationPath}" must match ${MIGRATION_NAME_PATTERN.toString()}.`,
      );
    }

    const absolutePath = path.join(process.cwd(), migrationPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Migration "${migrationPath}" must exist in the working tree.`);
    }

    const content = fs.readFileSync(absolutePath, "utf8").trim();

    if (!content) {
      throw new Error(`Migration "${migrationPath}" must not be empty.`);
    }
  }
}

function assertDocsTouched(changedFiles) {
  const missingDocs = REQUIRED_DOCS.filter((docPath) => !changedFiles.includes(docPath));

  if (missingDocs.length > 0) {
    throw new Error(
      `Migration changes require documentation updates in: ${missingDocs.join(", ")}.`,
    );
  }
}

function main() {
  const baseRef = process.env.MIGRATION_DIFF_BASE?.trim() || "working tree";
  const changedFiles = readChangedFiles();
  const changedMigrations = changedFiles.filter(
    (filePath) =>
      filePath.startsWith(MIGRATIONS_DIR) && filePath.toLowerCase().endsWith(".sql"),
  );

  if (changedMigrations.length === 0) {
    console.log(
      `[verify-migrations] No changed SQL migrations between ${baseRef} and the current workspace.`,
    );
    return;
  }

  assertMigrationFiles(changedMigrations);
  assertDocsTouched(changedFiles);

  console.log(
    `[verify-migrations] Verified ${changedMigrations.length} changed migration(s): ${changedMigrations.join(", ")}`,
  );
}

main();
