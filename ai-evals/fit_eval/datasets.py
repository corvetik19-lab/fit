from __future__ import annotations

import json
from pathlib import Path

from ragas.dataset_schema import EvaluationDataset, MultiTurnSample, SingleTurnSample
from ragas.messages import AIMessage, HumanMessage, ToolCall, ToolMessage


def _read_jsonl(path: Path) -> list[dict]:
  rows: list[dict] = []
  with path.open("r", encoding="utf-8") as handle:
    for raw_line in handle:
      line = raw_line.strip()
      if not line:
        continue
      rows.append(json.loads(line))
  return rows


def _parse_tool_call(payload: dict) -> ToolCall:
  return ToolCall(
    name=str(payload["name"]),
    args=dict(payload.get("args") or {}),
  )


def _parse_message(payload: dict):
  message_type = payload["type"]
  metadata = payload.get("metadata")

  if message_type == "human":
    return HumanMessage(content=str(payload["content"]), metadata=metadata)

  if message_type == "tool":
    return ToolMessage(content=str(payload["content"]), metadata=metadata)

  if message_type == "ai":
    tool_calls = payload.get("tool_calls") or []
    return AIMessage(
      content=str(payload.get("content", "")),
      metadata=metadata,
      tool_calls=[_parse_tool_call(item) for item in tool_calls],
    )

  raise ValueError(f"Unsupported message type: {message_type}")


def _build_single_turn_sample(payload: dict) -> SingleTurnSample:
  sample_payload = {
    key: payload.get(key)
    for key in SingleTurnSample.model_fields
    if key in payload
  }
  return SingleTurnSample(**sample_payload)


def _build_multi_turn_sample(payload: dict) -> MultiTurnSample:
  return MultiTurnSample(
    user_input=[_parse_message(item) for item in payload["user_input"]],
    reference=payload.get("reference"),
    reference_tool_calls=[
      _parse_tool_call(item) for item in payload.get("reference_tool_calls") or []
    ]
    or None,
    rubrics=payload.get("rubrics"),
    reference_topics=payload.get("reference_topics"),
  )


def load_evaluation_dataset(path: Path) -> EvaluationDataset:
  rows = _read_jsonl(path)
  samples = []

  for payload in rows:
    kind = payload.get("kind", "single_turn")
    if kind == "multi_turn":
      samples.append(_build_multi_turn_sample(payload))
      continue

    samples.append(_build_single_turn_sample(payload))

  return EvaluationDataset(samples=samples, name=path.stem)
