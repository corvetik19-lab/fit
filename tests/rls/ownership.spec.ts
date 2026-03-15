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

      const { data: foreignUpdateRows, error: foreignUpdateError } = await adminUser.client
        .from("ai_plan_proposals")
        .update({
          status: "approved",
        })
        .eq("id", fixture.userProposalId)
        .select("id, status");

      expect(foreignUpdateError).toBeNull();
      expect(foreignUpdateRows).toEqual([]);

      const proposalAfterForeignUpdate = await readProposalStatus(fixture.userProposalId);

      expect(proposalAfterForeignUpdate?.id).toBe(fixture.userProposalId);
      expect(proposalAfterForeignUpdate?.user_id).toBe(fixture.userId);
      expect(proposalAfterForeignUpdate?.status).toBe("draft");
    } finally {
      await signOutRlsUser(regularUser.client);
      await signOutRlsUser(adminUser.client);
    }
  });
});
