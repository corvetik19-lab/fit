import { addUtcDays, getUtcWeekStart } from "@/lib/dashboard/dashboard-utils";
import type { DashboardWorkoutRecovery } from "@/lib/dashboard/metrics";

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const rangeDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

export function buildRecoverySummary(input: {
  consistencyRatio: number | null;
  daysSinceLastWorkout: number | null;
  goalDaysPerWeek: number | null;
  loggedSetsLast14: number;
  status: DashboardWorkoutRecovery["status"];
}) {
  if (input.daysSinceLastWorkout === null) {
    return "Пока нет завершённых тренировок. После первых сессий здесь появится сигнал по ритму и восстановлению.";
  }

  if (input.status === "fresh") {
    return input.goalDaysPerWeek
      ? `Ритм держится близко к цели: за последние 14 дней выполнено ${input.loggedSetsLast14} рабочих подходов, а пауза после последней тренировки всего ${input.daysSinceLastWorkout} дн.`
      : `Ритм сейчас хороший: последняя тренировка была ${input.daysSinceLastWorkout} дн. назад, а рабочие подходы фиксируются стабильно.`;
  }

  if (input.status === "steady") {
    return input.consistencyRatio !== null
      ? `Темп остаётся рабочим, но есть запас для более ровного графика: выполнено ${Math.round(input.consistencyRatio * 100)}% от целевого ритма за последние 14 дней.`
      : "Темп остаётся рабочим. Следующая задача — удерживать более стабильный график без длинных пауз.";
  }

  return "Есть сигнал просадки по ритму: стоит вернуться к регулярности, прежде чем AI будет повышать объём в новых рекомендациях.";
}

export function buildWeeklyTrendSkeleton(weeks: number) {
  const currentWeekStart = getUtcWeekStart(new Date());

  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addUtcDays(currentWeekStart, (index - weeks + 1) * 7);
    const weekEnd = addUtcDays(weekStart, 6);

    return {
      completedDays: 0,
      label: shortDateFormatter.format(weekStart),
      loggedSets: 0,
      rangeLabel: `${rangeDateFormatter.format(weekStart)} - ${rangeDateFormatter.format(weekEnd)}`,
      tonnageKg: 0,
      weekEnd,
      weekStart,
    };
  });
}

export function getWeeklyTrendIndex(
  weekStartsAt: Date,
  bucketStart: Date,
  totalBuckets: number,
) {
  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const index = Math.floor(
    (weekStartsAt.getTime() - bucketStart.getTime()) / millisecondsPerWeek,
  );

  if (index < 0 || index >= totalBuckets) {
    return null;
  }

  return index;
}
