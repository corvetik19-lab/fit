function normalizeSiteUrl(candidate: string | undefined): URL | null {
  const trimmed = candidate?.trim();

  if (!trimmed) {
    return null;
  }

  const normalized =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

export function resolveSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeSiteUrl(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return new URL("http://localhost:3000");
}
