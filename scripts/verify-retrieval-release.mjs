import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";
import { runAiRuntimePreflight } from "./ai-runtime-preflight.mjs";

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

function runScript(label, script, extraEnv = {}) {
  console.log(`[run] ${label}: npm run ${script}`);
  const result = spawnSync(npmCommand, ["run", script], {
    env: {
      ...process.env,
      AI_RETRIEVAL_MODE: "hybrid",
      ...extraEnv,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
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
const aiRuntimeReady =
  hasValues(["OPENROUTER_API_KEY"]) &&
  (hasValues(["VOYAGE_API_KEY"]) || hasValues(["AI_GATEWAY_API_KEY"]));

const suiteResults = [
  {
    label: "Retrieval regression gate",
    status: runScript("Retrieval regression gate", "test:retrieval-gate"),
  },
];

if (hasUserAuth && hasAdminAuth && aiRuntimeReady) {
  const aiRuntimePreflight = await runAiRuntimePreflight();

  if (!aiRuntimePreflight.ok) {
    console.log("[fail] AI runtime preflight");
    for (const failure of aiRuntimePreflight.failures) {
      console.log(`  - ${failure}`);
    }

    suiteResults.push({
      label: "AI runtime preflight",
      status: 1,
    });
  } else {
    suiteResults.push({
      label: "AI quality gate",
      status: runScript("AI quality gate", "test:ai-gate"),
    });
  }
} else {
  logSkip("AI quality gate", [
    hasUserAuth
      ? null
      : "нет PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD для assistant и safety suite",
    hasAdminAuth
      ? null
      : "нет PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD для retrieval и plan suites",
    ...getMissing(["OPENROUTER_API_KEY"]).map(
      (key) => `нет ${key} для chat и plan runtime`,
    ),
    hasValues(["VOYAGE_API_KEY"]) || hasValues(["AI_GATEWAY_API_KEY"])
      ? null
      : "нет VOYAGE_API_KEY или AI_GATEWAY_API_KEY для retrieval embeddings",
  ].filter(Boolean));
}

const failedSuites = suiteResults.filter((suite) => suite.status !== 0);

if (failedSuites.length) {
  console.error(
    `[fail] retrieval release verification failed: ${failedSuites
      .map((suite) => suite.label)
      .join(", ")}`,
  );
  process.exit(1);
}

console.log("[done] retrieval release verification passed for all runnable suites.");
