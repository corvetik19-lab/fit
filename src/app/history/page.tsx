import type { Route } from "next";
import Link from "next/link";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { listAiPlanProposals } from "@/lib/ai/proposals";
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
  return `${rangeFormatter.format(new Date(start))} · ${rangeFormatter.format(new Date(end))}`;
}

function formatProposalType(value: string) {
  return value === "meal_plan" ? "AI питание" : "AI тренировки";
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

export default async function HistoryPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [programs, proposals, settingsSnapshot] = await Promise.all([
    listWeeklyPrograms(supabase, viewer.user.id, 24),
    listAiPlanProposals(supabase, viewer.user.id, 12),
    loadSettingsDataSnapshot(supabase, viewer.user.id),
  ]);

  const completedPrograms = programs.filter((program) => program.is_locked);
  const timelineItems: TimelineItem[] = [
    ...programs.slice(0, 6).map((program) => ({
      kind: "workout" as const,
      title: program.title,
      detail: `${formatDateRange(program.week_start_date, program.week_end_date)} · ${formatProgramStatus(program.status)}`,
      href: program.days[0]
        ? (`/workouts/day/${program.days[0].id}` as Route)
        : undefined,
      when: new Date(program.created_at).getTime(),
    })),
    ...proposals.slice(0, 4).map((proposal) => ({
      kind: "ai" as const,
      title: formatProposalType(proposal.proposal_type),
      detail: `${formatProposalStatus(proposal.status)} · ${fullDateFormatter.format(new Date(proposal.updated_at))}`,
      when: new Date(proposal.updated_at).getTime(),
    })),
    ...settingsSnapshot.privacyEvents.slice(0, 4).map((event) => ({
      kind: "data" as const,
      title: event.kind === "deletion" ? "Удаление аккаунта" : "Операция по данным",
      detail: `${event.title} · ${fullDateFormatter.format(new Date(event.createdAt))}`,
      when: new Date(event.createdAt).getTime(),
    })),
  ].sort((left, right) => right.when - left.when);

  return (
    <AppShell
      eyebrow="История"
      title="Прошлые циклы, AI-решения и операции с данными"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="grid gap-6">
        <section className="grid gap-5">
          <div className="space-y-3">
            <p className="workspace-kicker text-accent">Личный архив</p>
            <h1 className="app-display text-5xl font-black tracking-[-0.08em] text-foreground">
              Архив
            </h1>
          </div>

          <article className="surface-panel p-6 sm:p-7">
            <p className="text-5xl font-black tracking-tight text-accent">
              {completedPrograms.length}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-muted">
              недель завершено
            </p>
          </article>
        </section>

        <section className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            <a className="section-chip section-chip--active px-4 py-3 text-sm font-semibold" href="#history-events">
              Все события
            </a>
            <a className="section-chip px-4 py-3 text-sm font-semibold" href="#history-programs">
              Тренировки
            </a>
            <a className="section-chip px-4 py-3 text-sm font-semibold" href="#history-ai">
              AI аналитик
            </a>
            <a className="section-chip px-4 py-3 text-sm font-semibold" href="#history-data">
              Данные
            </a>
          </div>
        </section>

        <section className="grid gap-6" id="history-events">
          <div className="grid gap-3">
            {timelineItems.slice(0, 6).map((item) => (
              <article
                className={`rounded-[2rem] p-5 ${
                  item.kind === "ai"
                    ? "athletic-hero-card"
                    : "surface-panel"
                }`}
                key={`${item.kind}-${item.title}-${item.when}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`workspace-kicker ${
                        item.kind === "ai" ? "text-white/76" : ""
                      }`}
                    >
                      {item.kind === "ai"
                        ? "AI изменения"
                        : item.kind === "data"
                          ? "Данные"
                          : "Тренировки"}
                    </p>
                    <h2
                      className={`mt-3 text-3xl font-semibold tracking-tight ${
                        item.kind === "ai" ? "text-white" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </h2>
                    <p
                      className={`mt-2 text-sm leading-7 ${
                        item.kind === "ai" ? "text-white/78" : "text-muted"
                      }`}
                    >
                      {item.detail}
                    </p>
                  </div>

                  {item.href ? (
                    <Link
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        item.kind === "ai"
                          ? "bg-white text-accent"
                          : "border border-border bg-white/80 text-foreground hover:bg-white"
                      }`}
                      href={item.href}
                    >
                      Подробнее
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4" id="history-programs">
          <div>
            <p className="workspace-kicker">Программы</p>
            <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
              Прошлые циклы и рабочие недели
            </h2>
          </div>

          <div className="grid gap-3">
            {programs.length ? (
              programs.map((program) => {
                const firstDay = program.days[0] ?? null;

                return (
                  <article className="surface-panel p-5" key={program.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                          {program.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          {formatDateRange(
                            program.week_start_date,
                            program.week_end_date,
                          )}
                        </p>
                      </div>
                      <span className="pill">{formatProgramStatus(program.status)}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-3xl font-black tracking-tight text-foreground">
                          {program.days.length}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          дней
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-black tracking-tight text-foreground">
                          {program.days.reduce(
                            (sum, day) => sum + day.exercises.length,
                            0,
                          )}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          упражнений
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-black tracking-tight text-foreground">
                          {program.is_locked ? "Да" : "Нет"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          зафиксирована
                        </p>
                      </div>
                    </div>

                    {firstDay ? (
                      <div className="mt-5">
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
              <article className="surface-panel p-5 text-sm text-muted">
                Архив тренировочных недель пока пуст.
              </article>
            )}
          </div>
        </section>

        <section className="grid gap-4" id="history-ai">
          <div>
            <p className="workspace-kicker">AI</p>
            <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
              Черновики, подтверждения и применённые решения
            </h2>
          </div>

          <div className="grid gap-3">
            {proposals.length ? (
              proposals.map((proposal) => (
                <article
                  className={`rounded-[2rem] p-5 ${
                    proposal.status === "applied"
                      ? "athletic-hero-card"
                      : "surface-panel"
                  }`}
                  key={proposal.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p
                        className={`workspace-kicker ${
                          proposal.status === "applied" ? "text-white/78" : ""
                        }`}
                      >
                        {formatProposalType(proposal.proposal_type)}
                      </p>
                      <h3
                        className={`mt-2 text-2xl font-semibold tracking-tight ${
                          proposal.status === "applied"
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {formatProposalStatus(proposal.status)}
                      </h3>
                      <p
                        className={`mt-2 text-sm ${
                          proposal.status === "applied"
                            ? "text-white/78"
                            : "text-muted"
                        }`}
                      >
                        {fullDateFormatter.format(new Date(proposal.updated_at))}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                        proposal.status === "applied"
                          ? "bg-white/18 text-white"
                          : "bg-[color-mix(in_srgb,var(--accent-soft)_44%,white)] text-accent"
                      }`}
                    >
                      {proposal.id.slice(0, 8)}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="surface-panel p-5 text-sm text-muted">
                История AI-предложений пока пустая.
              </article>
            )}
          </div>
        </section>

        <section className="grid gap-4" id="history-data">
          <div>
            <p className="workspace-kicker">Данные</p>
            <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
              Экспорт и приватность
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="surface-panel p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Выгрузки профиля
              </h3>
              <div className="mt-4 grid gap-3">
                {settingsSnapshot.exportJobs.length ? (
                  settingsSnapshot.exportJobs.map((job) => (
                    <div
                      className="rounded-[1.6rem] bg-white/78 px-4 py-4 text-sm text-muted"
                      key={job.id}
                    >
                      <p className="font-semibold text-foreground">
                        {job.status}
                      </p>
                      <p className="mt-1">
                        {fullDateFormatter.format(new Date(job.createdAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.6rem] bg-white/78 px-4 py-4 text-sm text-muted">
                    Выгрузок пока не было.
                  </div>
                )}
              </div>
            </article>

            <article className="surface-panel p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                События приватности
              </h3>
              <div className="mt-4 grid gap-3">
                {settingsSnapshot.privacyEvents.length ? (
                  settingsSnapshot.privacyEvents.map((event) => (
                    <div
                      className="rounded-[1.6rem] bg-white/78 px-4 py-4 text-sm text-muted"
                      key={event.id}
                    >
                      <p className="font-semibold text-foreground">
                        {event.kind === "deletion"
                          ? "Удаление аккаунта"
                          : "Операция по данным"}
                      </p>
                      <p className="mt-1">{event.title}</p>
                      <p className="mt-1">
                        {fullDateFormatter.format(new Date(event.createdAt))}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.6rem] bg-white/78 px-4 py-4 text-sm text-muted">
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
