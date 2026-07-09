"""Tests for survey trace jsonl (HARD-005)."""

import json
from pathlib import Path

import pytest

from src import survey_trace


@pytest.fixture(autouse=True)
def isolated_traces(tmp_path, monkeypatch):
    path = tmp_path / "survey_traces.jsonl"
    monkeypatch.setattr(survey_trace, "traces_path", lambda: path)
    yield path


def test_parse_traceparent_valid():
    tid, sid = survey_trace.parse_traceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")
    assert tid == "4bf92f3577b34da6a3ce929d0e0e4736"
    assert sid == "00f067aa0ba902b7"


def test_parse_traceparent_generates_on_missing():
    tid, _ = survey_trace.parse_traceparent(None)
    assert len(tid) == 32


def test_record_and_query_by_report_id(isolated_traces: Path):
    survey_trace.record_span(
        trace_id="abc123",
        span_name="upload",
        duration_ms=12.5,
        report_id="SOL-TEST-1",
    )
    survey_trace.record_span(
        trace_id="abc123",
        span_name="vision",
        duration_ms=200.0,
        report_id="SOL-TEST-1",
        model="kimi",
        input_tokens=100,
    )
    rows = survey_trace.query_traces(report_id="SOL-TEST-1")
    assert len(rows) == 2
    assert rows[0]["span_name"] == "upload"
    summary = survey_trace.trace_summary_for_report("SOL-TEST-1")
    assert summary["trace_id"] == "abc123"
    assert summary["span_count"] == 2
    assert summary["total_duration_ms"] == pytest.approx(212.5)


def test_span_context_manager_records_on_exit(isolated_traces: Path):
    with survey_trace.span("trace-ctx", "pipeline", report_id="SOL-CTX"):
        pass
    rows = survey_trace.query_traces(report_id="SOL-CTX")
    assert len(rows) == 1
    assert rows[0]["span_name"] == "pipeline"
    assert rows[0]["status"] == "ok"