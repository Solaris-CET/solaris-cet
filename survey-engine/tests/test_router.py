"""Tests for HARD-004 dynamic router."""

from pathlib import Path

from src.model_router import VisionProvider
from src.router import (
    get_router_stats,
    list_routing_decisions,
    route_survey_job,
    vision_fallback_chain,
)


def test_route_survey_job_logs_decision(tmp_path: Path, monkeypatch):
    decisions_file = tmp_path / "output" / "router_decisions.jsonl"
    monkeypatch.setattr("src.router.decisions_path", lambda: decisions_file)
    monkeypatch.setattr("src.router._correction_rate", lambda: 0.0)

    decision = route_survey_job(4, premium=False, kimi_available=False)
    assert decision.vision == VisionProvider.DEEPSEEK
    rows = list_routing_decisions()
    assert len(rows) == 1
    assert rows[0]["vision"] == decision.vision.value


def test_quality_penalty_prefers_deepseek(tmp_path: Path, monkeypatch):
    decisions_file = tmp_path / "output" / "router_decisions.jsonl"
    monkeypatch.setattr("src.router.decisions_path", lambda: decisions_file)
    monkeypatch.setattr("src.router._correction_rate", lambda: 0.5)

    decision = route_survey_job(6, premium=False, kimi_available=True)
    assert decision.vision == VisionProvider.DEEPSEEK


def test_vision_fallback_chain():
    from src.model_router import route_job

    decision = route_job(12, premium=False, kimi_available=True)
    chain = vision_fallback_chain(
        decision,
        kimi_available=True,
        deepseek_available=True,
    )
    assert chain[0] == decision.vision.value
    assert len(chain) >= 2


def test_router_stats(tmp_path: Path, monkeypatch):
    decisions_file = tmp_path / "output" / "router_decisions.jsonl"
    monkeypatch.setattr("src.router.decisions_path", lambda: decisions_file)
    monkeypatch.setattr("src.router._correction_rate", lambda: 0.1)
    route_survey_job(3, premium=True, kimi_available=False)

    stats = get_router_stats()
    assert stats["decisions_total"] >= 1
    assert "by_vision" in stats
    assert "fallback_chain" in stats