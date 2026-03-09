import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicKey, publicEnv, serverEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    (!serverEnv.SUPABASE_SERVICE_ROLE_KEY && !getSupabasePublicKey())
  ) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
