"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type { AiPlanProposalRow } from "@/lib/ai/proposals";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type AiProposalStudioProps = {
  contextSnapshot: {
    goalType: string | null;
    weeklyTrainingDays: number | null;
    kcalTarget: number | null;
    equipment: string[];
    dietaryPreferences: string[];
  };
  proposals: AiPlanProposalRow[];
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
      return "подтверждён";
    case "applied":
      return "применён";
    case "rejected":
      return "отклонён";
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

function extractMealProposal(row: AiPlanProposalRow) {
  if (row.proposal_type !== "meal_plan") {
    return null;
  }

  const payload = row.payload as { proposal?: MealPlanProposal };
  return payload.proposal ?? null;
}

function extractWorkoutProposal(row: AiPlanProposalRow) {
  if (row.proposal_type !== "workout_plan") {
    return null;
  }

  const payload = row.payload as { proposal?: WorkoutPlanProposal };
  return payload.proposal ?? null;
}

export function AiProposalStudio({
  contextSnapshot,
  proposals,
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
          payload?.message ?? "Не удалось сгенерировать AI-предложение плана питания.",
        );
        return;
      }

      setNotice("AI-предложение плана питания сохранено в историю.");
      router.refresh();
    });
  }

  function createWorkoutPlanProposal() {
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
    runMutation(async () => {
      const response = await fetch(`/api/ai/proposals/${proposal.id}/apply`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            meta?: {
              appliedEntity?: string;
              weeklyProgramId?: string;
              weekStartDate?: string;
              mealTemplateIds?: string[];
            };
          }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось применить AI-предложение.");
        return;
      }

      if (proposal.proposal_type === "workout_plan") {
        setNotice(
          `AI-тренировочный план применён в черновик недели${payload?.meta?.weekStartDate ? ` с датой старта ${payload.meta.weekStartDate}` : ""}.`,
        );
      } else {
        setNotice(
          `AI-план питания применён как ${payload?.meta?.mealTemplateIds?.length ?? 0} справочных шаблонов питания.`,
        );
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
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
            Использует текущий контекст пользователя и сохраняет результат в
            `ai_plan_proposals`, не применяя его автоматически к дневнику.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              Цель
              <select
                className={inputClassName}
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
                inputMode="numeric"
                onChange={(event) => setMealKcalTarget(event.target.value)}
                type="number"
                value={mealKcalTarget}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted">
              Приёмов пищи в день
              <input
                className={inputClassName}
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
                onChange={(event) => setMealDietaryNotes(event.target.value)}
                value={mealDietaryNotes}
              />
            </label>
          </div>

          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={createMealPlanProposal}
            type="button"
          >
            {isPending ? "Генерирую..." : "Сгенерировать предложение плана"}
          </button>

          {latestMealProposal ? (
            <div className="mt-6 rounded-3xl border border-border bg-white/60 p-5">
              {(() => {
                const proposal = extractMealProposal(latestMealProposal);

                if (!proposal) {
                  return null;
                }

                return (
                  <div className="grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {proposal.title}
                      </p>
                      <p className="text-sm text-muted">
                          Сохранено {formatDateTime(latestMealProposal.created_at)} · статус {formatProposalStatus(latestMealProposal.status)}
                      </p>
                    </div>
                    <div className="pill">{proposal.caloriesTarget} ккал</div>
                  </div>
                    <p className="text-sm text-muted">
                      Б {proposal.macros.protein} · Ж {proposal.macros.fat} · У {proposal.macros.carbs}
                    </p>
                    <ul className="grid gap-2 text-sm leading-7 text-muted">
                      {proposal.meals.map((meal) => (
                        <li key={`${proposal.title}-${meal.name}`}>
                          {meal.name} · {meal.kcal} ккал · {meal.items.join(", ")}
                        </li>
                      ))}
                    </ul>
                    {latestMealProposal.status !== "applied" ? (
                      <div className="flex flex-wrap gap-2">
                        {latestMealProposal.status === "draft" ? (
                          <button
                            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                            disabled={isPending}
                            onClick={() => approveProposal(latestMealProposal)}
                            type="button"
                          >
                            Подтвердить
                          </button>
                        ) : null}
                        <button
                          className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                          disabled={isPending}
                          onClick={() => applyProposal(latestMealProposal)}
                          type="button"
                        >
                          Применить
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
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
            Генерирует безопасный черновик тренировочной недели и также сохраняет
            результат в `ai_plan_proposals`.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              Цель
              <select
                className={inputClassName}
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
                onChange={(event) => setWorkoutEquipment(event.target.value)}
                placeholder="гантели, штанга, турник"
                value={workoutEquipment}
              />
            </label>
            <label className="grid gap-2 text-sm text-muted sm:col-span-2">
              Фокус
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) => setWorkoutFocus(event.target.value)}
                value={workoutFocus}
              />
            </label>
          </div>

          <button
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={createWorkoutPlanProposal}
            type="button"
          >
            {isPending ? "Генерирую..." : "Сгенерировать предложение тренировки"}
          </button>

          {latestWorkoutProposal ? (
            <div className="mt-6 rounded-3xl border border-border bg-white/60 p-5">
              {(() => {
                const proposal = extractWorkoutProposal(latestWorkoutProposal);

                if (!proposal) {
                  return null;
                }

                return (
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {proposal.title}
                        </p>
                        <p className="text-sm text-muted">
                          Сохранено {formatDateTime(latestWorkoutProposal.created_at)} · статус {formatProposalStatus(latestWorkoutProposal.status)}
                        </p>
                      </div>
                      <div className="pill">{proposal.days.length} дня</div>
                    </div>
                    <p className="text-sm leading-7 text-muted">{proposal.summary}</p>
                    <ul className="grid gap-3 text-sm leading-7 text-muted">
                      {proposal.days.map((day) => (
                        <li key={`${proposal.title}-${day.day}`}>
                          <span className="font-semibold text-foreground">{day.day}</span> · {day.focus}
                        </li>
                      ))}
                    </ul>
                    {latestWorkoutProposal.status !== "applied" ? (
                      <div className="flex flex-wrap gap-2">
                        {latestWorkoutProposal.status === "draft" ? (
                          <button
                            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                            disabled={isPending}
                            onClick={() => approveProposal(latestWorkoutProposal)}
                            type="button"
                          >
                            Подтвердить
                          </button>
                        ) : null}
                        <button
                          className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                          disabled={isPending}
                          onClick={() => applyProposal(latestWorkoutProposal)}
                          type="button"
                        >
                          Применить
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
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
              Последние AI-предложения
            </h2>
          </div>
          <div className="rounded-3xl border border-border bg-white/60 px-5 py-4 text-sm text-muted">
            Цель профиля: <span className="font-semibold text-foreground">{formatGoal(contextSnapshot.goalType)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {proposals.length ? (
            proposals.map((proposal) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4"
                key={proposal.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {formatProposalType(proposal.proposal_type)}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(proposal.created_at)} · статус {formatProposalStatus(proposal.status)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {proposal.status !== "applied" ? (
                      <>
                        {proposal.status === "draft" ? (
                          <button
                            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                            disabled={isPending}
                            onClick={() => approveProposal(proposal)}
                            type="button"
                          >
                            Подтвердить
                          </button>
                        ) : null}
                        <button
                          className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                          disabled={isPending}
                          onClick={() => applyProposal(proposal)}
                          type="button"
                        >
                          Применить
                        </button>
                      </>
                    ) : null}
                    <div className="pill">{proposal.id.slice(0, 8)}</div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-muted">
              Пока нет ни одного сохранённого AI-предложения. Сгенерируй первый план
              выше, и он появится в истории.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
