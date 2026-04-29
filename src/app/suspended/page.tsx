import { redirect } from "next/navigation";
import Image from "next/image";

import { SignOutButton } from "@/components/sign-out-button";
import { getViewer } from "@/lib/viewer";

const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams?: Promise<{ __test_suspended?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const forcePlaywrightSuspended =
    IS_PLAYWRIGHT_RUNTIME && resolvedSearchParams?.__test_suspended === "1";
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth");
  }

  if ((!viewer.adminState?.is_suspended && !forcePlaywrightSuspended) || viewer.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const suspendedState =
    viewer.adminState?.is_suspended && viewer.adminState
      ? viewer.adminState
      : {
          is_suspended: true,
          metadata: null,
          restored_at: null,
          state_reason: "Тестовая причина ограничения для проверки экрана.",
          suspended_at: new Date().toISOString(),
        };

  return (
    <main className="min-h-dvh bg-background px-4 py-[calc(1rem+env(safe-area-inset-top))] text-foreground">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-md content-center gap-4">
        <div className="mx-auto grid justify-items-center gap-2 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[color-mix(in_srgb,var(--accent-soft)_44%,white)] p-2.5">
            <Image
              alt="fitora"
              className="h-full w-full object-contain"
              height={64}
              priority
              src="/fit-logo.svg"
              width={64}
            />
          </div>
          <p className="app-display text-2xl font-black tracking-[-0.08em] text-foreground">
            fitora
          </p>
        </div>

        <section className="surface-panel surface-panel--accent p-4 sm:p-5">
          <p className="workspace-kicker text-accent">Статус аккаунта</p>
          <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-foreground">
            Доступ к аккаунту временно ограничен
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Аккаунт{" "}
            <span className="font-semibold text-foreground">
              {viewer.user.email ?? "пользователя fit"}
            </span>{" "}
            сейчас находится в ограниченном режиме. Основной интерфейс скрыт до
            решения вопроса с поддержкой.
          </p>

          <div className="mt-4 grid gap-2.5">
            <div className="metric-tile p-3.5 text-sm text-muted">
              <p>
                Статус: <span className="font-semibold text-foreground">suspended</span>
              </p>
            </div>
            <div className="metric-tile p-3.5 text-sm text-muted">
              <p>
                Ограничение с:{" "}
                <span className="font-semibold text-foreground">
                  {suspendedState.suspended_at
                    ? new Intl.DateTimeFormat("ru-RU", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(suspendedState.suspended_at))
                    : "нет данных"}
                </span>
              </p>
            </div>
            <div className="metric-tile p-3.5 text-sm text-muted">
              <p>
                Причина:{" "}
                <span className="font-semibold text-foreground">
                  {suspendedState.state_reason ?? "ожидает комментария поддержки"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5">
            <SignOutButton className="w-full justify-center" />
          </div>
        </section>
      </div>
    </main>
  );
}
