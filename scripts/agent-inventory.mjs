import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  AUTONOMY_ALLOWED_WRITE_PATHS,
  AUTONOMY_DENIED_WRITE_PATHS,
  AUTONOMY_DRY_RUN_VERIFY_COMMANDS,
  AUTONOMY_REGISTRY_DOC,
  AUTONOMY_WRITE_VERIFY_COMMANDS,
} from "./agent-governance-config.mjs";

const ROOT = process.cwd();

const DOCS = [
  {
    name: "rollout",
    path: "docs/CODEX_ROLLOUT_PLAN.md",
    purpose: "rollout и handoff Codex operating system",
  },
  {
    name: "agent-hardening",
    path: "docs/CODEX_AGENT_HARDENING_PLAN.md",
    purpose: "review, security и prompt-contract слой",
  },
  {
    name: "agent-autonomy",
    path: "docs/CODEX_AGENT_AUTONOMY_PLAN.md",
    purpose: "orchestration, governance и autonomous mainline lane",
  },
  {
    name: "agent-governance",
    path: "docs/CODEX_AGENT_GOVERNANCE.md",
    purpose: "allowlist, denied surfaces, budgets и kill switch",
  },
  {
    name: "agent-registry",
    path: AUTONOMY_REGISTRY_DOC,
    purpose: "синхронизированный реестр ролей, skills, workflows и команд",
  },
  {
    name: "playbook",
    path: "docs/CODEX_PLAYBOOK.md",
    purpose: "рабочий playbook и cookbook-паттерны для agent layer",
  },
  {
    name: "onboarding",
    path: "docs/CODEX_ONBOARDING.md",
    purpose: "обязательный onboarding для нового домена и agent layer",
  },
  {
    name: "review-contract",
    path: "code_review.md",
    purpose: "локальный и GitHub review contract",
  },
];

const WORKFLOWS = [
  ".github/workflows/quality.yml",
  ".github/workflows/agent-autonomy.yml",
];

function parseArgs(argv) {
  const outIndex = argv.indexOf("--out");
  return {
    out: outIndex >= 0 ? argv[outIndex + 1] : null,
  };
}

function extractAgentBlocks(toml) {
  const blocks = [];
  let currentName = null;
  let currentLines = [];

  for (const rawLine of toml.split(/\r?\n/)) {
    const sectionMatch = rawLine.trim().match(/^\[agents\.([^\]]+)\]$/);
    if (sectionMatch) {
      if (currentName) {
        blocks.push({ name: currentName, body: currentLines.join("\n") });
      }

      currentName = sectionMatch[1];
      currentLines = [];
      continue;
    }

    if (currentName) {
      const anySectionMatch = rawLine.trim().match(/^\[[^\]]+\]$/);
      if (anySectionMatch) {
        blocks.push({ name: currentName, body: currentLines.join("\n") });
        currentName = null;
        currentLines = [];
      } else {
        currentLines.push(rawLine);
      }
    }
  }

  if (currentName) {
    blocks.push({ name: currentName, body: currentLines.join("\n") });
  }

  return blocks.map((block) => {
    const description = block.body.match(/description\s*=\s*"([^"]+)"/)?.[1] ?? "";
    const configFile = block.body.match(/config_file\s*=\s*"([^"]+)"/)?.[1] ?? "";
    return {
      name: block.name,
      description,
      configFile,
    };
  });
}

function parseFrontmatter(markdown) {
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const result = {};

  if (!frontmatterMatch) {
    return result;
  }

  for (const rawLine of frontmatterMatch[1].split(/\r?\n/)) {
    const assignment = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (assignment) {
      result[assignment[1]] = assignment[2];
    }
  }

  return result;
}

async function readUtf8(relativePath) {
  return readFile(path.join(ROOT, relativePath), "utf8");
}

async function readAgentConfig(relativePath) {
  const contents = await readUtf8(relativePath);
  return {
    reasoningEffort: contents.match(/model_reasoning_effort\s*=\s*"([^"]+)"/)?.[1] ?? "unknown",
    sandboxMode: contents.match(/sandbox_mode\s*=\s*"([^"]+)"/)?.[1] ?? "unknown",
  };
}

async function loadRoles() {
  const config = await readUtf8(".codex/config.toml");
  const roles = extractAgentBlocks(config);

  return Promise.all(
    roles.map(async (role) => {
      const configMeta = role.configFile ? await readAgentConfig(role.configFile) : {};
      return {
        ...role,
        ...configMeta,
      };
    }),
  );
}

async function loadSkills() {
  const skillsDir = path.join(ROOT, ".agents/skills");
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(".agents/skills", entry.name, "SKILL.md");

    try {
      const markdown = await readUtf8(skillPath);
      const frontmatter = parseFrontmatter(markdown);
      skills.push({
        name: frontmatter.name ?? entry.name,
        description: frontmatter.description ?? "",
        path: skillPath.replace(/\\/g, "/"),
      });
    } catch {
      continue;
    }
  }

  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

async function loadWorkflows() {
  const result = [];

  for (const workflowPath of WORKFLOWS) {
    try {
      const contents = await readUtf8(workflowPath);
      const name = contents.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? path.basename(workflowPath);
      result.push({
        name,
        path: workflowPath,
      });
    } catch {
      continue;
    }
  }

  return result;
}

async function loadCommands() {
  const packageJson = JSON.parse(await readUtf8("package.json"));
  const scripts = packageJson.scripts ?? {};
  const relevantEntries = Object.entries(scripts)
    .filter(([name]) => name.startsWith("agent:") || name.startsWith("verify:"))
    .sort(([left], [right]) => left.localeCompare(right));

  return relevantEntries.map(([name, command]) => ({ name, command }));
}

export async function buildAgentInventory() {
  return {
    project: "fit",
    scope: "dev-agent only",
    roles: await loadRoles(),
    skills: await loadSkills(),
    docs: DOCS,
    workflows: await loadWorkflows(),
    commands: await loadCommands(),
    governance: {
      allowedWritePaths: AUTONOMY_ALLOWED_WRITE_PATHS,
      deniedWritePaths: AUTONOMY_DENIED_WRITE_PATHS,
      dryRunVerifyCommands: AUTONOMY_DRY_RUN_VERIFY_COMMANDS,
      writeVerifyCommands: AUTONOMY_WRITE_VERIFY_COMMANDS,
      registryDoc: AUTONOMY_REGISTRY_DOC,
    },
  };
}

async function main() {
  const { out } = parseArgs(process.argv.slice(2));
  const inventory = await buildAgentInventory();
  const serialized = `${JSON.stringify(inventory, null, 2)}\n`;

  if (out) {
    const absoluteOut = path.join(ROOT, out);
    await mkdir(path.dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, serialized, "utf8");
    console.log(`agent:inventory wrote ${out}`);
    return;
  }

  process.stdout.write(serialized);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
