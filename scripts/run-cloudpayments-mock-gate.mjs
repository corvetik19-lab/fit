import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "node.exe" : "node";

const result = spawnSync(
  command,
  [
    "scripts/run-playwright.mjs",
    "PLAYWRIGHT_SKIP_AUTH_SETUP=1",
    "--",
    "test",
    "tests/billing-gate/billing-runtime-gate.spec.ts",
    "--workers=1",
  ],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_BILLING_PROVIDER: "cloudpayments",
      NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID: "mock-cloudpayments-public-id",
      CLOUDPAYMENTS_API_SECRET: "mock-cloudpayments-api-secret",
      CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB: "1490",
      CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION: "fit Premium - 1 month",
      CLOUDPAYMENTS_WEBHOOK_SECRET: "mock-cloudpayments-webhook-secret",
      CLOUDPAYMENTS_TEST_MODE: "mock",
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
