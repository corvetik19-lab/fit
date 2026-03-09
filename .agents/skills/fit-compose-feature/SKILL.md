---
name: fit-compose-feature
description: Design or implement a Jetpack Compose feature for the fit app. Use when the task is about Android screens, routes, UI state, state holders, event handling, previews, form flows, lists, workout detail views, session tracking UI, or Compose-specific architecture. Do not use for verification-only work, browser debugging, or documentation research by itself.
---

# fit Compose Feature

- Build screens for a workout-first fitness product.
- Keep each feature explicit about route, screen state, actions, side effects, and data dependencies.
- Prefer unidirectional data flow.
- Keep composables mostly stateless and move orchestration into a screen-level state holder.
- Model loading, empty, content, and failure states intentionally.
- Use clear domain language: workout, exercise, session, set, rep, duration, rest, progress.
- Avoid premature design systems. Extract reusable UI only after repetition is real.
- If the repository is still empty, choose the smallest Compose structure that can grow without churn.
