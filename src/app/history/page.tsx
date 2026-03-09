import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { requireReadyViewer } from "@/lib/viewer";

export default async function HistoryPage() {
  await requireReadyViewer();

  return (
    <AppShell eyebrow="История" title="История программ и прогресса">
      <PanelCard caption="Лента" title="Снимки, выгрузки и сравнения">
        <p className="text-sm leading-7 text-muted">
          Здесь будут собираться прошлые тренировочные программы, сводки по
          питанию, AI-предложения, выгрузки и безопасные сценарии удаления
          данных.
        </p>
      </PanelCard>
    </AppShell>
  );
}
