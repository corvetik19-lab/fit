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
    <AppShell eyebrow="История" title="Прошлые циклы, AI-решения и операции с данными">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          completedPrograms.length
            ? `${completedPrograms.length} завершённых недель`
            : "История только начинает собираться",
        ]}
        description="История разделена на три слоя: тренировочные циклы, AI-предложения и операции с личными данными. На телефоне это работает как компактный архив по разделам, без перегруженной ленты."
        metrics={[
          {
            label: "Программ",
            value: String(programs.length),
            note: "в хронологии профиля",
          },
          {
            label: "Закрыто",
            value: String(completedPrograms.length),
            note: "недель завершено",
          },
          {
            label: "AI-планы",
            value: String(appliedProposals.length),
            note: "уже применены",
          },
          {
            label: "Операций",
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
                caption="Архив программ"
                title="Прошлые недели и завершённые рабочие циклы"
              >
                <div className="grid gap-3">
                  {programs.length ? (
                    programs.map((program) => (
                      <article
                        className="rounded-[2rem] border border-border bg-white/72 p-4 shadow-[0_24px_52px_-40px_rgba(20,58,160,0.22)]"
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
                              className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/80 bg-white/88 px-3 py-3"
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
                    <div className="rounded-[2rem] border border-dashed border-border bg-white/72 px-4 py-5 text-sm text-muted">
                      Здесь появятся завершённые недели и архив тренировочных дней.
                    </div>
                  )}
                </div>
              </PanelCard>
            ),
          },
          {
            key: "ai",
            label: "AI",
            description: "Предложения, которые уже доходили до подтверждения и применения.",
            content: (
              <PanelCard
                caption="AI-история"
                title="Черновики, подтверждения и применённые решения"
              >
                <div className="grid gap-3">
                  {proposals.length ? (
                    proposals.map((proposal) => (
                      <article
                        className="rounded-[2rem] border border-border bg-white/72 p-4 shadow-[0_24px_52px_-40px_rgba(20,58,160,0.22)]"
                        key={proposal.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatProposalType(proposal.proposal_type)}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              Обновлено{" "}
                              {new Date(proposal.updated_at).toLocaleString("ru-RU")}
                            </p>
                          </div>
                          <span className="pill">{formatProposalStatus(proposal.status)}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted">
                          Идентификатор предложения: {proposal.id.slice(0, 8)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[2rem] border border-dashed border-border bg-white/72 px-4 py-5 text-sm text-muted">
                      Как только AI начнёт собирать и применять планы, история появится
                      здесь.
                    </div>
                  )}
                </div>
              </PanelCard>
            ),
          },
          {
            key: "data",
            label: "Данные",
            description: "Выгрузки и события по приватности без лишней техничности.",
            content: (
              <PanelCard
                caption="Данные и приватность"
                title="Выгрузки профиля и запросы на удаление"
              >
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-border bg-white/72 p-4">
                    <p className="text-sm font-semibold text-foreground">Выгрузки</p>
                    <div className="mt-3 grid gap-2 text-sm text-muted">
                      {settingsSnapshot.exportJobs.length ? (
                        settingsSnapshot.exportJobs.map((job) => (
                          <div
                            className="rounded-[1.5rem] border border-border/80 bg-white/88 px-3 py-3"
                            key={job.id}
                          >
                            <p className="font-medium text-foreground">{job.status}</p>
                            <p className="mt-1">
                              {new Date(job.createdAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-border px-3 py-3">
                          Пока нет созданных выгрузок.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-border bg-white/72 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      События приватности
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-muted">
                      {settingsSnapshot.privacyEvents.length ? (
                        settingsSnapshot.privacyEvents.map((event) => (
                          <div
                            className="rounded-[1.5rem] border border-border/80 bg-white/88 px-3 py-3"
                            key={event.id}
                          >
                            <p className="font-medium text-foreground">
                              {event.kind === "deletion"
                                ? "Запрос на удаление"
                                : "Событие приватности"}
                            </p>
                            <p className="mt-1">
                              {new Date(event.createdAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-border px-3 py-3">
                          Здесь будут показаны выгрузки и события по личным данным.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PanelCard>
            ),
          },
        ]}
        title="История прогресса, решений и действий над профилем"
      />
    </AppShell>
  );
}
