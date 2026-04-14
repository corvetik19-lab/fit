const DEFAULT_TRANSIENT_RETRY_DELAYS_MS = [400, 1_200] as const;

const TRANSIENT_RUNTIME_ERROR_MARKERS = [
  "aborted",
  "connection closed",
  "connection reset",
  "connection terminated",
  "econnreset",
  "econnrefused",
  "ehostunreach",
  "enotfound",
  "etimedout",
  "fetch failed",
  "headers timeout",
  "network error",
  "networkerror",
  "other side closed",
  "socket hang up",
  "timeout",
  "undici",
] as const;

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTimeoutError(label: string, timeoutMs: number) {
  return new Error(`${label} timed out after ${timeoutMs}ms`);
}

export function isTransientRuntimeError(error: unknown) {
  const normalized = normalizeErrorMessage(error).toLowerCase();

  return TRANSIENT_RUNTIME_ERROR_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

export async function withTransientRetry<T>(
  factory: () => Promise<T>,
  options?: {
    attempts?: number;
    delaysMs?: readonly number[];
  },
) {
  const attempts = Math.max(1, options?.attempts ?? 3);
  const delaysMs = options?.delaysMs ?? DEFAULT_TRANSIENT_RETRY_DELAYS_MS;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;

      if (!isTransientRuntimeError(error) || attempt === attempts - 1) {
        throw error;
      }

      const delayMs =
        delaysMs[Math.min(attempt, delaysMs.length - 1)] ?? delaysMs.at(-1) ?? 0;

      if (delayMs > 0) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(createTimeoutError(label, timeoutMs));
      }, timeoutMs);
    }),
  ]);
}
