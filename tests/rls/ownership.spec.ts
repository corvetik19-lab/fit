import { expect, test } from "@playwright/test";

import {
  hasRlsTestEnv,
  readProposalStatus,
  seedRlsOwnershipFixture,
  signInAsRlsUser,
  signOutRlsUser,
} from "./helpers/supabase-rls";

test.describe("rls ownership", () => {
  test.skip(!hasRlsTestEnv(), "requires Supabase auth and service-role env for RLS tests");

  test("direct Supabase clients only see and mutate their own user-scoped rows", async () => {
    test.setTimeout(60_000);

    const fixture = await seedRlsOwnershipFixture();
    const regularUser = await signInAsRlsUser("user");
    const adminUser = await signInAsRlsUser("admin");

    try {
      const { data: ownProposalRows, error: ownProposalError } = await regularUser.client
        .from("ai_plan_proposals")
        .select("id, user_id, status")
        .eq("id", fixture.userProposalId);

      expect(ownProposalError).toBeNull();
      expect(ownProposalRows).toHaveLength(1);
      expect(ownProposalRows?.[0]?.id).toBe(fixture.userProposalId);
      expect(ownProposalRows?.[0]?.user_id).toBe(fixture.userId);

      const { data: hiddenAdminProposalRows, error: hiddenAdminProposalError } =
        await regularUser.client
          .from("ai_plan_proposals")
          .select("id")
          .eq("id", fixture.adminProposalId);

      expect(hiddenAdminProposalError).toBeNull();
      expect(hiddenAdminProposalRows).toEqual([]);

      const { data: hiddenProposalRows, error: hiddenProposalError } = await adminUser.client
        .from("ai_plan_proposals")
        .select("id, user_id, status")
        .eq("id", fixture.userProposalId);

      expect(hiddenProposalError).toBeNull();
      expect(hiddenProposalRows).toEqual([]);

      const { data: hiddenExerciseRows, error: hiddenExerciseError } = await adminUser.client
        .from("exercise_library")
        .select("id")
        .eq("id", fixture.exerciseId);

      expect(hiddenExerciseError).toBeNull();
      expect(hiddenExerciseRows).toEqual([]);

      const { data: hiddenProgramRows, error: hiddenProgramError } = await adminUser.client
        .from("weekly_programs")
        .select("id")
        .eq("id", fixture.programId);

      expect(hiddenProgramError).toBeNull();
      expect(hiddenProgramRows).toEqual([]);

      const { data: ownWorkoutDayRows, error: ownWorkoutDayError } =
        await regularUser.client
          .from("workout_days")
          .select("id, user_id, status, day_of_week")
          .eq("id", fixture.workoutDayId);

      expect(ownWorkoutDayError).toBeNull();
      expect(ownWorkoutDayRows).toHaveLength(1);
      expect(ownWorkoutDayRows?.[0]?.id).toBe(fixture.workoutDayId);
      expect(ownWorkoutDayRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownWorkoutDayRows?.[0]?.status).toBe("planned");
      expect(ownWorkoutDayRows?.[0]?.day_of_week).toBe(1);

      const { data: ownWorkoutExerciseRows, error: ownWorkoutExerciseError } =
        await regularUser.client
          .from("workout_exercises")
          .select("id, user_id, workout_day_id, sets_count")
          .eq("id", fixture.workoutExerciseId);

      expect(ownWorkoutExerciseError).toBeNull();
      expect(ownWorkoutExerciseRows).toHaveLength(1);
      expect(ownWorkoutExerciseRows?.[0]?.id).toBe(fixture.workoutExerciseId);
      expect(ownWorkoutExerciseRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownWorkoutExerciseRows?.[0]?.workout_day_id).toBe(fixture.workoutDayId);
      expect(ownWorkoutExerciseRows?.[0]?.sets_count).toBe(1);

      const { data: ownWorkoutSetRows, error: ownWorkoutSetError } =
        await regularUser.client
          .from("workout_sets")
          .select("id, user_id, workout_exercise_id, actual_reps")
          .eq("id", fixture.workoutSetId);

      expect(ownWorkoutSetError).toBeNull();
      expect(ownWorkoutSetRows).toHaveLength(1);
      expect(ownWorkoutSetRows?.[0]?.id).toBe(fixture.workoutSetId);
      expect(ownWorkoutSetRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownWorkoutSetRows?.[0]?.workout_exercise_id).toBe(
        fixture.workoutExerciseId,
      );
      expect(ownWorkoutSetRows?.[0]?.actual_reps).toBe(8);

      const { data: ownGoalRows, error: ownGoalError } = await regularUser.client
        .from("goals")
        .select("id, user_id, goal_type, weekly_training_days")
        .eq("id", fixture.goalId);

      expect(ownGoalError).toBeNull();
      expect(ownGoalRows).toHaveLength(1);
      expect(ownGoalRows?.[0]?.id).toBe(fixture.goalId);
      expect(ownGoalRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownGoalRows?.[0]?.goal_type).toBe("maintenance");
      expect(ownGoalRows?.[0]?.weekly_training_days).toBe(4);

      const { data: ownNutritionGoalRows, error: ownNutritionGoalError } =
        await regularUser.client
          .from("nutrition_goals")
          .select("id, user_id, kcal_target, protein_target")
          .eq("id", fixture.nutritionGoalId);

      expect(ownNutritionGoalError).toBeNull();
      expect(ownNutritionGoalRows).toHaveLength(1);
      expect(ownNutritionGoalRows?.[0]?.id).toBe(fixture.nutritionGoalId);
      expect(ownNutritionGoalRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownNutritionGoalRows?.[0]?.kcal_target).toBe(2200);
      expect(ownNutritionGoalRows?.[0]?.protein_target).toBe(160);

      const { data: ownNutritionProfileRows, error: ownNutritionProfileError } =
        await regularUser.client
          .from("nutrition_profiles")
          .select("id, user_id, kcal_target, protein_target, fat_target, carbs_target")
          .eq("id", fixture.nutritionProfileId);

      expect(ownNutritionProfileError).toBeNull();
      expect(ownNutritionProfileRows).toHaveLength(1);
      expect(ownNutritionProfileRows?.[0]?.id).toBe(fixture.nutritionProfileId);
      expect(ownNutritionProfileRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownNutritionProfileRows?.[0]?.kcal_target).toBe(2200);
      expect(ownNutritionProfileRows?.[0]?.protein_target).toBe(160);
      expect(ownNutritionProfileRows?.[0]?.fat_target).toBe(70);
      expect(ownNutritionProfileRows?.[0]?.carbs_target).toBe(240);

      const { data: ownBodyMetricRows, error: ownBodyMetricError } =
        await regularUser.client
          .from("body_metrics")
          .select("id, user_id, weight_kg, body_fat_pct")
          .eq("id", fixture.bodyMetricId);

      expect(ownBodyMetricError).toBeNull();
      expect(ownBodyMetricRows).toHaveLength(1);
      expect(ownBodyMetricRows?.[0]?.id).toBe(fixture.bodyMetricId);
      expect(ownBodyMetricRows?.[0]?.user_id).toBe(fixture.userId);
      expect(Number(ownBodyMetricRows?.[0]?.weight_kg)).toBe(76.8);
      expect(Number(ownBodyMetricRows?.[0]?.body_fat_pct)).toBe(17.4);

      const { data: ownProfileRows, error: ownProfileError } = await regularUser.client
        .from("profiles")
        .select("id, user_id, full_name")
        .eq("id", fixture.profileId);

      expect(ownProfileError).toBeNull();
      expect(ownProfileRows).toHaveLength(1);
      expect(ownProfileRows?.[0]?.id).toBe(fixture.profileId);
      expect(ownProfileRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownProfileRows?.[0]?.full_name).toContain("RLS User");

      const { data: ownOnboardingProfileRows, error: ownOnboardingProfileError } =
        await regularUser.client
          .from("onboarding_profiles")
          .select("id, user_id, fitness_level, height_cm")
          .eq("id", fixture.onboardingProfileId);

      expect(ownOnboardingProfileError).toBeNull();
      expect(ownOnboardingProfileRows).toHaveLength(1);
      expect(ownOnboardingProfileRows?.[0]?.id).toBe(fixture.onboardingProfileId);
      expect(ownOnboardingProfileRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownOnboardingProfileRows?.[0]?.fitness_level).toBe("intermediate");
      expect(ownOnboardingProfileRows?.[0]?.height_cm).toBe(182);

      const { data: ownDailyMetricsRows, error: ownDailyMetricsError } =
        await regularUser.client
          .from("daily_metrics")
          .select("id, user_id, workout_count, total_reps")
          .eq("id", fixture.dailyMetricsId);

      expect(ownDailyMetricsError).toBeNull();
      expect(ownDailyMetricsRows).toHaveLength(1);
      expect(ownDailyMetricsRows?.[0]?.id).toBe(fixture.dailyMetricsId);
      expect(ownDailyMetricsRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownDailyMetricsRows?.[0]?.workout_count).toBe(1);
      expect(ownDailyMetricsRows?.[0]?.total_reps).toBe(32);

      const {
        data: ownPeriodMetricSnapshotRows,
        error: ownPeriodMetricSnapshotError,
      } = await regularUser.client
        .from("period_metric_snapshots")
        .select("id, user_id, period_key")
        .eq("id", fixture.periodMetricSnapshotId);

      expect(ownPeriodMetricSnapshotError).toBeNull();
      expect(ownPeriodMetricSnapshotRows).toHaveLength(1);
      expect(ownPeriodMetricSnapshotRows?.[0]?.id).toBe(
        fixture.periodMetricSnapshotId,
      );
      expect(ownPeriodMetricSnapshotRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownPeriodMetricSnapshotRows?.[0]?.period_key).toContain("week:");

      const { data: ownUserMemoryFactRows, error: ownUserMemoryFactError } =
        await regularUser.client
          .from("user_memory_facts")
          .select("id, user_id, fact_type, content")
          .eq("id", fixture.userMemoryFactId);

      expect(ownUserMemoryFactError).toBeNull();
      expect(ownUserMemoryFactRows).toHaveLength(1);
      expect(ownUserMemoryFactRows?.[0]?.id).toBe(fixture.userMemoryFactId);
      expect(ownUserMemoryFactRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownUserMemoryFactRows?.[0]?.fact_type).toBe("preference");
      expect(ownUserMemoryFactRows?.[0]?.content).toContain("RLS memory fact");

      const { data: ownAiSafetyEventRows, error: ownAiSafetyEventError } =
        await regularUser.client
          .from("ai_safety_events")
          .select("id, user_id, route_key, action")
          .eq("id", fixture.aiSafetyEventId);

      expect(ownAiSafetyEventError).toBeNull();
      expect(ownAiSafetyEventRows).toHaveLength(1);
      expect(ownAiSafetyEventRows?.[0]?.id).toBe(fixture.aiSafetyEventId);
      expect(ownAiSafetyEventRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownAiSafetyEventRows?.[0]?.route_key).toBe("assistant");
      expect(ownAiSafetyEventRows?.[0]?.action).toBe("blocked_response");

      const { data: ownSubscriptionRows, error: ownSubscriptionError } =
        await regularUser.client
          .from("subscriptions")
          .select("id, user_id, status, provider")
          .eq("id", fixture.subscriptionId);

      expect(ownSubscriptionError).toBeNull();
      expect(ownSubscriptionRows).toHaveLength(1);
      expect(ownSubscriptionRows?.[0]?.id).toBe(fixture.subscriptionId);
      expect(ownSubscriptionRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownSubscriptionRows?.[0]?.status).toBe("active");
      expect(ownSubscriptionRows?.[0]?.provider).toBe("stripe");

      const {
        data: ownSubscriptionEventRows,
        error: ownSubscriptionEventError,
      } = await regularUser.client
        .from("subscription_events")
        .select("id, user_id, subscription_id, event_type")
        .eq("id", fixture.subscriptionEventId);

      expect(ownSubscriptionEventError).toBeNull();
      expect(ownSubscriptionEventRows).toHaveLength(1);
      expect(ownSubscriptionEventRows?.[0]?.id).toBe(fixture.subscriptionEventId);
      expect(ownSubscriptionEventRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownSubscriptionEventRows?.[0]?.subscription_id).toBe(
        fixture.subscriptionId,
      );
      expect(ownSubscriptionEventRows?.[0]?.event_type).toBe(
        "customer.subscription.updated",
      );

      const { data: ownEntitlementRows, error: ownEntitlementError } =
        await regularUser.client
          .from("entitlements")
          .select("id, user_id, feature_key, is_enabled")
          .eq("id", fixture.entitlementId);

      expect(ownEntitlementError).toBeNull();
      expect(ownEntitlementRows).toHaveLength(1);
      expect(ownEntitlementRows?.[0]?.id).toBe(fixture.entitlementId);
      expect(ownEntitlementRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownEntitlementRows?.[0]?.feature_key).toBe("meal_photo");
      expect(ownEntitlementRows?.[0]?.is_enabled).toBe(true);

      const { data: ownUsageCounterRows, error: ownUsageCounterError } =
        await regularUser.client
          .from("usage_counters")
          .select("id, user_id, metric_key, usage_count")
          .eq("id", fixture.usageCounterId);

      expect(ownUsageCounterError).toBeNull();
      expect(ownUsageCounterRows).toHaveLength(1);
      expect(ownUsageCounterRows?.[0]?.id).toBe(fixture.usageCounterId);
      expect(ownUsageCounterRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownUsageCounterRows?.[0]?.metric_key).toBe("ai_messages");
      expect(Number(ownUsageCounterRows?.[0]?.usage_count)).toBe(7);

      const { data: ownFoodRows, error: ownFoodError } = await regularUser.client
        .from("foods")
        .select("id, user_id, source, name")
        .eq("id", fixture.foodId);

      expect(ownFoodError).toBeNull();
      expect(ownFoodRows).toHaveLength(1);
      expect(ownFoodRows?.[0]?.id).toBe(fixture.foodId);
      expect(ownFoodRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownFoodRows?.[0]?.source).toBe("custom");

      const { data: ownMealTemplateRows, error: ownMealTemplateError } =
        await regularUser.client
          .from("meal_templates")
          .select("id, user_id, title")
          .eq("id", fixture.mealTemplateId);

      expect(ownMealTemplateError).toBeNull();
      expect(ownMealTemplateRows).toHaveLength(1);
      expect(ownMealTemplateRows?.[0]?.id).toBe(fixture.mealTemplateId);
      expect(ownMealTemplateRows?.[0]?.user_id).toBe(fixture.userId);

      const { data: ownMealRows, error: ownMealError } = await regularUser.client
        .from("meals")
        .select("id, user_id, source")
        .eq("id", fixture.mealId);

      expect(ownMealError).toBeNull();
      expect(ownMealRows).toHaveLength(1);
      expect(ownMealRows?.[0]?.id).toBe(fixture.mealId);
      expect(ownMealRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownMealRows?.[0]?.source).toBe("manual");

      const { data: ownMealItemRows, error: ownMealItemError } = await regularUser.client
        .from("meal_items")
        .select("id, user_id, meal_id, food_id")
        .eq("id", fixture.mealItemId);

      expect(ownMealItemError).toBeNull();
      expect(ownMealItemRows).toHaveLength(1);
      expect(ownMealItemRows?.[0]?.id).toBe(fixture.mealItemId);
      expect(ownMealItemRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownMealItemRows?.[0]?.meal_id).toBe(fixture.mealId);
      expect(ownMealItemRows?.[0]?.food_id).toBe(fixture.foodId);

      const { data: ownNutritionSummaryRows, error: ownNutritionSummaryError } =
        await regularUser.client
          .from("daily_nutrition_summaries")
          .select("id, user_id, kcal")
          .eq("id", fixture.nutritionSummaryId);

      expect(ownNutritionSummaryError).toBeNull();
      expect(ownNutritionSummaryRows).toHaveLength(1);
      expect(ownNutritionSummaryRows?.[0]?.id).toBe(fixture.nutritionSummaryId);
      expect(ownNutritionSummaryRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownNutritionSummaryRows?.[0]?.kcal).toBe(220);

      const { data: ownRecipeRows, error: ownRecipeError } = await regularUser.client
        .from("recipes")
        .select("id, user_id, title")
        .eq("id", fixture.recipeId);

      expect(ownRecipeError).toBeNull();
      expect(ownRecipeRows).toHaveLength(1);
      expect(ownRecipeRows?.[0]?.id).toBe(fixture.recipeId);
      expect(ownRecipeRows?.[0]?.user_id).toBe(fixture.userId);

      const { data: ownRecipeItemRows, error: ownRecipeItemError } = await regularUser.client
        .from("recipe_items")
        .select("id, user_id, recipe_id, food_id")
        .eq("id", fixture.recipeItemId);

      expect(ownRecipeItemError).toBeNull();
      expect(ownRecipeItemRows).toHaveLength(1);
      expect(ownRecipeItemRows?.[0]?.id).toBe(fixture.recipeItemId);
      expect(ownRecipeItemRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownRecipeItemRows?.[0]?.recipe_id).toBe(fixture.recipeId);
      expect(ownRecipeItemRows?.[0]?.food_id).toBe(fixture.foodId);

      const { data: ownWorkoutTemplateRows, error: ownWorkoutTemplateError } =
        await regularUser.client
          .from("workout_templates")
          .select("id, user_id, title")
          .eq("id", fixture.workoutTemplateId);

      expect(ownWorkoutTemplateError).toBeNull();
      expect(ownWorkoutTemplateRows).toHaveLength(1);
      expect(ownWorkoutTemplateRows?.[0]?.id).toBe(fixture.workoutTemplateId);
      expect(ownWorkoutTemplateRows?.[0]?.user_id).toBe(fixture.userId);

      const { data: ownChatSessionRows, error: ownChatSessionError } = await regularUser.client
        .from("ai_chat_sessions")
        .select("id, user_id, title")
        .eq("id", fixture.chatSessionId);

      expect(ownChatSessionError).toBeNull();
      expect(ownChatSessionRows).toHaveLength(1);
      expect(ownChatSessionRows?.[0]?.id).toBe(fixture.chatSessionId);
      expect(ownChatSessionRows?.[0]?.user_id).toBe(fixture.userId);

      const { data: ownChatMessageRows, error: ownChatMessageError } = await regularUser.client
        .from("ai_chat_messages")
        .select("id, user_id, session_id, role")
        .eq("id", fixture.chatMessageId);

      expect(ownChatMessageError).toBeNull();
      expect(ownChatMessageRows).toHaveLength(1);
      expect(ownChatMessageRows?.[0]?.id).toBe(fixture.chatMessageId);
      expect(ownChatMessageRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownChatMessageRows?.[0]?.session_id).toBe(fixture.chatSessionId);

      const { data: ownExportRows, error: ownExportError } = await regularUser.client
        .from("export_jobs")
        .select("id, user_id, status")
        .eq("id", fixture.exportJobId);

      expect(ownExportError).toBeNull();
      expect(ownExportRows).toHaveLength(1);
      expect(ownExportRows?.[0]?.id).toBe(fixture.exportJobId);
      expect(ownExportRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownExportRows?.[0]?.status).toBe("queued");

      const { data: ownDeletionRows, error: ownDeletionError } = await regularUser.client
        .from("deletion_requests")
        .select("id, user_id, status")
        .eq("id", fixture.deletionRequestId);

      expect(ownDeletionError).toBeNull();
      expect(ownDeletionRows).toHaveLength(1);
      expect(ownDeletionRows?.[0]?.id).toBe(fixture.deletionRequestId);
      expect(ownDeletionRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownDeletionRows?.[0]?.status).toBe("holding");

      const { data: ownContextSnapshotRows, error: ownContextSnapshotError } =
        await regularUser.client
          .from("user_context_snapshots")
          .select("id, user_id, snapshot_reason")
          .eq("id", fixture.contextSnapshotId);

      expect(ownContextSnapshotError).toBeNull();
      expect(ownContextSnapshotRows).toHaveLength(1);
      expect(ownContextSnapshotRows?.[0]?.id).toBe(fixture.contextSnapshotId);
      expect(ownContextSnapshotRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownContextSnapshotRows?.[0]?.snapshot_reason).toBe("rls_fixture");

      const { data: ownKnowledgeChunkRows, error: ownKnowledgeChunkError } =
        await regularUser.client
          .from("knowledge_chunks")
          .select("id, user_id, source_type")
          .eq("id", fixture.knowledgeChunkId);

      expect(ownKnowledgeChunkError).toBeNull();
      expect(ownKnowledgeChunkRows).toHaveLength(1);
      expect(ownKnowledgeChunkRows?.[0]?.id).toBe(fixture.knowledgeChunkId);
      expect(ownKnowledgeChunkRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownKnowledgeChunkRows?.[0]?.source_type).toBe("rls_fixture");

      const { data: ownKnowledgeEmbeddingRows, error: ownKnowledgeEmbeddingError } =
        await regularUser.client
          .from("knowledge_embeddings")
          .select("id, user_id, chunk_id, model")
          .eq("id", fixture.knowledgeEmbeddingId);

      expect(ownKnowledgeEmbeddingError).toBeNull();
      expect(ownKnowledgeEmbeddingRows).toHaveLength(1);
      expect(ownKnowledgeEmbeddingRows?.[0]?.id).toBe(fixture.knowledgeEmbeddingId);
      expect(ownKnowledgeEmbeddingRows?.[0]?.user_id).toBe(fixture.userId);
      expect(ownKnowledgeEmbeddingRows?.[0]?.chunk_id).toBe(fixture.knowledgeChunkId);
      expect(ownKnowledgeEmbeddingRows?.[0]?.model).toBe("text-embedding-3-small");

      const { data: hiddenChatSessionRows, error: hiddenChatSessionError } =
        await adminUser.client
          .from("ai_chat_sessions")
          .select("id")
          .eq("id", fixture.chatSessionId);

      expect(hiddenChatSessionError).toBeNull();
      expect(hiddenChatSessionRows).toEqual([]);

      const { data: hiddenChatMessageRows, error: hiddenChatMessageError } =
        await adminUser.client
          .from("ai_chat_messages")
          .select("id")
          .eq("id", fixture.chatMessageId);

      expect(hiddenChatMessageError).toBeNull();
      expect(hiddenChatMessageRows).toEqual([]);

      const { data: hiddenExportRows, error: hiddenExportError } = await adminUser.client
        .from("export_jobs")
        .select("id")
        .eq("id", fixture.exportJobId);

      expect(hiddenExportError).toBeNull();
      expect(hiddenExportRows).toEqual([]);

      const { data: hiddenDeletionRows, error: hiddenDeletionError } =
        await adminUser.client
          .from("deletion_requests")
          .select("id")
          .eq("id", fixture.deletionRequestId);

      expect(hiddenDeletionError).toBeNull();
      expect(hiddenDeletionRows).toEqual([]);

      const { data: hiddenContextSnapshotRows, error: hiddenContextSnapshotError } =
        await adminUser.client
          .from("user_context_snapshots")
          .select("id")
          .eq("id", fixture.contextSnapshotId);

      expect(hiddenContextSnapshotError).toBeNull();
      expect(hiddenContextSnapshotRows).toEqual([]);

      const { data: hiddenKnowledgeChunkRows, error: hiddenKnowledgeChunkError } =
        await adminUser.client
          .from("knowledge_chunks")
          .select("id")
          .eq("id", fixture.knowledgeChunkId);

      expect(hiddenKnowledgeChunkError).toBeNull();
      expect(hiddenKnowledgeChunkRows).toEqual([]);

      const { data: hiddenKnowledgeEmbeddingRows, error: hiddenKnowledgeEmbeddingError } =
        await adminUser.client
          .from("knowledge_embeddings")
          .select("id")
          .eq("id", fixture.knowledgeEmbeddingId);

      expect(hiddenKnowledgeEmbeddingError).toBeNull();
      expect(hiddenKnowledgeEmbeddingRows).toEqual([]);

      const { data: hiddenGoalRows, error: hiddenGoalError } = await adminUser.client
        .from("goals")
        .select("id")
        .eq("id", fixture.goalId);

      expect(hiddenGoalError).toBeNull();
      expect(hiddenGoalRows).toEqual([]);

      const { data: hiddenNutritionGoalRows, error: hiddenNutritionGoalError } =
        await adminUser.client
          .from("nutrition_goals")
          .select("id")
          .eq("id", fixture.nutritionGoalId);

      expect(hiddenNutritionGoalError).toBeNull();
      expect(hiddenNutritionGoalRows).toEqual([]);

      const { data: hiddenNutritionProfileRows, error: hiddenNutritionProfileError } =
        await adminUser.client
          .from("nutrition_profiles")
          .select("id")
          .eq("id", fixture.nutritionProfileId);

      expect(hiddenNutritionProfileError).toBeNull();
      expect(hiddenNutritionProfileRows).toEqual([]);

      const { data: hiddenBodyMetricRows, error: hiddenBodyMetricError } =
        await adminUser.client
          .from("body_metrics")
          .select("id")
          .eq("id", fixture.bodyMetricId);

      expect(hiddenBodyMetricError).toBeNull();
      expect(hiddenBodyMetricRows).toEqual([]);

      const { data: hiddenProfileRows, error: hiddenProfileError } = await adminUser.client
        .from("profiles")
        .select("id")
        .eq("id", fixture.profileId);

      expect(hiddenProfileError).toBeNull();
      expect(hiddenProfileRows).toEqual([]);

      const {
        data: hiddenOnboardingProfileRows,
        error: hiddenOnboardingProfileError,
      } = await adminUser.client
        .from("onboarding_profiles")
        .select("id")
        .eq("id", fixture.onboardingProfileId);

      expect(hiddenOnboardingProfileError).toBeNull();
      expect(hiddenOnboardingProfileRows).toEqual([]);

      const { data: hiddenDailyMetricsRows, error: hiddenDailyMetricsError } =
        await adminUser.client
          .from("daily_metrics")
          .select("id")
          .eq("id", fixture.dailyMetricsId);

      expect(hiddenDailyMetricsError).toBeNull();
      expect(hiddenDailyMetricsRows).toEqual([]);

      const {
        data: hiddenPeriodMetricSnapshotRows,
        error: hiddenPeriodMetricSnapshotError,
      } = await adminUser.client
        .from("period_metric_snapshots")
        .select("id")
        .eq("id", fixture.periodMetricSnapshotId);

      expect(hiddenPeriodMetricSnapshotError).toBeNull();
      expect(hiddenPeriodMetricSnapshotRows).toEqual([]);

      const { data: hiddenUserMemoryFactRows, error: hiddenUserMemoryFactError } =
        await adminUser.client
          .from("user_memory_facts")
          .select("id")
          .eq("id", fixture.userMemoryFactId);

      expect(hiddenUserMemoryFactError).toBeNull();
      expect(hiddenUserMemoryFactRows).toEqual([]);

      const { data: hiddenAiSafetyEventRows, error: hiddenAiSafetyEventError } =
        await adminUser.client
          .from("ai_safety_events")
          .select("id")
          .eq("id", fixture.aiSafetyEventId);

      expect(hiddenAiSafetyEventError).toBeNull();
      expect(hiddenAiSafetyEventRows).toEqual([]);

      const { data: hiddenSubscriptionRows, error: hiddenSubscriptionError } =
        await adminUser.client
          .from("subscriptions")
          .select("id")
          .eq("id", fixture.subscriptionId);

      expect(hiddenSubscriptionError).toBeNull();
      expect(hiddenSubscriptionRows).toEqual([]);

      const {
        data: hiddenSubscriptionEventRows,
        error: hiddenSubscriptionEventError,
      } = await adminUser.client
        .from("subscription_events")
        .select("id")
        .eq("id", fixture.subscriptionEventId);

      expect(hiddenSubscriptionEventError).toBeNull();
      expect(hiddenSubscriptionEventRows).toEqual([]);

      const { data: hiddenEntitlementRows, error: hiddenEntitlementError } =
        await adminUser.client
          .from("entitlements")
          .select("id")
          .eq("id", fixture.entitlementId);

      expect(hiddenEntitlementError).toBeNull();
      expect(hiddenEntitlementRows).toEqual([]);

      const { data: hiddenUsageCounterRows, error: hiddenUsageCounterError } =
        await adminUser.client
          .from("usage_counters")
          .select("id")
          .eq("id", fixture.usageCounterId);

      expect(hiddenUsageCounterError).toBeNull();
      expect(hiddenUsageCounterRows).toEqual([]);

      const { data: hiddenFoodRows, error: hiddenFoodError } = await adminUser.client
        .from("foods")
        .select("id")
        .eq("id", fixture.foodId);

      expect(hiddenFoodError).toBeNull();
      expect(hiddenFoodRows).toEqual([]);

      const { data: hiddenMealTemplateRows, error: hiddenMealTemplateError } =
        await adminUser.client
          .from("meal_templates")
          .select("id")
          .eq("id", fixture.mealTemplateId);

      expect(hiddenMealTemplateError).toBeNull();
      expect(hiddenMealTemplateRows).toEqual([]);

      const { data: hiddenMealRows, error: hiddenMealError } = await adminUser.client
        .from("meals")
        .select("id")
        .eq("id", fixture.mealId);

      expect(hiddenMealError).toBeNull();
      expect(hiddenMealRows).toEqual([]);

      const { data: hiddenMealItemRows, error: hiddenMealItemError } = await adminUser.client
        .from("meal_items")
        .select("id")
        .eq("id", fixture.mealItemId);

      expect(hiddenMealItemError).toBeNull();
      expect(hiddenMealItemRows).toEqual([]);

      const { data: hiddenNutritionSummaryRows, error: hiddenNutritionSummaryError } =
        await adminUser.client
          .from("daily_nutrition_summaries")
          .select("id")
          .eq("id", fixture.nutritionSummaryId);

      expect(hiddenNutritionSummaryError).toBeNull();
      expect(hiddenNutritionSummaryRows).toEqual([]);

      const { data: hiddenRecipeRows, error: hiddenRecipeError } = await adminUser.client
        .from("recipes")
        .select("id")
        .eq("id", fixture.recipeId);

      expect(hiddenRecipeError).toBeNull();
      expect(hiddenRecipeRows).toEqual([]);

      const { data: hiddenRecipeItemRows, error: hiddenRecipeItemError } =
        await adminUser.client
          .from("recipe_items")
          .select("id")
          .eq("id", fixture.recipeItemId);

      expect(hiddenRecipeItemError).toBeNull();
      expect(hiddenRecipeItemRows).toEqual([]);

      const { data: hiddenWorkoutTemplateRows, error: hiddenWorkoutTemplateError } =
        await adminUser.client
          .from("workout_templates")
          .select("id")
          .eq("id", fixture.workoutTemplateId);

      expect(hiddenWorkoutTemplateError).toBeNull();
      expect(hiddenWorkoutTemplateRows).toEqual([]);

      const { data: hiddenWorkoutDayRows, error: hiddenWorkoutDayError } =
        await adminUser.client
          .from("workout_days")
          .select("id")
          .eq("id", fixture.workoutDayId);

      expect(hiddenWorkoutDayError).toBeNull();
      expect(hiddenWorkoutDayRows).toEqual([]);

      const {
        data: hiddenWorkoutExerciseRows,
        error: hiddenWorkoutExerciseError,
      } = await adminUser.client
        .from("workout_exercises")
        .select("id")
        .eq("id", fixture.workoutExerciseId);

      expect(hiddenWorkoutExerciseError).toBeNull();
      expect(hiddenWorkoutExerciseRows).toEqual([]);

      const { data: hiddenWorkoutSetRows, error: hiddenWorkoutSetError } =
        await adminUser.client
          .from("workout_sets")
          .select("id")
          .eq("id", fixture.workoutSetId);

      expect(hiddenWorkoutSetError).toBeNull();
      expect(hiddenWorkoutSetRows).toEqual([]);

      const { data: foreignProposalUpdateRows, error: foreignProposalUpdateError } =
        await adminUser.client
          .from("ai_plan_proposals")
          .update({
            status: "approved",
          })
          .eq("id", fixture.userProposalId)
          .select("id, status");

      expect(foreignProposalUpdateError).toBeNull();
      expect(foreignProposalUpdateRows).toEqual([]);

      const {
        data: foreignNutritionProfileUpdateRows,
        error: foreignNutritionProfileUpdateError,
      } = await adminUser.client
        .from("nutrition_profiles")
        .update({
          kcal_target: 9999,
        })
        .eq("id", fixture.nutritionProfileId)
        .select("id, kcal_target");

      expect(foreignNutritionProfileUpdateError).toBeNull();
      expect(foreignNutritionProfileUpdateRows).toEqual([]);

      const {
        data: foreignBodyMetricUpdateRows,
        error: foreignBodyMetricUpdateError,
      } = await adminUser.client
        .from("body_metrics")
        .update({
          weight_kg: 99.9,
        })
        .eq("id", fixture.bodyMetricId)
        .select("id, weight_kg");

      expect(foreignBodyMetricUpdateError).toBeNull();
      expect(foreignBodyMetricUpdateRows).toEqual([]);

      const { data: foreignProfileUpdateRows, error: foreignProfileUpdateError } =
        await adminUser.client
          .from("profiles")
          .update({
            full_name: "foreign overwrite",
          })
          .eq("id", fixture.profileId)
          .select("id, full_name");

      expect(foreignProfileUpdateError).toBeNull();
      expect(foreignProfileUpdateRows).toEqual([]);

      const {
        data: foreignOnboardingProfileUpdateRows,
        error: foreignOnboardingProfileUpdateError,
      } = await adminUser.client
        .from("onboarding_profiles")
        .update({
          fitness_level: "advanced",
        })
        .eq("id", fixture.onboardingProfileId)
        .select("id, fitness_level");

      expect(foreignOnboardingProfileUpdateError).toBeNull();
      expect(foreignOnboardingProfileUpdateRows).toEqual([]);

      const {
        data: foreignDailyMetricsUpdateRows,
        error: foreignDailyMetricsUpdateError,
      } = await adminUser.client
        .from("daily_metrics")
        .update({
          workout_count: 99,
        })
        .eq("id", fixture.dailyMetricsId)
        .select("id, workout_count");

      expect(foreignDailyMetricsUpdateError).toBeNull();
      expect(foreignDailyMetricsUpdateRows).toEqual([]);

      const {
        data: foreignUserMemoryFactUpdateRows,
        error: foreignUserMemoryFactUpdateError,
      } = await adminUser.client
        .from("user_memory_facts")
        .update({
          content: "foreign overwrite",
        })
        .eq("id", fixture.userMemoryFactId)
        .select("id, content");

      expect(foreignUserMemoryFactUpdateError).toBeNull();
      expect(foreignUserMemoryFactUpdateRows).toEqual([]);

      const {
        data: foreignUsageCounterUpdateRows,
        error: foreignUsageCounterUpdateError,
      } = await adminUser.client
        .from("usage_counters")
        .update({
          usage_count: 999,
        })
        .eq("id", fixture.usageCounterId)
        .select("id, usage_count");

      expect(foreignUsageCounterUpdateError).toBeNull();
      expect(foreignUsageCounterUpdateRows).toEqual([]);

      const {
        data: foreignWorkoutSetUpdateRows,
        error: foreignWorkoutSetUpdateError,
      } = await adminUser.client
        .from("workout_sets")
        .update({
          actual_reps: 12,
        })
        .eq("id", fixture.workoutSetId)
        .select("id, actual_reps");

      expect(foreignWorkoutSetUpdateError).toBeNull();
      expect(foreignWorkoutSetUpdateRows).toEqual([]);

      const proposalAfterForeignUpdate = await readProposalStatus(fixture.userProposalId);

      expect(proposalAfterForeignUpdate?.id).toBe(fixture.userProposalId);
      expect(proposalAfterForeignUpdate?.user_id).toBe(fixture.userId);
      expect(proposalAfterForeignUpdate?.status).toBe("draft");

      const {
        data: nutritionProfileAfterForeignUpdate,
        error: nutritionProfileAfterForeignUpdateError,
      } = await regularUser.client
        .from("nutrition_profiles")
        .select("id, kcal_target")
        .eq("id", fixture.nutritionProfileId)
        .maybeSingle();

      expect(nutritionProfileAfterForeignUpdateError).toBeNull();
      expect(nutritionProfileAfterForeignUpdate?.id).toBe(fixture.nutritionProfileId);
      expect(nutritionProfileAfterForeignUpdate?.kcal_target).toBe(2200);

      const {
        data: bodyMetricAfterForeignUpdate,
        error: bodyMetricAfterForeignUpdateError,
      } = await regularUser.client
        .from("body_metrics")
        .select("id, weight_kg")
        .eq("id", fixture.bodyMetricId)
        .maybeSingle();

      expect(bodyMetricAfterForeignUpdateError).toBeNull();
      expect(bodyMetricAfterForeignUpdate?.id).toBe(fixture.bodyMetricId);
      expect(Number(bodyMetricAfterForeignUpdate?.weight_kg)).toBe(76.8);

      const { data: profileAfterForeignUpdate, error: profileAfterForeignUpdateError } =
        await regularUser.client
          .from("profiles")
          .select("id, full_name")
          .eq("id", fixture.profileId)
          .maybeSingle();

      expect(profileAfterForeignUpdateError).toBeNull();
      expect(profileAfterForeignUpdate?.id).toBe(fixture.profileId);
      expect(profileAfterForeignUpdate?.full_name).toContain("RLS User");

      const {
        data: onboardingProfileAfterForeignUpdate,
        error: onboardingProfileAfterForeignUpdateError,
      } = await regularUser.client
        .from("onboarding_profiles")
        .select("id, fitness_level")
        .eq("id", fixture.onboardingProfileId)
        .maybeSingle();

      expect(onboardingProfileAfterForeignUpdateError).toBeNull();
      expect(onboardingProfileAfterForeignUpdate?.id).toBe(
        fixture.onboardingProfileId,
      );
      expect(onboardingProfileAfterForeignUpdate?.fitness_level).toBe(
        "intermediate",
      );

      const {
        data: dailyMetricsAfterForeignUpdate,
        error: dailyMetricsAfterForeignUpdateError,
      } = await regularUser.client
        .from("daily_metrics")
        .select("id, workout_count")
        .eq("id", fixture.dailyMetricsId)
        .maybeSingle();

      expect(dailyMetricsAfterForeignUpdateError).toBeNull();
      expect(dailyMetricsAfterForeignUpdate?.id).toBe(fixture.dailyMetricsId);
      expect(dailyMetricsAfterForeignUpdate?.workout_count).toBe(1);

      const {
        data: userMemoryFactAfterForeignUpdate,
        error: userMemoryFactAfterForeignUpdateError,
      } = await regularUser.client
        .from("user_memory_facts")
        .select("id, content")
        .eq("id", fixture.userMemoryFactId)
        .maybeSingle();

      expect(userMemoryFactAfterForeignUpdateError).toBeNull();
      expect(userMemoryFactAfterForeignUpdate?.id).toBe(fixture.userMemoryFactId);
      expect(userMemoryFactAfterForeignUpdate?.content).toContain(
        "RLS memory fact",
      );

      const {
        data: usageCounterAfterForeignUpdate,
        error: usageCounterAfterForeignUpdateError,
      } = await regularUser.client
        .from("usage_counters")
        .select("id, usage_count")
        .eq("id", fixture.usageCounterId)
        .maybeSingle();

      expect(usageCounterAfterForeignUpdateError).toBeNull();
      expect(usageCounterAfterForeignUpdate?.id).toBe(fixture.usageCounterId);
      expect(Number(usageCounterAfterForeignUpdate?.usage_count)).toBe(7);

      const {
        data: workoutSetAfterForeignUpdate,
        error: workoutSetAfterForeignUpdateError,
      } = await regularUser.client
        .from("workout_sets")
        .select("id, actual_reps")
        .eq("id", fixture.workoutSetId)
        .maybeSingle();

      expect(workoutSetAfterForeignUpdateError).toBeNull();
      expect(workoutSetAfterForeignUpdate?.id).toBe(fixture.workoutSetId);
      expect(workoutSetAfterForeignUpdate?.actual_reps).toBe(8);
    } finally {
      await signOutRlsUser(regularUser.client);
      await signOutRlsUser(adminUser.client);
    }
  });
});
