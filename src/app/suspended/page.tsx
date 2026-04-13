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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,91,255,0.18),_transparent_38%),linear-gradient(180deg,_#fcfbfa_0%,_#eef4ff_100%)] px-6 py-10 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-2xl content-center gap-6">
        <section className="card card--hero p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Account state
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            Доступ к аккаунту временно ограничен
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            Аккаунт{" "}
            <span className="font-semibold text-foreground">
              {viewer.user.email ?? "пользователя fit"}
            </span>{" "}
            сейчас находится в ограниченном режиме. Основной интерфейс скрыт до
            решения вопроса поддержкой.
          </p>

          <div className="mt-6 grid gap-3 rounded-[2rem] border border-border bg-white/78 p-5 text-sm">
            <p className="text-muted">
              Статус: <span className="text-foreground">suspended</span>
            </p>
            <p className="text-muted">
              Ограничение с:{" "}
              <span className="text-foreground">
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
            <p className="text-muted">
              Причина:{" "}
              <span className="text-foreground">
                {viewer.adminState.state_reason ?? "ожидает комментария поддержки"}
              </span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
