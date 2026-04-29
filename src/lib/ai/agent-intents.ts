export const AI_AGENT_INTENTS = [
  "general",
  "daily_plan",
  "screen_context",
  "meal_plan",
  "workout_plan",
  "meal_photo",
  "barcode",
  "progress_review",
  "memory_review",
] as const;

export const AI_AGENT_SOURCE_ROUTES = [
  "dashboard",
  "workouts",
  "nutrition",
  "ai",
  "history",
  "settings",
  "admin",
  "unknown",
] as const;

export type AiAgentIntent = (typeof AI_AGENT_INTENTS)[number];
export type AiAgentSourceRoute = (typeof AI_AGENT_SOURCE_ROUTES)[number];

export type AiAgentLaunchContext = {
  badge: string;
  description: string;
  intent: AiAgentIntent;
  contextPayload?: Record<string, string>;
  sourceLabel: string;
  sourceRoute: AiAgentSourceRoute;
  starterPrompt: string;
  title: string;
};

type LaunchSearchParams = {
  from?: string | string[] | undefined;
  intent?: string | string[] | undefined;
};

const sourceLabels: Record<AiAgentSourceRoute, string> = {
  admin: "админка",
  ai: "AI",
  dashboard: "обзор",
  history: "история",
  nutrition: "питание",
  settings: "настройки",
  unknown: "приложение",
  workouts: "тренировки",
};

const intentCopy: Record<
  AiAgentIntent,
  {
    badge: string;
    description: string;
    title: string;
    starterPrompt: (sourceLabel: string) => string;
  }
> = {
  barcode: {
    badge: "Штрихкод",
    description:
      "Найти продукт, объяснить состав и помочь добавить его в питание.",
    title: "Разобрать продукт по штрихкоду",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Помоги мне разобрать продукт по штрихкоду.`,
        "Если продукт уже найден через Open Food Facts, объясни состав, КБЖУ, плюсы/минусы и как лучше вписать его в мой рацион.",
        "Если штрихкода еще нет, подскажи короткий порядок: открыть сканер в питании, импортировать продукт и вернуться к разбору.",
      ].join("\n\n"),
  },
  daily_plan: {
    badge: "Сегодня",
    description:
      "Собрать простой план дня: тренировка, питание и восстановление.",
    title: "План на сегодня",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Составь мне короткий план на сегодня.`,
        "Учитывай мои цели, текущий контекст, питание, тренировки и восстановление.",
        "Дай 3-5 конкретных действий без длинной теории.",
      ].join("\n\n"),
  },
  general: {
    badge: "AI",
    description:
      "Открыть полноценный чат с AI-коучем без привязки к отдельному сценарию.",
    title: "Открыть AI-агента",
    starterPrompt: (sourceLabel) =>
      `Я пришел из раздела «${sourceLabel}». Помоги мне с тренировками, питанием или восстановлением.`,
  },
  meal_photo: {
    badge: "Фото еды",
    description:
      "Загрузить фото еды, получить оценку блюда и сохранить вывод через подтверждение.",
    title: "Разобрать фото еды",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Хочу разобрать фото еды.`,
        "Подскажи, как лучше сфотографировать блюдо, а после загрузки оцени КБЖУ, состав и что можно улучшить.",
      ].join("\n\n"),
  },
  meal_plan: {
    badge: "Питание",
    description:
      "Создать proposal-first план питания под цель, калории и режим.",
    title: "Составить план питания",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Составь черновик плана питания.`,
        "Уточни недостающие ограничения, если они нужны, и подготовь proposal-first план, который я смогу подтвердить перед применением.",
      ].join("\n\n"),
  },
  memory_review: {
    badge: "Память",
    description:
      "Проверить, что AI знает о целях, ограничениях и предпочтениях.",
    title: "Проверить память AI",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Покажи, какие факты обо мне ты учитываешь.`,
        "Раздели ответ на цели, питание, тренировки, ограничения и то, что нужно уточнить.",
      ].join("\n\n"),
  },
  progress_review: {
    badge: "Прогресс",
    description:
      "Разобрать историю тренировок и питания, найти следующий практичный шаг.",
    title: "Проанализировать прогресс",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Проанализируй мой прогресс.`,
        "Найди 2-3 сильных сигнала, 1-2 риска и предложи ближайшее действие на неделю.",
      ].join("\n\n"),
  },
  screen_context: {
    badge: "Контекст",
    description:
      "Спросить AI по текущему экрану без ручного объяснения, где я нахожусь.",
    title: "Спросить по текущему экрану",
    starterPrompt: (sourceLabel) =>
      [
        `Я сейчас в разделе «${sourceLabel}». Объясни, что здесь важнее всего сделать дальше.`,
        "Дай короткий ответ и предложи одно основное действие.",
      ].join("\n\n"),
  },
  workout_plan: {
    badge: "Тренировки",
    description:
      "Создать proposal-first программу тренировок под цель и неделю.",
    title: "Составить тренировку",
    starterPrompt: (sourceLabel) =>
      [
        `Я пришел из раздела «${sourceLabel}». Составь черновик тренировочного плана.`,
        "Уточни недостающие ограничения, если они нужны, и подготовь proposal-first план, который я смогу подтвердить перед применением.",
      ].join("\n\n"),
  },
};

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function isAiAgentIntent(value: string | null): value is AiAgentIntent {
  return AI_AGENT_INTENTS.includes(value as AiAgentIntent);
}

