"""Aggregate per-run API usage from shared api_usage.jsonl."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.models import project_root


def usage_log_path() -> Path:
    return project_root() / "output" / "api_usage.jsonl"


def line_count(path: Path | None = None) -> int:
    target = path or usage_log_path()
    if not target.exists():
        return 0
    return sum(1 for line in target.read_text(encoding="utf-8").splitlines() if line.strip())


def summarize_usage_delta(line_before: int, *, path: Path | None = None) -> dict[str, Any]:
    """Summarize usage records appended after line_before."""
    target = path or usage_log_path()
    if not target.exists():
        return _empty_summary()
    rows: list[dict[str, Any]] = []
    for i, line in enumerate(target.read_text(encoding="utf-8").splitlines()):
        if i < line_before or not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    if not rows:
        return _empty_summary()

    input_tokens = sum(int(r.get("input_tokens") or 0) for r in rows)
    output_tokens = sum(int(r.get("output_tokens") or 0) for r in rows)
    cost_usd = round(sum(float(r.get("cost_usd") or 0) for r in rows), 4)
    models = sorted({str(r.get("model") or "") for r in rows if r.get("model")})
    vision_calls = sum(1 for r in rows if "vision" in str(r.get("model", "")).lower() or r.get("provider") in ("deepseek", "kimi"))
    if vision_calls == 0:
        vision_calls = sum(1 for r in rows if r.get("provider") in ("deepseek", "kimi"))

    return {
        "cost_usd": cost_usd,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "vision_calls": vision_calls,
        "model_used": ",".join(models) if models else "",
        "call_count": len(rows),
    }


def _empty_summary() -> dict[str, Any]:
    return {
        "cost_usd": 0.0,
        "input_tokens": 0,
        "output_tokens": 0,
        "vision_calls": 0,
        "model_used": "",
        "call_count": 0,
    }