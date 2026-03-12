from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
AI_EVALS_DIR = ROOT_DIR / "ai-evals"
DATASETS_DIR = AI_EVALS_DIR / "datasets"
OUTPUT_DIR = AI_EVALS_DIR / "output"

for candidate in (
  ROOT_DIR / ".env.local",
  ROOT_DIR / ".env",
  AI_EVALS_DIR / ".env",
):
  if candidate.exists():
    load_dotenv(candidate, override=False)


def _read_env(name: str, default: str | None = None) -> str | None:
  value = os.getenv(name)
  if value is None:
    return default

  normalized = value.strip()
  return normalized or default


@dataclass(frozen=True)
class EvalRuntimeConfig:
  openrouter_api_key: str | None
  openrouter_app_name: str | None
  openrouter_base_url: str
  openrouter_chat_model: str
  openrouter_site_url: str | None
  supabase_service_role_key: str | None
  supabase_url: str | None
  voyage_api_key: str | None
  voyage_embedding_model: str


def load_runtime_config() -> EvalRuntimeConfig:
  return EvalRuntimeConfig(
    openrouter_api_key=_read_env("OPENROUTER_API_KEY"),
    openrouter_app_name=_read_env("OPENROUTER_APP_NAME", "fit"),
    openrouter_base_url=_read_env(
      "OPENROUTER_BASE_URL",
      "https://openrouter.ai/api/v1",
    )
    or "https://openrouter.ai/api/v1",
    openrouter_chat_model=_read_env(
      "OPENROUTER_CHAT_MODEL",
      "google/gemini-3.1-pro-preview",
    )
    or "google/gemini-3.1-pro-preview",
    openrouter_site_url=_read_env("OPENROUTER_SITE_URL"),
    supabase_service_role_key=_read_env("SUPABASE_SERVICE_ROLE_KEY"),
    supabase_url=_read_env("NEXT_PUBLIC_SUPABASE_URL"),
    voyage_api_key=_read_env("VOYAGE_API_KEY"),
    voyage_embedding_model=_read_env(
      "VOYAGE_EMBEDDING_MODEL",
      "voyage-3-large",
    )
    or "voyage-3-large",
  )


def require_value(value: str | None, env_name: str) -> str:
  if value:
    return value

  raise RuntimeError(f"Environment variable {env_name} is required.")
