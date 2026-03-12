import { embed, embedMany } from "ai";

import { defaultModels, models } from "@/lib/ai/gateway";
import { serverEnv } from "@/lib/env";

const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_BATCH_SIZE = 96;

type VoyageInputType = "document" | "query";

type VoyageEmbeddingsResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
};

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
    const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
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
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => "");
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

export async function embedQueryText(value: string) {
  if (serverEnv.VOYAGE_API_KEY) {
    const [embedding] = await fetchVoyageEmbeddings([value], "query");
    if (!embedding) {
      throw new Error("Voyage query embedding was empty.");
    }

    return embedding;
  }

  const result = await embed({
    model: models.embeddings,
    value,
  });

  return result.embedding;
}

export async function embedDocumentTexts(values: string[]) {
  if (!values.length) {
    return [] as number[][];
  }

  if (serverEnv.VOYAGE_API_KEY) {
    return fetchVoyageEmbeddings(values, "document");
  }

  const result = await embedMany({
    model: models.embeddings,
    values,
  });

  return result.embeddings;
}
