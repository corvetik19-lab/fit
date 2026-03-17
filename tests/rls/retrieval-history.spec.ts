import { expect, test } from "@playwright/test";

import {
  collectPaginatedRows,
  rankKnowledgeChunksByText,
  rankKnowledgeMatchesFromEmbeddingRows,
} from "@/lib/ai/knowledge-retrieval";
import type {
  KnowledgeChunkRow,
  KnowledgeEmbeddingRow,
} from "@/lib/ai/knowledge-model";

function createChunk(id: string, content: string): KnowledgeChunkRow {
  return {
    id,
    source_type: "fixture",
    source_id: id,
    content,
    metadata: {},
  };
}

test.describe("knowledge retrieval history coverage", () => {
  test("pagination helper reads rows beyond the first fresh pages", async () => {
    const rows = Array.from({ length: 625 }, (_, index) => ({ id: `row-${index}` }));

    const loaded = await collectPaginatedRows({
      pageSize: 200,
      fetchPage: async (from, to) => rows.slice(from, to + 1),
    });

    expect(loaded).toHaveLength(625);
    expect(loaded.at(0)?.id).toBe("row-0");
    expect(loaded.at(-1)?.id).toBe("row-624");
  });

  test("text fallback can surface an older relevant chunk from the full history", async () => {
    const chunks = Array.from({ length: 710 }, (_, index) =>
      createChunk(
        `chunk-${index}`,
        index === 709
          ? "История прогресса в приседаниях: три недели подряд рост рабочего веса."
          : `Нерелевантная заметка ${index} про обычный дневник.`,
      ),
    );

    const historicalChunks = await collectPaginatedRows({
      pageSize: 200,
      fetchPage: async (from, to) => chunks.slice(from, to + 1),
    });
    const matches = rankKnowledgeChunksByText(
      historicalChunks,
      "прогресс в приседаниях рабочий вес",
      3,
    );

    expect(matches).not.toHaveLength(0);
    expect(matches[0]?.id).toBe("chunk-709");
  });

  test("vector fallback can rank an older relevant embedding after later pages are loaded", async () => {
    const chunksById = new Map<string, KnowledgeChunkRow>(
      Array.from({ length: 450 }, (_, index) => {
        const id = `vector-${index}`;
        return [
          id,
          createChunk(
            id,
            index === 449
              ? "Старый, но релевантный chunk про восстановление после тяжёлой тренировки."
              : `Обычный нерелевантный chunk ${index}.`,
          ),
        ];
      }),
    );
    const embeddings = await collectPaginatedRows({
      pageSize: 200,
      fetchPage: async (from, to) =>
        Array.from({ length: Math.max(0, Math.min(449, to) - from + 1) }, (_, offset) => {
          const index = from + offset;
          return {
            chunk_id: `vector-${index}`,
            embedding: index === 449 ? [1, 0, 0] : [0, 1, 0],
          } satisfies KnowledgeEmbeddingRow;
        }),
    });
    const matches = rankKnowledgeMatchesFromEmbeddingRows({
      chunksById,
      embeddingRows: embeddings,
      limit: 3,
      queryEmbedding: [1, 0, 0],
    });

    expect(matches).not.toHaveLength(0);
    expect(matches[0]?.id).toBe("vector-449");
  });
});
