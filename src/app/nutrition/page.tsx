import { AppShell } from "@/components/app-shell";
import { NutritionGoalAdherence } from "@/components/nutrition-goal-adherence";
import { NutritionPhotoAnalysis } from "@/components/nutrition-photo-analysis";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { PanelCard } from "@/components/panel-card";
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
  ] =
    await Promise.all([
      listNutritionFoods(supabase, viewer.user.id),
      listRecentMeals(supabase, viewer.user.id, 8),
      getNutritionSummary(supabase, viewer.user.id, todaySummaryDate),
      getNutritionTargets(supabase, viewer.user.id),
      listNutritionRecipes(supabase, viewer.user.id),
      listMealTemplates(supabase, viewer.user.id),
      listNutritionSummaryTrend(supabase, viewer.user.id, 7),
    ]);

  return (
    <AppShell eyebrow="Питание" title="Питание и дневные сводки">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard caption="Контур питания" title="Первый рабочий nutrition-срез">
          <p className="text-sm leading-7 text-muted">
            Теперь здесь можно завести собственную базу продуктов, вручную логировать
            приёмы пищи и сразу получать дневную сводку по калориям, белкам, жирам и
            углеводам. Это уже рабочий источник данных для nutrition-аналитики на
            дашборде.
          </p>
        </PanelCard>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Продукты", String(foods.length)],
            ["Логи питания", String(recentMeals.length)],
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

      <NutritionPhotoAnalysis />

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
