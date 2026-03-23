import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function hasValues(keys) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

function getMissing(keys) {
  return keys.filter((key) => !process.env[key]?.trim());
}

function logSkip(label, reasons) {
  console.log(`[skip] ${label}`);

  for (const reason of reasons) {
    console.log(`  - ${reason}`);
  }
}

function runScript(label, script) {
  console.log(`[run] ${label}: npm run ${script}`);
  const result = spawnSync(npmCommand, ["run", script], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const hasAdminAuth =
  Boolean(process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim()) &&
  Boolean(process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim());
const hasRuntimeEnv = hasValues(["NEXT_PUBLIC_SENTRY_DSN"]);
const hasBuildEnv = hasValues([
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
]);

if (!(hasAdminAuth && hasRuntimeEnv && hasBuildEnv)) {
  logSkip(
    "Sentry runtime gate",
    [
      hasAdminAuth
        ? null
        : "нет PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD",
      ...getMissing(["NEXT_PUBLIC_SENTRY_DSN"]).map((key) => `нет ${key}`),
      ...getMissing(["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"]).map(
        (key) => `нет ${key}`,
      ),
    ].filter(Boolean),
  );
  console.log(
    "[done] sentry rollout readiness scaffold is in place; live runtime smoke is blocked only by missing credentials or env.",
  );
  process.exit(0);
}

const status = runScript("Sentry runtime gate", "test:sentry-gate");

if (status !== 0) {
  console.error("[fail] sentry runtime verification failed.");
  process.exit(status);
}

console.log("[done] sentry runtime verification passed.");
