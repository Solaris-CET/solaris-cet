"""Tests for twin AI agent over twin feed + orchestration."""

from pathlib import Path

import pytest

from src.ahj_export import export_ahj_json
from src.models import get_sample_survey
from src.report_registry import ReportRegistry
from src.twin_agent import (
    ACTION_TYPES,
    SCHEMA_ID,
    build_twin_agent_plan,
    execute_agent_action,
    list_agent_decisions,
    publish_agent_plan,
    publish_agent_reassess,
)


def _seed_report(tmp_path: Path) -> str:
    survey = get_sample_survey()
    out = tmp_path / "output"
    out.mkdir(parents=True, exist_ok=True)
    pdf = out / f"{survey.metadata.report_id}.pdf"
    pdf.write_bytes(b"%PDF")
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    ReportRegistry(index_path=out / "reports_index.jsonl").register(
        survey, pdf, ahj, installer_id="INST-AG",
    )
    return survey.metadata.report_id


def test_build_twin_agent_plan(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.setenv("TWIN_WEBHOOK_URL", "")
    monkeypatch.setattr("src.models.project_root", lambda: tmp_path)
    report_id = _seed_report(tmp_path)

    plan = build_twin_agent_plan(report_id, platform_base_url="https://test.local")
    assert plan["schema"] == SCHEMA_ID
    assert plan["actions_total"] >= 2
    types = {a["type"] for a in plan["actions"]}
    assert "suggest_contact" in types
    assert plan["recommended_next"]


def test_execute_agent_action(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.setenv("TWIN_WEBHOOK_URL", "")

    result = execute_agent_action(
        "SOL-AG-1",
        action_id="act-crm",
        action_type="suggest_crm",
        payload={"executed_by": "test"},
    )
    assert result["ok"] is True
    decisions = list_agent_decisions("SOL-AG-1")
    assert len(decisions) == 1
    assert decisions[0]["event_type"] == "agent_action"


def test_publish_agent_plan_and_reassess(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.setenv("TWIN_WEBHOOK_URL", "")
    monkeypatch.setattr("src.models.project_root", lambda: tmp_path)
    report_id = _seed_report(tmp_path)

    plan = publish_agent_plan(report_id)
    assert plan["report_id"] == report_id
    publish_agent_reassess(report_id, reason="test")
    rows = list_agent_decisions(report_id)
    event_types = {r["event_type"] for r in rows}
    assert "agent_plan_ready" in event_types
    assert "agent_reassess" in event_types


def test_unknown_action_type():
    with pytest.raises(ValueError, match="Unknown agent action type"):
        execute_agent_action("SOL-X", action_id="x", action_type="invalid_type")


def test_action_types_frozen():
    assert "suggest_crm" in ACTION_TYPES
    assert "refresh_twin" in ACTION_TYPES