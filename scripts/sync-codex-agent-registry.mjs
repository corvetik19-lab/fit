import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  AUTONOMY_ALLOWED_WRITE_PATHS,
  AUTONOMY_DENIED_WRITE_PATHS,
  AUTONOMY_REGISTRY_DOC,
  AUTONOMY_WRITE_VERIFY_COMMANDS,
} from "./agent-governance-config.mjs";
import { buildAgentInventory } from "./agent-inventory.mjs";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, AUTONOMY_REGISTRY_DOC);

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
    write: argv.includes("--write"),
    out: argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : null,
  };
}

function toDocLink(relativePath) {
  return `[${relativePath}](/C:/fit/${relativePath.replace(/\\/g, "/")})`;
}

export function renderRegistryMarkdown(inventory) {
  const roleRows = inventory.roles
    .map(
      (role) =>
        `| \`${role.name}\` | ${role.description} | ${toDocLink(role.configFile)} | \`${role.reasoningEffort}\` / \`${role.sandboxMode}\` |`,
    )
    .join("\n");

  const skillRows = inventory.skills
    .map(
      (skill) =>
        `| \`${skill.name}\` | ${skill.description} | ${toDocLink(skill.path)} |`,
    )
    .join("\n");

  const commandRows = inventory.commands
    .map((command) => `| \`${command.name}\` | \`${command.command}\` |`)
    .join("\n");

  const workflowRows = inventory.workflows
    .map((workflow) => `| ${workflow.name} | ${toDocLink(workflow.path)} |`)
    .join("\n");

  const docRows = inventory.docs
    .map((doc) => `| \`${doc.name}\` | ${toDocLink(doc.path)} | ${doc.purpose} |`)
    .join("\n");

  return `# Codex Agent Registry

Этот документ синхронизируется командой \`npm run agent:sync-registry\`.
Он фиксирует текущий control plane agent layer внутри \`fit\`: роли, repo-local skills,
governance, workflows и developer-facing команды.

## Role Control Plane

| Роль | Назначение | Config | Режим |
| --- | --- | --- | --- |
${roleRows}

## Repo Skills

| Skill | Назначение | Файл |
| --- | --- | --- |
${skillRows}

## Governance Summary

- Allowlisted write surfaces:
  \`${AUTONOMY_ALLOWED_WRITE_PATHS.join("`, `")}\`
- Denied surfaces:
  \`${AUTONOMY_DENIED_WRITE_PATHS.join("`, `")}\`
- Write-run verification:
  \`${AUTONOMY_WRITE_VERIFY_COMMANDS.join("`, `")}\`
- Канонический governance-doc:
  ${toDocLink("docs/CODEX_AGENT_GOVERNANCE.md")}

## Workflow Docs

| Док | Путь | Назначение |
| --- | --- | --- |
${docRows}

## Automation And Verification Commands

| Команда | Что делает |
| --- | --- |
${commandRows}

## Workflow Files

| Workflow | Путь |
| --- | --- |
${workflowRows}

## Regeneration

1. \`npm run agent:inventory\`
2. \`npm run agent:sync-registry\`
3. \`npm run verify:agent-governance\`
`;
}

export async function syncRegistryDoc({ write = false } = {}) {
  const inventory = await buildAgentInventory();
  const nextMarkdown = renderRegistryMarkdown(inventory);
  let currentMarkdown = "";

  try {
    currentMarkdown = await readFile(DOC_PATH, "utf8");
  } catch {
    currentMarkdown = "";
  }

  const changed = currentMarkdown !== nextMarkdown;

  if (write && changed) {
    await mkdir(path.dirname(DOC_PATH), { recursive: true });
    await writeFile(DOC_PATH, nextMarkdown, "utf8");
  }

  return {
    changed,
    inventory,
    markdown: nextMarkdown,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { changed, markdown } = await syncRegistryDoc({ write: args.write });

  if (args.out) {
    const absoluteOut = path.join(ROOT, args.out);
    await mkdir(path.dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, markdown, "utf8");
  }

  if (args.check) {
    if (changed) {
      console.error("agent registry is out of sync with inventory");
      process.exitCode = 1;
      return;
    }

    console.log("agent registry is in sync");
    return;
  }

  if (args.write) {
    console.log(changed ? `synced ${AUTONOMY_REGISTRY_DOC}` : "registry already in sync");
    return;
  }

  process.stdout.write(markdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
