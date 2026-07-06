"""Tests for digital twin feed."""

import json
from pathlib import Path

from src.ahj_export import export_ahj_json
from src.models import get_sample_survey
from src.report_registry import ReportRegistry
from src.twin_feed import SCHEMA_ID, build_twin_feed


def test_build_twin_feed(tmp_path: Path):
    survey = get_sample_survey()
    out = tmp_path / "output"
    out.mkdir()
    pdf = out / "test.pdf"
    pdf.write_bytes(b"%PDF")
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    reg = ReportRegistry(index_path=out / "reports_index.jsonl")
    reg.register(survey, pdf, ahj, installer_id="INST-TWIN")

    feed = build_twin_feed(survey.metadata.report_id, registry=reg, platform_base_url="https://t.test")
    assert feed["schema"] == SCHEMA_ID
    assert feed["report_id"] == survey.metadata.report_id
    assert feed["system"]["capacity_kwp"] > 0
    assert "explainable" in feed
    assert feed["crm"]["context_url"].startswith("https://t.test")