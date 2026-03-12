import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageWorkspace } from "@/components/page-workspace";
import { PanelCard } from "@/components/panel-card";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { loadSettingsDataSnapshot } from "@/lib/settings-data-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";
import { requireReadyViewer } from "@/lib/viewer";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
});

function formatDateRange(start: string, end: string) {
  return `${dateFormatter.format(new Date(start))} - ${dateFormatter.format(new Date(end))}`;
}

function formatProposalType(value: string) {
  return value === "meal_plan" ? "Питание" : "Тренировки";
}

function formatProposalStatus(value: string) {
  switch (value) {
    case "draft":
      return "черновик";
    case "approved":
      return "подтверждено";
    case "applied":
      return "применено";
    case "rejected":
      return "отклонено";
    default:
      return value;
  }
}

function formatProgramStatus(value: string) {
  switch (value) {
    case "active":
      return "активна";
    case "draft":
      return "черновик";
    case "archived":
      return "в истории";
    default:
      return value;
  }
}

export default async function HistoryPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [programs, proposals, settingsSnapshot] = await Promise.all([
    listWeeklyPrograms(supabase, viewer.user.id, 24),
    listAiPlanProposals(supabase, viewer.user.id, 12),
    loadSettingsDataSnapshot(supabase, viewer.user.id),
  ]);

  const completedPrograms = programs.filter((program) => program.is_locked);
  const appliedProposals = proposals.filter((proposal) => proposal.status === "applied");

  return (
    <AppShell eyebrow="История" title="История программ и прогресса">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          completedPrograms.length
            ? `${completedPrograms.length} завершённых недель`
            : "История только начинает собираться",
        ]}
        description="История собрана в отдельные логические слои: прошлые программы, AI-предложения и операции с личными данными. На телефоне это открывается по разделам, а не длинной смешанной лентой."
        metrics={[
          {
            label: "Программ",
            value: String(programs.length),
            note: "в хронологии профиля",
          },
          {
            label: "Завершено",
            value: String(completedPrograms.length),
            note: "недель уже закрыто",
          },
          {
            label: "AI-планы",
            value: String(appliedProposals.length),
            note: "применено в продукте",
          },
          {
            label: "Операции",
            value: String(
              settingsSnapshot.exportJobs.length + settingsSnapshot.privacyEvents.length,
            ),
            note: "по данным и выгрузкам",
          },
        ]}
        sections={[
          {
            key: "programs",
            label: "Программы",
            description: "Прошлые недели, статусы и быстрый вход в день.",
            content: (
              <PanelCard
                caption="История программ"
                title="Прошлые недели и рабочие циклы"
              >
                <div className="grid gap-3">
                  {programs.length ? (
                    programs.map((program) => (
                      <article
                        className="rounded-2xl border border-border bg-white/70 p-4"
                        key={program.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {program.title}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {formatDateRange(
                                program.week_start_date,
                                program.week_end_date,
                              )}
                            </p>
                          </div>
                          <span className="pill">{formatProgramStatus(program.status)}</span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-muted">
                          {program.days.map((day) => (
                            <div
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/80 px-3 py-2"
                              key={day.id}
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  День {day.day_of_week}
                                </p>
                                <p>Упражнений: {day.exercises.length}</p>
                              </div>
                              <Link
                                className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white"
                                href={`/workouts/day/${day.id}`}
                              >
                                Открыть
                              </Link>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm text-muted">
                      Здесь появятся прошлые недельные программы и завершённые дни.
                    </div>
                  )}
                </div>
              </PanelCard>
            ),
          },
          {
            key: "ai",
            label: "AI",
            description: "Сохранённые AI-предложения и то, что уже применялось.",
            content: (
              <PanelCard
                caption="AI-история"
                title="Черновики и применённые предложения"
              >
                <div className="grid gap-3">
                  {proposals.length ? (
                    proposals.map((proposal) => (
                      <article
                        className="rounded-2xl border border-border bg-white/70 p-4"
                        key={proposal.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatProposalType(proposal.proposal_type)}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              Обновлено {new Date(proposal.updated_at).toLocaleString("ru-RU")}
                            </p>
                          </div>
                          <span className="pill">{formatProposalStatus(proposal.status)}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted">
                          ID предложения: {proposal.id.slice(0, 8)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm text-muted">
                      Когда AI начнёт собирать и применять планы, история появится здесь.
                    </div>
                  )}
                </div>
              </PanelCard>
            ),
          },
          {
            key: "data",
            label: "Данные",
            description: "Экспорт, удаление и след операций с личными данными.",
            content: (
              <div className="grid gap-6 xl:grid-cols-2">
                <PanelCard
                  caption="Выгрузки"
                  title="Архивы и запросы по данным"
                >
                  <div className="grid gap-3">
                    {settingsSnapshot.exportJobs.length ? (
                      settingsSnapshot.exportJobs.map((job) => (
                        <article
                          className="rounded-2xl border border-border bg-white/70 p-4"
                          key={job.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                Выгрузка {job.id.slice(0, 8)}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {new Date(job.createdAt).toLocaleString("ru-RU")}
                              </p>
                            </div>
                            <span className="pill">{job.status}</span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm text-muted">
                        Выгрузок пока не было.
                      </div>
                    )}
                  </div>
                </PanelCard>

                <PanelCard
                  caption="Операции"
                  title="История действий с личными данными"
                >
                  <div className="grid gap-3">
                    {settingsSnapshot.privacyEvents.length ? (
                      settingsSnapshot.privacyEvents.map((event) => (
                        <article
                          className="rounded-2xl border border-border bg-white/70 p-4"
                          key={event.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {event.title}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {new Date(event.createdAt).toLocaleString("ru-RU")}
                              </p>
                            </div>
                            <span className="pill">{event.actorScope}</span>
                          </div>
                          {event.detail ? (
                            <p className="mt-3 text-sm leading-6 text-muted">
                              {event.detail}
                            </p>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm text-muted">
                        История операций с данными пока пуста.
                      </div>
                    )}
                  </div>
                </PanelCard>
              </div>
            ),
          },
        ]}
        title="Прошлые недели, AI-решения и операции по данным без длинной ленты"
      />
    </AppShell>
  );
}
