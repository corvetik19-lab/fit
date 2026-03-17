import fs from "node:fs";

const MIGRATIONS_DIR = "supabase/migrations/";
const DEFAULT_FAIL_LEVELS = new Set(["ERROR", "WARN"]);
const DEFAULT_ALLOWLIST = new Set(["auth_leaked_password_protection"]);

function parseDelimitedEnv(value) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[,\r\n]+/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

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
    "Changed files list is missing. Run scripts/verify-advisors.ps1 or provide MIGRATION_CHANGED_FILES_FILE.",
  );
}

function hasChangedMigrations(changedFiles) {
  return changedFiles.some(
    (filePath) =>
      filePath.startsWith(MIGRATIONS_DIR) && filePath.toLowerCase().endsWith(".sql"),
  );
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to verify Supabase advisors.`);
  }

  return value;
}

async function fetchAdvisorSet({ accessToken, projectRef, type }) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/advisors/${type}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase ${type} advisors request failed with ${response.status}: ${body || response.statusText}`,
    );
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.lints)) {
    return payload.lints;
  }

  if (Array.isArray(payload?.result?.lints)) {
    return payload.result.lints;
  }

  throw new Error(`Supabase ${type} advisors returned an unexpected payload shape.`);
}

function summarizeByLevel(items) {
  return items.reduce((accumulator, item) => {
    const level = String(item.level ?? "UNKNOWN").toUpperCase();
    accumulator[level] = (accumulator[level] ?? 0) + 1;
    return accumulator;
  }, {});
}

function isAllowlisted(item, allowlist) {
  return (
    allowlist.has(String(item.cache_key ?? "").trim()) ||
    allowlist.has(String(item.name ?? "").trim())
  );
}

function formatFinding(item, type) {
  const cacheKey = item.cache_key ? ` (${item.cache_key})` : "";
  const title = item.title ?? item.name ?? "Unknown advisor finding";
  const detail = item.detail ?? item.description ?? "No detail provided.";
  return `[${type}/${item.level}] ${title}${cacheKey}: ${detail}`;
}

async function main() {
  const baseRef = process.env.MIGRATION_DIFF_BASE?.trim() || "working tree";
  const changedFiles = readChangedFiles();

  if (!hasChangedMigrations(changedFiles)) {
    console.log(
      `[verify-advisors] No changed SQL migrations between ${baseRef} and the current workspace.`,
    );
    return;
  }

  const accessToken = getRequiredEnv("SUPABASE_ACCESS_TOKEN");
  const projectRef = getRequiredEnv("SUPABASE_PROJECT_REF");
  const failLevels = new Set(
    parseDelimitedEnv(process.env.SUPABASE_ADVISOR_FAIL_LEVELS).map((level) =>
      level.toUpperCase(),
    ),
  );
  const effectiveFailLevels = failLevels.size > 0 ? failLevels : DEFAULT_FAIL_LEVELS;
  const allowlist = new Set([
    ...DEFAULT_ALLOWLIST,
    ...parseDelimitedEnv(process.env.SUPABASE_ADVISOR_ALLOWLIST),
  ]);

  const [securityFindings, performanceFindings] = await Promise.all([
    fetchAdvisorSet({ accessToken, projectRef, type: "security" }),
    fetchAdvisorSet({ accessToken, projectRef, type: "performance" }),
  ]);

  const actionableFindings = [
    ...securityFindings
      .filter((item) => effectiveFailLevels.has(String(item.level ?? "").toUpperCase()))
      .filter((item) => !isAllowlisted(item, allowlist))
      .map((item) => formatFinding(item, "security")),
    ...performanceFindings
      .filter((item) => effectiveFailLevels.has(String(item.level ?? "").toUpperCase()))
      .filter((item) => !isAllowlisted(item, allowlist))
      .map((item) => formatFinding(item, "performance")),
  ];

  const suppressedFindings = [
    ...securityFindings.filter((item) => isAllowlisted(item, allowlist)).map((item) => ({
      type: "security",
      item,
    })),
    ...performanceFindings.filter((item) => isAllowlisted(item, allowlist)).map((item) => ({
      type: "performance",
      item,
    })),
  ];

  console.log(
    `[verify-advisors] security=${JSON.stringify(summarizeByLevel(securityFindings))} performance=${JSON.stringify(summarizeByLevel(performanceFindings))}`,
  );

  if (suppressedFindings.length > 0) {
    console.log(
      `[verify-advisors] Suppressed baseline findings: ${suppressedFindings
        .map(({ item, type }) => `${type}:${item.cache_key ?? item.name}`)
        .join(", ")}`,
    );
  }

  if (actionableFindings.length > 0) {
    throw new Error(
      `Supabase advisor verification failed:\n${actionableFindings.join("\n")}`,
    );
  }

  console.log(
    `[verify-advisors] Supabase advisor verification passed for ${projectRef}.`,
  );
}

main().catch((error) => {
  console.error("[verify-advisors] Verification failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
