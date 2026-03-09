import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminRouteAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Admin auth required.");
  }

  const { data: platformAdmin, error } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!platformAdmin) {
    throw new Error("Admin access denied.");
  }

  return {
    user,
    role: platformAdmin.role,
  };
}
