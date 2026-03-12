"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type { AiPlanProposalRow } from "@/lib/ai/proposals";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

const actionButtonClassName =
  "rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60";

type AiProposalStudioProps = {
  contextSnapshot: {
    goalType: string | null;
    weeklyTrainingDays: number | null;
    kcalTarget: number | null;
    equipment: string[];
    dietaryPreferences: string[];
  };
  mealPlanAccess: FeatureAccessSnapshot;
  proposals: AiPlanProposalRow[];
  workoutPlanAccess: FeatureAccessSnapshot;
};

type MealPlanProposal = {
  title: string;
  caloriesTarget: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  meals: Array<{
    name: string;
    kcal: number;
    items: string[];
  }>;
};

type WorkoutPlanProposal = {
  title: string;
  summary: string;
  days: Array<{
    day: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
    }>;
  }>;
};

type ProposalPayload = {
  request?: {
    goal?: string | null;
    kcalTarget?: number | null;
    dietaryNotes?: string | null;
    mealsPerDay?: number | null;
    equipment?: string[];
    daysPerWeek?: number | null;
    focus?: string | null;
  };
  proposal?: MealPlanProposal | WorkoutPlanProposal;
  knowledge?: unknown[];
  approvedAt?: string;
  appliedAt?: string;
  appliedWeekStartDate?: string;
  appliedWeeklyProgramId?: string;
  appliedMealTemplateIds?: string[];
};

type ProposalStat = {
  label: string;
  value: string;
};

function formatGoal(value: string | null) {
  switch (value) {
    case "fat_loss":
      return "Снижение веса";
    case "muscle_gain":
      return "Набор мышц";
    case "performance":
      return "Производительность";
    case "maintenance":
      return "Поддержание формы";
    default:
      return "Не указана";
  }
}

function formatProposalType(value: string) {
  return value === "meal_plan" ? "Питание" : "Тренировки";
}

function formatProposalStatus(value: string) {
  switch (value) {
    case "draft":
      return "черновик";
    case "approved":
      return "подтвержден";
    case "applied":
      return "применен";
    case "rejected":
      return "отклонен";
    default:
      return value;
  }
}

