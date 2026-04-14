import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "./supabase-admin";
const defaultUserEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? null;
const defaultAdminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? null;

async function withSupabaseRetry<T>(
  factory: () => PromiseLike<T> | T,
  attempts = 5,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    }
  }

  throw lastError;
}

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

export async function ensureAiChatSession(_page?: unknown) {
  const seedPrompt =
    "I want an extreme calorie deficit and I am ready to starve to lose weight fast.";
  const email = defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required to seed AI chat sessions for e2e.",
    );
  }

  const supabase = createSupabaseAdminTestClient();
  const userId = await withSupabaseRetry(() => findAuthUserIdByEmail(email));
  const title = seedPrompt.slice(0, 72);

  const { data: session, error: sessionError } = await withSupabaseRetry(() =>
    supabase
      .from("ai_chat_sessions")
      .insert({
        user_id: userId,
        title,
      })
      .select("id, title")
      .single(),
  );

  if (sessionError) {
    throw sessionError;
  }

  const { error: messageError } = await withSupabaseRetry(() =>
    supabase.from("ai_chat_messages").insert([
      {
        user_id: userId,
        session_id: session.id,
        role: "user",
        content: seedPrompt,
      },
      {
        user_id: userId,
        session_id: session.id,
        role: "assistant",
        content:
          "Я не могу помогать с опасным голоданием. Лучше соберём безопасный дефицит и реалистичный план снижения веса.",
      },
    ]),
  );

  if (messageError) {
    throw messageError;
  }

  return {
    prompt: seedPrompt,
    sessionId: session.id as string,
    sessionTitle: (session.title as string | null) ?? null,
  };
}

export async function ensureAiPlanProposal(input?: {
  email?: string;
  proposalType?: AiPlanProposalType;
}) {
  const email = input?.email ?? defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required to seed AI plan proposals for e2e.",
    );
  }

  const proposalType = input?.proposalType ?? "meal_plan";
  const seed = crypto.randomUUID().slice(0, 8);
  const supabase = createSupabaseAdminTestClient();
  const userId = await withSupabaseRetry(() => findAuthUserIdByEmail(email));

  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from("ai_plan_proposals")
      .insert({
        user_id: userId,
        proposal_type: proposalType,
        status: "draft",
        payload: createSeededProposalPayload(proposalType, seed),
      })
      .select("id, proposal_type, status")
      .single(),
  );

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

export async function resetAiChatHistory(input?: { email?: string }) {
  const email = input?.email ?? defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required to reset AI chat history for e2e.",
    );
  }

  const supabase = createSupabaseAdminTestClient();
  const userId = await withSupabaseRetry(() => findAuthUserIdByEmail(email));

  const { error: deleteMessagesError } = await withSupabaseRetry(() =>
    supabase.from("ai_chat_messages").delete().eq("user_id", userId),
  );

  if (deleteMessagesError) {
    throw deleteMessagesError;
  }

  const { error: deleteSessionsError } = await withSupabaseRetry(() =>
    supabase.from("ai_chat_sessions").delete().eq("user_id", userId),
  );

  if (deleteSessionsError) {
    throw deleteSessionsError;
  }

  return { userId };
}

export async function replaceAiChatHistory(input?: {
  email?: string;
  sessionCount?: number;
}) {
  const email = input?.email ?? defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required to replace AI chat history for e2e.",
    );
  }

  const sessionCount = Math.max(1, input?.sessionCount ?? 2);
  const supabase = createSupabaseAdminTestClient();
  const userId = await withSupabaseRetry(() => findAuthUserIdByEmail(email));

  await resetAiChatHistory({ email });

  const sessions = Array.from({ length: sessionCount }, (_, index) => {
    const prompt = `E2E history seed ${index + 1}: помоги разобрать восстановление после нагрузки.`;
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      title: prompt.slice(0, 72),
      prompt,
    };
  });

  const { error: sessionError } = await withSupabaseRetry(() =>
    supabase.from("ai_chat_sessions").insert(
      sessions.map((session) => ({
        id: session.id,
        user_id: session.user_id,
        title: session.title,
      })),
    ),
  );

  if (sessionError) {
    throw sessionError;
  }

  const { error: messageError } = await withSupabaseRetry(() =>
    supabase.from("ai_chat_messages").insert(
      sessions.flatMap((session) => [
        {
          user_id: userId,
          session_id: session.id,
          role: "user",
          content: session.prompt,
        },
        {
          user_id: userId,
          session_id: session.id,
          role: "assistant",
          content:
            "Я не помогаю с опасными ограничениями. Давай лучше соберём безопасный план, который можно реально выдержать.",
        },
      ]),
    ),
  );

  if (messageError) {
    throw messageError;
  }

  return {
    sessionIds: sessions.map((session) => session.id),
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

export async function seedHistoricalMemoryFact(input?: {
  content?: string;
  createdAt?: string;
  email?: string;
  factType?: string;
}) {
  const email = input?.email ?? defaultAdminEmail ?? defaultUserEmail;

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_ADMIN_EMAIL or PLAYWRIGHT_TEST_EMAIL is required to seed historical AI memory facts.",
    );
  }

  const supabase = createSupabaseAdminTestClient();
  const userId = await findAuthUserIdByEmail(email);
  const marker = crypto.randomUUID().slice(0, 8);
  const createdAt = input?.createdAt ?? "2024-02-15T09:30:00.000Z";
  const content =
    input?.content ??
    `Исторический факт для AI retrieval ${marker}: пользователь лучше восстанавливается после двух коротких прогулок в день.`;

  const { data, error } = await supabase
    .from("user_memory_facts")
    .insert({
      user_id: userId,
      fact_type: input?.factType ?? "recovery_preference",
      content,
      source: "e2e",
      confidence: 0.97,
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select("id, content")
    .single();

  if (error) {
    throw error;
  }

  return {
    content: data.content as string,
    factId: data.id as string,
    marker,
    userId,
  };
}
