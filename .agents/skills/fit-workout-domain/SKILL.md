---
name: fit-workout-domain
description: Apply workout-domain guidance for the fit app. Use when the task involves workout plans, exercises, training sessions, sets, reps, timers, progress tracking, onboarding for goals, or cloud-synced workout behavior. Do not use for nutrition-first features, wearables-first integrations, or generic Android plumbing without workout semantics.
---

# fit Workout Domain

- Treat workout flows as the core product surface.
- Prefer domain terms that match how users train: plan, day, exercise, set, rep, rest, duration, weight, distance, completion.
- Keep units explicit and avoid hidden conversions.
- Separate planned workout data from completed session data.
- Preserve room for progression history and future sync, but do not overdesign schemas before the feature needs them.
- Optimize for clarity of user progress and session continuity over novelty.
- When tradeoffs appear, choose the behavior that makes workout execution faster and less error-prone.
