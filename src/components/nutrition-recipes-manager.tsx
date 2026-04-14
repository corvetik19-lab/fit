"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type {
  NutritionFood,
  NutritionRecipe,
} from "@/lib/nutrition/meal-logging";

const inputClassName =
  "w-full rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_88%,var(--surface))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type RecipeDraftItem = {
  localId: string;
  foodId: string;
  servings: string;
};

function createRecipeDraftItem(foodId = ""): RecipeDraftItem {
  return {
    localId: crypto.randomUUID(),
    foodId,
    servings: "1",
  };
}

function formatMacro(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function NutritionRecipesManager({
  foods,
  recipes,
  onApplyRecipe,
}: {
  foods: NutritionFood[];
  recipes: NutritionRecipe[];
  onApplyRecipe: (recipe: NutritionRecipe) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [servings, setServings] = useState("1");
  const [items, setItems] = useState<RecipeDraftItem[]>([
    createRecipeDraftItem(foods[0]?.id ?? ""),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const foodsById = useMemo(
    () => new Map(foods.map((food) => [food.id, food])),
    [foods],
  );

  const preview = useMemo(
    () =>
      items.reduce(
        (totals, item) => {
          const food = foodsById.get(item.foodId);
          const portionCount = Number(item.servings);

          if (!food || Number.isNaN(portionCount) || portionCount <= 0) {
            return totals;
          }

          return {
            kcal: totals.kcal + food.kcal * portionCount,
            protein: totals.protein + Number(food.protein) * portionCount,
            fat: totals.fat + Number(food.fat) * portionCount,
            carbs: totals.carbs + Number(food.carbs) * portionCount,
          };
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      ),
    [foodsById, items],
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

  function resetForm() {
    setTitle("");
    setInstructions("");
    setServings("1");
    setItems([createRecipeDraftItem(foods[0]?.id ?? "")]);
  }

  function updateItem(
    localId: string,
    field: "foodId" | "servings",
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.localId === localId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function appendItem() {
    setItems((currentItems) => [
      ...currentItems,
      createRecipeDraftItem(foods[0]?.id ?? ""),
    ]);
  }

  function removeItem(localId: string) {
    setItems((currentItems) =>
      currentItems.length > 1
        ? currentItems.filter((item) => item.localId !== localId)
        : currentItems,
    );
  }

  function saveRecipe() {
    runMutation(async () => {
      const normalizedItems = items
        .map((item) => ({
          foodId: item.foodId,
          servings: Number(item.servings),
        }))
        .filter((item) => item.foodId && item.servings > 0);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim() || null,
          servings: Number(servings),
          items: normalizedItems,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось сохранить рецепт.");
        return;
      }

      setNotice("Рецепт сохранён.");
      resetForm();
      router.refresh();
    });
  }

  function deleteRecipe(recipeId: string) {
    runMutation(async () => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось удалить рецепт.");
        return;
      }

      setNotice("Рецепт удалён.");
      router.refresh();
    });
  }

  function applyRecipe(recipe: NutritionRecipe) {
    if (recipe.items.some((item) => !item.food_id)) {
      setError(
        "В рецепте есть продукты, которых уже нет в базе. Сначала обнови рецепт или верни продукты.",
      );
      return;
    }

    onApplyRecipe(recipe);
    setNotice(`Рецепт «${recipe.title}» загружен в текущий приём пищи.`);
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Рецепты
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Рецепты и состав блюд
          </h2>
        </div>
        <div className="pill">{recipes.length}</div>
      </div>

      {error ? (
        <p className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted sm:col-span-2">
          Название рецепта
          <input
            className={inputClassName}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Овсянка с йогуртом"
            type="text"
            value={title}
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Количество порций
          <input
            className={inputClassName}
            inputMode="decimal"
            min="1"
            onChange={(event) => setServings(event.target.value)}
            step="0.5"
            type="number"
            value={servings}
          />
        </label>
        <label className="grid gap-2 text-sm text-muted sm:col-span-2">
          Инструкции
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Короткое описание приготовления или подсказки по порционированию"
            value={instructions}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <div
            className="rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface))] p-4"
            key={item.localId}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                Ингредиент {index + 1}
              </p>
              {items.length > 1 ? (
                <button
                  className="rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
                  onClick={() => removeItem(item.localId)}
                  type="button"
                >
                  Удалить
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <label className="grid gap-2 text-sm text-muted">
                Продукт
                <select
                  className={inputClassName}
                  onChange={(event) =>
                    updateItem(item.localId, "foodId", event.target.value)
                  }
                  value={item.foodId}
                >
                  <option value="">Выбери продукт</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Порции
                <input
                  className={inputClassName}
                  inputMode="decimal"
                  min="0.1"
                  onChange={(event) =>
                    updateItem(item.localId, "servings", event.target.value)
                  }
                  step="0.1"
                  type="number"
                  value={item.servings}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
          onClick={appendItem}
          type="button"
        >
          Добавить ингредиент
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_88%,var(--surface))] p-5">
        <p className="text-sm font-medium text-foreground">Предварительный расчёт рецепта</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-muted">
            Всего калорий:{" "}
            <span className="font-semibold text-foreground">{Math.round(preview.kcal)}</span>
          </p>
          <p className="text-sm text-muted">
            Белки:{" "}
            <span className="font-semibold text-foreground">
              {formatMacro(preview.protein)} г
            </span>
          </p>
          <p className="text-sm text-muted">
            Жиры:{" "}
            <span className="font-semibold text-foreground">{formatMacro(preview.fat)} г</span>
          </p>
          <p className="text-sm text-muted">
            Углеводы:{" "}
            <span className="font-semibold text-foreground">{formatMacro(preview.carbs)} г</span>
          </p>
        </div>
      </div>

      <button
        className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={
          isPending ||
          !title.trim() ||
          !items.some((item) => item.foodId && Number(item.servings) > 0)
        }
        onClick={saveRecipe}
        type="button"
      >
        {isPending ? "Сохраняю..." : "Сохранить рецепт"}
      </button>

      <div className="mt-8 grid gap-3">
        {recipes.length ? (
          recipes.map((recipe) => (
            <article
              className="rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface))] p-4"
              key={recipe.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{recipe.title}</p>
                  <p className="text-sm text-muted">
                    {Math.round(recipe.totals.kcal)} ккал на рецепт · {formatMacro(recipe.servings)}{" "}
                    порц.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
                    onClick={() => applyRecipe(recipe)}
                    type="button"
                  >
                    В лог питания
                  </button>
                  <button
                    className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
                    onClick={() => deleteRecipe(recipe.id)}
                    type="button"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              {recipe.instructions ? (
                <p className="mt-3 text-sm leading-7 text-muted">{recipe.instructions}</p>
              ) : null}
              <ul className="mt-3 grid gap-2 text-sm text-muted">
                {recipe.items.map((item) => (
                  <li key={item.id}>
                    {item.food_name_snapshot} · {formatMacro(Number(item.servings))} порц.
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            Пока нет рецептов. Добавь первый рецепт, чтобы быстро собирать повторяющиеся
            блюда и загружать их в лог питания.
          </p>
        )}
      </div>
    </section>
  );
}
