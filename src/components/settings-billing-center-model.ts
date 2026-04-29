import type { BillingProvider } from "@/lib/billing-provider";
import type { SettingsDataSnapshot } from "@/lib/settings-data";

export const CHECKOUT_RETURN_RETRY_DELAYS_MS = [2500, 5000, 8000] as const;

export const settingsBillingInputClassName =
  "w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
    return "полный корневой доступ";
  }

  switch (status) {
    case "active":
      return "активна";
    case "trial":
    case "trialing":
      return "пробный период";
    case "past_due":
      return "нужна оплата";
    case "canceled":
      return "отключена";
    case "incomplete":
      return "ожидает оплаты";
    case "incomplete_expired":
      return "истекла без оплаты";
    case "paused":
      return "на паузе";
    case "unpaid":
      return "не оплачена";
    default:
      return status ?? "нет";
  }
}

export function formatSubscriptionProvider(
  provider: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "административный доступ";
  }

  switch (provider) {
    case "cloudpayments":
      return "CloudPayments";
    case "stripe":
      return "Stripe";
    case "admin_trial":
      return "тестовый доступ";
    case "admin_console":
      return "ручное управление";
    case "manual":
      return "ручное подключение";
    case "system":
      return "система";
    default:
      return provider ?? "не задан";
  }
}

export function getSubscriptionDaysRemaining(value: string | null | undefined) {
  if (!value) {
    return "без даты окончания";
  }

  const endTime = new Date(value).getTime();

  if (!Number.isFinite(endTime)) {
    return "без даты окончания";
  }

  const remainingDays = Math.ceil((endTime - Date.now()) / DAY_IN_MS);

  if (remainingDays <= 0) {
    return "истёк";
  }

  return `${remainingDays} дн.`;
}

export function getSubscriptionAccessBadge(
  status: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "корневой доступ";
  }

  if (status === "trial") {
    return "тестовый доступ";
  }

  if (status === "active") {
    return "подписка активна";
  }

  if (status === "past_due") {
    return "нужна оплата";
  }

  return "без подписки";
}

export function getSubscriptionAccessSummary(
  status: string | null,
  currentPeriodEnd: string | null | undefined,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "Администраторский профиль: функции открыты без ограничения срока.";
  }

  if (status === "trial") {
    return `Тестовый период активен, осталось ${getSubscriptionDaysRemaining(currentPeriodEnd)}.`;
  }

  if (status === "active") {
    return `Подписка активна, текущий период: ${formatSettingsDateTime(currentPeriodEnd)}.`;
  }

  if (status === "past_due") {
    return "Подписка требует оплаты или ручной проверки.";
  }

  return "Расширенный доступ не активен.";
}

export function formatUsageLimit(value: number | null | undefined) {
  if (typeof value === "number") {
    return value.toLocaleString("ru-RU");
  }

  return "без лимита";
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
      return "bg-emerald-500/12 text-emerald-700 border border-emerald-500/30";
    case "failed":
      return "bg-red-500/10 text-red-700 border border-red-500/30";
    case "queued":
      return "bg-amber-500/10 text-amber-700 border border-amber-400/30";
    default:
      return "bg-white/10 text-foreground border border-border";
  }
}

export function getTimelineTone(
  value: SettingsDataSnapshot["billingEvents"][number]["tone"],
) {
  switch (value) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/12";
    case "warning":
      return "border-amber-400/30 bg-amber-500/10";
    case "danger":
      return "border-red-500/30 bg-red-500/10";
    default:
      return "border-border bg-background/40";
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

export function formatBillingPaymentStatus(value: string | null | undefined) {
  switch (value) {
    case "paid":
      return "оплачен";
    case "active":
      return "активна";
    case "unpaid":
      return "не оплачен";
    case "past_due":
      return "нужна оплата";
    case "canceled":
      return "отключена";
    case "no_payment_required":
      return "оплата не требуется";
    default:
      return value ?? "неизвестно";
  }
}

export function formatBillingSessionStatus(value: string | null | undefined) {
  switch (value) {
    case "complete":
      return "завершен";
    case "open":
      return "открыт";
    case "expired":
      return "истек";
    case "pending":
      return "ожидает подтверждения";
    default:
      return value ?? "неизвестно";
  }
}

export function formatBillingManagementLabel(provider: BillingProvider) {
  return provider === "cloudpayments"
    ? "Управлять в CloudPayments"
    : "Управлять подпиской";
}
