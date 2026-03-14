import { spawn } from "node:child_process";

const nextArgs = process.argv.slice(2);
const nextCommand = `npx next ${nextArgs.join(" ")}`;

if (!nextArgs.length) {
  console.error("Expected Next.js command arguments.");
  process.exit(1);
}

const child = spawn(nextCommand, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || ".next_build",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
