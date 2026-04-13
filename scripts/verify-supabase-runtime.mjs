import dns from "node:dns/promises";
import { setTimeout as delay } from "node:timers/promises";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function readEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    clear() {
      clearTimeout(timer);
    },
    signal: controller.signal,
  };
}

async function verifyDns(hostname) {
  try {
    const lookup = await dns.lookup(hostname);
    console.log(`[ok] DNS resolves ${hostname} -> ${lookup.address}`);
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка DNS.";
    console.error(`[fail] DNS does not resolve ${hostname}: ${message}`);
    return false;
  }
}

async function verifyHttps(url) {
  const { clear, signal } = createTimeoutSignal(10_000);

  try {
    const response = await fetch(url, {
      headers: {
        apikey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? "",
      },
      method: "GET",
      signal,
    });

    console.log(`[ok] HTTPS reachable ${url} -> ${response.status}`);
    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка сети.";
    console.error(`[fail] HTTPS request failed ${url}: ${message}`);
    return false;
  } finally {
    clear();
  }
}

async function main() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");

  if (!supabaseUrl) {
    console.error("[fail] NEXT_PUBLIC_SUPABASE_URL is missing");
    process.exit(1);
  }

  const parsedUrl = new URL(supabaseUrl);

  console.log("Supabase runtime preflight for fit");
  console.log(`- base url: ${parsedUrl.origin}`);
  console.log(`- hostname: ${parsedUrl.hostname}`);

  const dnsOk = await verifyDns(parsedUrl.hostname);

  if (!dnsOk) {
    console.error(
      "[hint] Проверь актуальность project URL и DNS-доступность Supabase host для этой среды.",
    );
    process.exit(1);
  }

  const authOk = await verifyHttps(`${parsedUrl.origin}/auth/v1/settings`);
  await delay(150);
  const restOk = await verifyHttps(`${parsedUrl.origin}/rest/v1/`);

  if (!authOk || !restOk) {
    console.error(
      "[hint] Host резолвится, но runtime всё ещё не готов. Проверь firewall, proxy, TLS и текущие env ключи.",
    );
    process.exit(1);
  }

  console.log("[ok] Supabase runtime reachable for auth and REST surface");
}

await main();
