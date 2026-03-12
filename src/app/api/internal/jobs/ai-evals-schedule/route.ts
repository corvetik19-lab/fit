import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { queueAiEvalRun } from "@/lib/ai/eval-runs";
import { AI_EVAL_SUITES } from "@/lib/ai/eval-suites";
import { parsePositiveInt, requireInternalAdminJobAccess } from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_DEDUPE_HOURS = 24;
const DEFAULT_MODEL_ID = "google/gemini-3.1-pro-preview";
export const maxDuration = 60;

const querySchema = z.object({
  force: z
    .enum(["0", "1", "false", "true"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
  modelId: z.string().trim().min(2).max(160).optional(),
  suite: z.enum(AI_EVAL_SUITES).optional(),
  windowHours: z.string().optional(),
});

async function handleRequest(request: Request) {
  const access = await requireInternalAdminJobAccess(
    request,
    "scheduled AI eval jobs",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      force: searchParams.get("force") ?? undefined,
      modelId: searchParams.get("modelId") ?? undefined,
      suite: searchParams.get("suite") ?? undefined,
      windowHours: searchParams.get("windowHours") ?? undefined,
    });
    const modelId = parsed.modelId ?? DEFAULT_MODEL_ID;
    const suite = parsed.suite ?? "tool_calls";
    const dedupeWindowHours = parsed.force
      ? 0
      : parsePositiveInt(
          parsed.windowHours ?? null,
          DEFAULT_DEDUPE_HOURS,
          7 * 24,
        );
    const supabase = createAdminSupabaseClient();
    const queuedRun = await queueAiEvalRun(supabase, {
      dedupeWindowHours,
      isScheduled: true,
      modelId,
      requestedBy: access.actorUserId,
      suite,
      trigger: access.source === "cron" ? "scheduled_cron" : "scheduled_admin",
    });

    return Response.json({
      data: {
        ...queuedRun.data,
        skipped: queuedRun.skipped,
        suite,
      },
      message: queuedRun.skipped
        ? "Свежий scheduled AI eval уже есть, новый run не добавлялся."
        : "Scheduled AI eval добавлен в очередь.",
    });
  } catch (error) {
    logger.error("scheduled ai eval job failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SCHEDULED_AI_EVAL_INVALID",
        message: "Некорректные параметры scheduled AI eval job.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "SCHEDULED_AI_EVAL_FAILED",
      message: "Не удалось поставить scheduled AI eval в очередь.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
