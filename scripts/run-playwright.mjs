import { spawnSync } from "node:child_process";

const separatorIndex = process.argv.indexOf("--");

if (separatorIndex === -1) {
  console.error("Usage: node scripts/run-playwright.mjs KEY=value -- <playwright args>");
  process.exit(1);
}

const envArgs = process.argv.slice(2, separatorIndex);
const playwrightArgs = process.argv.slice(separatorIndex + 1);

if (!playwrightArgs.length) {
  console.error("Missing Playwright arguments.");
  process.exit(1);
}

const env = { ...process.env };

for (const envArg of envArgs) {
  const equalsIndex = envArg.indexOf("=");

  if (equalsIndex === -1) {
    console.error(`Invalid env argument: ${envArg}`);
    process.exit(1);
  }

  const key = envArg.slice(0, equalsIndex);
  const value = envArg.slice(equalsIndex + 1);
  env[key] = value;
}

function run(command, args) {
  return spawnSync(command, args, {
    stdio: "pipe",
    env,
    encoding: "utf8",
    shell: false,
  });
}

function killProcess(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/PID", pid, "/F"], {
      stdio: "ignore",
      shell: false,
    });
    return;
  }

  spawnSync("kill", ["-9", pid], {
    stdio: "ignore",
  });
}

function clearExistingListener(port) {
  if (!port || env.PLAYWRIGHT_BASE_URL) {
    return;
  }

  if (process.platform === "win32") {
    const lookup = run(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
      ],
    );

    if (lookup.status !== 0 || !lookup.stdout) {
      return;
    }

    const pids = lookup.stdout
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);

    for (const pid of pids) {
      killProcess(pid);
    }

    return;
  }

  const lookup = run("bash", ["-lc", `lsof -ti tcp:${port}`]);

  if (lookup.status !== 0 || !lookup.stdout) {
    return;
  }

  const pids = lookup.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const pid of pids) {
    killProcess(pid);
  }
}

clearExistingListener(env.PLAYWRIGHT_PORT ?? "3100");

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["playwright", ...playwrightArgs], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
