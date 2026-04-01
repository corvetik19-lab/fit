import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function hasValue(key) {
  return Boolean(process.env[key]?.trim());
}

function printGroup(title, entries) {
  console.log(`\n[${title}]`);

  for (const entry of entries) {
    const status = hasValue(entry.key) ? "ok" : "missing";
    console.log(
      `- ${status.padEnd(7)} ${entry.key}${entry.scope ? ` (${entry.scope})` : ""}`,
    );
  }
}

const groups = [
  {
    title: "Web/PWA baseline",
    entries: [
      { key: "NEXT_PUBLIC_SUPABASE_URL", scope: "preview + production + CI" },
      {
        key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        scope: "preview + production + CI",
      },
      { key: "SUPABASE_SERVICE_ROLE_KEY", scope: "preview + production + CI" },
      { key: "CRON_SECRET", scope: "preview + production" },
      { key: "ADMIN_BOOTSTRAP_TOKEN", scope: "preview + production" },
    ],
  },
  {
    title: "AI runtime",
    entries: [
      { key: "OPENROUTER_API_KEY", scope: "preview + production" },
      { key: "OPENROUTER_CHAT_MODEL", scope: "optional override" },
      { key: "OPENROUTER_VISION_MODEL", scope: "optional override" },
      { key: "VOYAGE_API_KEY", scope: "preview + production" },
      { key: "VOYAGE_EMBEDDING_MODEL", scope: "optional override" },
      { key: "AI_GATEWAY_API_KEY", scope: "optional fallback" },
    ],
  },
  {
    title: "Stripe",
    entries: [
      { key: "STRIPE_SECRET_KEY", scope: "preview + production" },
      {
        key: "STRIPE_PREMIUM_MONTHLY_PRICE_ID",
        scope: "preview + production",
      },
      { key: "STRIPE_WEBHOOK_SECRET", scope: "preview + production" },
    ],
  },
  {
    title: "Sentry",
    entries: [
      { key: "NEXT_PUBLIC_SENTRY_DSN", scope: "preview + production" },
      { key: "SENTRY_ORG", scope: "CI + production build" },
      { key: "SENTRY_PROJECT", scope: "CI + production build" },
      { key: "SENTRY_AUTH_TOKEN", scope: "CI + production build" },
    ],
  },
  {
    title: "GitHub Actions full regression",
    entries: [
      { key: "PLAYWRIGHT_TEST_EMAIL", scope: "CI secret" },
      { key: "PLAYWRIGHT_TEST_PASSWORD", scope: "CI secret" },
      { key: "PLAYWRIGHT_ADMIN_EMAIL", scope: "CI secret" },
      { key: "PLAYWRIGHT_ADMIN_PASSWORD", scope: "CI secret" },
      { key: "SUPABASE_PROJECT_REF", scope: "CI secret for advisors" },
      { key: "SUPABASE_ACCESS_TOKEN", scope: "CI secret for advisors" },
    ],
  },
  {
    title: "Android/TWA",
    entries: [
      { key: "ANDROID_TWA_PACKAGE_NAME", scope: "optional override" },
      { key: "ANDROID_TWA_SHA256_FINGERPRINTS", scope: "release env" },
    ],
  },
];

console.log("Runtime env readiness matrix for fit");
console.log("Use this output together with docs/PROD_READY.md and docs/RELEASE_CHECKLIST.md.");

for (const group of groups) {
  printGroup(group.title, group.entries);
}
