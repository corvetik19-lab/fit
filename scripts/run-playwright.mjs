import { spawnSync } from "node:child_process";

const separatorIndex = process.argv.indexOf("--");

if (separatorIndex === -1) {
  console.error("Usage: node scripts/run-playwright.mjs KEY=value -- <playwright args>");
  process.exit(1);
}

const envArgs = process.argv.slice(2, separatorIndex);
const playwrightArgs = process.argv.slice(separatorIndex + 1);

if (!playwrightArgs.length) {
  console.error("Missing Playwright arguments.");
  process.exit(1);
}

const env = { ...process.env };

for (const envArg of envArgs) {
  const equalsIndex = envArg.indexOf("=");

  if (equalsIndex === -1) {
    console.error(`Invalid env argument: ${envArg}`);
    process.exit(1);
  }

  const key = envArg.slice(0, equalsIndex);
  const value = envArg.slice(equalsIndex + 1);
  env[key] = value;
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["playwright", ...playwrightArgs], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
