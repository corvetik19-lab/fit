import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const typesRoot = join(rootDir, ".next", "types");
const requiredFiles = [
  join(typesRoot, "validator.ts"),
  join(typesRoot, "routes.d.ts"),
  join(typesRoot, "app", "layout.ts"),
  join(typesRoot, "app", "page.ts"),
  join(typesRoot, "app", "api", "ai", "assistant", "route.ts"),
];

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function countTypeFiles(dir) {
  let total = 0;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      total += countTypeFiles(fullPath);
      continue;
    }

    total += 1;
  }

  return total;
}

async function sleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForStableTypegenOutput() {
  const timeoutAt = Date.now() + 10_000;
  let previousCount = -1;
  let stableIterations = 0;

  while (Date.now() < timeoutAt) {
    const hasRequiredFiles = requiredFiles.every((filePath) => existsSync(filePath));
    const fileCount = existsSync(typesRoot) ? countTypeFiles(typesRoot) : 0;

    if (hasRequiredFiles && fileCount >= 20) {
      if (fileCount === previousCount) {
        stableIterations += 1;
      } else {
        stableIterations = 0;
      }

      if (stableIterations >= 2) {
        await sleep(250);
        return;
      }
    } else {
      stableIterations = 0;
    }

    previousCount = fileCount;
    await sleep(200);
  }

  throw new Error("Next typegen output did not stabilize in time.");
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

runCommand(npxCommand, ["next", "typegen"]);

const typegenCreatedFullRouteWrappers = requiredFiles.every((filePath) => existsSync(filePath));

if (typegenCreatedFullRouteWrappers) {
  await waitForStableTypegenOutput();
} else {
  runCommand(npmCommand, ["run", "build"]);
}

runCommand(npxCommand, ["tsc", "-p", "tsconfig.json", "--noEmit", "--incremental", "false"]);
