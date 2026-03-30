import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const configPath = path.join(cwd, "android", "twa-release.json");
const assetLinksFilePath = path.join(cwd, "public", "android-assetlinks.json");

function fail(message) {
  console.error(`android-twa: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`android-twa: ${message}`);
}

function assertFile(relativePath) {
  const filePath = path.join(cwd, relativePath);

  if (!fs.existsSync(filePath)) {
    fail(`missing file ${relativePath}`);
  }
}

if (!fs.existsSync(configPath)) {
  fail("missing android/twa-release.json");
} else {
  const rawConfig = fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
  const config = JSON.parse(rawConfig);

  const packageNamePattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

  if (!packageNamePattern.test(config.packageName ?? "")) {
    fail("packageName in android/twa-release.json is invalid");
  }

  if (!config.assetLinksPath || config.assetLinksPath !== "/.well-known/assetlinks.json") {
    fail("assetLinksPath must be '/.well-known/assetlinks.json'");
  }

  if (!config.startUrl || !String(config.startUrl).startsWith("/")) {
    fail("startUrl must start with '/'");
  }

  if (!config.host || String(config.host).includes("localhost")) {
    fail("host must point to the production web origin, not localhost");
  }

  [
    config.icon192Path,
    config.icon512Path,
    config.maskableIconPath,
    config.splashIconPath,
    "public/sw.js",
    "src/app/manifest.ts",
  ].forEach(assertFile);

  if (!config.playStore?.title || !config.playStore?.shortDescription) {
    fail("playStore metadata is incomplete");
  }

  if (!config.signing?.packageNameEnv || !config.signing?.fingerprintsEnv) {
    fail("signing env names are missing");
  }

  const packageName = process.env[config.signing.packageNameEnv] || config.packageName;
  const fingerprints = (process.env[config.signing.fingerprintsEnv] ?? "")
    .split(/[\n,;]+/)
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const assetLinksPayload = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [...new Set(fingerprints)],
      },
    },
  ];

  fs.mkdirSync(path.dirname(assetLinksFilePath), { recursive: true });
  fs.writeFileSync(assetLinksFilePath, `${JSON.stringify(assetLinksPayload, null, 2)}\n`, "utf8");

  if (!fingerprints.length) {
    warn(
      `${config.signing.fingerprintsEnv} is not set; public/android-assetlinks.json will be generated without release fingerprints until they are configured`,
    );
  }

  console.log("android-twa: scaffold is ready");
  console.log("android-twa: asset links synced to public/android-assetlinks.json and served via /.well-known/assetlinks.json rewrite");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
