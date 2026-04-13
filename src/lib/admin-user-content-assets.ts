import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminContentAssetType = "exercise" | "food";

type AdminContentAssetConfig = {
  action: string;
  label: string;
  nameColumn: string;
  select: string;
  table: "exercise_library" | "foods";
};

const CONTENT_ASSET_CONFIG: Record<AdminContentAssetType, AdminContentAssetConfig> = {
  exercise: {
    action: "admin_update_exercise_image",
    label: "изображение упражнения",
    nameColumn: "title",
    select: "id, title, muscle_group, image_url, updated_at",
    table: "exercise_library",
  },
  food: {
    action: "admin_update_food_image",
    label: "изображение продукта",
    nameColumn: "name",
    select: "id, name, brand, source, image_url, updated_at",
    table: "foods",
  },
};

export async function updateAdminUserContentAsset(params: {
  actorUserId: string;
  entityId: string;
  entityType: AdminContentAssetType;
  imageUrl: string | null;
  reason: string;
  supabase: SupabaseClient;
  targetUserId: string;
}) {
  const { actorUserId, entityId, entityType, imageUrl, reason, supabase, targetUserId } =
    params;
  const config = CONTENT_ASSET_CONFIG[entityType];

  const { data, error } = await supabase
    .from(config.table)
    .update({
      image_url: imageUrl,
    })
    .eq("id", entityId)
    .eq("user_id", targetUserId)
    .select(config.select)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const entityName = data[config.nameColumn as keyof typeof data];

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: config.action,
    reason,
    payload: {
      entityId,
      entityName,
      entityType,
      imageUrl,
      label: config.label,
    },
  });

  if (auditError) {
    throw auditError;
  }

  return data;
}
