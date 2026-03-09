import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicKey, publicEnv } from "@/lib/env";

export function createClient() {
  const publicKey = getSupabasePublicKey();

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicKey);
}
