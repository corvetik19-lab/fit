import nextEnv from "@next/env";
import { embed } from "ai";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_CHAT_MODEL = "google/gemini-3.1-pro-preview";
const DEFAULT_GATEWAY_EMBEDDING_MODEL = "voyage/voyage-3-large";
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

async function verifyGatewayEmbeddings() {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  try {
    const result = await embed({
      model: DEFAULT_GATEWAY_EMBEDDING_MODEL,
      value: "runtime preflight",
    });

    if (!Array.isArray(result.embedding) || result.embedding.length === 0) {
      return "AI Gateway embeddings returned an empty vector";
    }

    return null;
  } catch (error) {
    return `AI Gateway embeddings failed: ${
      error instanceof Error ? trimText(error.message) : trimText(String(error))
    }`;
  }
}

export async function runAiRuntimePreflight() {
  const failures = [];
  const warnings = [];

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

  const hasVoyage = Boolean(process.env.VOYAGE_API_KEY?.trim());
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());

  if (hasVoyage) {
    try {
      const voyageFailure = await verifyVoyage();
      if (voyageFailure) {
        if (hasGateway) {
          const gatewayFailure = await verifyGatewayEmbeddings();
          if (gatewayFailure) {
            warnings.push(
              `Embeddings runtime unavailable; retrieval will run in text-only mode: ${voyageFailure}; ${gatewayFailure}`,
            );
          } else {
            warnings.push(
              `Voyage direct embeddings unavailable, using AI Gateway fallback: ${voyageFailure}`,
            );
          }
        } else {
          warnings.push(
            `Voyage direct embeddings unavailable; retrieval will run in text-only mode: ${voyageFailure}`,
          );
        }
      }
    } catch (error) {
      const message = `Voyage preflight failed: ${
        error instanceof Error ? error.message : String(error)
      }`;

      if (hasGateway) {
        const gatewayFailure = await verifyGatewayEmbeddings();
        if (gatewayFailure) {
          warnings.push(
            `Embeddings runtime unavailable; retrieval will run in text-only mode: ${message}; ${gatewayFailure}`,
          );
        } else {
          warnings.push(
            `Voyage direct embeddings unavailable, using AI Gateway fallback: ${message}`,
          );
        }
      } else {
        warnings.push(
          `Voyage direct embeddings unavailable; retrieval will run in text-only mode: ${message}`,
        );
      }
    }
  } else if (hasGateway) {
    const gatewayFailure = await verifyGatewayEmbeddings();
    if (gatewayFailure) {
      warnings.push(
        `AI Gateway embeddings unavailable; retrieval will run in text-only mode: ${gatewayFailure}`,
      );
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
  };
}
