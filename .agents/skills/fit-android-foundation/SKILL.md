---
name: fit-android-foundation
description: Bootstrap or evolve the Android project foundation for the fit app. Use when Codex needs repo-specific guidance for Kotlin, Jetpack Compose, Gradle modules, package layout, navigation seams, DI boundaries, data/domain/ui layering, or greenfield Android architecture decisions. Do not use for browser-only investigation, OpenAI docs lookup, or generic non-Android tasks.
---

# fit Android Foundation

- Treat this repository as an Android-first fitness app, even when source modules do not exist yet.
- Prefer a small, explicit foundation over template-heavy scaffolding.
- Default to Kotlin + Jetpack Compose + Gradle Kotlin DSL unless the repository clearly establishes something else.
- Start with the minimum number of modules needed for the requested slice.
- Keep package layout predictable: `app`, `core`, `feature`, `domain`, `data` only when there is real code pressure for separation.
- Keep navigation, state ownership, and dependency boundaries obvious to the next engineer.
- Prefer repository interfaces only when there is more than one consumer or a real boundary to protect.
- When bootstrapping from empty, favor a single-app-module start and defer modularization until there is genuine feature surface.
