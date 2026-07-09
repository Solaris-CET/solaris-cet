"""Tests for per-run cost attribution."""

import json
from pathlib import Path

from src.cost_attribution import line_count, summarize_usage_delta


def test_summarize_usage_delta(tmp_path: Path, monkeypatch):
    usage_file = tmp_path / "api_usage.jsonl"
    monkeypatch.setattr("src.cost_attribution.usage_log_path", lambda: usage_file)
    usage_file.write_text(
        json.dumps({"provider": "deepseek", "model": "deepseek-v4-pro", "input_tokens": 10, "output_tokens": 5, "cost_usd": 0.01})
        + "\n",
        encoding="utf-8",
    )
    before = line_count(usage_file)
    with usage_file.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({
            "provider": "deepseek",
            "model": "deepseek-v4-pro",
            "input_tokens": 100,
            "output_tokens": 50,
            "cost_usd": 0.05,
        }) + "\n")
    summary = summarize_usage_delta(before, path=usage_file)
    assert summary["cost_usd"] == 0.05
    assert summary["input_tokens"] == 100
    assert summary["output_tokens"] == 50
    assert summary["call_count"] == 1