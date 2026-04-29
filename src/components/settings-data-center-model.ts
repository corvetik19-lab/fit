import type { SettingsDataSnapshot } from "@/lib/settings-data";

export const settingsDataInputClassName =
  "w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

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
      return "в hold";
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
      return "bg-emerald-500/12 text-emerald-700 border border-emerald-500/30";
    case "failed":
      return "bg-red-500/10 text-red-700 border border-red-500/30";
    case "holding":
      return "bg-amber-500/10 text-amber-700 border border-amber-400/30";
    case "processing":
      return "bg-sky-500/10 text-sky-700 border border-sky-400/30";
    case "queued":
      return "bg-white/10 text-foreground border border-border";
    case "canceled":
      return "bg-white/6 text-muted border border-border";
    default:
      return "bg-white/10 text-foreground border border-border";
  }
}

export function getSettingsDataTimelineTone(
  tone: SettingsDataSnapshot["privacyEvents"][number]["tone"],
) {
  switch (tone) {
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
    return "Срок удержания пока не определен.";
  }

  const diff = new Date(holdUntil).getTime() - Date.now();

  if (diff <= 0) {
    return "Срок удержания уже истек, ожидается следующий этап обработки.";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `До следующего шага остается примерно ${days} дн.`;
}

export function getExportNextStep(snapshot: SettingsDataSnapshot) {
  const latestExport = snapshot.exportJobs[0];

  if (!latestExport) {
    return "Когда понадобится архив, запроси выгрузку и система соберет ZIP автоматически.";
  }

  if (latestExport.status === "queued") {
    return "Запрос стоит в очереди. Следующий шаг: сервер начнет собирать архив.";
  }

  if (latestExport.status === "processing") {
    return "Архив сейчас собирается. После завершения появится кнопка скачивания.";
  }

  if (latestExport.status === "completed") {
    return "Архив готов. Его можно скачать прямо на это устройство.";
  }

  return "Последняя сборка завершилась ошибкой. Можно повторно запросить новый экспорт.";
}

export function getDeletionNextStep(snapshot: SettingsDataSnapshot) {
  const deletionRequest = snapshot.deletionRequest;

  if (!deletionRequest) {
    return "Если понадобится удалить аккаунт, сначала будет создан hold-период на 14 дней.";
  }

  if (deletionRequest.status === "holding") {
    return getHoldRemainingLabel(deletionRequest.holdUntil);
  }

  if (deletionRequest.status === "queued") {
    return "Запрос ожидает перевода в hold или следующий этап обработки.";
  }

  if (deletionRequest.status === "completed") {
    return "Процесс удаления уже перешел на следующий этап. Подробности смотри в истории ниже.";
  }

  return "Активный процесс удаления остановлен. При необходимости можно создать новый запрос.";
}
