import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

let adminClient: SupabaseClient | null = null;

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for Playwright admin helpers.`);
  }

  return value;
}

export function createSupabaseAdminTestClient() {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
}

export async function findAuthUserIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseAdminTestClient();

  for (let page = 1; page <= 10; page += 1) {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const targetUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (targetUser) {
      return targetUser.id;
    }

    if (users.length < 200) {
      break;
    }
  }

  throw new Error(`Playwright auth user not found for email: ${email}`);
}
