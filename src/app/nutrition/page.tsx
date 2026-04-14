import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { NutritionGoalAdherence } from "@/components/nutrition-goal-adherence";
import { NutritionPhotoAnalysis } from "@/components/nutrition-photo-analysis";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { PageWorkspace } from "@/components/page-workspace";
import { readUserBillingAccessOrFallback } from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import {
  getNutritionSummary,
  type NutritionFood,
  type NutritionMeal,
  type NutritionMealTemplate,
  type NutritionRecipe,
  type NutritionSummary,
  type NutritionSummaryTrendPoint,
  type NutritionTargets,
  getNutritionTargets,
  getTodaySummaryDate,
  listMealTemplates,
  listNutritionFoods,
  listNutritionRecipes,
  listNutritionSummaryTrend,
  listRecentMeals,
} from "@/lib/nutrition/meal-logging";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const nutritionPageSectionKeys = ["balance", "photo", "log"] as const;
const nutritionTrackerPanelKeys = ["targets", "foods", "log", "history"] as const;
const NUTRITION_PAGE_DATA_TIMEOUT_MS = 8_000;

type NutritionPageSectionKey = (typeof nutritionPageSectionKeys)[number];
type NutritionTrackerPanelKey = (typeof nutritionTrackerPanelKeys)[number];

type NutritionPageProps = {
  searchParams?: Promise<{
    panel?: string | string[];
    section?: string | string[];
  }>;
};

function resolveSearchParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function resolveSectionKey(value: string | null): NutritionPageSectionKey | undefined {
  if (!value) {
    return undefined;
  }

  return nutritionPageSectionKeys.includes(value as NutritionPageSectionKey)
    ? (value as NutritionPageSectionKey)
    : undefined;
}

function resolvePanelKey(value: string | null): NutritionTrackerPanelKey | undefined {
  if (!value) {
    return undefined;
  }

  return nutritionTrackerPanelKeys.includes(value as NutritionTrackerPanelKey)
    ? (value as NutritionTrackerPanelKey)
    : undefined;
}

function formatSummaryDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyNutritionSummary(summaryDate: string): NutritionSummary {
  const now = new Date().toISOString();

  return {
    id: `fallback-${summaryDate}`,
    summary_date: summaryDate,
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    created_at: now,
    updated_at: now,
  };
}

function createEmptyNutritionTrend(days: number): NutritionSummaryTrendPoint[] {
  return Array.from({ length: days }, (_, index) => ({
    summary_date: formatSummaryDate(days - index - 1),
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  }));
}

function withTimeout<T>(promise: Promise<T>, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${NUTRITION_PAGE_DATA_TIMEOUT_MS}ms`));
      }, NUTRITION_PAGE_DATA_TIMEOUT_MS);
    }),
  ]);
}

async function loadNutritionResource<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
  userId: string,
) {
  try {
    return await withTimeout(promise, label);
  } catch (error) {
    logger.warn("nutrition page fallback activated", { error, label, userId });
    return fallback;
  }
}

export default async function NutritionPage({ searchParams }: NutritionPageProps) {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialSectionKey = resolveSectionKey(
    resolveSearchParam(resolvedSearchParams.section),
  );
  const initialPanelKey = resolvePanelKey(
    resolveSearchParam(resolvedSearchParams.panel),
  );
  const todaySummaryDate = getTodaySummaryDate();
  const [
    foods,
    recentMeals,
    todaySummary,
    nutritionTargets,
    recipes,
    mealTemplates,
    summaryTrend,
    access,
  ] = await Promise.all([
    loadNutritionResource<NutritionFood[]>(
      "nutrition foods",
      listNutritionFoods(supabase, viewer.user.id),
      [],
      viewer.user.id,
    ),
    loadNutritionResource<NutritionMeal[]>(
      "nutrition recent meals",
      listRecentMeals(supabase, viewer.user.id, 8),
      [],
      viewer.user.id,
    ),
    loadNutritionResource<NutritionSummary | null>(
      "nutrition daily summary",
      getNutritionSummary(supabase, viewer.user.id, todaySummaryDate),
      null,
      viewer.user.id,
    ),
    loadNutritionResource<NutritionTargets | null>(
      "nutrition targets",
      getNutritionTargets(supabase, viewer.user.id),
      null,
      viewer.user.id,
    ),
    loadNutritionResource<NutritionRecipe[]>(
      "nutrition recipes",
      listNutritionRecipes(supabase, viewer.user.id),
      [],
      viewer.user.id,
    ),
    loadNutritionResource<NutritionMealTemplate[]>(
      "nutrition meal templates",
      listMealTemplates(supabase, viewer.user.id),
      [],
      viewer.user.id,
    ),
    loadNutritionResource<NutritionSummaryTrendPoint[]>(
      "nutrition summary trend",
      listNutritionSummaryTrend(supabase, viewer.user.id, 7),
      createEmptyNutritionTrend(7),
      viewer.user.id,
    ),
    readUserBillingAccessOrFallback(supabase, viewer.user.id, {
      email: viewer.user.email,
    }),
  ]);

  return (
    <AppShell
      eyebrow="Питание"
      title="Дневник питания и ежедневный баланс"
      viewer={toAppShellViewer(viewer)}
    >
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          `Сегодня: ${todaySummaryDate}`,
        ]}
        description="Экран питания разбит на отдельные разделы: баланс дня, AI-анализ фото и журнал питания. На телефоне открывается только нужный блок, без сплошной длинной ленты."
        metrics={[
          {
            label: "Продукты",
            value: String(foods.length),
            note: "в личной базе",
          },
          {
            label: "Логи",
            value: String(recentMeals.length),
            note: "последних приёмов пищи",
          },
          {
            label: "Рецепты",
            value: String(recipes.length),
            note: "сохранено в профиле",
          },
          {
            label: "Шаблоны",
            value: String(mealTemplates.length),
            note: "быстрых наборов",
          },
        ]}
        sections={[
          {
            key: "balance",
            label: "Баланс дня",
            description: "КБЖУ, цели и недельный тренд",
            content: (
              <NutritionGoalAdherence
                summary={
                  todaySummary ?? createEmptyNutritionSummary(todaySummaryDate)
                }
                targets={nutritionTargets}
                trend={summaryTrend}
              />
            ),
          },
          {
            key: "photo",
            label: "AI-фото",
            description: "Разбор блюда по фотографии",
            content: <NutritionPhotoAnalysis access={access.features.meal_photo} />,
          },
          {
            key: "log",
            label: "Журнал",
            description: "Продукты, рецепты и ручной лог",
            content: (
              <NutritionTracker
                initialFoods={foods}
                initialMeals={recentMeals}
                initialMealTemplates={mealTemplates}
                initialPanelKey={initialPanelKey}
                initialRecipes={recipes}
                nutritionTargets={nutritionTargets}
                todaySummary={todaySummary}
                todaySummaryDate={todaySummaryDate}
              />
            ),
          },
        ]}
        initialSectionKey={initialSectionKey}
        storageKey="nutrition-page"
        title="Рацион, AI-анализ фото и журнал питания в одном экране"
      />
    </AppShell>
  );
}
