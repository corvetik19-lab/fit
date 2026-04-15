"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ClipboardList,
  History,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiWorkspaceSidebar } from "@/components/ai-workspace-sidebar";
import type { AiChatMessageRow, AiChatSessionRow } from "@/lib/ai/chat";
import type { AiPlanProposalRow } from "@/lib/ai/proposals";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type WorkspaceSectionKey = "history" | "context" | "plans";
type AssistantFlowKey = "request" | "analysis" | "proposal" | "approve" | "apply";

type AiWorkspaceProps = {
  chatAccess: FeatureAccessSnapshot;
  initialMessages: AiChatMessageRow[];
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  mealPhotoAccess: FeatureAccessSnapshot;
  proposals: AiPlanProposalRow[];
  recentSessions: AiChatSessionRow[];
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

const sectionMeta: Array<{
  description: string;
  icon: typeof Sparkles;
  key: WorkspaceSectionKey;
  label: string;
}> = [
  {
    key: "history",
    label: "История",
    description: "Сохранённые диалоги и быстрый возврат к прошлым решениям.",
    icon: History,
  },
  {
    key: "context",
    label: "Контекст",
    description: "Факты и сигналы, на которые AI опирается в ответах.",
    icon: Brain,
  },
  {
    key: "plans",
    label: "Планы",
    description: "Черновики, подтверждение и перенос в тренировки или питание.",
    icon: ClipboardList,
  },
];

const assistantFlowSteps: Array<{
  description: string;
  key: AssistantFlowKey;
  label: string;
}> = [
  {
    key: "request",
    label: "Запрос",
    description: "Сформулируй задачу или приложи фото еды.",
  },
  {
    key: "analysis",
    label: "Анализ",
    description: "AI подтягивает контекст, историю и свежие сигналы.",
  },
  {
    key: "proposal",
    label: "Черновик",
    description: "Появляется структурированное предложение по плану или разбору.",
  },
  {
    key: "approve",
    label: "Подтверждение",
    description: "Ты проверяешь детали и утверждаешь нужный вариант.",
  },
  {
    key: "apply",
    label: "Применение",
    description: "План переносится в рабочие разделы приложения.",
  },
];

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatProposalStatus(value: string) {
  switch (value) {
    case "approved":
      return "Подтверждён";
    case "applied":
      return "Применён";
    default:
      return "Черновик";
  }
}

function parseProposalTitle(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as { proposal?: unknown };
  const schema =
    proposal.proposal_type === "meal_plan" ? mealPlanSchema : workoutPlanSchema;
  const parsed = schema.safeParse(payload.proposal);

  if (!parsed.success) {
    return proposal.proposal_type === "meal_plan"
      ? "План питания"
      : "План тренировок";
  }

  return parsed.data.title;
}

function parseProposalSummary(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as {
    proposal?: unknown;
    request?: {
      daysPerWeek?: number | null;
      dietaryNotes?: string | null;
      focus?: string | null;
      kcalTarget?: number | null;
      mealsPerDay?: number | null;
    };
  };
  const request = payload.request;

  if (proposal.proposal_type === "meal_plan") {
    const parsed = mealPlanSchema.safeParse(payload.proposal);
    if (parsed.success) {
      return `${parsed.data.caloriesTarget} ккал, ${parsed.data.meals.length} приёмов пищи`;
    }

    return [
      request?.kcalTarget ? `${request.kcalTarget} ккал` : null,
      request?.mealsPerDay ? `${request.mealsPerDay} приёмов пищи` : null,
      request?.dietaryNotes?.trim() || null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const parsed = workoutPlanSchema.safeParse(payload.proposal);
  if (parsed.success) {
    return `${parsed.data.days.length} тренировочных дня · ${parsed.data.summary}`;
  }

  return [
    request?.daysPerWeek ? `${request.daysPerWeek} дня в неделю` : null,
    request?.focus?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getCurrentFlowStep(
  messagesCount: number,
  proposals: AiPlanProposalRow[],
): AssistantFlowKey {
  if (proposals.some((proposal) => proposal.status === "applied")) {
    return "apply";
  }

  if (proposals.some((proposal) => proposal.status === "approved")) {
    return "approve";
  }

  if (proposals.some((proposal) => proposal.status === "draft")) {
    return "proposal";
  }

  if (messagesCount > 0) {
    return "analysis";
  }

  return "request";
}

function getFlowStepState(step: AssistantFlowKey, current: AssistantFlowKey) {
  const currentIndex = assistantFlowSteps.findIndex((item) => item.key === current);
  const stepIndex = assistantFlowSteps.findIndex((item) => item.key === step);

  if (stepIndex < currentIndex) {
    return "done";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

function getNextFlowHint(current: AssistantFlowKey) {
  switch (current) {
    case "request":
      return "Сформулируй задачу в чате, чтобы AI начал анализ.";
    case "analysis":
      return "Дождись ответа или черновика прямо в ленте диалога.";
    case "proposal":
      return "Открой раздел «Планы» или подтверди карточку предложения в чате.";
    case "approve":
      return "После подтверждения можно сразу перенести план в рабочий раздел.";
    case "apply":
      return "Готово: переходи в тренировки или питание и работай с новым планом.";
    default:
      return "";
  }
}

async function fetchMutationWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
  timeoutMs = 10_000,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function clearSessionQueryParam() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("session");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function FlowCard({ currentStep }: { currentStep: AssistantFlowKey }) {
  const currentMeta =
    assistantFlowSteps.find((step) => step.key === currentStep) ?? assistantFlowSteps[0];

  return (
    <section className="card card--hero p-4 sm:p-5" data-testid="ai-assistant-flow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="workspace-kicker">Сценарий AI</p>
          <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
            От запроса до применения
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            AI не пишет планы за тебя молча. Сначала он понимает задачу, затем
            собирает контекст, показывает черновик и только после подтверждения
            переносит решение в продукт.
          </p>
        </div>
        <span className="pill">Сейчас: {currentMeta.label}</span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-5">
        {assistantFlowSteps.map((step, index) => {
          const state = getFlowStepState(step.key, currentStep);
          const isDone = state === "done";
          const isActive = state === "active";

          return (
            <article
              className={`rounded-[1.75rem] border px-4 py-4 text-sm ${
                isActive
                  ? "border-accent/24 bg-[color-mix(in_srgb,var(--accent-soft)_76%,white)] shadow-[0_24px_52px_-38px_rgba(0,64,224,0.28)]"
                  : isDone
                    ? "border-emerald-500/25 bg-emerald-500/12"
                    : "border-border bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface))]"
              }`}
              data-flow-state={state}
              key={step.key}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-accent text-white"
                      : isDone
                      ? "bg-emerald-500 text-white"
                        : "bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))] text-muted"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} strokeWidth={2.2} /> : index + 1}
                </span>
                <p className="font-semibold text-foreground">{step.label}</p>
              </div>
              <p className="mt-3 leading-6 text-muted">{step.description}</p>
            </article>
          );
        })}
      </div>

      <div className="surface-panel mt-4 px-4 py-3 text-sm text-muted">
        <span className="font-semibold text-foreground">Следующий шаг.</span>{" "}
        {getNextFlowHint(currentStep)}
      </div>
    </section>
  );
}

function WorkspaceStatCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "accent";
  value: string;
}) {
  return (
    <article className={`metric-tile p-4 ${tone === "accent" ? "surface-panel--accent" : ""}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </article>
  );
}

function PlansSection({ proposals }: { proposals: AiPlanProposalRow[] }) {
  return (
    <section className="card card--hero p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="workspace-kicker">Планы</p>
          <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
            Черновики, подтверждение и перенос
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Здесь лежат предложения AI по тренировкам и питанию. Их можно
            спокойно посмотреть, подтвердить и только потом применить в рабочие
            разделы приложения.
          </p>
        </div>
        <span className="pill">{proposals.length} в работе</span>
      </div>

      <div className="mt-4 grid gap-3" id="ai-plans">
        {proposals.length ? (
          proposals.map((proposal) => (
            <article className="surface-panel p-4" key={proposal.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">
                      {proposal.proposal_type === "meal_plan" ? "Питание" : "Тренировки"}
                    </span>
                    <span className="pill">{formatProposalStatus(proposal.status)}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {parseProposalTitle(proposal)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {parseProposalSummary(proposal) ||
                      "Параметры черновика уже сохранены и готовы к проверке."}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {dateFormatter.format(new Date(proposal.updated_at))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {proposal.status !== "applied" ? (
                  <span className="toggle-chip toggle-chip--active px-3 py-1.5 text-xs font-semibold">
                    Можно подтвердить или применить прямо из чата
                  </span>
                ) : (
                  <Link
                    className="toggle-chip px-3 py-2 text-sm font-semibold"
                    href={proposal.proposal_type === "meal_plan" ? "/nutrition" : "/workouts"}
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="surface-panel border-dashed px-4 py-6 text-sm leading-6 text-muted">
            Здесь появятся черновики, которые AI соберёт по твоим запросам.
          </div>
        )}
      </div>
    </section>
  );
}

export function AiWorkspace({
  chatAccess,
  initialMessages,
  initialSessionId,
  initialSessionTitle,
  mealPhotoAccess,
  proposals,
  recentSessions,
  structuredKnowledge,
}: AiWorkspaceProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>("history");
  const [activeChatSessionId, setActiveChatSessionId] = useState(initialSessionId);
  const [sessionList, setSessionList] = useState(() => recentSessions);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatPanelResetVersion, setChatPanelResetVersion] = useState(0);

  useEffect(() => {
    setActiveChatSessionId(initialSessionId);
  }, [initialSessionId]);

  const currentFlowStep = useMemo(
    () => getCurrentFlowStep(initialMessages.length, proposals),
    [initialMessages.length, proposals],
  );

  function upsertSession(session: AiChatSessionRow) {
    setActiveChatSessionId(session.id);
    setSessionList((current) => [
      session,
      ...current.filter((item) => item.id !== session.id),
    ]);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("Удалить этот чат из истории?")) {
      return;
    }

    setHistoryError(null);
    setBusySessionId(sessionId);
    const previousSessions = sessionList;
    const previousActiveSessionId = activeChatSessionId;
    const nextSessions = previousSessions.filter((item) => item.id !== sessionId);
    const isDeletingActiveSession = sessionId === activeChatSessionId;

    setSessionList(nextSessions);

    try {
      if (isDeletingActiveSession) {
        setActiveChatSessionId(null);
        clearSessionQueryParam();
        setChatPanelResetVersion((current) => current + 1);
      }

      const response = await fetchMutationWithTimeout(`/api/ai/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось удалить чат.");
      }
    } catch (error) {
      setSessionList(previousSessions);
      setActiveChatSessionId(previousActiveSessionId);

      if (isDeletingActiveSession) {
        setChatPanelResetVersion((current) => current + 1);
      }

      setHistoryError(
        error instanceof Error
          ? error.name === "AbortError"
            ? "Сессия не удалилась вовремя. Попробуй ещё раз."
            : error.message
          : "Не удалось удалить чат.",
      );
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleClearSessions() {
    if (!sessionList.length) {
      return;
    }

    if (!window.confirm("Очистить всю историю AI-чатов? Это действие нельзя отменить.")) {
      return;
    }

    setHistoryError(null);
    setIsClearingAll(true);
    const previousSessions = sessionList;
    const previousActiveSessionId = activeChatSessionId;

    setSessionList([]);
    setActiveChatSessionId(null);
    clearSessionQueryParam();
    setChatPanelResetVersion((current) => current + 1);

    try {
      const response = await fetchMutationWithTimeout("/api/ai/sessions", {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось очистить историю чатов.");
      }
    } catch (error) {
      setSessionList(previousSessions);
      setActiveChatSessionId(previousActiveSessionId);
      setChatPanelResetVersion((current) => current + 1);
      setHistoryError(
        error instanceof Error
          ? error.name === "AbortError"
            ? "История не очистилась вовремя. Попробуй ещё раз."
            : error.message
          : "Не удалось очистить историю чатов.",
      );
    } finally {
      setIsClearingAll(false);
    }
  }

  const sectionContent =
    activeSection === "plans" ? (
      <PlansSection proposals={proposals} />
    ) : (
      <AiWorkspaceSidebar
        activeSessionId={activeChatSessionId}
        busySessionId={busySessionId}
        historyError={historyError}
        isClearingAll={isClearingAll}
        onClearSessions={activeSection === "history" ? handleClearSessions : undefined}
        onDeleteSession={activeSection === "history" ? handleDeleteSession : undefined}
        recentSessions={sessionList}
        section={activeSection}
        structuredKnowledge={structuredKnowledge}
      />
    );

  const activeMeta =
    sectionMeta.find((item) => item.key === activeSection) ?? sectionMeta[0];
  const shouldReuseServerSession =
    activeChatSessionId !== null && activeChatSessionId === initialSessionId;
  const summaryCards = [
    {
      label: "Чатов в истории",
      tone: "default" as const,
      value: sessionList.length.toLocaleString("ru-RU"),
    },
    {
      label: "Фактов в контексте",
      tone: "default" as const,
      value: structuredKnowledge.facts.length.toLocaleString("ru-RU"),
    },
    {
      label: "Черновиков",
      tone: "accent" as const,
      value: proposals.length.toLocaleString("ru-RU"),
    },
  ];

  function handleSectionSelect(nextSection: WorkspaceSectionKey) {
    setActiveSection(nextSection);
    setIsMobileMenuOpen(false);
  }

  function returnToApp() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="grid gap-5">
      <section className="card card--hero overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="pill">AI коуч</span>
              <span className="pill">
                {mealPhotoAccess.allowed ? "Фото еды включено" : "Фото еды отключено"}
              </span>
              <span className="pill">
                {chatAccess.allowed ? "Чат доступен" : "Доступ ограничен"}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="app-display max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Чат, контекст и перенос решений в один рабочий AI-экран.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Здесь остаются только полезные поверхности: сам диалог, история,
                факты, предложения по планам и быстрый разбор фото еды. На
                телефоне экран ощущается как компактная PWA-панель, а не как
                набор перегруженных виджетов.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {summaryCards.map((card) => (
                <WorkspaceStatCard
                  key={card.label}
                  label={card.label}
                  tone={card.tone}
                  value={card.value}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <article className="athletic-hero-card p-5">
              <div className="relative z-[1]">
                <p className="athletic-hero-chip">Сейчас в фокусе</p>
                <p className="mt-4 text-xl font-semibold text-white">
                  AI-коуч остаётся proposal-first: сначала анализ, затем
                  черновик, потом подтверждение и только после этого перенос в
                  продукт.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="athletic-hero-chip">
                    {proposals.length} черновиков
                  </span>
                  <span className="athletic-hero-chip">
                    {structuredKnowledge.facts.length} фактов в контексте
                  </span>
                </div>
              </div>
            </article>

            <div className="flex flex-wrap gap-2">
              <button
                className="toggle-chip px-4 py-2 text-sm font-semibold"
                onClick={returnToApp}
                type="button"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
                Вернуться к дашборду
              </button>
              <Link
                className="toggle-chip toggle-chip--active px-4 py-2 text-sm font-semibold"
                href="/dashboard#ai"
              >
                Открыть AI-сводку
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FlowCard currentStep={currentFlowStep} />

      <section className="card card--hero p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-kicker">Разделы AI</p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
              Открывай только нужный слой рабочего экрана
            </h2>
          </div>
          <span className="pill">Сейчас: {activeMeta.label}</span>
        </div>

        <div className="mt-4 md:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            data-testid="ai-workspace-mobile-trigger"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                Раздел AI
              </span>
              <span className="mt-1 block text-sm font-semibold text-foreground">
                {activeMeta.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {activeMeta.description}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] text-foreground shadow-[0_18px_32px_-26px_rgba(0,64,224,0.18)]">
              {isMobileMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </span>
          </button>

          {isMobileMenuOpen ? (
            <div className="mt-3 grid gap-2 rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface-overlay)_92%,var(--surface-elevated))] p-3 shadow-[0_30px_60px_-48px_rgba(18,32,27,0.34)]">
              {sectionMeta.map((section) => {
                const Icon = section.icon;
                const isActive = section.key === activeSection;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex w-full items-start justify-between gap-3 px-3 py-3 text-left ${
                      isActive ? "section-chip--active" : "border-transparent"
                    }`}
                    data-testid={`ai-workspace-option-${section.key}`}
                    key={section.key}
                    onClick={() => handleSectionSelect(section.key)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? "border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_72%,white)] text-accent"
                            : "bg-accent/8 text-accent"
                        }`}
                      >
                        <Icon size={17} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {section.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {section.description}
                        </span>
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/12 text-emerald-200">
                        <Check size={16} strokeWidth={2.3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
          {sectionMeta.map((section) => {
            const Icon = section.icon;
            const isActive = section.key === activeSection;

            return (
              <button
                aria-pressed={isActive}
                className={`section-chip inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  isActive ? "section-chip--active" : ""
                }`}
                key={section.key}
                onClick={() => handleSectionSelect(section.key)}
                type="button"
              >
                <Icon size={16} strokeWidth={2.1} />
                {section.label}
              </button>
            );
          })}
        </div>

        <div className="surface-panel mt-4 px-4 py-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{activeMeta.label}.</span>{" "}
          {activeMeta.description}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="min-w-0">
          <AiChatPanel
            access={chatAccess}
            initialMessages={shouldReuseServerSession ? initialMessages : []}
            initialSessionId={shouldReuseServerSession ? initialSessionId : null}
            initialSessionTitle={shouldReuseServerSession ? initialSessionTitle : null}
            key={`${chatPanelResetVersion}:${activeChatSessionId ?? "new-chat"}`}
            mealPhotoAccess={mealPhotoAccess}
            onSessionTouched={upsertSession}
          />
        </div>

        <div className="min-w-0">{sectionContent}</div>
      </div>
    </div>
  );
}
