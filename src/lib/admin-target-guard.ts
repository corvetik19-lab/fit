import type { User } from "@supabase/supabase-js";

import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const PRIMARY_SUPER_ADMIN_GUARD_MESSAGE = `Primary super admin ${PRIMARY_SUPER_ADMIN_EMAIL} is protected from suspension and deletion.`;

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
  const user = await getAuthUserById(adminSupabase, userId);

  if (isPrimarySuperAdminEmail(user?.email ?? null)) {
    throw new Error(PRIMARY_SUPER_ADMIN_GUARD_MESSAGE);
  }

  return user;
}
