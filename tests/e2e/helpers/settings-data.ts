import { expect, type Page } from "@playwright/test";

import { fetchJson } from "./http";

type SettingsDataSnapshot = {
  exportJobs?: Array<{
    id: string;
    status: string;
  }>;
};

export async function ensureSettingsExportJob(page: Page) {
  const queueResult = await fetchJson<{
    code?: string;
    data?: SettingsDataSnapshot;
  }>(page, {
    method: "POST",
    url: "/api/settings/data",
    body: {
      action: "queue_export",
    },
  });

  if (queueResult.status === 200) {
    const exportJobId = queueResult.body?.data?.exportJobs?.[0]?.id;
    expect(exportJobId).toBeTruthy();

    return {
      exportJobId: exportJobId!,
    };
  }

  expect(queueResult.status).toBe(409);
  expect(queueResult.body?.code).toBe("SETTINGS_EXPORT_ALREADY_ACTIVE");

  const snapshotResult = await fetchJson<{ data?: SettingsDataSnapshot }>(page, {
    method: "GET",
    url: "/api/settings/data",
  });

  expect(snapshotResult.status).toBe(200);

  const exportJobId = snapshotResult.body?.data?.exportJobs?.find((job) =>
    ["queued", "processing", "completed"].includes(job.status),
  )?.id;

  expect(exportJobId).toBeTruthy();

  return {
    exportJobId: exportJobId!,
  };
}
