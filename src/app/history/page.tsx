import type { Route } from "next";
import Link from "next/link";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { withTransientRetry } from "@/lib/runtime-retry";
import { loadSettingsDataSnapshot } from "@/lib/settings-data-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";
import { requireReadyViewer } from "@/lib/viewer";

const rangeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDateRange(start: string, end: string) {
  return `${rangeFormatter.format(new Date(start))} - ${rangeFormatter.format(new Date(end))}`;
}

function formatProposalType(value: string) {
  return value === "meal_plan" ? "AI-план питания" : "AI-план тренировок";
}

function formatProposalStatus(value: string) {
  switch (value) {
    case "draft":
      return "Черновик";
    case "approved":
      return "Подтверждено";
    case "applied":
      return "Применено";
    case "rejected":
      return "Отклонено";
    default:
      return value;
  }
}

function formatProgramStatus(value: string) {
  switch (value) {
    case "active":
      return "Активна";
    case "draft":
      return "Черновик";
    case "archived":
      return "В архиве";
    default:
      return value;
  }
}

type TimelineItem = {
  detail: string;
  href?: Route;
  kind: "ai" | "data" | "workout";
  title: string;
  when: number;
};

function getTimelineKindLabel(kind: TimelineItem["kind"]) {
  switch (kind) {
    case "ai":
      return "AI";
    case "data":
      return "Данные";
    case "workout":
      return "Тренировки";
  }
}

