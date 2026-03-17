import { spawn } from "node:child_process";

const rawArgs = process.argv.slice(2);

let distDir = process.env.NEXT_DIST_DIR ?? ".next";
const nextArgs = [];

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (arg.startsWith("--dist-dir=")) {
    distDir = arg.slice("--dist-dir=".length) || distDir;
    continue;
  }

  if (arg === "--dist-dir") {
    const value = rawArgs[index + 1];

    if (value) {
      distDir = value;
      index += 1;
    }

    continue;
  }

  nextArgs.push(arg);
}

const nextCommand = `npx next ${nextArgs.join(" ")}`;
const isBuildCommand = nextArgs[0] === "build";

if (!nextArgs.length) {
  console.error("Expected Next.js command arguments.");
  process.exit(1);
}

const child = spawn(nextCommand, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS:
      isBuildCommand &&
      !(process.env.NODE_OPTIONS ?? "").includes("--max-old-space-size")
        ? `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim()
        : process.env.NODE_OPTIONS,
    NEXT_DIST_DIR: distDir,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
