import { access, constants, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { renderRegistryMarkdown } from "./sync-codex-agent-registry.mjs";
import { buildAgentInventory } from "./agent-inventory.mjs";

const ROOT = process.cwd();

const requiredFiles = [
  "docs/CODEX_AGENT_AUTONOMY_PLAN.md",
  "docs/CODEX_AGENT_GOVERNANCE.md",
  "docs/CODEX_AGENT_REGISTRY.md",
  "agents/orchestrator.toml",
  "agents/autonomy-guardian.toml",
  "agents/evolution-driver.toml",
  ".agents/skills/fit-agent-orchestration/SKILL.md",
  ".agents/skills/fit-agent-governance/SKILL.md",
  ".agents/skills/fit-agent-governance/references/agent-governance-guardrails.md",
  ".agents/skills/fit-agent-evolution/SKILL.md",
  "scripts/agent-governance-config.mjs",
  "scripts/agent-inventory.mjs",
  "scripts/sync-codex-agent-registry.mjs",
  "scripts/verify-agent-governance.mjs",
  "scripts/agent-evolve.mjs",
  ".github/workflows/agent-autonomy.yml",
];

async function fileExists(relativePath) {
  try {
    await access(path.join(ROOT, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(relativePath) {
  return readFile(path.join(ROOT, relativePath), "utf8");
}

function requireSubstring(errors, text, file, fragment) {
  if (!text.includes(fragment)) {
    errors.push(`${file}: missing required reference "${fragment}"`);
  }
}

async function main() {
  const errors = [];

  for (const relativePath of requiredFiles) {
    if (!(await fileExists(relativePath))) {
      errors.push(`Missing required file: ${relativePath}`);
    }
  }

  const packageJson = JSON.parse(await readUtf8("package.json"));
  for (const scriptName of [
    "agent:inventory",
    "agent:sync-registry",
    "agent:evaluate",
    "agent:evolve",
    "agent:evolve:push",
    "verify:agent-governance",
  ]) {
    if (!packageJson.scripts?.[scriptName]) {
      errors.push(`package.json: missing script "${scriptName}"`);
    }
  }

  const codexConfig = await readUtf8(".codex/config.toml");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.orchestrator]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.autonomy_guardian]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.evolution_driver]");

  const rootAgents = await readUtf8("AGENTS.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_AGENT_AUTONOMY_PLAN.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_AGENT_GOVERNANCE.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_AGENT_REGISTRY.md");

  const playbook = await readUtf8("docs/CODEX_PLAYBOOK.md");
  for (const fragment of [
    "fit-agent-orchestration",
    "fit-agent-governance",
    "fit-agent-evolution",
    "agent:evaluate",
    "agent:evolve",
    "verify:agent-governance",
  ]) {
    requireSubstring(errors, playbook, "docs/CODEX_PLAYBOOK.md", fragment);
  }

  const onboarding = await readUtf8("docs/CODEX_ONBOARDING.md");
  requireSubstring(errors, onboarding, "docs/CODEX_ONBOARDING.md", "Agent operating system");
  requireSubstring(errors, onboarding, "docs/CODEX_ONBOARDING.md", "CODEX_AGENT_GOVERNANCE.md");

  const docsReadme = await readUtf8("docs/README.md");
  for (const fragment of [
    "CODEX_AGENT_AUTONOMY_PLAN.md",
    "CODEX_AGENT_GOVERNANCE.md",
    "CODEX_AGENT_REGISTRY.md",
  ]) {
    requireSubstring(errors, docsReadme, "docs/README.md", fragment);
  }

  const rootReadme = await readUtf8("README.md");
  for (const fragment of [
    "verify:agent-governance",
    "agent:evaluate",
    "CODEX_AGENT_AUTONOMY_PLAN.md",
    "CODEX_AGENT_GOVERNANCE.md",
    "CODEX_AGENT_REGISTRY.md",
  ]) {
    requireSubstring(errors, rootReadme, "README.md", fragment);
  }

  const reviewContract = await readUtf8("code_review.md");
  requireSubstring(errors, reviewContract, "code_review.md", "verify:agent-governance");
  requireSubstring(errors, reviewContract, "code_review.md", "autonomous");

  const workflow = await readUtf8(".github/workflows/agent-autonomy.yml");
  for (const fragment of [
    "npm run agent:evaluate",
    "npm run agent:evolve:push",
    "CODEX_AGENT_AUTONOMY_ENABLED",
    "FIT_CODEX_AUTONOMY_ENABLED",
    "upload-artifact",
  ]) {
    requireSubstring(errors, workflow, ".github/workflows/agent-autonomy.yml", fragment);
  }

  const inventory = await buildAgentInventory();
  const expectedRegistry = renderRegistryMarkdown(inventory);
  const registryDoc = await readUtf8("docs/CODEX_AGENT_REGISTRY.md");
  if (registryDoc !== expectedRegistry) {
    errors.push("docs/CODEX_AGENT_REGISTRY.md is out of sync with inventory; run npm run agent:sync-registry");
  }

  if (errors.length > 0) {
    console.error("verify:agent-governance failed\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("verify:agent-governance passed");
  console.log(`- required files: ${requiredFiles.length}`);
  console.log("- package scripts, docs, workflows, and registry are in sync");
}

await main();
