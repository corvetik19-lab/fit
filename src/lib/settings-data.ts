export const DATA_EXPORT_FORMAT = "json_csv_zip";
export const DEFAULT_DELETION_HOLD_DAYS = 14;

export type SettingsExportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type SettingsDeletionRequestStatus =
  | "queued"
  | "holding"
  | "completed"
  | "canceled";

export type SettingsExportJob = {
  artifactPath: string | null;
  createdAt: string;
  format: string;
  id: string;
  status: SettingsExportJobStatus;
  updatedAt: string;
};

export type SettingsDeletionRequest = {
  createdAt: string;
  holdUntil: string | null;
  id: string;
  status: SettingsDeletionRequestStatus;
  updatedAt: string;
};

export type SettingsPrivacyEvent = {
  actorScope: "support" | "system" | "you";
  createdAt: string;
  detail: string | null;
  id: string;
  kind: "deletion" | "export";
  tone: "danger" | "neutral" | "success" | "warning";
  title: string;
};

export type SettingsBillingReviewRequestStatus = "completed" | "failed" | "queued";

export type SettingsBillingReviewRequest = {
  createdAt: string;
  id: string;
  note: string | null;
  requestedFeatures: string[];
  status: SettingsBillingReviewRequestStatus;
  updatedAt: string;
};

export type SettingsBillingEvent = {
  actorScope: "support" | "system" | "you";
  createdAt: string;
  detail: string | null;
  id: string;
  kind: "entitlement" | "request" | "subscription";
  tone: "danger" | "neutral" | "success" | "warning";
  title: string;
};

export type SettingsDataSnapshot = {
  billingEvents: SettingsBillingEvent[];
  billingReviewRequest: SettingsBillingReviewRequest | null;
  deletionRequest: SettingsDeletionRequest | null;
  exportJobs: SettingsExportJob[];
  privacyEvents: SettingsPrivacyEvent[];
};

export function getDefaultDeletionHoldUntil() {
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + DEFAULT_DELETION_HOLD_DAYS);
  return holdUntil.toISOString();
}
