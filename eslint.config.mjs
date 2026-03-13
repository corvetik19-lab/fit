import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".github/**",
    ".next/**",
    ".next*/**",
    "out/**",
    "build/**",
    "output/**",
    "coverage/**",
    "ai-evals/**",
    "public/**/*.svg",
    "public/**/*.html",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
