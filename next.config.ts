import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
      },
    ],
  },
  rewrites: async () => [
    {
      source: "/.well-known/assetlinks.json",
      destination: "/android-assetlinks.json",
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
      ],
    },
  ],
};

const hasSentryBuildConfig = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

export default hasSentryBuildConfig
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      disableLogger: true,
      tunnelRoute: "/monitoring",
      automaticVercelMonitors: true,
      webpack: {
        autoInstrumentAppDirectory: true,
        autoInstrumentMiddleware: true,
        autoInstrumentServerFunctions: true,
        treeshake: {
          removeDebugLogging: true,
        },
      },
    })
  : nextConfig;
