import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "../../e2e/helpers/supabase-admin";

loadEnvConfig(process.cwd());

const regularEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? null;
const regularPassword = process.env.PLAYWRIGHT_TEST_PASSWORD ?? null;
const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? null;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? null;

type RlsAuthKind = "admin" | "user";

function getPublicSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for RLS tests.");
  }

  return value;
}

function getPublicSupabaseKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for RLS tests.",
    );
  }

  return value;
}

function getAuthCredentials(kind: RlsAuthKind) {
  if (kind === "admin") {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        "PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD are required for admin RLS tests.",
      );
    }

    return {
      email: adminEmail,
      password: adminPassword,
    };
  }

  if (!regularEmail || !regularPassword) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required for user RLS tests.",
    );
  }

  return {
    email: regularEmail,
    password: regularPassword,
  };
}

function createPublicSupabaseTestClient() {
  return createClient(getPublicSupabaseUrl(), getPublicSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildFixtureWeekWindow(seed: string) {
  const baseDate = new Date("2035-01-01T00:00:00.000Z");
  const offsetDays = Number.parseInt(seed.slice(0, 4), 16) % 900;
  const weekStart = addUtcDays(baseDate, offsetDays);

  return {
    weekStartDate: toDateString(weekStart),
    weekEndDate: toDateString(addUtcDays(weekStart, 6)),
  };
}

export function hasRlsTestEnv() {
  return Boolean(
    regularEmail &&
      regularPassword &&
      adminEmail &&
      adminPassword &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function signInAsRlsUser(kind: RlsAuthKind) {
  const credentials = getAuthCredentials(kind);
  const client = createPublicSupabaseTestClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(`Supabase auth user not returned for ${credentials.email}.`);
  }

  return {
    client,
    email: credentials.email,
    userId: data.user.id,
  };
}

export async function signOutRlsUser(client: SupabaseClient) {
  await client.auth.signOut();
}

export async function seedRlsOwnershipFixture() {
  const supabase = createSupabaseAdminTestClient();
  const userId = await findAuthUserIdByEmail(getAuthCredentials("user").email);
  const adminUserId = await findAuthUserIdByEmail(getAuthCredentials("admin").email);
  const seed = crypto.randomUUID().slice(0, 8);
  const weekWindow = buildFixtureWeekWindow(seed);
  const deletionHoldUntil = addUtcDays(new Date("2035-01-01T00:00:00.000Z"), 14).toISOString();

  const { data: userProposalRow, error: userProposalError } = await supabase
    .from("ai_plan_proposals")
    .insert({
      user_id: userId,
      proposal_type: "meal_plan",
      status: "draft",
      payload: {
        kind: "meal_plan",
        request: {
          goal: "maintenance",
          kcalTarget: 2150,
          dietaryNotes: `RLS seed ${seed}`,
          mealsPerDay: 4,
        },
        proposal: {
          title: `RLS Meal Proposal ${seed}`,
          caloriesTarget: 2150,
          macros: {
            protein: 160,
            fat: 70,
            carbs: 220,
          },
          meals: [
            {
              name: "Breakfast",
              kcal: 600,
              items: ["Eggs", "Toast"],
            },
          ],
        },
      },
    })
    .select("id")
    .single();

  if (userProposalError) {
    throw userProposalError;
  }

  const { data: adminProposalRow, error: adminProposalError } = await supabase
    .from("ai_plan_proposals")
    .insert({
      user_id: adminUserId,
      proposal_type: "meal_plan",
      status: "draft",
      payload: {
        kind: "meal_plan",
        request: {
          goal: "maintenance",
          kcalTarget: 2300,
          dietaryNotes: `Admin RLS seed ${seed}`,
          mealsPerDay: 4,
        },
        proposal: {
          title: `Admin Meal Proposal ${seed}`,
          caloriesTarget: 2300,
          macros: {
            protein: 170,
            fat: 75,
            carbs: 240,
          },
          meals: [
            {
              name: "Breakfast",
              kcal: 650,
              items: ["Oats", "Yogurt"],
            },
          ],
        },
      },
    })
    .select("id")
    .single();

  if (adminProposalError) {
    throw adminProposalError;
  }

  const { data: exerciseRow, error: exerciseError } = await supabase
    .from("exercise_library")
    .insert({
      user_id: userId,
      title: `RLS Exercise ${seed}`,
      muscle_group: "Chest",
      description: "RLS ownership fixture",
      note: "Seeded by test:rls",
      is_archived: false,
    })
    .select("id")
    .single();

  if (exerciseError) {
    throw exerciseError;
  }

  const { data: foodRow, error: foodError } = await supabase
    .from("foods")
    .insert({
      user_id: userId,
      source: "custom",
      name: `RLS Food ${seed}`,
      kcal: 220,
      protein: 18,
      fat: 7,
      carbs: 24,
    })
    .select("id")
    .single();

  if (foodError) {
    throw foodError;
  }

  const { data: programRow, error: programError } = await supabase
    .from("weekly_programs")
    .insert({
      user_id: userId,
      title: `RLS Program ${seed}`,
      status: "draft",
      week_start_date: weekWindow.weekStartDate,
      week_end_date: weekWindow.weekEndDate,
      is_locked: false,
    })
    .select("id")
    .single();

  if (programError) {
    throw programError;
  }

  const { data: workoutTemplateRow, error: workoutTemplateError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: userId,
      title: `RLS Template ${seed}`,
      payload: {
        days: [
          {
            dayOfWeek: 1,
            exercises: [
              {
                exerciseTitleSnapshot: `RLS Exercise ${seed}`,
                setsCount: 4,
                plannedReps: 8,
                plannedRepsMin: 8,
                plannedRepsMax: 10,
                repRangeKey: "strength",
                exerciseLibraryId: exerciseRow.id,
              },
            ],
          },
        ],
      },
    })
    .select("id")
    .single();

  if (workoutTemplateError) {
    throw workoutTemplateError;
  }

  const { data: recipeRow, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: `RLS Recipe ${seed}`,
      instructions: "RLS ownership fixture",
      servings: 2,
    })
    .select("id")
    .single();

  if (recipeError) {
    throw recipeError;
  }

  const { error: recipeItemError } = await supabase.from("recipe_items").insert({
    user_id: userId,
    recipe_id: recipeRow.id,
    food_id: foodRow.id,
    food_name_snapshot: `RLS Food ${seed}`,
    servings: 1,
    kcal: 220,
    protein: 18,
    fat: 7,
    carbs: 24,
  });

  if (recipeItemError) {
    throw recipeItemError;
  }

  const { data: chatSessionRow, error: chatSessionError } = await supabase
    .from("ai_chat_sessions")
    .insert({
      user_id: userId,
      title: `RLS Chat Session ${seed}`,
    })
    .select("id")
    .single();

  if (chatSessionError) {
    throw chatSessionError;
  }

  const { data: chatMessageRow, error: chatMessageError } = await supabase
    .from("ai_chat_messages")
    .insert({
      user_id: userId,
      session_id: chatSessionRow.id,
      role: "user",
      content: `RLS chat message ${seed}`,
    })
    .select("id")
    .single();

  if (chatMessageError) {
    throw chatMessageError;
  }

  const { data: exportJobRow, error: exportJobError } = await supabase
    .from("export_jobs")
    .insert({
      user_id: userId,
      requested_by: userId,
      format: "json_csv_zip",
      status: "queued",
    })
    .select("id, status")
    .single();

  if (exportJobError) {
    throw exportJobError;
  }

  const { data: deletionRequestRow, error: deletionRequestError } = await supabase
    .from("deletion_requests")
    .upsert(
      {
        user_id: userId,
        requested_by: userId,
        status: "holding",
        hold_until: deletionHoldUntil,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id, status")
    .single();

  if (deletionRequestError) {
    throw deletionRequestError;
  }

  const { data: contextSnapshotRow, error: contextSnapshotError } = await supabase
    .from("user_context_snapshots")
    .insert({
      user_id: userId,
      snapshot_reason: "rls_fixture",
      payload: {
        summary: `RLS context snapshot ${seed}`,
        source: "rls_test",
      },
    })
    .select("id")
    .single();

  if (contextSnapshotError) {
    throw contextSnapshotError;
  }

  const { data: knowledgeChunkRow, error: knowledgeChunkError } = await supabase
    .from("knowledge_chunks")
    .insert({
      user_id: userId,
      source_type: "rls_fixture",
      source_id: seed,
      content: `RLS knowledge chunk ${seed}`,
      metadata: {
        source: "rls_test",
      },
    })
    .select("id")
    .single();

  if (knowledgeChunkError) {
    throw knowledgeChunkError;
  }

  return {
    chatMessageId: chatMessageRow.id as string,
    chatSessionId: chatSessionRow.id as string,
    contextSnapshotId: contextSnapshotRow.id as string,
    adminProposalId: adminProposalRow.id as string,
    adminUserId,
    deletionRequestId: deletionRequestRow.id as string,
    exerciseId: exerciseRow.id as string,
    exportJobId: exportJobRow.id as string,
    foodId: foodRow.id as string,
    knowledgeChunkId: knowledgeChunkRow.id as string,
    programId: programRow.id as string,
    recipeId: recipeRow.id as string,
    userId,
    userProposalId: userProposalRow.id as string,
    workoutTemplateId: workoutTemplateRow.id as string,
  };
}

export async function readProposalStatus(proposalId: string) {
  const supabase = createSupabaseAdminTestClient();
  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .select("id, user_id, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id: string; status: string; user_id: string } | null;
}
