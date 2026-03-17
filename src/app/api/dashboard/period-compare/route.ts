import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDashboardPeriodComparison } from "@/lib/dashboard/metrics";

function parsePeriod(value: string | null) {
  return value && /^\d+d$/.test(value) ? value : "30d";
}

function parsePeriodDays(value: string) {
  return Number(value.replace("d", ""));
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы запросить сравнение периодов.",
      });
    }

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get("period"));
    const baseline = parsePeriod(searchParams.get("baseline"));
    const periodDays = parsePeriodDays(period);
    const baselineDays = parsePeriodDays(baseline);
    const metrics = await getDashboardPeriodComparison(
      supabase,
      user.id,
      periodDays,
      baselineDays,
    );

    return Response.json({
      data: {
        period,
        baseline,
        metrics,
      },
    });
  } catch (error) {
    logger.error("dashboard period compare route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "DASHBOARD_PERIOD_COMPARE_FAILED",
      message: "Не удалось рассчитать сравнение выбранных периодов.",
    });
  }
}
