"""Tests for API cost logger."""

import json
from pathlib import Path

from src.api_clients.cost_logger import CostLogger, UsageRecord


def test_log_appends_jsonl(tmp_path: Path):
    log_path = tmp_path / "usage.jsonl"
    logger = CostLogger(log_path=log_path)
    logger.log(
        UsageRecord(
            provider="anthropic",
            model="claude-sonnet",
            input_tokens=1000,
            output_tokens=500,
            cost_usd=0.012,
            report_id="SOL-1",
        )
    )
    lines = log_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    row = json.loads(lines[0])
    assert row["provider"] == "anthropic"
    assert row["cost_usd"] == 0.012


def test_total_cost_sums_entries(tmp_path: Path):
    log_path = tmp_path / "usage.jsonl"
    logger = CostLogger(log_path=log_path)
    logger.log(UsageRecord(provider="a", model="m1", cost_usd=0.01))
    logger.log(UsageRecord(provider="b", model="m2", cost_usd=0.02))
    assert abs(logger.total_cost() - 0.03) < 1e-9


def test_total_cost_empty_file(tmp_path: Path):
    logger = CostLogger(log_path=tmp_path / "missing.jsonl")
    assert logger.total_cost() == 0.0