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
