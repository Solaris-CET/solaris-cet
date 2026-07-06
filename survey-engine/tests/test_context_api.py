"""Tests for unified context API."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.ahj_export import export_ahj_json
from src.context_api import build_report_context
from src.models import get_sample_survey
from src.report_registry import ReportRegistry
from src.server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_build_report_context_from_registry(tmp_path: Path):
    survey = get_sample_survey()
    out = tmp_path / "output"
    out.mkdir()
    pdf = out / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4")
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    index = out / "reports_index.jsonl"
    reg = ReportRegistry(index_path=index)
    reg.register(survey, pdf, ahj, cost_usd=0.12, routing="demo", installer_id="INST-1")

    ctx = build_report_context(survey.metadata.report_id, registry=reg, platform_base_url="https://test.local")
    assert ctx["schema"] == "solaris-context-v1"
    assert ctx["report"]["client_name"] == survey.client.name
    assert ctx["jurisdiction"]["code"] is None or isinstance(ctx["jurisdiction"]["code"], str)
    assert ctx["cost"]["api_usd"] == 0.12
    assert "crm" in ctx and ctx["crm"]["lead_search_key"] == survey.metadata.report_id
    assert ctx["files"]["pdf_url"].startswith("https://test.local/api/survey/files")
    assert len(ctx["explainable"]["findings"]) >= 1


def test_context_endpoint_404(client: TestClient):
    res = client.get("/context/SOL-NONEXISTENT-999")
    assert res.status_code == 404


def test_context_endpoint_after_demo(client: TestClient):
    demo = client.post("/demo")
    assert demo.status_code == 200
    report_id = demo.json()["report_id"]
    res = client.get(f"/context/{report_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["report_id"] == report_id
    assert "cost" in data
    assert "crm" in data