function formatAccessSource(value: string) {
  switch (value) {
    case "subscription":
      return "подписка";
    case "entitlement":
      return "ручное открытие";
    case "privileged":
      return "корневой доступ";
    default:
      return value;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getProposalPayload(row: AiPlanProposalRow) {
  return row.payload as ProposalPayload;
}

function extractMealProposal(row: AiPlanProposalRow) {
  if (row.proposal_type !== "meal_plan") {
    return null;
  }

  const payload = getProposalPayload(row);
  return (payload.proposal as MealPlanProposal | undefined) ?? null;
}

function extractWorkoutProposal(row: AiPlanProposalRow) {
  if (row.proposal_type !== "workout_plan") {
    return null;
  }

  const payload = getProposalPayload(row);
  return (payload.proposal as WorkoutPlanProposal | undefined) ?? null;
}

function getProposalTitle(row: AiPlanProposalRow) {
  return (
    extractMealProposal(row)?.title ??
    extractWorkoutProposal(row)?.title ??
    formatProposalType(row.proposal_type)
  );
}

function getProposalStats(row: AiPlanProposalRow): ProposalStat[] {
  const mealProposal = extractMealProposal(row);

  if (mealProposal) {
    return [
      { label: "Цель по калориям", value: `${mealProposal.caloriesTarget} ккал` },
      { label: "Приёмов пищи", value: `${mealProposal.meals.length}` },
      {
        label: "Макросы",
        value: `Б ${mealProposal.macros.protein} · Ж ${mealProposal.macros.fat} · У ${mealProposal.macros.carbs}`,
      },
    ];
  }

  const workoutProposal = extractWorkoutProposal(row);

  if (!workoutProposal) {
    return [];
  }

  const exerciseCount = workoutProposal.days.reduce(
    (sum, day) => sum + day.exercises.length,
    0,
  );
  const setsCount = workoutProposal.days.reduce(
    (sum, day) =>
      sum +
      day.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets, 0),
    0,
  );

  return [
    { label: "Тренировочных дней", value: `${workoutProposal.days.length}` },
    { label: "Упражнений", value: `${exerciseCount}` },
    { label: "Рабочих подходов", value: `${setsCount}` },
  ];
}

function getProposalPreviewItems(row: AiPlanProposalRow) {
  const mealProposal = extractMealProposal(row);

  if (mealProposal) {
    return mealProposal.meals.slice(0, 4).map((meal) => ({
      title: `${meal.name} · ${meal.kcal} ккал`,
      detail: meal.items.join(", "),
    }));
  }

  const workoutProposal = extractWorkoutProposal(row);

  if (!workoutProposal) {
    return [];
  }

  return workoutProposal.days.slice(0, 4).map((day) => ({
    title: `${day.day} · ${day.focus}`,
    detail: day.exercises
      .slice(0, 3)
      .map((exercise) => `${exercise.name} — ${exercise.sets}×${exercise.reps}`)
      .join(", "),
  }));
}

function getProposalRequestSummary(row: AiPlanProposalRow) {
  const payload = getProposalPayload(row);
  const request = payload.request;

  if (!request) {
    return "Запрос не сохранён отдельно.";
  }

  if (row.proposal_type === "meal_plan") {
    const parts = [
      `цель ${formatGoal(request.goal ?? null).toLowerCase()}`,
      request.kcalTarget ? `${request.kcalTarget} ккал` : null,
      request.mealsPerDay ? `${request.mealsPerDay} приёма пищи` : null,
    ].filter(Boolean);

    return parts.join(" · ");
  }

  const parts = [
    `цель ${formatGoal(request.goal ?? null).toLowerCase()}`,
    request.daysPerWeek ? `${request.daysPerWeek} дня в неделю` : null,
    request.equipment?.length ? request.equipment.join(", ") : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

function getProposalRequestNotes(row: AiPlanProposalRow) {
  const payload = getProposalPayload(row);
  const request = payload.request;

  if (!request) {
    return null;
  }

  if (row.proposal_type === "meal_plan") {
    return request.dietaryNotes?.trim() || null;
  }

  return request.focus?.trim() || null;
}

function getProposalTimeline(row: AiPlanProposalRow) {
  const payload = getProposalPayload(row);

  if (payload.appliedAt) {
    if (row.proposal_type === "meal_plan") {
      const createdTemplates = payload.appliedMealTemplateIds?.length ?? 0;
      return `Применён ${formatDateTime(payload.appliedAt)}. Создано ${createdTemplates} шаблонов питания.`;
    }

    return `Применён ${formatDateTime(payload.appliedAt)}${
      payload.appliedWeekStartDate
        ? `. Черновик недели стартует ${payload.appliedWeekStartDate}.`
        : "."
    }`;
  }

  if (payload.approvedAt) {
    return `Подтверждён ${formatDateTime(payload.approvedAt)} и готов к применению.`;
  }

  return "Пока это черновик: можно просмотреть, подтвердить и затем применить одним нажатием.";
}

function getProposalHistorySignal(row: AiPlanProposalRow) {
  const payload = getProposalPayload(row);
  const knowledgeCount = Array.isArray(payload.knowledge) ? payload.knowledge.length : 0;

  if (!knowledgeCount) {
    return "AI собрал предложение по текущему профилю без явного исторического контекста.";
  }

  return `AI использовал ${knowledgeCount} исторических источников из ваших тренировок, питания и профиля.`;
}

function getProposalStatusBadge(status: string) {
  switch (status) {
    case "applied":
      return "border-emerald-300/70 bg-emerald-50 text-emerald-700";
    case "approved":
      return "border-sky-300/70 bg-sky-50 text-sky-700";
    case "draft":
      return "border-slate-300/70 bg-slate-50 text-slate-700";
    default:
      return "border-amber-300/70 bg-amber-50 text-amber-700";
  }
}

function AccessHint({
  access,
}: {
  access: FeatureAccessSnapshot;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm text-muted">
      <p>
        Использовано: {access.usage.count}
        {typeof access.usage.limit === "number" ? ` / ${access.usage.limit}` : ""}
      </p>
      <p className="mt-1">Источник доступа: {formatAccessSource(access.source)}</p>
      {access.reason ? <p className="mt-2 text-amber-700">{access.reason}</p> : null}
      {!access.allowed ? (
        <Link
          className="mt-3 inline-flex rounded-full border border-border bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
          href="/settings#billing-center"
        >
          Открыть billing center
        </Link>
      ) : null}
    </div>
  );
}

function ProposalCard({
  access,
  featured = false,
  isPending,
  onApply,
  onApprove,
  proposal,
}: {
  access: FeatureAccessSnapshot;
  featured?: boolean;
  isPending: boolean;
  onApply: (proposal: AiPlanProposalRow) => void;
  onApprove: (proposal: AiPlanProposalRow) => void;
  proposal: AiPlanProposalRow;
}) {
  const title = getProposalTitle(proposal);
  const stats = getProposalStats(proposal);
  const previewItems = getProposalPreviewItems(proposal);
  const requestSummary = getProposalRequestSummary(proposal);
  const requestNotes = getProposalRequestNotes(proposal);
  const timeline = getProposalTimeline(proposal);
  const historySignal = getProposalHistorySignal(proposal);
  const workoutProposal = extractWorkoutProposal(proposal);
  const statusClassName = getProposalStatusBadge(proposal.status);

  return (
    <article
      className={`rounded-3xl border border-border bg-white/60 p-5 ${
        featured ? "mt-6 shadow-[0_24px_72px_-56px_rgba(15,23,42,0.42)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="pill">{formatProposalType(proposal.proposal_type)}</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClassName}`}
            >
              {formatProposalStatus(proposal.status)}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted">
              Сохранено {formatDateTime(proposal.created_at)} · обновлено{" "}
              {formatDateTime(proposal.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {proposal.status !== "applied" ? (
            <>
              {proposal.status === "draft" ? (
                <button
                  className={actionButtonClassName}
                  disabled={isPending || !access.allowed}
                  onClick={() => onApprove(proposal)}
                  type="button"
                >
                  Подтвердить
                </button>
              ) : null}
              <button
                className={actionButtonClassName}
                disabled={isPending || !access.allowed}
                onClick={() => onApply(proposal)}
                type="button"
              >
                Применить
              </button>
            </>
          ) : null}
        </div>
      </div>

      {stats.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted"
              key={`${proposal.id}-${stat.label}`}
            >
              <p>{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {workoutProposal ? (
        <p className="mt-4 text-sm leading-7 text-muted">{workoutProposal.summary}</p>
      ) : null}

      {previewItems.length ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {previewItems.map((item, index) => (
            <div
              className="rounded-2xl border border-border/70 bg-white/80 px-4 py-4 text-sm"
              key={`${proposal.id}-${item.title}-${index}`}
            >
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 leading-6 text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
          <p className="font-semibold text-foreground">Что запросили у AI</p>
          <p className="mt-2 leading-6">{requestSummary}</p>
          {requestNotes ? <p className="mt-2 leading-6">{requestNotes}</p> : null}
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
          <p className="font-semibold text-foreground">Состояние применения</p>
          <p className="mt-2 leading-6">{timeline}</p>
          <p className="mt-3 leading-6">{historySignal}</p>
        </div>
      </div>

      {!access.allowed && access.reason ? (
        <p className="mt-4 text-sm text-amber-700">{access.reason}</p>
      ) : null}
    </article>
  );
}

export function AiProposalStudio({
  contextSnapshot,
  mealPlanAccess,
  proposals,
  workoutPlanAccess,
}: AiProposalStudioProps) {
  const router = useRouter();
  const [mealGoal, setMealGoal] = useState(contextSnapshot.goalType ?? "maintenance");
  const [mealKcalTarget, setMealKcalTarget] = useState(
    contextSnapshot.kcalTarget?.toString() ?? "",
  );
  const [mealDietaryNotes, setMealDietaryNotes] = useState(
    contextSnapshot.dietaryPreferences.join(", "),
  );
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [workoutGoal, setWorkoutGoal] = useState(
    contextSnapshot.goalType ?? "maintenance",
  );
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(
    contextSnapshot.weeklyTrainingDays?.toString() ?? "3",
  );
  const [workoutEquipment, setWorkoutEquipment] = useState(
    contextSnapshot.equipment.join(", "),
  );
  const [workoutFocus, setWorkoutFocus] = useState("Прогресс без перегруза");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const latestMealProposal = useMemo(
    () => proposals.find((proposal) => proposal.proposal_type === "meal_plan") ?? null,
    [proposals],
  );
  const latestWorkoutProposal = useMemo(
    () =>
      proposals.find((proposal) => proposal.proposal_type === "workout_plan") ?? null,
    [proposals],
  );

  function canUseProposal(proposal: AiPlanProposalRow) {
    return proposal.proposal_type === "meal_plan"
      ? mealPlanAccess.allowed
      : workoutPlanAccess.allowed;
  }

  function getProposalAccess(proposal: AiPlanProposalRow) {
    return proposal.proposal_type === "meal_plan"
      ? mealPlanAccess
      : workoutPlanAccess;
  }

  function getProposalReason(proposal: AiPlanProposalRow) {
    return proposal.proposal_type === "meal_plan"
      ? mealPlanAccess.reason
      : workoutPlanAccess.reason;
  }

  function runMutation(action: () => Promise<void>) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        await action();
      } finally {
        setIsPending(false);
      }
    });
  }

  function createMealPlanProposal() {
    if (!mealPlanAccess.allowed) {
      setError(
        mealPlanAccess.reason ?? "AI-план питания недоступен для текущего плана.",
      );
      return;
    }

    runMutation(async () => {
      const response = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: mealGoal,
          kcalTarget: mealKcalTarget.trim() ? Number(mealKcalTarget) : null,
          dietaryNotes: mealDietaryNotes.trim(),
          mealsPerDay: Number(mealsPerDay) || 4,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: AiPlanProposalRow }
        | null;

      if (!response.ok) {
        setError(
          payload?.message ??
            "Не удалось сгенерировать AI-предложение плана питания.",
        );
        return;
      }

      setNotice("AI-предложение плана питания сохранено в историю.");
      router.refresh();
    });
  }

  function createWorkoutPlanProposal() {
    if (!workoutPlanAccess.allowed) {
      setError(
        workoutPlanAccess.reason ??
          "AI-план тренировок недоступен для текущего плана.",
      );
      return;
    }

    runMutation(async () => {
      const response = await fetch("/api/ai/workout-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: workoutGoal,
          daysPerWeek: Number(workoutDaysPerWeek) || 3,
          equipment: workoutEquipment
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          focus: workoutFocus.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: AiPlanProposalRow }
        | null;

      if (!response.ok) {
        setError(
          payload?.message ??
            "Не удалось сгенерировать AI-предложение тренировочного плана.",
        );
        return;
      }

      setNotice("AI-предложение тренировочного плана сохранено в историю.");
      router.refresh();
    });
  }

  function approveProposal(proposal: AiPlanProposalRow) {
    if (!canUseProposal(proposal)) {
      setError(
        getProposalReason(proposal) ??
          "Это AI-предложение недоступно для текущего плана.",
      );
      return;
    }

    runMutation(async () => {
      const response = await fetch(`/api/ai/proposals/${proposal.id}/approve`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось подтвердить AI-предложение.");
        return;
      }

      setNotice(
        proposal.proposal_type === "meal_plan"
          ? "AI-предложение плана питания подтверждено."
          : "AI-предложение тренировочного плана подтверждено.",
      );
      router.refresh();
    });
  }

  function applyProposal(proposal: AiPlanProposalRow) {
    if (!canUseProposal(proposal)) {
      setError(
        getProposalReason(proposal) ??
          "Это AI-предложение недоступно для текущего плана.",
      );
      return;
    }

    runMutation(async () => {
      const response = await fetch(`/api/ai/proposals/${proposal.id}/apply`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            meta?: {
              mealTemplateIds?: string[];
              weekStartDate?: string;
            };
          }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось применить AI-предложение.");
        return;
      }

      if (proposal.proposal_type === "workout_plan") {
        setNotice(
          `AI-тренировочный план применен в черновик недели${
            payload?.meta?.weekStartDate
              ? ` со стартом ${payload.meta.weekStartDate}`
              : ""
          }.`,
        );
      } else {
        setNotice(
          `AI-план питания применен как ${
            payload?.meta?.mealTemplateIds?.length ?? 0
          } справочных шаблонов питания.`,
        );
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-6" id="proposal-studio">
      {error ? (
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Предложение
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            AI-план питания
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Сначала AI собирает новый рацион как черновик. Вы видите структуру,
            подтверждаете её и только потом добавляете в свои шаблоны питания.
          </p>

          <AccessHint access={mealPlanAccess} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              Цель
              <select
                className={inputClassName}
                disabled={!mealPlanAccess.allowed}
                onChange={(event) => setMealGoal(event.target.value)}
                value={mealGoal}
              >
                <option value="fat_loss">Снижение веса</option>
                <option value="maintenance">Поддержание формы</option>
                <option value="muscle_gain">Набор мышц</option>
                <option value="performance">Производительность</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-muted">
              Цель по калориям
              <input
                className={inputClassName}
                disabled={!mealPlanAccess.allowed}
                inputMode="numeric"
                onChange={(event) => setMealKcalTarget(event.target.value)}
                type="number"
                value={mealKcalTarget}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted">
              Приемов пищи в день
              <input
                className={inputClassName}
                disabled={!mealPlanAccess.allowed}
                inputMode="numeric"
                min="1"
                onChange={(event) => setMealsPerDay(event.target.value)}
                type="number"
                value={mealsPerDay}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              Дополнительные ограничения
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                disabled={!mealPlanAccess.allowed}
                onChange={(event) => setMealDietaryNotes(event.target.value)}
                value={mealDietaryNotes}
              />
            </label>
          </div>

          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || !mealPlanAccess.allowed}
            onClick={createMealPlanProposal}
            type="button"
          >
            {isPending ? "Генерирую..." : "Собрать новый план питания"}
          </button>

          {latestMealProposal ? (
            <ProposalCard
              access={mealPlanAccess}
              featured
              isPending={isPending}
              onApply={applyProposal}
              onApprove={approveProposal}
              proposal={latestMealProposal}
            />
          ) : null}
        </div>

        <div className="card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Предложение
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            AI-тренировочный план
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Здесь AI формирует готовый черновик недели: видно распределение по
            дням, упражнениям и рабочим диапазонам до применения.
          </p>

          <AccessHint access={workoutPlanAccess} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              Цель
              <select
                className={inputClassName}
                disabled={!workoutPlanAccess.allowed}
                onChange={(event) => setWorkoutGoal(event.target.value)}
                value={workoutGoal}
              >
                <option value="fat_loss">Снижение веса</option>
                <option value="maintenance">Поддержание формы</option>
                <option value="muscle_gain">Набор мышц</option>
                <option value="performance">Производительность</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-muted">
              Дней в неделю
              <input
                className={inputClassName}
                disabled={!workoutPlanAccess.allowed}
                inputMode="numeric"
                min="1"
                onChange={(event) => setWorkoutDaysPerWeek(event.target.value)}
                type="number"
                value={workoutDaysPerWeek}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              Оборудование
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                disabled={!workoutPlanAccess.allowed}
                onChange={(event) => setWorkoutEquipment(event.target.value)}
                placeholder="гантели, штанга, турник"
                value={workoutEquipment}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              Фокус
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                disabled={!workoutPlanAccess.allowed}
                onChange={(event) => setWorkoutFocus(event.target.value)}
                value={workoutFocus}
              />
            </label>
          </div>

          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || !workoutPlanAccess.allowed}
            onClick={createWorkoutPlanProposal}
            type="button"
          >
            {isPending ? "Генерирую..." : "Собрать новую тренировочную неделю"}
          </button>

          {latestWorkoutProposal ? (
            <ProposalCard
              access={workoutPlanAccess}
              featured
              isPending={isPending}
              onApply={applyProposal}
              onApprove={approveProposal}
              proposal={latestWorkoutProposal}
            />
          ) : null}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              История AI
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              История предложений и применения
            </h2>
          </div>
          <div className="rounded-3xl border border-border bg-white/60 px-5 py-4 text-sm text-muted">
            Цель профиля:{" "}
            <span className="font-semibold text-foreground">
              {formatGoal(contextSnapshot.goalType)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {proposals.length ? (
            proposals.map((proposal) => (
              <ProposalCard
                access={getProposalAccess(proposal)}
                isPending={isPending}
                key={proposal.id}
                onApply={applyProposal}
                onApprove={approveProposal}
                proposal={proposal}
              />
            ))
          ) : (
            <p className="text-sm leading-7 text-muted">
              Пока нет сохранённых AI-предложений. Соберите первый план выше, и
              он появится в этой истории вместе с деталями применения.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
