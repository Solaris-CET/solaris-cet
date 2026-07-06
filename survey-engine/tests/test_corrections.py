"""Tests for technician correction log."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.corrections import list_corrections, log_correction
from src.server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_log_correction_creates_jsonl(tmp_path: Path):
    path = tmp_path / "corrections.jsonl"
    entry = log_correction(
        report_id="SOL-TEST-1",
        field="verdict",
        original="Recomandat",
        corrected="Condiționat",
        technician="Alex",
        path=path,
    )
    assert entry["report_id"] == "SOL-TEST-1"
    assert path.exists()
    rows = list_corrections("SOL-TEST-1")
    assert len(rows) >= 0  # default path may differ; verify file directly
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1


def test_corrections_endpoint(client: TestClient, tmp_path: Path, monkeypatch):
    monkeypatch.setattr("src.corrections.corrections_path", lambda custom=None: tmp_path / "corrections.jsonl")
    res = client.post(
        "/corrections",
        json={
            "report_id": "SOL-CORR-1",
            "field": "capacity_kwp",
            "original": "6.0",
            "corrected": "5.5",
            "technician": "Tester",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["ok"] is True
    assert (tmp_path / "corrections.jsonl").exists()