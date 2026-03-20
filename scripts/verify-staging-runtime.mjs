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

const hasUserAuth =
  Boolean(process.env.PLAYWRIGHT_TEST_EMAIL?.trim()) &&
  Boolean(process.env.PLAYWRIGHT_TEST_PASSWORD?.trim());
const hasAdminAuth =
  Boolean(process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim()) &&
  Boolean(process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim());

const aiReady =
  hasUserAuth &&
  hasAdminAuth &&
  hasValues(["OPENROUTER_API_KEY"]) &&
  (hasValues(["VOYAGE_API_KEY"]) || hasValues(["AI_GATEWAY_API_KEY"]));

const stripeReady =
  hasUserAuth &&
  hasValues(["STRIPE_SECRET_KEY", "STRIPE_PREMIUM_MONTHLY_PRICE_ID"]);

const suiteResults = [];

if (aiReady) {
  suiteResults.push({
    label: "AI runtime gate",
    status: runScript("AI runtime gate", "test:ai-gate"),
  });
} else {
  logSkip("AI runtime gate", [
    hasUserAuth ? null : "нет PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD",
    hasAdminAuth
      ? null
      : "нет PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD",
    hasValues(["OPENROUTER_API_KEY"]) ? null : "нет OPENROUTER_API_KEY",
    hasValues(["VOYAGE_API_KEY"]) || hasValues(["AI_GATEWAY_API_KEY"])
      ? null
      : "нет VOYAGE_API_KEY или AI_GATEWAY_API_KEY для retrieval/embeddings",
  ].filter(Boolean));
}

if (stripeReady) {
  suiteResults.push({
    label: "Stripe runtime gate",
    status: runScript("Stripe runtime gate", "test:billing-gate"),
  });
} else {
  logSkip(
    "Stripe runtime gate",
    [
      hasUserAuth
        ? null
        : "нет PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD",
      ...getMissing(["STRIPE_SECRET_KEY", "STRIPE_PREMIUM_MONTHLY_PRICE_ID"]).map(
        (key) => `нет ${key}`,
      ),
    ].filter(Boolean),
  );
}

if (!suiteResults.length) {
  console.log("[done] staging-like verification scaffold is in place; no runtime suites were runnable in this environment.");
  process.exit(0);
}

const failedSuites = suiteResults.filter((suite) => suite.status !== 0);

if (failedSuites.length) {
  console.error(
    `[fail] staging-like verification failed: ${failedSuites
      .map((suite) => suite.label)
      .join(", ")}`,
  );
  process.exit(1);
}

console.log("[done] staging-like verification passed for all runnable suites.");
