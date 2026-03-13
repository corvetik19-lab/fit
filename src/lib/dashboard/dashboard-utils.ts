export function toUtcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDateDaysAgo(daysAgo: number) {
  const nextDate = new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() - daysAgo);
  return nextDate;
}

export function getIsoTimestampDaysAgo(daysAgo: number) {
  return getDateDaysAgo(daysAgo).toISOString();
}

export function getTomorrowDateString() {
  const nextDate = new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return toUtcDateString(nextDate);
}

export function getUtcDateStringFromTimestamp(timestamp: string) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function getUtcWeekStart(date: Date) {
  const nextDate = new Date(date);
  const offset = (nextDate.getUTCDay() + 6) % 7;
  nextDate.setUTCHours(0, 0, 0, 0);
  nextDate.setUTCDate(nextDate.getUTCDate() - offset);
  return nextDate;
}

export function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function toSafeNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function roundToSingleDecimal(value: number) {
  return Number(value.toFixed(1));
}

export function getSetTonnageKg(
  actualReps: number | null,
  actualWeightKg: number | null,
) {
  if (actualReps === null || actualWeightKg === null) {
    return 0;
  }

  return actualReps * actualWeightKg;
}

export function getEstimatedOneRmKg(
  actualReps: number | null,
  actualWeightKg: number | null,
) {
  if (actualReps === null || actualWeightKg === null || actualReps <= 0) {
    return null;
  }

  return actualWeightKg * (1 + actualReps / 30);
}

export function getDaysBetween(later: string, earlier: string) {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.max(0, Math.round(diff / (24 * 60 * 60 * 1000)));
}

export function getDaysSince(value: string | null) {
  if (!value) {
    return null;
  }

  return getDaysBetween(new Date().toISOString(), value);
}

export function getMomentum(
  recentCompletedSets: number,
  previousCompletedSets: number,
  repsDelta: number | null,
): "up" | "stable" | "down" {
  if (
    recentCompletedSets > previousCompletedSets ||
    (repsDelta !== null && repsDelta >= 0.6)
  ) {
    return "up";
  }

  if (
    recentCompletedSets < previousCompletedSets &&
    (repsDelta === null || repsDelta <= -0.6)
  ) {
    return "down";
  }

  return "stable";
}