export function isAiAgentSourceRoute(
  value: string | null,
): value is AiAgentSourceRoute {
  return AI_AGENT_SOURCE_ROUTES.includes(value as AiAgentSourceRoute);
}

export function getAiAgentSourceRouteFromPathname(
  pathname: string | null | undefined,
): AiAgentSourceRoute {
  const path = pathname ?? "";

  if (path.startsWith("/admin")) {
    return "admin";
  }

  if (path.startsWith("/ai")) {
    return "ai";
  }

  if (path.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (path.startsWith("/history")) {
    return "history";
  }

  if (path.startsWith("/nutrition")) {
    return "nutrition";
  }

  if (path.startsWith("/settings")) {
    return "settings";
  }

  if (path.startsWith("/workouts")) {
    return "workouts";
  }

  return "unknown";
}

export function createAiAgentLaunchContext(input: {
  intent: AiAgentIntent;
  sourceRoute?: AiAgentSourceRoute | null;
}): AiAgentLaunchContext {
  const sourceRoute = input.sourceRoute ?? "unknown";
  const sourceLabel = sourceLabels[sourceRoute];
  const copy = intentCopy[input.intent];

  return {
    badge: copy.badge,
    description: copy.description,
    intent: input.intent,
    sourceLabel,
    sourceRoute,
    starterPrompt: copy.starterPrompt(sourceLabel),
    title: copy.title,
  };
}

export function resolveAiAgentLaunchContext(
  searchParams: LaunchSearchParams,
): AiAgentLaunchContext | null {
  const intentValue = readSearchValue(searchParams.intent);

  if (!isAiAgentIntent(intentValue)) {
    return null;
  }

  const sourceValue = readSearchValue(searchParams.from);
  const sourceRoute = isAiAgentSourceRoute(sourceValue) ? sourceValue : "unknown";

  return createAiAgentLaunchContext({
    intent: intentValue,
    sourceRoute,
  });
}

export function createAiAgentLaunchHref(input: {
  intent: AiAgentIntent;
  sourceRoute?: AiAgentSourceRoute | null;
}) {
  const params = new URLSearchParams({
    intent: input.intent,
    from: input.sourceRoute ?? "unknown",
  });

  return `/ai?${params.toString()}`;
}

export function getAiAgentIntentTitle(intent: AiAgentIntent) {
  return intentCopy[intent].title;
}
