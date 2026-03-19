import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "../../e2e/helpers/supabase-admin";

function buildFixtureEmbeddingLiteral() {
  return `[${Array.from({ length: 1024 }, (_, index) =>
    ((index % 8) / 1000).toFixed(8),
  ).join(",")}]`;
}

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

  const { data: mealTemplateRow, error: mealTemplateError } = await supabase
    .from("meal_templates")
    .insert({
      user_id: userId,
      title: `RLS Meal Template ${seed}`,
      payload: {
        source: "rls_fixture",
        items: [
          {
            foodId: foodRow.id,
            foodNameSnapshot: `RLS Food ${seed}`,
            servings: 1,
            kcal: 220,
            protein: 18,
            fat: 7,
            carbs: 24,
          },
        ],
      },
    })
    .select("id")
    .single();

  if (mealTemplateError) {
    throw mealTemplateError;
  }

  const { data: mealRow, error: mealError } = await supabase
    .from("meals")
    .insert({
      user_id: userId,
      source: "manual",
      eaten_at: new Date("2035-01-01T08:00:00.000Z").toISOString(),
    })
    .select("id")
    .single();

  if (mealError) {
    throw mealError;
  }

  const { data: mealItemRow, error: mealItemError } = await supabase
    .from("meal_items")
    .insert({
      user_id: userId,
      meal_id: mealRow.id,
      food_id: foodRow.id,
      food_name_snapshot: `RLS Food ${seed}`,
      servings: 1,
      kcal: 220,
      protein: 18,
      fat: 7,
      carbs: 24,
    })
    .select("id")
    .single();

  if (mealItemError) {
    throw mealItemError;
  }

  const { data: nutritionSummaryRow, error: nutritionSummaryError } = await supabase
    .from("daily_nutrition_summaries")
    .upsert(
      {
        user_id: userId,
        summary_date: weekWindow.weekStartDate,
        kcal: 220,
        protein: 18,
        fat: 7,
        carbs: 24,
      },
      {
        onConflict: "user_id,summary_date",
      },
    )
    .select("id")
    .single();

  if (nutritionSummaryError) {
    throw nutritionSummaryError;
  }

  const { data: goalRow, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      goal_type: "maintenance",
      target_weight_kg: 76.5,
      weekly_training_days: 4,
    })
    .select("id")
    .single();

  if (goalError) {
    throw goalError;
  }

  const { data: nutritionGoalRow, error: nutritionGoalError } = await supabase
    .from("nutrition_goals")
    .insert({
      user_id: userId,
      goal_type: "maintenance",
      kcal_target: 2200,
      protein_target: 160,
      fat_target: 70,
      carbs_target: 240,
      effective_from: weekWindow.weekStartDate,
    })
    .select("id")
    .single();

  if (nutritionGoalError) {
    throw nutritionGoalError;
  }

  const { data: nutritionProfileRow, error: nutritionProfileError } = await supabase
    .from("nutrition_profiles")
    .upsert(
      {
        user_id: userId,
        kcal_target: 2200,
        protein_target: 160,
        fat_target: 70,
        carbs_target: 240,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id")
    .single();

  if (nutritionProfileError) {
    throw nutritionProfileError;
  }

  const { data: bodyMetricRow, error: bodyMetricError } = await supabase
    .from("body_metrics")
    .insert({
      user_id: userId,
      weight_kg: 76.8,
      body_fat_pct: 17.4,
      measured_at: new Date("2035-01-02T09:00:00.000Z").toISOString(),
    })
    .select("id")
    .single();

  if (bodyMetricError) {
    throw bodyMetricError;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        user_id: userId,
        full_name: `RLS User ${seed}`,
        avatar_url: `https://example.com/avatar-${seed}.png`,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id")
    .single();

  if (profileError) {
    throw profileError;
  }

  const { data: onboardingProfileRow, error: onboardingProfileError } =
    await supabase
      .from("onboarding_profiles")
      .upsert(
        {
          user_id: userId,
          age: 31,
          sex: "male",
          height_cm: 182,
          weight_kg: 76.8,
          fitness_level: "intermediate",
          equipment: ["barbell", "dumbbells"],
          injuries: [],
          dietary_preferences: ["high_protein"],
        },
        {
          onConflict: "user_id",
        },
      )
      .select("id")
      .single();

  if (onboardingProfileError) {
    throw onboardingProfileError;
  }

  const { data: dailyMetricsRow, error: dailyMetricsError } = await supabase
    .from("daily_metrics")
    .insert({
      user_id: userId,
      metric_date: weekWindow.weekStartDate,
      workout_count: 1,
      total_reps: 32,
      total_kcal: 220,
      adherence_score: 0.82,
    })
    .select("id")
    .single();

  if (dailyMetricsError) {
    throw dailyMetricsError;
  }

  const { data: periodMetricSnapshotRow, error: periodMetricSnapshotError } =
    await supabase
      .from("period_metric_snapshots")
      .insert({
        user_id: userId,
        period_key: `week:${weekWindow.weekStartDate}`,
        period_start: weekWindow.weekStartDate,
        period_end: weekWindow.weekEndDate,
        payload: {
          source: "rls_fixture",
          workouts: 1,
          kcal: 220,
        },
      })
      .select("id")
      .single();

  if (periodMetricSnapshotError) {
    throw periodMetricSnapshotError;
  }

  const { data: userMemoryFactRow, error: userMemoryFactError } = await supabase
    .from("user_memory_facts")
    .insert({
      user_id: userId,
      fact_type: "preference",
      content: `RLS memory fact ${seed}`,
      source: "rls_fixture",
      confidence: 0.91,
    })
    .select("id")
    .single();

  if (userMemoryFactError) {
    throw userMemoryFactError;
  }

  const { data: aiSafetyEventRow, error: aiSafetyEventError } = await supabase
    .from("ai_safety_events")
    .insert({
      user_id: userId,
      route_key: "assistant",
      action: "blocked_response",
      prompt_excerpt: `RLS safety event ${seed}`,
      payload: {
        source: "rls_fixture",
        severity: "medium",
      },
    })
    .select("id")
    .single();

  if (aiSafetyEventError) {
    throw aiSafetyEventError;
  }

  const currentPeriodStart = new Date("2035-01-01T00:00:00.000Z").toISOString();
  const currentPeriodEnd = new Date("2035-02-01T00:00:00.000Z").toISOString();

  const { data: subscriptionRow, error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      provider: "stripe",
      provider_subscription_id: `sub_rls_${seed}`,
      provider_customer_id: `cus_rls_${seed}`,
      status: "active",
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    })
    .select("id")
    .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { data: subscriptionEventRow, error: subscriptionEventError } =
    await supabase
      .from("subscription_events")
      .insert({
        user_id: userId,
        subscription_id: subscriptionRow.id,
        provider_event_id: `evt_rls_${seed}`,
        event_type: "customer.subscription.updated",
        payload: {
          source: "rls_fixture",
          status: "active",
        },
      })
      .select("id")
      .single();

  if (subscriptionEventError) {
    throw subscriptionEventError;
  }

  const { data: entitlementRow, error: entitlementError } = await supabase
    .from("entitlements")
    .upsert(
      {
        user_id: userId,
        feature_key: "meal_photo",
        limit_value: 100,
        is_enabled: true,
      },
      {
        onConflict: "user_id,feature_key",
      },
    )
    .select("id")
    .single();

  if (entitlementError) {
    throw entitlementError;
  }

  const { data: usageCounterRow, error: usageCounterError } = await supabase
    .from("usage_counters")
    .upsert(
      {
        user_id: userId,
        metric_key: "ai_messages",
        metric_window: "monthly",
        usage_count: 7,
        reset_at: currentPeriodEnd,
      },
      {
        onConflict: "user_id,metric_key,metric_window",
      },
    )
    .select("id")
    .single();

  if (usageCounterError) {
    throw usageCounterError;
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

  const { data: workoutDayRow, error: workoutDayError } = await supabase
    .from("workout_days")
    .insert({
      user_id: userId,
      weekly_program_id: programRow.id,
      day_of_week: 1,
      status: "planned",
      body_weight_kg: 76.8,
      session_note: `RLS workout day ${seed}`,
      session_duration_seconds: 0,
    })
    .select("id")
    .single();

  if (workoutDayError) {
    throw workoutDayError;
  }

  const { data: workoutExerciseRow, error: workoutExerciseError } =
    await supabase
      .from("workout_exercises")
      .insert({
        user_id: userId,
        workout_day_id: workoutDayRow.id,
        exercise_library_id: exerciseRow.id,
        exercise_title_snapshot: `RLS Exercise ${seed}`,
        sets_count: 1,
        sort_order: 1,
      })
      .select("id")
      .single();

  if (workoutExerciseError) {
    throw workoutExerciseError;
  }

  const { data: workoutSetRow, error: workoutSetError } = await supabase
    .from("workout_sets")
    .insert({
      user_id: userId,
      workout_exercise_id: workoutExerciseRow.id,
      set_number: 1,
      planned_reps: 8,
      planned_reps_min: 8,
      planned_reps_max: 10,
      actual_reps: 8,
      actual_weight_kg: 60,
      actual_rpe: 8,
    })
    .select("id")
    .single();

  if (workoutSetError) {
    throw workoutSetError;
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

  const { data: recipeItemRow, error: recipeItemError } = await supabase
    .from("recipe_items")
    .insert({
    user_id: userId,
    recipe_id: recipeRow.id,
    food_id: foodRow.id,
    food_name_snapshot: `RLS Food ${seed}`,
    servings: 1,
    kcal: 220,
    protein: 18,
    fat: 7,
    carbs: 24,
    })
    .select("id")
    .single();

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

  const { data: knowledgeEmbeddingRow, error: knowledgeEmbeddingError } = await supabase
    .from("knowledge_embeddings")
    .insert({
      user_id: userId,
      chunk_id: knowledgeChunkRow.id,
      embedding: buildFixtureEmbeddingLiteral(),
      model: "text-embedding-3-small",
    })
    .select("id")
    .single();

  if (knowledgeEmbeddingError) {
    throw knowledgeEmbeddingError;
  }

  return {
    chatMessageId: chatMessageRow.id as string,
    chatSessionId: chatSessionRow.id as string,
    contextSnapshotId: contextSnapshotRow.id as string,
    adminProposalId: adminProposalRow.id as string,
    adminUserId,
    aiSafetyEventId: aiSafetyEventRow.id as string,
    bodyMetricId: bodyMetricRow.id as string,
    dailyMetricsId: dailyMetricsRow.id as string,
    goalId: goalRow.id as string,
    deletionRequestId: deletionRequestRow.id as string,
    entitlementId: entitlementRow.id as string,
    exerciseId: exerciseRow.id as string,
    exportJobId: exportJobRow.id as string,
    foodId: foodRow.id as string,
    knowledgeChunkId: knowledgeChunkRow.id as string,
    knowledgeEmbeddingId: knowledgeEmbeddingRow.id as string,
    mealId: mealRow.id as string,
    mealItemId: mealItemRow.id as string,
    mealTemplateId: mealTemplateRow.id as string,
    nutritionGoalId: nutritionGoalRow.id as string,
    nutritionProfileId: nutritionProfileRow.id as string,
    nutritionSummaryId: nutritionSummaryRow.id as string,
    onboardingProfileId: onboardingProfileRow.id as string,
    periodMetricSnapshotId: periodMetricSnapshotRow.id as string,
    profileId: profileRow.id as string,
    programId: programRow.id as string,
    recipeId: recipeRow.id as string,
    recipeItemId: recipeItemRow.id as string,
    subscriptionEventId: subscriptionEventRow.id as string,
    subscriptionId: subscriptionRow.id as string,
    userId,
    userMemoryFactId: userMemoryFactRow.id as string,
    userProposalId: userProposalRow.id as string,
    workoutDayId: workoutDayRow.id as string,
    workoutExerciseId: workoutExerciseRow.id as string,
    workoutSetId: workoutSetRow.id as string,
    usageCounterId: usageCounterRow.id as string,
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
