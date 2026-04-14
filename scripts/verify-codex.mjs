import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  ".codex/config.toml",
  "docs/CODEX_ROLLOUT_PLAN.md",
  "docs/CODEX_AGENT_HARDENING_PLAN.md",
  "docs/CODEX_PLAYBOOK.md",
  "docs/CODEX_ONBOARDING.md",
  "code_review.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "src/app/AGENTS.md",
  "src/lib/ai/AGENTS.md",
  "supabase/AGENTS.md",
  "ai-evals/AGENTS.md",
  "android/AGENTS.md",
  "agents/onboarding-mapper.toml",
  "agents/eval-loop-driver.toml",
  "agents/pr-reviewer.toml",
  "agents/security-reviewer.toml",
  "agents/prompt-contract-editor.toml",
  "agents/workflow-maintainer.toml",
  ".agents/skills/fit-web-onboarding/SKILL.md",
  ".agents/skills/fit-ai-eval-ops/SKILL.md",
  ".agents/skills/fit-release-verification/SKILL.md",
  ".agents/skills/fit-pr-review/SKILL.md",
  ".agents/skills/fit-security-review/SKILL.md",
  ".agents/skills/fit-security-review/references/fit-security-checklist.md",
  ".agents/skills/fit-prompt-contracts/SKILL.md",
  ".agents/skills/fit-prompt-contracts/references/prompt-contract-patterns.md",
  ".agents/skills/fit-github-review-ops/SKILL.md",
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

function extractAssignments(toml) {
  const assignments = [];
  let currentSection = null;

  for (const [index, rawLine] of toml.split(/\r?\n/).entries()) {
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const assignmentMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!assignmentMatch) {
      continue;
    }

    assignments.push({
      key: assignmentMatch[1],
      value: assignmentMatch[2].trim(),
      section: currentSection,
      lineNumber: index + 1,
    });
  }

  return assignments;
}

function validateCodexConfig(errors, toml, file) {
  const assignments = extractAssignments(toml);
  const topLevelProjectDocBudget = assignments.find(
    (assignment) => assignment.section === null && assignment.key === "project_doc_max_bytes",
  );

  if (!toml.includes("#:schema https://developers.openai.com/codex/config-schema.json")) {
    errors.push(`${file}: missing schema hint for editor diagnostics`);
  }

  if (!topLevelProjectDocBudget) {
    errors.push(`${file}: missing top-level project_doc_max_bytes`);
  } else if (!/^\d+$/.test(topLevelProjectDocBudget.value)) {
    errors.push(
      `${file}:${topLevelProjectDocBudget.lineNumber}: project_doc_max_bytes must be a top-level integer`,
    );
  }

  for (const assignment of assignments.filter((entry) => entry.section === "features")) {
    if (assignment.key === "project_doc_max_bytes") {
      errors.push(
        `${file}:${assignment.lineNumber}: project_doc_max_bytes must stay at the top level, not inside [features]`,
      );
      continue;
    }

    if (!/^(true|false)$/.test(assignment.value)) {
      errors.push(
        `${file}:${assignment.lineNumber}: features.${assignment.key} must use a boolean value`,
      );
    }
  }
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
  validateCodexConfig(errors, codexConfig, ".codex/config.toml");

  for (const relativePath of referencedAgentConfigs) {
    if (!(await fileExists(relativePath))) {
      errors.push(`.codex/config.toml references missing agent config: ${relativePath}`);
    }
  }

  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.onboarding_mapper]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.eval_loop_driver]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "review_model =");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.pr_reviewer]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.security_reviewer]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.prompt_contract_editor]");
  requireSubstring(errors, codexConfig, ".codex/config.toml", "[agents.workflow_maintainer]");

  const docsReadme = await readUtf8("docs/README.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_ROLLOUT_PLAN.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_AGENT_HARDENING_PLAN.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_PLAYBOOK.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "CODEX_ONBOARDING.md");
  requireSubstring(errors, docsReadme, "docs/README.md", "code_review.md");

  const rootReadme = await readUtf8("README.md");
  requireSubstring(errors, rootReadme, "README.md", "CODEX_ROLLOUT_PLAN.md");
  requireSubstring(errors, rootReadme, "README.md", "CODEX_AGENT_HARDENING_PLAN.md");
  requireSubstring(errors, rootReadme, "README.md", "code_review.md");
  requireSubstring(errors, rootReadme, "README.md", "@codex review");
  requireSubstring(errors, rootReadme, "README.md", "verify:codex");

  const rootAgents = await readUtf8("AGENTS.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_PLAYBOOK.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_ONBOARDING.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "docs/CODEX_AGENT_HARDENING_PLAN.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "code_review.md");
  requireSubstring(errors, rootAgents, "AGENTS.md", "## Review guidelines");
  requireSubstring(errors, rootAgents, "AGENTS.md", "## Prompt contract");

  const reviewContract = await readUtf8("code_review.md");
  requireSubstring(errors, reviewContract, "code_review.md", "@codex review");
  requireSubstring(errors, reviewContract, "code_review.md", "P0");
  requireSubstring(errors, reviewContract, "code_review.md", "P1");
  requireSubstring(errors, reviewContract, "code_review.md", "P2");

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
