from __future__ import annotations

from openai import AsyncOpenAI
from ragas.embeddings.base import BaseRagasEmbedding
from ragas.llms import llm_factory
from voyageai import AsyncClient as AsyncVoyageClient
from voyageai import Client as VoyageClient

from .config import EvalRuntimeConfig, require_value


class VoyageRagasEmbedding(BaseRagasEmbedding):
  def __init__(
    self,
    model: str,
    sync_client: VoyageClient,
    async_client: AsyncVoyageClient,
  ):
    super().__init__()
    self.model = model
    self.sync_client = sync_client
    self.async_client = async_client

  def embed_text(self, text: str, **kwargs) -> list[float]:
    input_type = kwargs.get("input_type", "query")
    response = self.sync_client.embed(
      [text],
      input_type=input_type,
      model=self.model,
      truncation=True,
    )
    return response.embeddings[0]

  async def aembed_text(self, text: str, **kwargs) -> list[float]:
    input_type = kwargs.get("input_type", "query")
    response = await self.async_client.embed(
      [text],
      input_type=input_type,
      model=self.model,
      truncation=True,
    )
    return response.embeddings[0]

  def embed_texts(self, texts: list[str], **kwargs) -> list[list[float]]:
    input_type = kwargs.get("input_type", "document")
    response = self.sync_client.embed(
      texts,
      input_type=input_type,
      model=self.model,
      truncation=True,
    )
    return list(response.embeddings)

  async def aembed_texts(self, texts: list[str], **kwargs) -> list[list[float]]:
    input_type = kwargs.get("input_type", "document")
    response = await self.async_client.embed(
      texts,
      input_type=input_type,
      model=self.model,
      truncation=True,
    )
    return list(response.embeddings)


def build_eval_llm(
  config: EvalRuntimeConfig,
  model_override: str | None = None,
):
  api_key = require_value(config.openrouter_api_key, "OPENROUTER_API_KEY")
  headers = {
    header_name: header_value
    for header_name, header_value in {
      "HTTP-Referer": config.openrouter_site_url,
      "X-Title": config.openrouter_app_name,
    }.items()
    if header_value
  }
  client = AsyncOpenAI(
    api_key=api_key,
    base_url=config.openrouter_base_url,
    default_headers=headers or None,
  )
  model_name = model_override or config.openrouter_chat_model

  return llm_factory(model_name, provider="openai", client=client)


def build_eval_embeddings(config: EvalRuntimeConfig) -> VoyageRagasEmbedding:
  api_key = require_value(config.voyage_api_key, "VOYAGE_API_KEY")

  return VoyageRagasEmbedding(
    model=config.voyage_embedding_model,
    sync_client=VoyageClient(api_key=api_key),
    async_client=AsyncVoyageClient(api_key=api_key),
  )
