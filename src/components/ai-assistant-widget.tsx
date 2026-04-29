"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Camera,
  ClipboardList,
  Dumbbell,
  History,
  MessageCircle,
  ScanBarcode,
  Settings2,
  Sparkles,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  createAiAgentLaunchHref,
  getAiAgentSourceRouteFromPathname,
  type AiAgentIntent,
  type AiAgentSourceRoute,
} from "@/lib/ai/agent-intents";

type AiAssistantWidgetProps = {
  hidden?: boolean;
  initialMessages?: Array<{
    id: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;
  initialSessionId?: string | null;
  viewer: {
    email: string | null;
    fullName: string | null;
  };
};

type LauncherAction = {
  description: string;
  href: Route;
  icon: LucideIcon;
  label: string;
  testId: string;
  title: string;
};

function createIntentAction(input: {
  description: string;
  icon: LauncherAction["icon"];
  intent: AiAgentIntent;
  label: string;
  sourceRoute: AiAgentSourceRoute;
  testId: string;
  title: string;
}): LauncherAction {
  return {
    description: input.description,
    href: createAiAgentLaunchHref({
      intent: input.intent,
      sourceRoute: input.sourceRoute,
    }) as Route,
    icon: input.icon,
    label: input.label,
    testId: input.testId,
    title: input.title,
  };
}

function getRouteActions(sourceRoute: AiAgentSourceRoute): LauncherAction[] {
  const screenContextAction = createIntentAction({
    description: "Получить короткую подсказку по текущему экрану.",
    icon: MessageCircle,
    intent: "screen_context",
    label: "Контекст",
    sourceRoute,
    testId: "ai-launcher-action-screen-context",
    title: "Спросить по этому экрану",
  });

  if (sourceRoute === "nutrition") {
    return [
      createIntentAction({
        description: "Загрузить фото еды и получить разбор блюда.",
        icon: Camera,
        intent: "meal_photo",
        label: "Фото еды",
        sourceRoute,
        testId: "ai-launcher-action-meal-photo",
        title: "Разобрать фото еды",
      }),
      {
        description: "Открыть сканер и импорт продукта из Open Food Facts.",
        href: "/nutrition?panel=foods" as Route,
        icon: ScanBarcode,
        label: "Сканер",
        testId: "ai-launcher-action-barcode-scanner",
        title: "Сканировать штрихкод",
      },
      createIntentAction({
        description: "Собрать proposal-first рацион под цель и режим.",
        icon: Utensils,
        intent: "meal_plan",
        label: "План",
        sourceRoute,
        testId: "ai-launcher-action-meal-plan",
        title: "План питания",
      }),
      screenContextAction,
    ];
  }

  if (sourceRoute === "workouts") {
    return [
      createIntentAction({
        description: "Собрать или адаптировать программу тренировок.",
        icon: Dumbbell,
        intent: "workout_plan",
        label: "План",
        sourceRoute,
        testId: "ai-launcher-action-workout-plan",
        title: "План тренировок",
      }),
      createIntentAction({
        description: "Понять, что делать с нагрузкой, усталостью и прогрессом.",
        icon: History,
        intent: "progress_review",
        label: "Анализ",
        sourceRoute,
        testId: "ai-launcher-action-progress",
        title: "Разобрать прогресс",
      }),
      screenContextAction,
    ];
  }

  if (sourceRoute === "history") {
    return [
      createIntentAction({
        description: "Найти тренд, риск и следующий шаг на неделю.",
        icon: History,
        intent: "progress_review",
        label: "Прогресс",
        sourceRoute,
        testId: "ai-launcher-action-progress",
        title: "Проанализировать историю",
      }),
      createIntentAction({
        description: "Подстроить тренировки по фактической истории.",
        icon: Dumbbell,
        intent: "workout_plan",
        label: "Тренировки",
        sourceRoute,
        testId: "ai-launcher-action-workout-plan",
        title: "Скорректировать план",
      }),
      screenContextAction,
    ];
  }

  if (sourceRoute === "settings") {
    return [
      createIntentAction({
        description: "Проверить цели, ограничения и предпочтения в памяти AI.",
        icon: Settings2,
        intent: "memory_review",
        label: "Память",
        sourceRoute,
        testId: "ai-launcher-action-memory",
        title: "Проверить память AI",
      }),
      screenContextAction,
    ];
  }

  return [
    createIntentAction({
      description: "Собрать короткий план дня по тренировкам и питанию.",
      icon: ClipboardList,
      intent: "daily_plan",
      label: "Сегодня",
      sourceRoute,
      testId: "ai-launcher-action-daily-plan",
      title: "План на сегодня",
    }),
    createIntentAction({
      description: "Создать proposal-first рацион под текущую цель.",
      icon: Utensils,
      intent: "meal_plan",
      label: "Питание",
      sourceRoute,
      testId: "ai-launcher-action-meal-plan",
      title: "План питания",
    }),
    createIntentAction({
      description: "Создать или адаптировать тренировочный план.",
      icon: Dumbbell,
      intent: "workout_plan",
      label: "Тренировки",
      sourceRoute,
      testId: "ai-launcher-action-workout-plan",
      title: "План тренировок",
    }),
    screenContextAction,
  ];
}

export function AiAssistantWidget({
  hidden = false,
  viewer,
}: AiAssistantWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const sourceRoute = getAiAgentSourceRouteFromPathname(pathname);
  const viewerIdentity = viewer.fullName ?? viewer.email ?? "Аккаунт fitora";
  const primaryHref = createAiAgentLaunchHref({
    intent: "general",
    sourceRoute,
  }) as Route;
  const actions = getRouteActions(sourceRoute);
  const isLauncherOpen = isOpen && !hidden;

  useEffect(() => {
    if (!isLauncherOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLauncherOpen]);

  if (hidden) {
    return null;
  }

  return (
    <>
      <button
        aria-expanded={isLauncherOpen}
        aria-label="Открыть быстрые действия AI"
        className="fitora-ai-fab"
        data-testid="ai-assistant-widget-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Sparkles size={18} strokeWidth={2.2} />
        AI
      </button>

      <div
        aria-hidden={!isLauncherOpen}
        className={`app-drawer-backdrop ${
          isLauncherOpen ? "app-drawer-backdrop--visible" : ""
        }`}
        onClick={() => setIsOpen(false)}
      />

      {isLauncherOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-0 z-[70] flex items-end justify-center p-3 sm:p-4 lg:items-end lg:justify-end lg:p-6"
          data-testid="ai-launcher-sheet"
        >
          <section className="surface-panel w-full max-w-[26.875rem] overflow-hidden p-3.5 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.42)] lg:max-w-[26rem]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <span className="pill">AI-агент</span>
                  <span className="pill">launcher</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  Что поручить AI?
                </h2>
                <p className="mt-1 truncate text-sm text-muted">
                  {viewerIdentity}
                </p>
              </div>

              <button
                aria-label="Закрыть AI launcher"
                className="chat-toolbar-button shrink-0"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <Link
              className="surface-panel surface-panel--accent mt-3 flex items-center justify-between gap-3 p-3.5 text-left transition hover:-translate-y-0.5"
              data-testid="ai-launcher-open-agent"
              href={primaryHref}
              onClick={() => setIsOpen(false)}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/88 text-accent-strong">
                  <Bot size={19} strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Открыть полноценного AI-агента
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    Большой чат, планы, история и подтверждение действий.
                  </span>
                </span>
              </span>
              <ArrowRight size={17} strokeWidth={2.2} />
            </Link>

            <div className="mt-3 grid gap-2">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    className="section-chip flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                    data-testid={action.testId}
                    href={action.href}
                    key={`${action.testId}:${action.href}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] bg-[color:var(--accent-soft)] text-accent-strong">
                        <Icon size={17} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="pill px-2 py-1 text-[0.62rem]">
                            {action.label}
                          </span>
                          <span className="truncate text-sm font-semibold">
                            {action.title}
                          </span>
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                          {action.description}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </Link>
                );
              })}
            </div>

            <p className="mt-3 rounded-[0.9rem] bg-[color:var(--surface-soft)] px-3 py-2 text-xs leading-5 text-muted">
              Виджет больше не дублирует чат. Длинные диалоги и применение
              планов выполняются только в полноценном AI Agent Center.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
