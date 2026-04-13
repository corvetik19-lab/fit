"use client";

import Image from "next/image";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { NutritionMealTemplatesManager } from "@/components/nutrition-meal-templates-manager";
import { NutritionOpenFoodFactsCard } from "@/components/nutrition-open-food-facts-card";
import { NutritionRecipesManager } from "@/components/nutrition-recipes-manager";
import { isAbsoluteHttpUrl } from "@/lib/image-url";
import type {
  NutritionFood,
  NutritionMeal,
  NutritionMealTemplate,
  NutritionRecipe,
  NutritionSummary,
  NutritionTargets,
} from "@/lib/nutrition/meal-logging";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type MealDraftItem = {
  localId: string;
  foodId: string;
  servings: string;
};

type NutritionTrackerPanelKey = "targets" | "foods" | "log" | "history";

function formatMacro(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDefaultMealDateTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function createMealDraftItem(foodId = "", stableKey?: string): MealDraftItem {
  return {
    localId: stableKey ? `meal-item-${stableKey}` : crypto.randomUUID(),
    foodId,
    servings: "1",
  };
}

function calculateProgress(value: number, target: number | null) {
  if (!target || target <= 0) {
    return null;
  }

  return Math.min(Math.round((value / target) * 100), 200);
}

export function NutritionTracker({
  initialFoods,
  initialMeals,
  initialMealTemplates,
  initialPanelKey,
  initialRecipes,
  todaySummary,
  todaySummaryDate,
  nutritionTargets,
}: {
  initialFoods: NutritionFood[];
  initialMeals: NutritionMeal[];
  initialMealTemplates: NutritionMealTemplate[];
  initialPanelKey?: NutritionTrackerPanelKey;
  initialRecipes: NutritionRecipe[];
  todaySummary: NutritionSummary | null;
  todaySummaryDate: string;
  nutritionTargets: NutritionTargets | null;
}) {
  const router = useRouter();
  const [foods, setFoods] = useState(initialFoods);
  const [foodName, setFoodName] = useState("");
  const [foodKcal, setFoodKcal] = useState("0");
  const [foodProtein, setFoodProtein] = useState("0");
  const [foodFat, setFoodFat] = useState("0");
  const [foodCarbs, setFoodCarbs] = useState("0");
  const [foodBarcode, setFoodBarcode] = useState("");
  const [foodImageUrl, setFoodImageUrl] = useState("");
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [mealDateTime, setMealDateTime] = useState(getDefaultMealDateTime);
  const [mealBarcode, setMealBarcode] = useState("");
  const [mealItems, setMealItems] = useState<MealDraftItem[]>([
    createMealDraftItem(initialFoods[0]?.id ?? "", "1"),
  ]);
  const [kcalTarget, setKcalTarget] = useState(
    nutritionTargets?.kcal_target?.toString() ?? "",
  );
  const [proteinTarget, setProteinTarget] = useState(
    nutritionTargets?.protein_target?.toString() ?? "",
  );
  const [fatTarget, setFatTarget] = useState(
    nutritionTargets?.fat_target?.toString() ?? "",
  );
  const [carbsTarget, setCarbsTarget] = useState(
    nutritionTargets?.carbs_target?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activePanelKey, setActivePanelKey] =
    useState<NutritionTrackerPanelKey>(initialPanelKey ?? "targets");
  const [isMobilePanelMenuOpen, setIsMobilePanelMenuOpen] = useState(false);
  const defaultFoodId = foods[0]?.id ?? "";

  useEffect(() => {
    setFoods(initialFoods);
  }, [initialFoods]);

  useEffect(() => {
    if (initialPanelKey) {
      setActivePanelKey(initialPanelKey);
    }
  }, [initialPanelKey]);

  const foodsById = useMemo(
    () => new Map(foods.map((food) => [food.id, food])),
    [foods],
  );

  const mealPreview = useMemo(
    () =>
      mealItems.reduce(
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
    [foodsById, mealItems],
  );

  const summary = todaySummary ?? {
    id: "local-summary",
    summary_date: todaySummaryDate,
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const nutritionCards = [
    {
      label: "Калории",
      value: `${summary.kcal.toLocaleString("ru-RU")} ккал`,
      target: nutritionTargets?.kcal_target ?? null,
      progress: calculateProgress(summary.kcal, nutritionTargets?.kcal_target ?? null),
    },
    {
      label: "Белки",
      value: `${formatMacro(Number(summary.protein))} г`,
      target: nutritionTargets?.protein_target ?? null,
      progress: calculateProgress(
        Number(summary.protein),
        nutritionTargets?.protein_target ?? null,
      ),
    },
    {
      label: "Жиры",
      value: `${formatMacro(Number(summary.fat))} г`,
      target: nutritionTargets?.fat_target ?? null,
      progress: calculateProgress(Number(summary.fat), nutritionTargets?.fat_target ?? null),
    },
    {
      label: "Углеводы",
      value: `${formatMacro(Number(summary.carbs))} г`,
      target: nutritionTargets?.carbs_target ?? null,
      progress: calculateProgress(
        Number(summary.carbs),
        nutritionTargets?.carbs_target ?? null,
      ),
    },
  ];

  function resetFoodForm() {
    setEditingFoodId(null);
    setFoodName("");
    setFoodKcal("0");
    setFoodProtein("0");
    setFoodFat("0");
    setFoodCarbs("0");
    setFoodBarcode("");
    setFoodImageUrl("");
  }

  function selectFoodForEdit(food: NutritionFood) {
    setEditingFoodId(food.id);
    setFoodName(food.name);
    setFoodKcal(String(food.kcal));
    setFoodProtein(String(food.protein));
    setFoodFat(String(food.fat));
    setFoodCarbs(String(food.carbs));
    setFoodBarcode(food.barcode ?? "");
    setFoodImageUrl(food.image_url ?? "");
    setError(null);
    setNotice(null);
  }

  function upsertFood(nextFood: NutritionFood) {
    setFoods((currentFoods) => [
      nextFood,
      ...currentFoods.filter((food) => food.id !== nextFood.id),
    ]);
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

  function submitFood() {
    runMutation(async () => {
      const endpoint = editingFoodId ? `/api/foods/${editingFoodId}` : "/api/foods";
      const method = editingFoodId ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: foodName.trim(),
          kcal: Number(foodKcal),
          protein: Number(foodProtein),
          fat: Number(foodFat),
          carbs: Number(foodCarbs),
          barcode: foodBarcode.trim() || null,
          imageUrl: foodImageUrl.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { data?: NutritionFood; message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось сохранить продукт.");
        return;
      }

      if (payload?.data) {
        upsertFood(payload.data);
      }

      setNotice(editingFoodId ? "Продукт обновлён." : "Продукт добавлен.");
      resetFoodForm();
      router.refresh();
    });
  }

  function removeFood(foodId: string) {
    runMutation(async () => {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось удалить продукт.");
        return;
      }

      if (editingFoodId === foodId) {
        resetFoodForm();
      }

      setFoods((currentFoods) =>
        currentFoods.filter((food) => food.id !== foodId),
      );
      setMealItems((currentItems) =>
        currentItems.map((item) =>
          item.foodId === foodId ? { ...item, foodId: "" } : item,
        ),
      );
      setNotice("Продукт удалён.");
      router.refresh();
    });
  }

  function submitMeal() {
    runMutation(async () => {
      const normalizedItems = mealItems
        .map((item) => ({
          foodId: item.foodId,
          servings: Number(item.servings),
        }))
        .filter((item) => item.foodId && item.servings > 0);

      const mealDate = new Date(mealDateTime);
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eatenAt: mealDate.toISOString(),
          summaryDate: mealDateTime.slice(0, 10),
          items: normalizedItems,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось сохранить приём пищи.");
        return;
      }

      setNotice("Приём пищи сохранён, дневная сводка пересчитана.");
      setMealDateTime(getDefaultMealDateTime());
      setMealItems([createMealDraftItem(defaultFoodId, "1")]);
      router.refresh();
    });
  }

  function deleteMeal(meal: NutritionMeal) {
    runMutation(async () => {
      const eatenAt = new Date(meal.eaten_at);
      const year = eatenAt.getFullYear();
      const month = String(eatenAt.getMonth() + 1).padStart(2, "0");
      const day = String(eatenAt.getDate()).padStart(2, "0");
      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summaryDate: `${year}-${month}-${day}`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось удалить приём пищи.");
        return;
      }

      setNotice("Приём пищи удалён, дневная сводка обновлена.");
      router.refresh();
    });
  }

  function saveTargets() {
    runMutation(async () => {
      const response = await fetch("/api/nutrition/targets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kcalTarget: kcalTarget.trim() ? Number(kcalTarget) : null,
          proteinTarget: proteinTarget.trim() ? Number(proteinTarget) : null,
          fatTarget: fatTarget.trim() ? Number(fatTarget) : null,
          carbsTarget: carbsTarget.trim() ? Number(carbsTarget) : null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось сохранить цели по питанию.");
        return;
      }

      setNotice("Цели по питанию обновлены.");
      router.refresh();
    });
  }

  function updateMealItem(
    localId: string,
    field: "foodId" | "servings",
    value: string,
  ) {
    setMealItems((currentItems) =>
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

  function appendMealItem() {
    setMealItems((currentItems) => [
      ...currentItems,
      createMealDraftItem(defaultFoodId),
    ]);
  }

  function addFoodToCurrentMeal(foodId: string) {
    setMealItems((currentItems) => {
      const emptyIndex = currentItems.findIndex((item) => !item.foodId);

      if (emptyIndex === -1) {
        return [...currentItems, createMealDraftItem(foodId)];
      }

      return currentItems.map((item, index) =>
        index === emptyIndex
          ? {
              ...item,
              foodId,
              servings: item.servings || "1",
            }
          : item,
      );
    });
  }

  function removeMealItem(localId: string) {
    setMealItems((currentItems) =>
      currentItems.length > 1
        ? currentItems.filter((item) => item.localId !== localId)
        : currentItems,
    );
  }

  function loadDraftItemsFromSource(
    sourceItems: Array<{ foodId: string | null; servings: number }>,
    noticeMessage: string,
  ) {
    const normalizedDraftItems = sourceItems
      .filter((item) => item.foodId)
      .map((item) => ({
        localId: crypto.randomUUID(),
        foodId: item.foodId ?? "",
        servings: String(item.servings),
      }));

    setMealItems(
      normalizedDraftItems.length
        ? normalizedDraftItems
        : [createMealDraftItem(defaultFoodId, "1")],
    );
    setNotice(noticeMessage);
    setError(null);
  }

  function applyRecipe(recipe: NutritionRecipe) {
    loadDraftItemsFromSource(
      recipe.items.map((item) => ({
        foodId: item.food_id,
        servings: Number(item.servings),
      })),
      `Рецепт «${recipe.title}» загружен в текущий приём пищи.`,
    );
  }

  function applyMealTemplate(template: NutritionMealTemplate) {
    loadDraftItemsFromSource(
      template.payload.items.map((item) => ({
        foodId: item.foodId,
        servings: Number(item.servings),
      })),
      `Шаблон «${template.title}» загружен в текущий приём пищи.`,
    );
  }

  function addMealItemByBarcode() {
    const normalizedBarcode = mealBarcode.trim();

    if (!normalizedBarcode) {
      setError("Введи штрихкод, чтобы найти продукт в своей базе.");
      setNotice(null);
      return;
    }

    const matchedFood = foods.find(
      (food) => food.barcode?.trim() === normalizedBarcode,
    );

    if (!matchedFood) {
      setError(
        "Продукт с таким штрихкодом не найден в твоей базе. Сначала добавь его в справочник продуктов.",
      );
      setNotice(null);
      return;
    }

    addFoodToCurrentMeal(matchedFood.id);
    setMealBarcode("");
    setError(null);
    setNotice(`Продукт «${matchedFood.name}» добавлен в текущий приём пищи по штрихкоду.`);
  }

  const trackerPanels: Array<{
    description: string;
    key: NutritionTrackerPanelKey;
    label: string;
  }> = [
    {
      key: "targets",
      label: "Баланс",
      description: "КБЖУ и цели на день",
    },
    {
      key: "foods",
      label: "Продукты",
      description: "Своя база и рецепты",
    },
    {
      key: "log",
      label: "Лог дня",
      description: "Добавление текущего приёма пищи",
    },
    {
      key: "history",
      label: "История",
      description: "Последние приёмы и шаблоны",
    },
  ];
  const activePanel =
    trackerPanels.find((panel) => panel.key === activePanelKey) ?? null;
  const completedMacroTargets = nutritionCards.filter(
    (card) => (card.progress ?? 0) >= 100,
  ).length;
  const currentMealItemsCount = mealItems.filter((item) => item.foodId).length;

  function selectPanel(panelKey: NutritionTrackerPanelKey) {
    setActivePanelKey(panelKey);
    setIsMobilePanelMenuOpen(false);
  }

  function handleResolvedFoodForLibrary(
    food: NutritionFood,
    origin: "existing" | "imported",
  ) {
    upsertFood(food);
    setError(null);
    setNotice(
      origin === "existing"
        ? `Продукт «${food.name}» уже был в базе и открыт для редактирования.`
        : `Продукт «${food.name}» импортирован из Open Food Facts.`,
    );
    selectFoodForEdit(food);
  }

  function handleResolvedFoodForMeal(
    food: NutritionFood,
    origin: "existing" | "imported",
  ) {
    upsertFood(food);
    addFoodToCurrentMeal(food.id);
    setError(null);
    setNotice(
      origin === "existing"
        ? `Продукт «${food.name}» добавлен в текущий приём пищи.`
        : `Продукт «${food.name}» импортирован и сразу добавлен в текущий приём пищи.`,
    );
  }

  return (
    <div className="grid gap-6">
      <section className="card card--hero p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-kicker">
              Меню питания
            </p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Держи питание под контролем без лишних экранов
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Баланс дня, импорт по штрихкоду, база продуктов и живой лог открываются по одному,
              чтобы на телефоне всё ощущалось как быстрый пищевой контроль, а не таблица из форм.
            </p>
          </div>
          <span className="pill">
            {activePanel?.label ?? "Питание"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="surface-panel surface-panel--soft p-4">
            <p className="workspace-kicker">Сегодня</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {summary.kcal.toLocaleString("ru-RU")} ккал
            </p>
            <p className="mt-1 text-sm text-muted">съедено за текущий день</p>
          </article>
          <article className="surface-panel surface-panel--soft p-4">
            <p className="workspace-kicker">Цели</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {completedMacroTargets} / {nutritionCards.length}
            </p>
            <p className="mt-1 text-sm text-muted">макро-ориентиров уже закрыто</p>
          </article>
          <article className="surface-panel surface-panel--accent p-4">
            <p className="workspace-kicker">Текущий лог</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {currentMealItemsCount}
            </p>
            <p className="mt-1 text-sm text-muted">позиций сейчас в сборке приёма пищи</p>
          </article>
        </div>

        <div className="mt-4 md:hidden">
          <button
            aria-expanded={isMobilePanelMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => setIsMobilePanelMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="workspace-kicker block">
                Текущий раздел
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-foreground">
                {activePanel?.label ?? "Выбери раздел"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {activePanel?.description ?? "Выбери нужный блок"}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white/82 text-foreground">
              {isMobilePanelMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </span>
          </button>

          {isMobilePanelMenuOpen ? (
            <div className="mt-3 grid gap-2 rounded-[1.75rem] border border-border bg-[color-mix(in_srgb,var(--surface)_94%,white)] p-3">
              {trackerPanels.map((panel) => {
                const isActive = panel.key === activePanelKey;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex items-start justify-between gap-3 px-3 py-3 text-left ${
                      isActive ? "section-chip--active" : ""
                    }`}
                    data-testid={`nutrition-panel-mobile-${panel.key}`}
                    key={panel.key}
                    onClick={() => selectPanel(panel.key)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {panel.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {panel.description}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <Check size={16} strokeWidth={2.3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden gap-3 md:flex md:flex-wrap">
          {trackerPanels.map((panel) => {
            const isActive = panel.key === activePanelKey;

            return (
              <button
                aria-pressed={isActive}
                className={`section-chip min-w-[11rem] px-4 py-3 text-left ${
                  isActive ? "section-chip--active" : ""
                }`}
                data-testid={`nutrition-panel-${panel.key}`}
                key={panel.key}
                onClick={() => selectPanel(panel.key)}
                type="button"
              >
                <span className="block text-sm font-semibold">{panel.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {panel.description}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </section>

      {activePanelKey === "targets" ? (
        <section className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {nutritionCards.map((card) => (
              <article
                className={`surface-panel p-5 ${card.progress && card.progress >= 100 ? "surface-panel--accent" : "surface-panel--soft"}`}
                key={card.label}
              >
                <p className="workspace-kicker">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{card.value}</p>
                <p className="mt-2 text-sm text-muted">
                  {card.target ? `Цель: ${card.target}` : "Цель не задана"}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/70">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${Math.min(card.progress ?? 0, 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </section>

          <section className="card card--hero p-6">
            <div className="mb-5">
              <p className="workspace-kicker">
                Цели
              </p>
              <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Дневные ориентиры по КБЖУ
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Держи одну понятную планку на день: приложение покажет, сколько уже съедено,
                сколько осталось и где рацион уходит в сторону.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-2 text-sm text-muted">
                Калории
                <input className={inputClassName} inputMode="numeric" onChange={(event) => setKcalTarget(event.target.value)} placeholder="2200" type="number" value={kcalTarget} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Белки
                <input className={inputClassName} inputMode="numeric" onChange={(event) => setProteinTarget(event.target.value)} placeholder="150" type="number" value={proteinTarget} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Жиры
                <input className={inputClassName} inputMode="numeric" onChange={(event) => setFatTarget(event.target.value)} placeholder="70" type="number" value={fatTarget} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Углеводы
                <input className={inputClassName} inputMode="numeric" onChange={(event) => setCarbsTarget(event.target.value)} placeholder="220" type="number" value={carbsTarget} />
              </label>
            </div>

            <button className="action-button action-button--primary mt-6" disabled={isPending} onClick={saveTargets} type="button">
              {isPending ? "Сохраняю..." : "Сохранить цели"}
            </button>
          </section>
        </section>
      ) : null}

      {activePanelKey === "foods" ? (
        <section className="grid gap-6">
          <section className="card card--hero p-6">
            <div className="mb-5">
              <p className="workspace-kicker">
                База продуктов
              </p>
              <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Свои продукты и справочник
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Храни свои продукты, импортируй упаковку по штрихкоду и собирай понятную базу
                для быстрого логирования без ручного ввода каждого макроэлемента.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-muted sm:col-span-2">
                Название
                <input className={inputClassName} onChange={(event) => setFoodName(event.target.value)} placeholder="Греческий йогурт" type="text" value={foodName} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Калории
                <input className={inputClassName} inputMode="numeric" onChange={(event) => setFoodKcal(event.target.value)} type="number" value={foodKcal} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Белки
                <input className={inputClassName} inputMode="decimal" onChange={(event) => setFoodProtein(event.target.value)} step="0.1" type="number" value={foodProtein} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Жиры
                <input className={inputClassName} inputMode="decimal" onChange={(event) => setFoodFat(event.target.value)} step="0.1" type="number" value={foodFat} />
              </label>
              <label className="grid gap-2 text-sm text-muted">
                Углеводы
                <input className={inputClassName} inputMode="decimal" onChange={(event) => setFoodCarbs(event.target.value)} step="0.1" type="number" value={foodCarbs} />
              </label>
              <label className="grid gap-2 text-sm text-muted sm:col-span-2">
                Штрихкод
                <input className={inputClassName} onChange={(event) => setFoodBarcode(event.target.value)} placeholder="Необязательно" type="text" value={foodBarcode} />
              </label>
              <label className="grid gap-2 text-sm text-muted sm:col-span-2">
                Ссылка на фото
                <input className={inputClassName} onChange={(event) => setFoodImageUrl(event.target.value)} placeholder="https://..." type="url" value={foodImageUrl} />
              </label>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border bg-white/78">
              {isAbsoluteHttpUrl(foodImageUrl) ? (
                <Image
                  alt={foodName.trim() || "Предпросмотр продукта"}
                  className="h-40 w-full object-cover"
                  height={160}
                  src={foodImageUrl.trim()}
                  unoptimized
                  width={640}
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_58%,white)] px-5 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      Обложка продукта
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Добавь свою ссылку на изображение, чтобы карточка продукта выглядела
                      аккуратно в базе и при логировании.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="action-button action-button--primary" disabled={isPending || !foodName.trim()} onClick={submitFood} type="button">
                {isPending ? "Сохраняю..." : editingFoodId ? "Сохранить продукт" : "Добавить продукт"}
              </button>
              {editingFoodId ? (
                <button className="action-button action-button--secondary" onClick={resetFoodForm} type="button">
                  Отменить редактирование
                </button>
              ) : null}
            </div>

            <div className="mt-6">
              <NutritionOpenFoodFactsCard
                mode="foods"
                onResolveFood={handleResolvedFoodForLibrary}
              />
            </div>

            <div className="mt-6 grid gap-3">
              {foods.length ? (
                foods.map((food) => (
                  <article className="surface-panel surface-panel--soft p-4" key={food.id}>
                    <div className="grid gap-4 sm:grid-cols-[104px_1fr]">
                      <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white/78">
                        {food.image_url ? (
                          <Image
                            alt={food.name}
                            className="h-[104px] w-full object-cover"
                            height={104}
                            src={food.image_url}
                            unoptimized
                            width={104}
                          />
                        ) : (
                          <div className="flex h-[104px] items-center justify-center bg-[color-mix(in_srgb,var(--accent-soft)_52%,white)] px-3 text-center text-xs font-medium text-accent">
                            {food.source === "open_food_facts" ? "Импорт без фото" : "Своя карточка"}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{food.name}</p>
                            <p className="mt-1 text-sm text-muted">
                              {food.brand ?? "Без бренда"}
                              {food.quantity ? ` · ${food.quantity}` : ""}
                              {food.serving_size ? ` · порция ${food.serving_size}` : ""}
                            </p>
                            <p className="mt-2 text-sm text-muted">
                              {food.kcal} ккал · Б {formatMacro(Number(food.protein))} · Ж {formatMacro(Number(food.fat))} · У {formatMacro(Number(food.carbs))}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button className="action-button action-button--secondary px-4 py-2 text-sm" onClick={() => selectFoodForEdit(food)} type="button">
                              Редактировать
                            </button>
                            <button className="action-button action-button--secondary px-4 py-2 text-sm" onClick={() => removeFood(food.id)} type="button">
                              Удалить
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="pill">{food.source === "open_food_facts" ? "Open Food Facts" : "Свой продукт"}</span>
                          {food.barcode ? <span className="pill">Штрихкод: {food.barcode}</span> : null}
                        </div>

                        {food.ingredients_text ? (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                            {food.ingredients_text}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Пока нет ни одного продукта. Сначала добавь базовые продукты, из которых собираешь свои приёмы пищи.
                </p>
              )}
            </div>
          </section>

          <NutritionRecipesManager
            foods={foods}
            onApplyRecipe={applyRecipe}
            recipes={initialRecipes}
          />
        </section>
      ) : null}

      {activePanelKey === "log" ? (
        <section className="card card--hero p-6">
          <div className="mb-5">
            <p className="workspace-kicker">
              Логирование
            </p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Текущий приём пищи
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Добавляй еду так, как это реально происходит в жизни: по своему продукту, по
              штрихкоду, из шаблона или прямо с импортом упаковки.
            </p>
          </div>

          <div className="surface-panel surface-panel--soft mb-5 p-4">
            <p className="workspace-kicker">
              Быстрое добавление по штрихкоду
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Поиск идёт по твоей собственной базе продуктов. Если продукт уже сохранён со штрихкодом, его можно сразу добавить в текущий приём пищи.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className={inputClassName}
                onChange={(event) => setMealBarcode(event.target.value)}
                placeholder="Например, 4601234567890"
                type="text"
                value={mealBarcode}
              />
              <button
                className="action-button action-button--secondary"
                onClick={addMealItemByBarcode}
                type="button"
              >
                Найти и добавить
              </button>
            </div>
          </div>

          <div className="mb-5">
            <NutritionOpenFoodFactsCard
              mode="meal"
              onResolveFood={handleResolvedFoodForMeal}
            />
          </div>

          <label className="grid gap-2 text-sm text-muted">
            Дата и время
            <input className={inputClassName} onChange={(event) => setMealDateTime(event.target.value)} type="datetime-local" value={mealDateTime} />
          </label>

          <div className="mt-5 grid gap-3">
            {mealItems.map((item, index) => (
              <div className="surface-panel p-4" key={item.localId}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Позиция {index + 1}</p>
                  {mealItems.length > 1 ? (
                    <button className="action-button action-button--secondary px-4 py-2 text-xs" onClick={() => removeMealItem(item.localId)} type="button">
                      Удалить позицию
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <label className="grid gap-2 text-sm text-muted">
                    Продукт
                    <select className={inputClassName} onChange={(event) => updateMealItem(item.localId, "foodId", event.target.value)} value={item.foodId}>
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
                    <input className={inputClassName} inputMode="decimal" min="0.1" onChange={(event) => updateMealItem(item.localId, "servings", event.target.value)} step="0.1" type="number" value={item.servings} />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button className="action-button action-button--soft" onClick={appendMealItem} type="button">
              Добавить ещё продукт
            </button>
          </div>

          <div className="surface-panel surface-panel--accent mt-6 p-5">
            <p className="workspace-kicker">Предварительный расчёт</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted">Калории: <span className="font-semibold text-foreground">{Math.round(mealPreview.kcal)}</span></p>
              <p className="text-sm text-muted">Белки: <span className="font-semibold text-foreground">{formatMacro(mealPreview.protein)} г</span></p>
              <p className="text-sm text-muted">Жиры: <span className="font-semibold text-foreground">{formatMacro(mealPreview.fat)} г</span></p>
              <p className="text-sm text-muted">Углеводы: <span className="font-semibold text-foreground">{formatMacro(mealPreview.carbs)} г</span></p>
            </div>
          </div>

          <button className="action-button action-button--primary mt-6" disabled={isPending || !mealItems.some((item) => item.foodId && Number(item.servings) > 0)} onClick={submitMeal} type="button">
            {isPending ? "Сохраняю..." : "Сохранить приём пищи"}
          </button>
        </section>
      ) : null}

      {activePanelKey === "history" ? (
        <section className="grid gap-6">
          <section className="card card--hero p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="workspace-kicker">
                  История
                </p>
                <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  Последние приёмы пищи
                </h2>
              </div>
              <div className="pill">{initialMeals.length}</div>
            </div>

            <div className="grid gap-3">
              {initialMeals.length ? (
                initialMeals.map((meal) => (
                  <article className="surface-panel surface-panel--soft p-4" key={meal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{formatDateTime(meal.eaten_at)}</p>
                        <p className="text-sm text-muted">
                          {meal.totals.kcal.toLocaleString("ru-RU")} ккал · Б {formatMacro(meal.totals.protein)} · Ж {formatMacro(meal.totals.fat)} · У {formatMacro(meal.totals.carbs)}
                        </p>
                      </div>
                      <button className="action-button action-button--secondary px-4 py-2 text-sm" onClick={() => deleteMeal(meal)} type="button">
                        Удалить
                      </button>
                    </div>
                    <ul className="mt-3 grid gap-2 text-sm text-muted">
                      {meal.items.map((item) => (
                        <li key={item.id}>
                          {item.food_name_snapshot} · {formatMacro(Number(item.servings))} порц. · {item.kcal} ккал
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Пока нет сохранённых приёмов пищи. Добавь первый лог, и дневная сводка заполнится автоматически.
                </p>
              )}
            </div>
          </section>

          <NutritionMealTemplatesManager
            draftItems={mealItems.map((item) => ({
              foodId: item.foodId,
              servings: item.servings,
            }))}
            foods={foods}
            onApplyTemplate={applyMealTemplate}
            templates={initialMealTemplates}
          />
        </section>
      ) : null}
    </div>
  );
}
