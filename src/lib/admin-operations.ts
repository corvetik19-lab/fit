export type AdminOperationKind =
  | "support_action"
  | "export_job"
  | "deletion_request";

export type AdminOperationStatusAction =
  | "mark_processing"
  | "mark_completed"
  | "mark_failed"
  | "mark_holding"
  | "mark_canceled";

export const SUPPORT_ACTION_PENDING_STATUSES = ["queued"] as const;
export const SUPPORT_ACTION_TERMINAL_STATUSES = ["completed", "failed"] as const;

export const EXPORT_JOB_ACTIVE_STATUSES = ["queued", "processing"] as const;
export const EXPORT_JOB_TERMINAL_STATUSES = ["completed", "failed"] as const;

export const DELETION_REQUEST_ACTIVE_STATUSES = ["queued", "holding"] as const;
export const DELETION_REQUEST_TERMINAL_STATUSES = [
  "completed",
  "canceled",
] as const;

function includesStatus(
  statuses: readonly string[],
  value: string | null | undefined,
) {
  return value ? statuses.includes(value.toLowerCase()) : false;
}

export function isPendingSupportActionStatus(status: string | null | undefined) {
  return includesStatus(SUPPORT_ACTION_PENDING_STATUSES, status);
}

export function isActiveExportJobStatus(status: string | null | undefined) {
  return includesStatus(EXPORT_JOB_ACTIVE_STATUSES, status);
}

export function isActiveDeletionRequestStatus(
  status: string | null | undefined,
) {
  return includesStatus(DELETION_REQUEST_ACTIVE_STATUSES, status);
}

export function getAvailableOperationActions(
  kind: AdminOperationKind,
  status: string | null | undefined,
): AdminOperationStatusAction[] {
  switch (kind) {
    case "support_action":
      return isPendingSupportActionStatus(status)
        ? ["mark_completed", "mark_failed"]
        : [];
    case "export_job":
      if (status?.toLowerCase() === "queued") {
        return ["mark_processing", "mark_completed", "mark_failed"];
      }

      return isActiveExportJobStatus(status)
        ? ["mark_completed", "mark_failed"]
        : [];
    case "deletion_request":
      return isActiveDeletionRequestStatus(status)
        ? ["mark_holding", "mark_completed", "mark_canceled"]
        : [];
    default:
      return [];
  }
}

export function canApplyOperationAction(
  kind: AdminOperationKind,
  status: string | null | undefined,
  action: AdminOperationStatusAction,
) {
  return getAvailableOperationActions(kind, status).includes(action);
}

export function getNextOperationStatus(
  kind: AdminOperationKind,
  action: AdminOperationStatusAction,
) {
  switch (kind) {
    case "support_action":
      switch (action) {
        case "mark_completed":
          return "completed";
        case "mark_failed":
          return "failed";
        default:
          return null;
      }
    case "export_job":
      switch (action) {
        case "mark_processing":
          return "processing";
        case "mark_completed":
          return "completed";
        case "mark_failed":
          return "failed";
        default:
          return null;
      }
    case "deletion_request":
      switch (action) {
        case "mark_holding":
          return "holding";
        case "mark_completed":
          return "completed";
        case "mark_canceled":
          return "canceled";
        default:
          return null;
      }
    default:
      return null;
  }
}
