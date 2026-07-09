"""Tests for twin runtime event log + SSE."""

import json
from pathlib import Path

from src.ahj_export import export_ahj_json
from src.models import get_sample_survey
from src.report_registry import ReportRegistry
from src.twin_runtime import (
    EVENT_SCHEMA,
    list_twin_events,
    publish_twin_event,
    replay_twin_events,
    runtime_status,
)


def _seed_report(tmp_path: Path) -> str:
    survey = get_sample_survey()
    out = tmp_path / "output"
    out.mkdir(parents=True, exist_ok=True)
    pdf = out / f"{survey.metadata.report_id}.pdf"
    pdf.write_bytes(b"%PDF")
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    ReportRegistry(index_path=out / "reports_index.jsonl").register(
        survey, pdf, ahj, installer_id="INST-RT",
    )
    return survey.metadata.report_id


def test_publish_and_list_events(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    report_id = "SOL-RT-1"
    ev = publish_twin_event(report_id, "report_generated", payload={"score": 88})
    assert ev["schema"] == EVENT_SCHEMA
    assert ev["event_type"] == "report_generated"
    rows = list_twin_events(report_id)
    assert len(rows) == 1
    assert rows[0]["payload"]["score"] == 88


def test_replay_from_seq(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    publish_twin_event("SOL-R1", "twin_ready")
    publish_twin_event("SOL-R1", "report_generated", payload={"n": 1})
    publish_twin_event("SOL-R2", "twin_ready")
    replayed = replay_twin_events(from_seq=1, report_id="SOL-R1")
    assert len(replayed) == 1
    assert replayed[0]["event_type"] == "report_generated"
    assert replayed[0]["seq"] == 2
    all_after_zero = replay_twin_events(from_seq=0)
    assert len(all_after_zero) == 3
    assert all_after_zero[0]["seq"] == 1


def test_runtime_status(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    publish_twin_event("SOL-A", "twin_ready")
    publish_twin_event("SOL-B", "twin_ready")
    status = runtime_status()
    assert status["events_total"] == 2
    assert status["sse_supported"] is True


def test_sse_stream_snapshot(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.models.project_root", lambda: tmp_path)
    report_id = _seed_report(tmp_path)
    publish_twin_event(report_id, "report_generated", payload={"source": "test"})
    from src.twin_runtime import iter_sse_stream

    chunks = list(iter_sse_stream(report_id))
    joined = "".join(chunks)
    assert "event: snapshot" in joined
    assert "event: ready" in joined
    assert report_id in joined


def test_persistent_stream_initial_burst(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: tmp_path / "output" / "deliveries.jsonl")
    monkeypatch.setenv("TWIN_WEBHOOK_URL", "")
    monkeypatch.setattr("src.models.project_root", lambda: tmp_path)
    report_id = _seed_report(tmp_path)
    from src.twin_runtime import iter_sse_persistent_stream

    chunks: list[str] = []
    for i, frame in enumerate(
        iter_sse_persistent_stream(report_id, poll_seconds=0.05, heartbeat_seconds=0.1),
    ):
        chunks.append(frame)
        joined = "".join(chunks)
        if "event: ready" in joined:
            break
        if i > 80:
            break
    joined = "".join(chunks)
    assert "event: snapshot" in joined
    assert "event: ready" in joined