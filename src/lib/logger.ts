import * as Sentry from "@sentry/nextjs";

function normalizeMeta(meta?: Record<string, unknown>) {
  return meta ?? {};
}

function captureHandledError(
  message: string,
  meta?: Record<string, unknown>,
) {
  const errorCandidate = meta?.error;
  const extras = { ...normalizeMeta(meta) };
  delete extras.error;

  Sentry.withScope((scope) => {
    scope.setLevel("error");

    for (const [key, value] of Object.entries(extras)) {
      scope.setExtra(key, value);
    }

    if (errorCandidate instanceof Error) {
      Sentry.captureException(errorCandidate);
      return;
    }

    Sentry.captureMessage(message, "error");
  });
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(message, meta ?? {});
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(message, meta ?? {});
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(message, meta ?? {});
    captureHandledError(message, meta);
  },
};
