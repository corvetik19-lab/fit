const AI_PROVIDER_CONFIGURATION_MARKERS = [
  "credit card",
  "customer_verification_required",
  "insufficient credits",
  "more credits",
  "payment required",
  "quota",
  "billing",
  "can only afford",
  "ai gateway requires",
  "\"code\":402",
];

export function stringifyAiRuntimeError(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
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

export function isAiProviderConfigurationFailure(error: unknown) {
  const normalized = stringifyAiRuntimeError(error).toLowerCase();

  return AI_PROVIDER_CONFIGURATION_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}
