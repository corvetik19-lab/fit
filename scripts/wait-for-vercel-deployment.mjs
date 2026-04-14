import { spawnSync } from "node:child_process";
import process from "node:process";

function parseArgs(argv) {
  const args = [...argv];
  const help = args.includes("--help") || args.includes("-h");
  const timeoutIndex = args.indexOf("--timeout");
  const timeout = timeoutIndex >= 0 ? args[timeoutIndex + 1] : process.env.VERCEL_DEPLOY_WAIT_TIMEOUT ?? "10m";

  if (timeoutIndex >= 0) {
    args.splice(timeoutIndex, 2);
  }

  const target = args[0] ?? process.env.VERCEL_DEPLOYMENT ?? process.env.VERCEL_DEPLOYMENT_URL ?? "";

  return {
    help,
    timeout,
    target,
  };
}

function hasCommand(command, versionArg = "--version") {
  const result = spawnSync(command, [versionArg], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}

function runCommand(command, args, inherit = true) {
  return spawnSync(command, args, {
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    encoding: "utf8",
  });
}

function resolveVercelInvocation() {
  if (hasCommand("vercel")) {
    return {
      command: "vercel",
      baseArgs: [],
    };
  }

  return {
    command: "npx",
    baseArgs: ["-y", "vercel@latest"],
  };
}

function printUsage() {
  console.log("Usage: npm run wait:vercel-deploy -- <deployment-url-or-id> [--timeout 10m]");
  console.log("Environment fallback: VERCEL_DEPLOYMENT or VERCEL_DEPLOYMENT_URL");
}

async function main() {
  const { help, target, timeout } = parseArgs(process.argv.slice(2));

  if (help) {
    printUsage();
    return;
  }

  if (!target) {
    printUsage();
    throw new Error("Нужно передать deployment URL или ID");
  }

  const invocation = resolveVercelInvocation();
  const inspectArgs = [...invocation.baseArgs, "inspect", target, "--wait", "--timeout", timeout];

  console.log(`Ожидание Vercel deploy: ${target}`);
  console.log(`Команда: ${invocation.command} ${inspectArgs.join(" ")}`);

  const inspectResult = runCommand(invocation.command, inspectArgs);
  if (inspectResult.status === 0) {
    console.log("Vercel deployment завершён без CLI-ошибки.");
    return;
  }

  console.error("Vercel inspect завершился с ошибкой. Печатаю build logs:");
  const logArgs = [...invocation.baseArgs, "inspect", target, "--logs"];
  runCommand(invocation.command, logArgs);
  process.exit(inspectResult.status ?? 1);
}

await main();
