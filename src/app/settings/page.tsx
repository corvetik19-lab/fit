import type { Route } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageWorkspace } from "@/components/page-workspace";
import { PanelCard } from "@/components/panel-card";
import { SettingsBillingCenter } from "@/components/settings-billing-center";
import { SettingsDataCenter } from "@/components/settings-data-center";
import { SignOutButton } from "@/components/sign-out-button";
import { readUserBillingAccessOrFallback } from "@/lib/billing-access";
import { hasStripeCheckoutEnv, hasStripePortalEnv } from "@/lib/env";
import { loadSettingsDataSnapshotOrFallback } from "@/lib/settings-data-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const goalTypeLabels: Record<string, string> = {
  fat_loss: "Снижение веса",
  maintenance: "Поддержание формы",
  muscle_gain: "Набор мышц",
  performance: "Результат и выносливость",
};

export default async function SettingsPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [dataSnapshot, access] = await Promise.all([
    loadSettingsDataSnapshotOrFallback(supabase, viewer.user.id),
    readUserBillingAccessOrFallback(supabase, viewer.user.id, {
      email: viewer.user.email,
    }),
  ]);

  return (
    <AppShell eyebrow="Настройки" title="Профиль, доступ и управление данными">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          viewer.adminState?.is_suspended ? "Аккаунт ограничен" : "Аккаунт активен",
        ]}
        description="Настройки тоже разделены по логике: профиль, доступ и личные данные. На мобильном это открывается через понятное меню разделов, без длинной вертикальной стены карточек."
        metrics={[
          {
            label: "Цель",
            value: viewer.goal?.goal_type
              ? goalTypeLabels[viewer.goal.goal_type] ?? viewer.goal.goal_type
              : "Не задана",
            note: "текущий курс",
          },
          {
            label: "AI-чат",
            value: access.features.ai_chat.allowed ? "Открыт" : "Закрыт",
            note: "статус ключевой функции",
          },
          {
            label: "Выгрузки",
            value: String(dataSnapshot.exportJobs.length),
            note: "история выгрузок",
          },
          {
            label: "Приватность",
            value: String(dataSnapshot.privacyEvents.length),
            note: "событий по данным",
          },
        ]}
        sections={[
          {
            key: "profile",
            label: "Профиль",
            description: "Аккаунт, анкета и личные параметры.",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <PanelCard caption="Аккаунт" title="Профиль и текущая сессия">
                  <div className="space-y-3 text-sm leading-7 text-muted">
                    <p>
                      <span className="font-semibold text-foreground">Email:</span>{" "}
                      {viewer.user.email ?? "Неизвестно"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Имя:</span>{" "}
                      {viewer.profile?.full_name ?? "Пока не заполнено"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Цель:</span>{" "}
                      {viewer.goal?.goal_type
                        ? goalTypeLabels[viewer.goal.goal_type] ?? viewer.goal.goal_type
                        : "Пока не заполнено"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Статус:</span>{" "}
                      {viewer.adminState?.is_suspended ? "Ограничен" : "Активен"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
                      href={"/onboarding" as Route}
                    >
                      Обновить анкету
                    </Link>
                    <SignOutButton />
                  </div>
                </PanelCard>

                <PanelCard caption="Личные параметры" title="Что влияет на рекомендации">
                  <div className="space-y-3 text-sm leading-7 text-muted">
                    <p>
                      Здесь собраны данные, на которых держатся план тренировок,
                      питание и AI-подсказки.
                    </p>
                    <div className="rounded-2xl border border-border bg-white/60 px-4 py-3">
                      <span className="font-semibold text-foreground">Оборудование:</span>{" "}
                      {viewer.onboarding?.equipment?.join(", ") || "Не указано"}
                    </div>
                    <div className="rounded-2xl border border-border bg-white/60 px-4 py-3">
                      <span className="font-semibold text-foreground">Питание:</span>{" "}
                      {viewer.onboarding?.dietary_preferences?.join(", ") || "Не указано"}
                    </div>
                  </div>
                </PanelCard>
              </div>
            ),
          },
          {
            key: "billing",
            label: "Доступ",
            description: "Подписка, функции и управление доступом.",
            content: (
              <SettingsBillingCenter
                access={access}
                initialSnapshot={dataSnapshot}
                stripe={{
                  checkoutReady: hasStripeCheckoutEnv(),
                  portalReady: hasStripePortalEnv(),
                }}
              />
            ),
          },
          {
            key: "data",
            label: "Данные",
            description: "Выгрузка, удаление и история операций.",
            content: <SettingsDataCenter initialSnapshot={dataSnapshot} />,
          },
        ]}
        title="Профиль, доступ и личные данные без лишней прокрутки"
      />
    </AppShell>
  );
}
