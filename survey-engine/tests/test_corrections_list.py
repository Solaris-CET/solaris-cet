"""Tests for corrections list endpoint."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.corrections import log_correction
from src.server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_list_corrections_endpoint(client: TestClient, tmp_path: Path, monkeypatch):
    path = tmp_path / "corrections.jsonl"
    monkeypatch.setattr("src.corrections.corrections_path", lambda custom=None: path)
    log_correction(report_id="SOL-LIST-1", field="verdict", original="A", corrected="B", path=path)

    res = client.get("/corrections?report_id=SOL-LIST-1")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["corrections"][0]["report_id"] == "SOL-LIST-1"