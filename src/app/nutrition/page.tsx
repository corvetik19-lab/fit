import { AppShell } from "@/components/app-shell";
import { NutritionGoalAdherence } from "@/components/nutrition-goal-adherence";
import { NutritionPhotoAnalysis } from "@/components/nutrition-photo-analysis";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { PageWorkspace } from "@/components/page-workspace";
import { readUserBillingAccess } from "@/lib/billing-access";
import {
  getNutritionSummary,
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

export default async function NutritionPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
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
    listNutritionFoods(supabase, viewer.user.id),
    listRecentMeals(supabase, viewer.user.id, 8),
    getNutritionSummary(supabase, viewer.user.id, todaySummaryDate),
    getNutritionTargets(supabase, viewer.user.id),
    listNutritionRecipes(supabase, viewer.user.id),
    listMealTemplates(supabase, viewer.user.id),
    listNutritionSummaryTrend(supabase, viewer.user.id, 7),
    readUserBillingAccess(supabase, viewer.user.id, {
      email: viewer.user.email,
    }),
  ]);

  return (
    <AppShell eyebrow="Питание" title="Дневник питания и ежедневный баланс">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          `Сегодня: ${todaySummaryDate}`,
        ]}
        description="Экран питания разбит по разделам: баланс дня, AI-анализ фото и журнал. На телефоне это открывается по меню, а не сплошной колонкой."
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
                  todaySummary ?? {
                    summary_date: todaySummaryDate,
                    kcal: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                  }
                }
                targets={nutritionTargets}
                trend={summaryTrend}
              />
            ),
          },
          {
            key: "photo",
            label: "AI-фото",
            description: "Разбор блюда по фото",
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
                initialRecipes={recipes}
                nutritionTargets={nutritionTargets}
                todaySummary={todaySummary}
                todaySummaryDate={todaySummaryDate}
              />
            ),
          },
        ]}
        title="Рацион, AI-анализ фото и журнал питания в одном экране"
      />
    </AppShell>
  );
}
