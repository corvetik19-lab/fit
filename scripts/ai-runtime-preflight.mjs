import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_CHAT_MODEL = "google/gemini-3.1-pro-preview";
const DEFAULT_VOYAGE_EMBEDDING_MODEL = "voyage-3-large";
const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";

function trimText(value, maxLength = 240) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

async function requestWithTimeout(url, init, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function verifyOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const baseUrl =
    process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL;
  const chatModel =
    process.env.OPENROUTER_CHAT_MODEL?.trim() || DEFAULT_OPENROUTER_CHAT_MODEL;

  const response = await requestWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(process.env.OPENROUTER_SITE_URL?.trim()
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL.trim() }
        : {}),
      ...(process.env.OPENROUTER_APP_NAME?.trim()
        ? { "X-Title": process.env.OPENROUTER_APP_NAME.trim() }
        : {}),
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        {
          role: "user",
          content: "Ping",
        },
      ],
      max_tokens: 1,
      temperature: 0,
    }),
  });

  if (response.ok) {
    return null;
  }

  const payload = trimText(await response.text().catch(() => ""));
  return `OpenRouter ${response.status}${payload ? `: ${payload}` : ""}`;
}

async function verifyVoyage() {
  const apiKey = process.env.VOYAGE_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const model =
    process.env.VOYAGE_EMBEDDING_MODEL?.trim() || DEFAULT_VOYAGE_EMBEDDING_MODEL;
  const response = await requestWithTimeout(VOYAGE_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: ["runtime preflight"],
      input_type: "query",
      model,
      truncation: true,
    }),
  });

  if (response.ok) {
    return null;
  }

  const payload = trimText(await response.text().catch(() => ""));
  return `Voyage ${response.status}${payload ? `: ${payload}` : ""}`;
}

export async function runAiRuntimePreflight() {
  const failures = [];

  try {
    const openRouterFailure = await verifyOpenRouter();
    if (openRouterFailure) {
      failures.push(openRouterFailure);
    }
  } catch (error) {
    failures.push(
      `OpenRouter preflight failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    const voyageFailure = await verifyVoyage();
    if (voyageFailure) {
      failures.push(voyageFailure);
    }
  } catch (error) {
    failures.push(
      `Voyage preflight failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return {
    ok: failures.length === 0,
    failures,
  };
}
