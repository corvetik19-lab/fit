import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  AUTONOMY_ARTIFACT_ROOT,
  AUTONOMY_COMMIT_PREFIX,
  AUTONOMY_DRY_RUN_VERIFY_COMMANDS,
  AUTONOMY_ENABLE_ENV,
  AUTONOMY_KILL_SWITCH_ENV,
  AUTONOMY_MAX_CHANGED_FILES,
  AUTONOMY_MAX_DIFF_BYTES,
  AUTONOMY_MAX_DIFF_LINES,
  AUTONOMY_REGISTRY_DOC,
  AUTONOMY_WRITE_VERIFY_COMMANDS,
  isAllowedAutonomyWrite,
  isDeniedAutonomyWrite,
} from "./agent-governance-config.mjs";
import { buildAgentInventory } from "./agent-inventory.mjs";
import { readMasterPlanProgress } from "./master-plan-progress.mjs";
import { syncRegistryDoc } from "./sync-codex-agent-registry.mjs";

const ROOT = process.cwd();

function parseArgs(argv) {
  const write = argv.includes("--write");
  const push = argv.includes("--push");
  return {
    write,
    push,
  };
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function runShell(command, { capture = false } = {}) {
  if (capture) {
    return execSync(command, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }).trim();
  }

  execSync(command, {
    cwd: ROOT,
    stdio: "inherit",
  });
  return "";
}

function getWorkingTreeStatus() {
  return runShell("git status --porcelain", { capture: true });
}

function getCurrentBranch() {
  return runShell("git branch --show-current", { capture: true });
}

function parseChangedFiles(porcelain) {
  return porcelain
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3))
    .map((filePath) => (filePath.includes(" -> ") ? filePath.split(" -> ").at(-1) : filePath));
}

function collectDiffStats() {
  const patch = runShell(`git diff -- ${AUTONOMY_REGISTRY_DOC}`, { capture: true });
  const changedLines = patch
    .split(/\r?\n/)
    .filter((line) => /^[+-]/.test(line) && !/^\+\+\+|^---/.test(line)).length;

  return {
    changedLines,
    patchBytes: Buffer.byteLength(patch, "utf8"),
  };
}

async function writeArtifact(relativePath, contents) {
  const absolutePath = path.join(ROOT, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const runId = nowStamp();
  const artifactDir = path.join(AUTONOMY_ARTIFACT_ROOT, runId);
  const summary = {
    mode: args.write ? (args.push ? "write-push" : "write") : "dry-run",
    branch: getCurrentBranch(),
    startedAt,
    artifacts: artifactDir.replace(/\\/g, "/"),
    commands: [],
  };

  if (process.env[AUTONOMY_KILL_SWITCH_ENV] === "1") {
    throw new Error(`${AUTONOMY_KILL_SWITCH_ENV}=1 blocks autonomous writes`);
  }

  if (args.write && getWorkingTreeStatus()) {
    throw new Error("autonomous write-run requires a clean working tree");
  }

  if (args.push) {
    if (summary.branch !== "main") {
      throw new Error("autonomous push-run is allowed only from main");
    }

    if (process.env[AUTONOMY_ENABLE_ENV] !== "1") {
      throw new Error(`${AUTONOMY_ENABLE_ENV}=1 is required for autonomous push-run`);
    }
  }

  const inventory = await buildAgentInventory();
  const masterPlanProgress = await readMasterPlanProgress();
  await writeArtifact(path.join(artifactDir, "agent-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);

  const registrySync = await syncRegistryDoc({ write: args.write });
  await writeArtifact(path.join(artifactDir, "registry-preview.md"), registrySync.markdown);

  const verificationCommands = args.write ? AUTONOMY_WRITE_VERIFY_COMMANDS : AUTONOMY_DRY_RUN_VERIFY_COMMANDS;
  for (const command of verificationCommands) {
    summary.commands.push(command);
    runShell(command);
  }

  if (args.write) {
    const changedFiles = parseChangedFiles(getWorkingTreeStatus());
    summary.changedFiles = changedFiles;

    if (changedFiles.some((filePath) => isDeniedAutonomyWrite(filePath))) {
      throw new Error(`autonomous write-run touched denied surface: ${changedFiles.join(", ")}`);
    }

    if (changedFiles.some((filePath) => !isAllowedAutonomyWrite(filePath))) {
      throw new Error(`autonomous write-run touched non-allowlisted surface: ${changedFiles.join(", ")}`);
    }

    if (changedFiles.length > AUTONOMY_MAX_CHANGED_FILES) {
      throw new Error(`autonomous write-run exceeded file budget (${changedFiles.length} > ${AUTONOMY_MAX_CHANGED_FILES})`);
    }

    const diffStats = collectDiffStats();
    summary.diffStats = diffStats;

    if (diffStats.changedLines > AUTONOMY_MAX_DIFF_LINES) {
      throw new Error(
        `autonomous write-run exceeded diff line budget (${diffStats.changedLines} > ${AUTONOMY_MAX_DIFF_LINES})`,
      );
    }

    if (diffStats.patchBytes > AUTONOMY_MAX_DIFF_BYTES) {
      throw new Error(
        `autonomous write-run exceeded diff byte budget (${diffStats.patchBytes} > ${AUTONOMY_MAX_DIFF_BYTES})`,
      );
    }

    if (args.push && changedFiles.length > 0) {
      runShell(`git add ${AUTONOMY_REGISTRY_DOC}`);
      runShell(`git commit -m "${AUTONOMY_COMMIT_PREFIX} sync Codex agent registry"`);
      runShell("git push origin main");
      summary.pushed = true;
    } else {
      summary.pushed = false;
    }
  }

  summary.registryChanged = registrySync.changed;
  summary.masterPlanProgress = masterPlanProgress;
  summary.finishedAt = new Date().toISOString();

  await writeArtifact(path.join(artifactDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeArtifact(
    path.join(artifactDir, "summary.md"),
    `# Agent Evolution Summary

- Mode: \`${summary.mode}\`
- Branch: \`${summary.branch}\`
- Registry changed: \`${summary.registryChanged}\`
- Master plan progress: \`${masterPlanProgress.display}\`
- Commands: \`${summary.commands.join("`, `")}\`
- Pushed: \`${summary.pushed ?? false}\`
`,
  );

  console.log(`agent evolution completed: ${artifactDir.replace(/\\/g, "/")}`);
}

await main();
