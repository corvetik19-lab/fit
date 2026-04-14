# Android and TWA Guidance

- Treat Android as a wrapper around the web product unless the task explicitly changes native behavior.
- Reuse the existing `fit-android-*` skills before inventing new Android workflows.
- Keep deep-link, signing, asset, and TWA assumptions aligned with `docs/ANDROID_TWA.md`.
- Validate Android-facing changes with the narrowest reproducible verification path first.
- For review, treat deep-link drift, signing/config mismatch, and broken TWA assumptions as reportable.
- After substantial Android or TWA changes, sync `docs/ANDROID_TWA.md`,
  `docs/MASTER_PLAN.md`, and `docs/AI_WORKLOG.md`.
