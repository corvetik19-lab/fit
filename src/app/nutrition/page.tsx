import { AppShell } from "@/components/app-shell";
import { NutritionGoalAdherence } from "@/components/nutrition-goal-adherence";
import { NutritionPhotoAnalysis } from "@/components/nutrition-photo-analysis";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { PanelCard } from "@/components/panel-card";
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
    readUserBillingAccess(supabase, viewer.user.id),
  ]);

  return (
    <AppShell eyebrow="Питание" title="Дневник питания и ежедневный баланс">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard caption="Ежедневный рацион" title="Продукты, рецепты и быстрая фиксация приёмов">
          <div className="space-y-3 text-sm leading-7 text-muted">
            <p>
              Веди питание без перегруза: сохраняй свои продукты, собирай шаблоны блюд и смотри,
              как день закрывается по калориям, белкам, жирам и углеводам.
            </p>
            <p>
              Фоторазбор еды и история приёмов помогают быстрее заполнять дневник прямо с телефона,
              без длинных ручных форм.
            </p>
          </div>
        </PanelCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Продукты", String(foods.length)],
            ["Приёмы пищи", String(recentMeals.length)],
            ["Рецепты", String(recipes.length)],
            ["Шаблоны", String(mealTemplates.length)],
          ].map(([label, value]) => (
            <article className="kpi p-5" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>
      </div>

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

      <NutritionPhotoAnalysis access={access.features.meal_photo} />

      <NutritionTracker
        initialFoods={foods}
        initialMeals={recentMeals}
        initialMealTemplates={mealTemplates}
        initialRecipes={recipes}
        nutritionTargets={nutritionTargets}
        todaySummary={todaySummary}
        todaySummaryDate={todaySummaryDate}
      />
    </AppShell>
  );
}
