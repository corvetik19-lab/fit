import { expect, type Page } from "@playwright/test";

import { fetchJson } from "./http";

type SettingsDataSnapshot = {
  billingReviewRequest?: {
    id: string;
    status: string;
  } | null;
  deletionRequest?: {
    id: string;
    status: string;
  } | null;
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

export async function ensureSettingsDeletionRequest(page: Page) {
  const requestResult = await fetchJson<{
    data?: SettingsDataSnapshot;
  }>(page, {
    method: "POST",
    url: "/api/settings/data",
    body: {
      action: "request_deletion",
    },
  });

  expect(requestResult.status).toBe(200);

  const deletionRequestId = requestResult.body?.data?.deletionRequest?.id;
  expect(deletionRequestId).toBeTruthy();

  return {
    deletionRequestId: deletionRequestId!,
  };
}

export async function ensureSettingsBillingReviewRequest(page: Page) {
  const requestResult = await fetchJson<{
    code?: string;
    data?: {
      snapshot?: SettingsDataSnapshot;
    };
  }>(page, {
    method: "POST",
    url: "/api/settings/billing",
    body: {
      action: "request_access_review",
      feature_keys: ["ai_chat"],
      note: "Playwright billing review request",
    },
  });

  if (requestResult.status === 200) {
    const reviewRequestId = requestResult.body?.data?.snapshot?.billingReviewRequest?.id;
    expect(reviewRequestId).toBeTruthy();

    return {
      reviewRequestId: reviewRequestId!,
    };
  }

  expect(requestResult.status).toBe(409);
  expect(requestResult.body?.code).toBe("SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE");

  const snapshotResult = await fetchJson<{
    data?: {
      snapshot?: SettingsDataSnapshot;
    };
  }>(page, {
    method: "GET",
    url: "/api/settings/billing",
  });

  expect(snapshotResult.status).toBe(200);

  const reviewRequestId = snapshotResult.body?.data?.snapshot?.billingReviewRequest?.id;
  expect(reviewRequestId).toBeTruthy();

  return {
    reviewRequestId: reviewRequestId!,
  };
}
