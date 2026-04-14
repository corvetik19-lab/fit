# Supabase Guidance

- Use the `fit` Supabase MCP target first and verify the active project before mutating anything.
- Schema changes live only in `supabase/migrations`.
- Every business table remains owner-scoped and protected by RLS.
- Service-role flows must stay server-only and be auditable.
- For review, treat policy weakening, RLS disablement, missing advisor follow-up, and service-role leakage as reportable.
- After substantial DB work, sync `docs/DB_AUDIT.md`, `docs/BACKEND.md`,
  `docs/MASTER_PLAN.md`, and `docs/AI_WORKLOG.md`.
