import type { SettingsDataSnapshot } from "@/lib/settings-data";

export const settingsDataInputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSettingsDataDateTime(value: string | null | undefined) {
  if (!value) {
    return "нет данных";
  }

  return dateFormatter.format(new Date(value));
}

export function getExportStatusLabel(
  status: SettingsDataSnapshot["exportJobs"][number]["status"],
) {
  switch (status) {
    case "queued":
      return "в очереди";
    case "processing":
      return "собирается";
    case "completed":
      return "готов";
    case "failed":
      return "ошибка";
    default:
      return status;
  }
}

export function getDeletionStatusLabel(
  status: NonNullable<SettingsDataSnapshot["deletionRequest"]>["status"],
) {
  switch (status) {
    case "queued":
      return "в очереди";
    case "holding":
      return "на удержании";
    case "completed":
      return "завершен";
    case "canceled":
      return "отменен";
    default:
      return status;
  }
}

export function getSettingsDataStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "holding":
      return "bg-amber-50 text-amber-700";
    case "processing":
      return "bg-sky-50 text-sky-700";
    case "queued":
      return "bg-stone-100 text-stone-700";
    case "canceled":
      return "bg-white/80 text-muted";
    default:
      return "bg-white/80 text-foreground";
  }
}

export function getSettingsDataTimelineTone(
  tone: SettingsDataSnapshot["privacyEvents"][number]["tone"],
) {
  switch (tone) {
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

export function getSettingsDataActorLabel(
  actorScope: SettingsDataSnapshot["privacyEvents"][number]["actorScope"],
) {
  switch (actorScope) {
    case "you":
      return "Вы";
    case "support":
      return "Поддержка";
    case "system":
      return "Система";
    default:
      return actorScope;
  }
}

export function getSettingsDataKindLabel(
  kind: SettingsDataSnapshot["privacyEvents"][number]["kind"],
) {
  return kind === "export" ? "Выгрузка" : "Удаление";
}

export function getHoldRemainingLabel(holdUntil: string | null | undefined) {
  if (!holdUntil) {
    return "Срок hold пока не определён.";
  }

  const diff = new Date(holdUntil).getTime() - Date.now();

  if (diff <= 0) {
    return "Срок hold уже истёк, ожидается следующий шаг обработки.";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `До следующего шага остаётся примерно ${days} дн.`;
}

export function getExportNextStep(snapshot: SettingsDataSnapshot) {
  const latestExport = snapshot.exportJobs[0];

  if (!latestExport) {
    return "Когда понадобится архив, запроси выгрузку и система соберёт ZIP автоматически.";
  }

  if (latestExport.status === "queued") {
    return "Запрос стоит в очереди. Следующий шаг: сервер начнёт собирать архив.";
  }

  if (latestExport.status === "processing") {
    return "Архив сейчас собирается. После завершения появится кнопка скачивания ZIP.";
  }

  if (latestExport.status === "completed") {
    return "Архив готов. Его можно скачать прямо на это устройство.";
  }

  return "Последняя сборка завершилась ошибкой. Можно повторно запросить новый экспорт.";
}

export function getDeletionNextStep(snapshot: SettingsDataSnapshot) {
  const deletionRequest = snapshot.deletionRequest;

  if (!deletionRequest) {
    return "Если потребуется удалить аккаунт, сначала будет создан hold-период на 14 дней.";
  }

  if (deletionRequest.status === "holding") {
    return getHoldRemainingLabel(deletionRequest.holdUntil);
  }

  if (deletionRequest.status === "queued") {
    return "Запрос ожидает перевода в hold или следующий этап обработки.";
  }

  if (deletionRequest.status === "completed") {
    return "Процесс удаления уже продвинулся дальше периода удержания. Детали смотри в истории ниже.";
  }

  return "Активный процесс удаления остановлен. При необходимости можно создать новый запрос.";
}
