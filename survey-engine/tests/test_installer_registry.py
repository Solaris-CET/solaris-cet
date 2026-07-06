"""Tests for installer registry aggregate."""

import json
from pathlib import Path

from src.ahj_export import export_ahj_json
from src.installer_registry import aggregate_installers, get_installer_profile
from src.models import get_sample_survey
from src.report_registry import ReportRegistry


def _register(tmp_path: Path, installer_id: str) -> str:
    survey = get_sample_survey()
    survey.metadata.report_id = f"SOL-{installer_id}"
    out = tmp_path / "output"
    out.mkdir(parents=True, exist_ok=True)
    pdf = out / f"{survey.metadata.report_id}.pdf"
    pdf.write_bytes(b"%PDF")
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    reg = ReportRegistry(index_path=out / "reports_index.jsonl")
    reg.register(survey, pdf, ahj, installer_id=installer_id)
    return survey.metadata.report_id


def test_aggregate_installers(tmp_path: Path, monkeypatch):
    monkeypatch.delenv("INSTALLER_API_KEYS", raising=False)
    out = tmp_path / "output"
    out.mkdir(parents=True, exist_ok=True)
    reg = ReportRegistry(index_path=out / "reports_index.jsonl")
    _register(tmp_path, "INST-A")
    _register(tmp_path, "INST-B")

    rows = aggregate_installers(registry=reg)
    ids = {r["installer_id"] for r in rows}
    assert "INST-A" in ids
    assert "INST-B" in ids
    inst_a = next(r for r in rows if r["installer_id"] == "INST-A")
    assert inst_a["report_count"] == 1
    assert inst_a["total_capacity_kwp"] > 0


def test_get_installer_profile(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("INSTALLER_API_KEYS", json.dumps({"INST-A": "secret"}))
    out = tmp_path / "output"
    out.mkdir(parents=True, exist_ok=True)
    reg = ReportRegistry(index_path=out / "reports_index.jsonl")
    report_id = _register(tmp_path, "INST-A")

    profile = get_installer_profile("INST-A", registry=reg)
    assert profile["installer_id"] == "INST-A"
    assert profile["report_count"] == 1
    assert profile["api_key_configured"] is True
    assert profile["recent_reports"][0]["report_id"] == report_id
    assert "by_month" in profile["stats"]