export default async function HistoryPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [programs, proposals, settingsSnapshot] = await Promise.all([
    withTransientRetry(async () => await listWeeklyPrograms(supabase, viewer.user.id, 24), {
      attempts: 3,
      delaysMs: [500, 1_500, 3_000],
    }),
    withTransientRetry(async () => await listAiPlanProposals(supabase, viewer.user.id, 12), {
      attempts: 3,
      delaysMs: [500, 1_500, 3_000],
    }),
    withTransientRetry(async () => await loadSettingsDataSnapshot(supabase, viewer.user.id), {
      attempts: 3,
      delaysMs: [500, 1_500, 3_000],
    }),
  ]);

  const completedPrograms = programs.filter((program) => program.is_locked);
  const timelineItems: TimelineItem[] = [
    ...programs.slice(0, 6).map((program) => ({
      detail: `${formatDateRange(program.week_start_date, program.week_end_date)} - ${formatProgramStatus(program.status)}`,
      href: program.days[0]
        ? (`/workouts/day/${program.days[0].id}` as Route)
        : undefined,
      kind: "workout" as const,
      title: program.title,
      when: new Date(program.created_at).getTime(),
    })),
    ...proposals.slice(0, 4).map((proposal) => ({
      detail: `${formatProposalStatus(proposal.status)} - ${fullDateFormatter.format(new Date(proposal.updated_at))}`,
      kind: "ai" as const,
      title: formatProposalType(proposal.proposal_type),
      when: new Date(proposal.updated_at).getTime(),
    })),
    ...settingsSnapshot.privacyEvents.slice(0, 4).map((event) => ({
      detail: `${event.title} - ${fullDateFormatter.format(new Date(event.createdAt))}`,
      kind: "data" as const,
      title: event.kind === "deletion" ? "Удаление аккаунта" : "Операция с данными",
      when: new Date(event.createdAt).getTime(),
    })),
  ].sort((left, right) => right.when - left.when);

  return (
    <AppShell
      eyebrow="История"
      title="История циклов, AI-решений и операций с данными"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="grid gap-4">
        <section className="grid gap-3.5">
          <div className="grid gap-2.5">
            <p className="workspace-kicker text-accent">Личный архив</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              История действий и прошлых циклов
            </h1>
            <p className="max-w-2xl text-sm leading-5 text-muted">
              Здесь собраны завершенные недели, AI-решения и события по данным.
              Экран нужен не для красоты, а чтобы быстро понять, что именно мы
              уже меняли и к чему можно вернуться.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <article className="metric-tile p-3.5">
              <p className="workspace-kicker">Завершено недель</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {completedPrograms.length}
              </p>
            </article>
            <article className="metric-tile p-3.5">
              <p className="workspace-kicker">AI-решений</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {proposals.length}
              </p>
            </article>
            <article className="metric-tile p-3.5">
              <p className="workspace-kicker">Операций с данными</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {settingsSnapshot.privacyEvents.length}
              </p>
            </article>
          </div>
        </section>

        <section className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            <a className="section-chip section-chip--active px-3.5 py-2.5 text-sm font-semibold" href="#history-feed">
              Лента
            </a>
            <a className="section-chip px-3.5 py-2.5 text-sm font-semibold" href="#history-programs">
              Программы
            </a>
            <a className="section-chip px-3.5 py-2.5 text-sm font-semibold" href="#history-ai">
              AI
            </a>
            <a className="section-chip px-3.5 py-2.5 text-sm font-semibold" href="#history-data">
              Данные
            </a>
          </div>
        </section>

        <section className="grid gap-3" id="history-feed">
          {timelineItems.length ? (
            timelineItems.slice(0, 6).map((item) => (
              <article
                className={`rounded-[1.1rem] p-3.5 ${
                  item.kind === "ai" ? "surface-panel surface-panel--accent" : "surface-panel"
                }`}
                key={`${item.kind}-${item.title}-${item.when}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="workspace-kicker">{getTimelineKindLabel(item.kind)}</p>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-5 text-muted">{item.detail}</p>
                  </div>

                  {item.href ? (
                    <Link className="action-button action-button--secondary shrink-0" href={item.href}>
                      Открыть
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="metric-tile p-3.5 text-sm text-muted">
              История пока пустая. Как только появятся завершенные недели,
              AI-предложения или операции с данными, они соберутся здесь.
            </article>
          )}
        </section>

        <section className="grid gap-3" id="history-programs">
          <div>
            <p className="workspace-kicker">Программы</p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Прошлые циклы и рабочие недели
            </h2>
          </div>

          <div className="grid gap-3">
            {programs.length ? (
              programs.map((program) => {
                const firstDay = program.days[0] ?? null;

                return (
                  <article className="surface-panel p-3.5" key={program.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">
                          {program.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          {formatDateRange(program.week_start_date, program.week_end_date)}
                        </p>
                      </div>
                      <span className="pill">{formatProgramStatus(program.status)}</span>
                    </div>

                    <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                      <div className="metric-tile p-3">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {program.days.length}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          дней
                        </p>
                      </div>
                      <div className="metric-tile p-3">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {program.days.reduce((sum, day) => sum + day.exercises.length, 0)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          упражнений
                        </p>
                      </div>
                      <div className="metric-tile p-3">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {program.is_locked ? "Да" : "Нет"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          зафиксирована
                        </p>
                      </div>
                    </div>

                    {firstDay ? (
                      <div className="mt-3.5">
                        <Link
                          className="action-button action-button--primary w-full justify-center"
                          href={`/workouts/day/${firstDay.id}` as Route}
                        >
                          Открыть день {firstDay.day_of_week}
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <article className="metric-tile p-3.5 text-sm text-muted">
                Архив недель пока пуст.
              </article>
            )}
          </div>
        </section>

        <section className="grid gap-3" id="history-ai">
          <div>
            <p className="workspace-kicker">AI</p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Черновики, подтверждения и примененные решения
            </h2>
          </div>

          <div className="grid gap-3">
            {proposals.length ? (
              proposals.map((proposal) => (
                <article
                  className={`rounded-[1.1rem] p-3.5 ${
                    proposal.status === "applied"
                      ? "surface-panel surface-panel--accent"
                      : "surface-panel"
                  }`}
                  key={proposal.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="workspace-kicker">
                        {formatProposalType(proposal.proposal_type)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                        {formatProposalStatus(proposal.status)}
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        {fullDateFormatter.format(new Date(proposal.updated_at))}
                      </p>
                    </div>

                    <span className="pill">{proposal.id.slice(0, 8)}</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="metric-tile p-3.5 text-sm text-muted">
                История AI-предложений пока пустая.
              </article>
            )}
          </div>
        </section>

        <section className="grid gap-3" id="history-data">
          <div>
            <p className="workspace-kicker">Данные</p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Экспорт и приватность
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <article className="surface-panel p-3.5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Выгрузки профиля
              </h3>
              <div className="mt-4 grid gap-3">
                {settingsSnapshot.exportJobs.length ? (
                  settingsSnapshot.exportJobs.map((job) => (
                    <div className="metric-tile p-3 text-sm text-muted" key={job.id}>
                      <p className="font-semibold text-foreground">{job.status}</p>
                      <p className="mt-1">
                        {fullDateFormatter.format(new Date(job.createdAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="metric-tile p-3 text-sm text-muted">
                    Выгрузок пока не было.
                  </div>
                )}
              </div>
            </article>

            <article className="surface-panel p-3.5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                События приватности
              </h3>
              <div className="mt-4 grid gap-3">
                {settingsSnapshot.privacyEvents.length ? (
                  settingsSnapshot.privacyEvents.map((event) => (
                    <div className="metric-tile p-3 text-sm text-muted" key={event.id}>
                      <p className="font-semibold text-foreground">
                        {event.kind === "deletion" ? "Удаление аккаунта" : "Операция с данными"}
                      </p>
                      <p className="mt-1">{event.title}</p>
                      <p className="mt-1">
                        {fullDateFormatter.format(new Date(event.createdAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="metric-tile p-3 text-sm text-muted">
                    Событий приватности пока нет.
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
