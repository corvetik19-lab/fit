"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type {
  NutritionFood,
  NutritionMealTemplate,
} from "@/lib/nutrition/meal-logging";

const inputClassName =
  "w-full rounded-[0.95rem] border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10";

function formatMacro(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function NutritionMealTemplatesManager({
  foods,
  templates,
  draftItems,
  onApplyTemplate,
}: {
  foods: NutritionFood[];
  templates: NutritionMealTemplate[];
  draftItems: Array<{ foodId: string; servings: string }>;
  onApplyTemplate: (template: NutritionMealTemplate) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const foodsById = useMemo(
    () => new Map(foods.map((food) => [food.id, food])),
    [foods],
  );

  const currentDraftPreview = useMemo(
    () =>
      draftItems.reduce(
        (totals, item) => {
          const food = foodsById.get(item.foodId);
          const servings = Number(item.servings);

          if (!food || Number.isNaN(servings) || servings <= 0) {
            return totals;
          }

          return {
            kcal: totals.kcal + food.kcal * servings,
            protein: totals.protein + Number(food.protein) * servings,
            fat: totals.fat + Number(food.fat) * servings,
            carbs: totals.carbs + Number(food.carbs) * servings,
          };
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      ),
    [draftItems, foodsById],
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

  function saveTemplate() {
    runMutation(async () => {
      const normalizedItems = draftItems
        .map((item) => ({
          foodId: item.foodId,
          servings: Number(item.servings),
        }))
        .filter((item) => item.foodId && item.servings > 0);

      const response = await fetch("/api/meal-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          items: normalizedItems,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось сохранить шаблон питания.");
        return;
      }

      setNotice("Шаблон питания сохранён.");
      setTitle("");
      router.refresh();
    });
  }

  function deleteTemplate(templateId: string) {
    runMutation(async () => {
      const response = await fetch(`/api/meal-templates/${templateId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось удалить шаблон питания.");
        return;
      }

      setNotice("Шаблон питания удалён.");
      router.refresh();
    });
  }

  function applyTemplate(template: NutritionMealTemplate) {
    if (template.isReferenceOnly) {
      setError(
        "Это справочный AI-шаблон. Сначала сопоставь его продукты с базой.",
      );
      return;
    }

    const hasMissingFoods = template.payload.items.some(
      (item) => !item.foodId || !foodsById.has(item.foodId),
    );

    if (hasMissingFoods) {
      setError(
        "В шаблоне есть продукты, которых уже нет в базе. Обнови шаблон через новый черновик.",
      );
      return;
    }

    onApplyTemplate(template);
    setNotice(`Шаблон «${template.title}» загружен в текущий приём пищи.`);
  }

  return (
    <section className="surface-panel p-3.5 sm:p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">Шаблоны</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Быстрые приёмы пищи
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Сохраняй текущий черновик и применяй повторяющиеся завтраки или перекусы.
          </p>
        </div>
        <div className="pill">{templates.length}</div>
      </div>

      {error ? (
        <p className="mb-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mb-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm text-muted">
          Название шаблона
          <input
            className={inputClassName}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Завтрак после тренировки"
            type="text"
            value={title}
          />
        </label>
        <button
          className="action-button action-button--primary self-end"
          disabled={
            isPending ||
            !title.trim() ||
            !draftItems.some((item) => item.foodId && Number(item.servings) > 0)
          }
          onClick={saveTemplate}
          type="button"
        >
          {isPending ? "Сохраняю..." : "Сохранить"}
        </button>
      </div>

      <div className="surface-panel surface-panel--accent mt-4 p-3">
        <p className="workspace-kicker">Текущий черновик</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted">
          <p>
            Калории: <span className="font-semibold text-foreground">{Math.round(currentDraftPreview.kcal)}</span>
          </p>
          <p>
            Белки: <span className="font-semibold text-foreground">{formatMacro(currentDraftPreview.protein)} г</span>
          </p>
          <p>
            Жиры: <span className="font-semibold text-foreground">{formatMacro(currentDraftPreview.fat)} г</span>
          </p>
          <p>
            Углеводы: <span className="font-semibold text-foreground">{formatMacro(currentDraftPreview.carbs)} г</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5">
        {templates.length ? (
          templates.map((template) => (
            <article className="surface-panel surface-panel--soft p-3" key={template.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base font-semibold text-foreground">
                    {template.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {Math.round(template.totals.kcal)} ккал · Б{" "}
                    {formatMacro(template.totals.protein)} · Ж{" "}
                    {formatMacro(template.totals.fat)} · У{" "}
                    {formatMacro(template.totals.carbs)}
                  </p>
                  {template.isReferenceOnly ? (
                    <p className="mt-2 text-xs text-muted">
                      Справочный AI-шаблон: используй как ориентир и сопоставь продукты вручную.
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    className="action-button action-button--secondary px-3 py-2 text-xs"
                    disabled={template.isReferenceOnly}
                    onClick={() => applyTemplate(template)}
                    type="button"
                  >
                    {template.isReferenceOnly ? "Справка" : "Применить"}
                  </button>
                  <button
                    className="action-button action-button--secondary px-3 py-2 text-xs"
                    onClick={() => deleteTemplate(template.id)}
                    type="button"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <ul className="mt-2 grid gap-1.5 text-sm text-muted">
                {template.payload.items.map((item, index) => (
                  <li key={`${template.id}-${index}`}>
                    {item.foodNameSnapshot} · {formatMacro(Number(item.servings))} порц.
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted">
            Пока нет шаблонов питания. Сохрани текущий черновик, чтобы быстрее заполнять повторяющиеся приёмы пищи.
          </p>
        )}
      </div>
    </section>
  );
}
