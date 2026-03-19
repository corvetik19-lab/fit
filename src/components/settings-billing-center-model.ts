import type { SettingsDataSnapshot } from "@/lib/settings-data";

export const CHECKOUT_RETURN_RETRY_DELAYS_MS = [2500, 5000, 8000] as const;

export const settingsBillingInputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSettingsDateTime(value: string | null | undefined) {
  if (!value) {
    return "нет данных";
  }

  return dateFormatter.format(new Date(value));
}

export function formatAccessSource(value: string) {
  switch (value) {
    case "subscription":
      return "по подписке";
    case "entitlement":
      return "открыто вручную";
    case "privileged":
      return "корневой доступ";
    default:
      return "базовый доступ";
  }
}

export function formatSubscriptionStatus(
  status: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "полный доступ super-admin";
  }

  return status ?? "нет";
}

export function formatSubscriptionProvider(
  provider: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "встроенный административный доступ";
  }

  return provider ?? "не задан";
}

export function formatReviewStatus(value: string) {
  switch (value) {
    case "queued":
      return "в очереди";
    case "completed":
      return "обработан";
    case "failed":
      return "ошибка";
    default:
      return value;
  }
}

export function getStatusTone(value: string) {
  switch (value) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "queued":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-white/80 text-foreground";
  }
}

export function getTimelineTone(
  value: SettingsDataSnapshot["billingEvents"][number]["tone"],
) {
  switch (value) {
    case "success":
      return "border-emerald-200 bg-emerald-50/70";
    case "warning":
      return "border-amber-200 bg-amber-50/70";
    case "danger":
      return "border-red-200 bg-red-50/70";
    default:
      return "border-border/70 bg-white/80";
  }
}

export function formatActorScope(
  value: SettingsDataSnapshot["billingEvents"][number]["actorScope"],
) {
  switch (value) {
    case "you":
      return "Вы";
    case "support":
      return "Поддержка";
    case "system":
      return "Система";
    default:
      return value;
  }
}

export function formatEventKind(
  value: SettingsDataSnapshot["billingEvents"][number]["kind"],
) {
  switch (value) {
    case "subscription":
      return "Подписка";
    case "entitlement":
      return "Доступ";
    case "request":
      return "Запрос";
    default:
      return value;
  }
}

export function formatFeatureKey(value: string) {
  switch (value) {
    case "ai_chat":
      return "AI-чат";
    case "meal_plan":
      return "AI-план питания";
    case "workout_plan":
      return "AI-план тренировок";
    case "meal_photo":
      return "AI-анализ фото еды";
    default:
      return value.replaceAll("_", " ");
  }
}

export function formatStripePaymentStatus(value: string | null | undefined) {
  switch (value) {
    case "paid":
      return "оплачен";
    case "unpaid":
      return "не оплачен";
    case "no_payment_required":
      return "оплата не требуется";
    default:
      return value ?? "неизвестно";
  }
}

export function formatStripeSessionStatus(value: string | null | undefined) {
  switch (value) {
    case "complete":
      return "завершён";
    case "open":
      return "открыт";
    case "expired":
      return "истёк";
    default:
      return value ?? "неизвестно";
  }
}
