import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  ".codex/config.toml",
  "docs/CODEX_ROLLOUT_PLAN.md",
  "docs/CODEX_PLAYBOOK.md",
  "docs/CODEX_ONBOARDING.md",
  "src/app/AGENTS.md",
  "src/lib/ai/AGENTS.md",
  "supabase/AGENTS.md",
  "ai-evals/AGENTS.md",
  "android/AGENTS.md",
  "agents/onboarding-mapper.toml",
  "agents/eval-loop-driver.toml",
  ".agents/skills/fit-web-onboarding/SKILL.md",
  ".agents/skills/fit-ai-eval-ops/SKILL.md",
  ".agents/skills/fit-release-verification/SKILL.md",
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

function extractConfigFiles(toml) {
  return [...toml.matchAll(/config_file\s*=\s*"([^"]+)"/g)].map((match) => match[1]);
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

  const codexConfig = await readUtf8(".codex/config.toml");
  const referencedAgentConfigs = extractConfigFiles(codexConfig);

  for (const relativePath of referencedAgentConfigs) {
    if (!(await fileExists(relativePath))) {
      errors.push(`.codex/config.toml references missing agent config: ${relativePath}`);
    }
  }

  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.onboarding_mapper]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.eval_loop_driver]");

  const docsReadme = await readUtf8("docs/README.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_ROLLOUT_PLAN.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_PLAYBOOK.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_ONBOARDING.md");

  const rootReadme = await readUtf8("README.md");
  requireSubstring(errors, rootReadme, "README.md", "CODEX_ROLLOUT_PLAN.md");
  requireSubstring(errors, rootReadme, "README.md", "verify:codex");

  const rootAgents = await readUtf8("AGENTS.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_PLAYBOOK.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_ONBOARDING.md");

  if (errors.length > 0) {
    console.error("verify:codex failed\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("verify:codex passed");
  console.log(`- required files: ${requiredFiles.length}`);
  console.log(`- referenced agent configs: ${referencedAgentConfigs.length}`);
  console.log("- docs links and root instructions are in sync");
}

await main();
