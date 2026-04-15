import type { User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const PRIMARY_SUPER_ADMIN_GUARD_MESSAGE =
  "Primary super admin guard is disabled for role-based super-admin access.";

export async function getAuthUserById(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<User | null> {
  const { data, error } = await adminSupabase.auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export async function assertUserIsNotPrimarySuperAdmin(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<User | null> {
  return getAuthUserById(adminSupabase, userId);
}
