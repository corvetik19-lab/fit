import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MASTER_PLAN_PATH = path.join(ROOT, "docs/MASTER_PLAN.md");

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
  };
}

async function readMasterPlanProgress() {
  const markdown = await readFile(MASTER_PLAN_PATH, "utf8");
  const match = markdown.match(
    /execution checklist:\s*`(\d+)\s*\/\s*(\d+)`\s*\(`(\d+)%`\)/u,
  );

  if (!match) {
    throw new Error(
      "Не удалось найти строку текущего прогресса в docs/MASTER_PLAN.md",
    );
  }

  const [, done, total, percent] = match;
  return {
    done: Number(done),
    total: Number(total),
    percent: Number(percent),
    display: `${done} / ${total} (${percent}%)`,
  };
}

export { readMasterPlanProgress };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const progress = await readMasterPlanProgress();

  if (args.json) {
    process.stdout.write(`${JSON.stringify(progress, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${progress.display}\n`);
}

await main();
