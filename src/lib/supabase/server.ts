import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicKey, publicEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const publicKey = getSupabasePublicKey();

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Cookie writes are only allowed in Route Handlers and Server Actions.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // Server Components must stay read-only with respect to cookies.
          }
        },
      },
    },
  );
}
