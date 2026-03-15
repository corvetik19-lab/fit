import { expect, type Page } from "@playwright/test";

import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "./supabase-admin";
import { fetchJson } from "./http";

const defaultUserEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? null;

type AiPlanProposalType = "meal_plan" | "workout_plan";

function createSeededProposalPayload(proposalType: AiPlanProposalType, seed: string) {
  if (proposalType === "meal_plan") {
    return {
      kind: "meal_plan",
      request: {
        goal: "maintenance",
        kcalTarget: 2200,
        dietaryNotes: `E2E seed ${seed}`,
        mealsPerDay: 4,
      },
      proposal: {
        title: `E2E Meal Proposal ${seed}`,
        caloriesTarget: 2200,
        macros: {
          protein: 160,
          fat: 70,
          carbs: 240,
        },
        meals: [
          {
            name: "Breakfast",
            kcal: 600,
            items: ["Eggs", "Oats"],
          },
          {
            name: "Lunch",
            kcal: 800,
            items: ["Chicken", "Rice"],
          },
        ],
      },
    };
  }

  return {
    kind: "workout_plan",
    request: {
      goal: "maintenance",
      equipment: ["bodyweight"],
      daysPerWeek: 3,
      focus: `E2E seed ${seed}`,
    },
    proposal: {
      title: `E2E Workout Proposal ${seed}`,
      summary: "Seeded workout proposal for ownership isolation tests.",
      days: [
        {
          day: "Day 1",
          focus: "Full body",
          exercises: [
            {
              name: "Push-ups",
              sets: 3,
              reps: "10-12",
            },
          ],
        },
      ],
    },
  };
}

export async function ensureAiChatSession(page: Page) {
  const seedPrompt =
    "I want an extreme calorie deficit and I am ready to starve to lose weight fast.";

  const result = await fetchJson<{
    data?: {
      blocked: boolean;
      sessionId?: string;
      sessionTitle?: string | null;
    };
  }>(page, {
    method: "POST",
    url: "/api/ai/chat",
    body: {
      message: seedPrompt,
    },
  });

  expect(result.status).toBe(200);
  expect(result.body?.data?.blocked).toBe(true);
  expect(result.body?.data?.sessionId).toBeTruthy();
  const sessionId = result.body?.data?.sessionId;
  expect(sessionId).toBeTruthy();

  return {
    prompt: seedPrompt,
    sessionId: sessionId as string,
    sessionTitle: result.body?.data?.sessionTitle ?? null,
  };
}

export async function ensureAiPlanProposal(
  _page: Page,
  input?: {
    email?: string;
    proposalType?: AiPlanProposalType;
  },
) {
  const email = input?.email ?? defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required to seed AI plan proposals for e2e.",
    );
  }

  const proposalType = input?.proposalType ?? "meal_plan";
  const seed = crypto.randomUUID().slice(0, 8);
  const supabase = createSupabaseAdminTestClient();
  const userId = await findAuthUserIdByEmail(email);

  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .insert({
      user_id: userId,
      proposal_type: proposalType,
      status: "draft",
      payload: createSeededProposalPayload(proposalType, seed),
    })
    .select("id, proposal_type, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    proposalId: data.id as string,
    proposalType: data.proposal_type as AiPlanProposalType,
    status: data.status as string,
    userId,
  };
}

export async function readAiPlanProposal(proposalId: string) {
  const supabase = createSupabaseAdminTestClient();
  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .select("id, user_id, proposal_type, status")
    .eq("id", proposalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    | {
        id: string;
        user_id: string;
        proposal_type: AiPlanProposalType;
        status: string;
      }
    | null;
}
