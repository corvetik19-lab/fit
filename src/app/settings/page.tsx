import type { Route } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { SignOutButton } from "@/components/sign-out-button";
import { requireReadyViewer } from "@/lib/viewer";

const goalTypeLabels: Record<string, string> = {
  fat_loss: "Снижение веса",
  maintenance: "Поддержание",
  muscle_gain: "Набор мышц",
  performance: "Результативность",
};

export default async function SettingsPage() {
  const viewer = await requireReadyViewer();

  return (
    <AppShell eyebrow="Настройки" title="Профиль, выгрузки и управление данными">
      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard caption="Аккаунт" title="Сессия и профиль">
          <div className="space-y-3 text-sm leading-7 text-muted">
            <p>
              <span className="font-semibold text-foreground">Email:</span>{" "}
              {viewer.user.email ?? "Неизвестно"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Имя:</span>{" "}
              {viewer.profile?.full_name ?? "Не заполнено"}
            </p>
            <p>
              <span className="font-semibold text-foreground">Цель:</span>{" "}
              {viewer.goal?.goal_type
                ? goalTypeLabels[viewer.goal.goal_type] ?? viewer.goal.goal_type
                : "Не заполнено"}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
              href={"/onboarding" as Route}
            >
              Обновить онбординг
            </Link>
            <SignOutButton />
          </div>
        </PanelCard>
        <PanelCard caption="Данные" title="Выгрузки и удаление">
          <p className="text-sm leading-7 text-muted">
            Здесь будут собраны выгрузка данных пользователя, запросы на
            удаление, retention hold и служебные переопределения поддержки.
          </p>
        </PanelCard>
        <PanelCard caption="Контекст" title="Цели и обновление онбординга">
          <p className="text-sm leading-7 text-muted">
            Базовые метрики, тренировочные цели, пищевые предпочтения и
            ограничения должны редактироваться без поломки исторических данных.
          </p>
          <div className="mt-4 rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm text-muted">
            Оборудование: {viewer.onboarding?.equipment?.join(", ") || "не заполнено"}
          </div>
        </PanelCard>
      </div>
    </AppShell>
  );
}
