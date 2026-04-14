import { embed, embedMany } from "ai";

import { defaultModels, models } from "@/lib/ai/gateway";
import { serverEnv } from "@/lib/env";
import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";
import { withTransientRetry } from "@/lib/runtime-retry";

const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_BATCH_SIZE = 96;
const EMBEDDINGS_PROVIDER_COOLDOWN_MS = 10 * 60 * 1000;

const embeddingsProviderCooldownUntil = {
  gateway: 0,
  voyage: 0,
};

type VoyageInputType = "document" | "query";

type VoyageEmbeddingsResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
};

function isProviderOnCooldown(provider: keyof typeof embeddingsProviderCooldownUntil) {
  return embeddingsProviderCooldownUntil[provider] > Date.now();
}

function markProviderOnCooldown(
  provider: keyof typeof embeddingsProviderCooldownUntil,
) {
  embeddingsProviderCooldownUntil[provider] =
    Date.now() + EMBEDDINGS_PROVIDER_COOLDOWN_MS;
}

async function fetchVoyageEmbeddings(
  values: string[],
  inputType: VoyageInputType,
) {
  if (!serverEnv.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not configured.");
  }

  const embeddings: number[][] = [];

  for (let index = 0; index < values.length; index += VOYAGE_BATCH_SIZE) {
    const batch = values.slice(index, index + VOYAGE_BATCH_SIZE);
    const response = await withTransientRetry(() =>
      fetch(VOYAGE_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serverEnv.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          input: batch,
          input_type: inputType,
          model: defaultModels.voyageEmbeddings,
          truncation: true,
        }),
      }),
    );

    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        markProviderOnCooldown("voyage");
      }
      throw new Error(
        `Voyage embeddings request failed with ${response.status}: ${payload}`,
      );
    }

    const payload = (await response.json()) as VoyageEmbeddingsResponse;
    const batchEmbeddings = (payload.data ?? [])
      .map((item) => item.embedding ?? [])
      .filter((embedding) => embedding.length > 0);

    if (batchEmbeddings.length !== batch.length) {
      throw new Error("Voyage embeddings response length mismatch.");
    }

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

function hasGatewayEmbeddingsFallback() {
  return Boolean(serverEnv.AI_GATEWAY_API_KEY);
}

async function fetchGatewayQueryEmbedding(value: string) {
  const result = await withTransientRetry(() =>
    embed({
      model: models.embeddings,
      value,
    }),
  );

  return result.embedding;
}

async function fetchGatewayDocumentEmbeddings(values: string[]) {
  const result = await withTransientRetry(() =>
    embedMany({
      model: models.embeddings,
      values,
    }),
  );

  return result.embeddings;
}

export async function embedQueryText(value: string) {
  let lastError: unknown = null;

  if (serverEnv.VOYAGE_API_KEY && !isProviderOnCooldown("voyage")) {
    try {
      const [embedding] = await fetchVoyageEmbeddings([value], "query");
      if (!embedding) {
        throw new Error("Voyage query embedding was empty.");
      }

      return embedding;
    } catch (error) {
      lastError = error;
      if (!hasGatewayEmbeddingsFallback()) {
        throw error;
      }
    }
  }

  if (hasGatewayEmbeddingsFallback() && !isProviderOnCooldown("gateway")) {
    try {
      return await fetchGatewayQueryEmbedding(value);
    } catch (error) {
      lastError = error;

      if (isAiProviderConfigurationFailure(error)) {
        markProviderOnCooldown("gateway");
      }
    }
  }

  throw lastError ?? new Error("Embeddings runtime is unavailable.");
}

export async function embedDocumentTexts(values: string[]) {
  if (!values.length) {
    return [] as number[][];
  }

  let lastError: unknown = null;

  if (serverEnv.VOYAGE_API_KEY && !isProviderOnCooldown("voyage")) {
    try {
      return await fetchVoyageEmbeddings(values, "document");
    } catch (error) {
      lastError = error;
      if (!hasGatewayEmbeddingsFallback()) {
        throw error;
      }
    }
  }

  if (hasGatewayEmbeddingsFallback() && !isProviderOnCooldown("gateway")) {
    try {
      return await fetchGatewayDocumentEmbeddings(values);
    } catch (error) {
      lastError = error;

      if (isAiProviderConfigurationFailure(error)) {
        markProviderOnCooldown("gateway");
      }
    }
  }

  throw lastError ?? new Error("Embeddings runtime is unavailable.");
}
