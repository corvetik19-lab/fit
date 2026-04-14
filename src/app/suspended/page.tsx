import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { getViewer } from "@/lib/viewer";

export default async function SuspendedPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth");
  }

  if (!viewer.adminState?.is_suspended || viewer.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-2xl content-center gap-6">
        <section className="surface-panel surface-panel--accent p-8 md:p-10">
          <p className="workspace-kicker text-accent">Статус аккаунта</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Доступ к аккаунту временно ограничен
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            Аккаунт{" "}
            <span className="font-semibold text-foreground">
              {viewer.user.email ?? "пользователя fit"}
            </span>{" "}
            сейчас находится в ограниченном режиме. Основной интерфейс скрыт до
            решения вопроса с поддержкой.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="metric-tile p-4 text-sm text-muted">
              <p>
                Статус: <span className="font-semibold text-foreground">suspended</span>
              </p>
            </div>
            <div className="metric-tile p-4 text-sm text-muted">
              <p>
                Ограничение с:{" "}
                <span className="font-semibold text-foreground">
                  {viewer.adminState.suspended_at
                    ? new Intl.DateTimeFormat("ru-RU", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(viewer.adminState.suspended_at))
                    : "нет данных"}
                </span>
              </p>
            </div>
            <div className="metric-tile p-4 text-sm text-muted">
              <p>
                Причина:{" "}
                <span className="font-semibold text-foreground">
                  {viewer.adminState.state_reason ?? "ожидает комментария поддержки"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
