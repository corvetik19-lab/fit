---
name: fit-android-verification
description: Verify Android changes for the fit app without editing source code. Use when Codex needs repo-specific guidance for Gradle commands, lint, unit tests, instrumentation tests, emulator checks, adb inspection, build blockers, or acceptance verification after a Kotlin/Compose change. Do not use for implementation, browser-only debugging, or docs-only research.
---

# fit Android Verification

- Verify with the narrowest useful command first.
- Prefer targeted Gradle tasks before full project builds when the scope is known.
- Use emulator and adb checks only when unit-level verification is insufficient.
- Report missing prerequisites directly when the Android project has not been bootstrapped yet.
- Separate build failures, test failures, and environment failures.
- Do not fix code from this skill; hand failures back to the implementation path with exact evidence.
