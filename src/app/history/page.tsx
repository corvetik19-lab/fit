import type { Route } from "next";
import Link from "next/link";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { loadSettingsDataSnapshotOrFallback } from "@/lib/settings-data-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";
import { requireReadyViewer } from "@/lib/viewer";

const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";
const HISTORY_RETRY_OPTIONS = IS_PLAYWRIGHT_RUNTIME
  ? { attempts: 1, delaysMs: [100] as const }
  : { attempts: 3, delaysMs: [500, 1_500, 3_000] as const };

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

async function loadHistorySlice<T>({
  fallback,
  factory,
  label,
  userId,
}: {
  fallback: T;
  factory: () => Promise<T>;
  label: string;
  userId: string;
}) {
  try {
    return await withTransientRetry(factory, HISTORY_RETRY_OPTIONS);
  } catch (error) {
    logger.warn("history slice load failed, using fallback", {
      error,
      label,
      userId,
    });
    return fallback;
  }
}

export default async function HistoryPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [programs, proposals, settingsSnapshot] = await Promise.all([
    loadHistorySlice({
      fallback: [] as Awaited<ReturnType<typeof listWeeklyPrograms>>,
      factory: async () => await listWeeklyPrograms(supabase, viewer.user.id, 24),
      label: "history weekly programs",
      userId: viewer.user.id,
    }),
    loadHistorySlice({
      fallback: [] as Awaited<ReturnType<typeof listAiPlanProposals>>,
      factory: async () => await listAiPlanProposals(supabase, viewer.user.id, 12),
      label: "history ai proposals",
      userId: viewer.user.id,
    }),
    loadSettingsDataSnapshotOrFallback(supabase, viewer.user.id),
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
      title="История циклов, AI-решений и данных"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="grid gap-3.5">
        <section className="surface-panel p-3.5 sm:p-4">
          <p className="workspace-kicker">Личный архив</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            История действий
          </h1>
          <p className="mt-1 text-sm leading-5 text-muted">
            Завершённые недели, AI-планы и события по данным собраны в одном коротком журнале.
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="Недели" value={completedPrograms.length.toString()} />
            <Metric label="AI" value={proposals.length.toString()} />
            <Metric label="Данные" value={settingsSnapshot.privacyEvents.length.toString()} />
          </div>
        </section>

        <section className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            <a className="section-chip section-chip--active px-3 py-2 text-sm font-semibold" href="#history-feed">
              Лента
            </a>
            <a className="section-chip px-3 py-2 text-sm font-semibold" href="#history-programs">
              Программы
            </a>
            <a className="section-chip px-3 py-2 text-sm font-semibold" href="#history-ai">
              AI
            </a>
            <a className="section-chip px-3 py-2 text-sm font-semibold" href="#history-data">
              Данные
            </a>
          </div>
        </section>

        <section className="grid gap-2.5" id="history-feed">
          {timelineItems.length ? (
            timelineItems.slice(0, 6).map((item) => (
              <article
                className={`rounded-[1.1rem] p-3.5 ${
                  item.kind === "ai" ? "surface-panel surface-panel--accent" : "surface-panel"
                }`}
                key={`${item.kind}-${item.title}-${item.when}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="workspace-kicker">{getTimelineKindLabel(item.kind)}</p>
                    <h2 className="mt-1.5 line-clamp-2 text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-muted">{item.detail}</p>
                  </div>

                  {item.href ? (
                    <Link className="action-button action-button--secondary shrink-0 px-3 py-2 text-xs" href={item.href}>
                      Открыть
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="metric-tile p-3.5 text-sm text-muted">
              История пока пустая.
            </article>
          )}
        </section>

        <section className="grid gap-2.5" id="history-programs">
          <SectionHeading eyebrow="Программы" title="Прошлые циклы" />

          {programs.length ? (
            programs.map((program) => {
              const firstDay = program.days[0] ?? null;

              return (
                <article className="surface-panel p-3.5" key={program.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">
                        {program.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {formatDateRange(program.week_start_date, program.week_end_date)}
                      </p>
                    </div>
                    <span className="pill">{formatProgramStatus(program.status)}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Metric label="Дней" value={program.days.length.toString()} />
                    <Metric
                      label="Упр."
                      value={program.days
                        .reduce((sum, day) => sum + day.exercises.length, 0)
                        .toString()}
                    />
                    <Metric label="Фикс." value={program.is_locked ? "Да" : "Нет"} />
                  </div>

                  {firstDay ? (
                    <div className="mt-3">
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
        </section>

        <section className="grid gap-2.5" id="history-ai">
          <SectionHeading eyebrow="AI" title="Черновики и решения" />

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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="workspace-kicker">
                      {formatProposalType(proposal.proposal_type)}
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground">
                      {formatProposalStatus(proposal.status)}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
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
        </section>

        <section className="grid gap-2.5" id="history-data">
          <SectionHeading eyebrow="Данные" title="Экспорт и приватность" />

          <div className="grid gap-2.5 lg:grid-cols-2">
            <DataCard
              empty="Выгрузок пока не было."
              items={settingsSnapshot.exportJobs.map((job) => ({
                id: job.id,
                title: job.status,
                detail: fullDateFormatter.format(new Date(job.createdAt)),
              }))}
              title="Выгрузки профиля"
            />
            <DataCard
              empty="Событий приватности пока нет."
              items={settingsSnapshot.privacyEvents.map((event) => ({
                id: event.id,
                title:
                  event.kind === "deletion"
                    ? "Удаление аккаунта"
                    : "Операция с данными",
                detail: `${event.title} · ${fullDateFormatter.format(new Date(event.createdAt))}`,
              }))}
              title="События приватности"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-tile p-2.5">
      <p className="workspace-kicker">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="workspace-kicker">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  );
}

function DataCard({
  empty,
  items,
  title,
}: {
  empty: string;
  items: Array<{ detail: string; id: string; title: string }>;
  title: string;
}) {
  return (
    <article className="surface-panel p-3.5">
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => (
            <div className="metric-tile p-3 text-sm text-muted" key={item.id}>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-1">{item.detail}</p>
            </div>
          ))
        ) : (
          <div className="metric-tile p-3 text-sm text-muted">{empty}</div>
        )}
      </div>
    </article>
  );
}
