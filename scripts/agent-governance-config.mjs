import path from "node:path";

export const AUTONOMY_ARTIFACT_ROOT = "output/codex-runs/agent-evolution";
export const AUTONOMY_REGISTRY_DOC = "docs/CODEX_AGENT_REGISTRY.md";
export const AUTONOMY_KILL_SWITCH_ENV = "FIT_CODEX_AUTONOMY_KILL_SWITCH";
export const AUTONOMY_ENABLE_ENV = "FIT_CODEX_AUTONOMY_ENABLED";
export const AUTONOMY_GITHUB_ENABLE_VAR = "CODEX_AGENT_AUTONOMY_ENABLED";
export const AUTONOMY_MAX_CHANGED_FILES = 24;
export const AUTONOMY_MAX_DIFF_LINES = 600;
export const AUTONOMY_MAX_DIFF_BYTES = 120000;
export const AUTONOMY_COMMIT_PREFIX = "chore(agent-evolution):";

export const AUTONOMY_ALLOWED_WRITE_PATHS = [
  "AGENTS.md",
  ".codex/config.toml",
  "agents/",
  ".agents/skills/",
  "code_review.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/workflows/agent-autonomy.yml",
  "docs/CODEX_AGENT_AUTONOMY_PLAN.md",
  "docs/CODEX_AGENT_GOVERNANCE.md",
  "docs/CODEX_AGENT_REGISTRY.md",
  "docs/CODEX_PLAYBOOK.md",
  "docs/CODEX_ONBOARDING.md",
  "docs/CODEX_ROLLOUT_PLAN.md",
  "docs/README.md",
  "README.md",
  "scripts/agent-governance-config.mjs",
  "scripts/agent-inventory.mjs",
  "scripts/sync-codex-agent-registry.mjs",
  "scripts/verify-agent-governance.mjs",
  "scripts/agent-evolve.mjs",
  "scripts/verify-codex.mjs",
];

export const AUTONOMY_DENIED_WRITE_PATHS = [
  ".env",
  ".env.",
  "node_modules/",
  "package-lock.json",
  "public/",
  "src/",
  "supabase/migrations/",
  "tests/",
];

export const AUTONOMY_DRY_RUN_VERIFY_COMMANDS = [
  "npm run verify:codex",
  "npm run verify:agent-governance",
];

export const AUTONOMY_WRITE_VERIFY_COMMANDS = [
  ...AUTONOMY_DRY_RUN_VERIFY_COMMANDS,
  "npm run lint",
  "npm run typecheck",
  "npm run build",
];

export function normalizeAutonomyPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function matchesCandidate(filePath, candidate) {
  if (candidate.endsWith("/")) {
    return filePath.startsWith(candidate);
  }

  return filePath === candidate;
}

export function isAllowedAutonomyWrite(filePath) {
  const normalized = normalizeAutonomyPath(filePath);
  return AUTONOMY_ALLOWED_WRITE_PATHS.some((candidate) => matchesCandidate(normalized, candidate));
}

export function isDeniedAutonomyWrite(filePath) {
  const normalized = normalizeAutonomyPath(filePath);
  return AUTONOMY_DENIED_WRITE_PATHS.some((candidate) => matchesCandidate(normalized, candidate));
}

export function toAbsoluteAutonomyPath(rootDir, relativePath) {
  return path.join(rootDir, normalizeAutonomyPath(relativePath));
}
