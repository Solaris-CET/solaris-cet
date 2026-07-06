"""Tests for FastAPI survey server."""

from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["service"] == "survey-engine"


def test_demo_generates_pdf(client: TestClient):
    res = client.post("/demo")
    assert res.status_code == 200
    data = res.json()
    assert "report_id" in data
    assert data["score"] > 0
    assert Path(data["pdf_path"]).exists()


def test_generate_with_photo(client: TestClient, tmp_path: Path):
    img = BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 200)
    res = client.post(
        "/generate",
        data={
            "client_name": "Test Client",
            "client_city": "Cluj-Napoca",
            "client_address": "Str 1",
            "client_postal": "400001",
            "roof_type": "tile",
            "roof_orientation": "S",
            "roof_pitch": "35",
            "usable_area_m2": "42",
            "annual_consumption_kwh": "4800",
            "grid_connection": "single-phase",
            "shading_level": "low",
            "existing_solar": "false",
            "premium": "false",
            "installer_id": "INST-TEST",
            "installer_name": "Tester",
        },
        files=[("photos", ("roof.jpg", img, "image/jpeg"))],
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["report_id"]
    assert data["pdf_filename"].endswith(".pdf")
    assert data["score"] > 0
    assert data["installer_id"] == "INST-TEST"


def test_generate_rejects_empty(client: TestClient):
    res = client.post("/generate", data={"client_name": "X"}, files=[])
    assert res.status_code == 422 or res.status_code == 400


def test_batch_endpoint(client: TestClient):
    manifest = '[{"job_id":"b1","client_name":"Batch Client","client_city":"Cluj"}]'
    img = BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 200)
    res = client.post(
        "/batch",
        data={"manifest": manifest},
        files=[("photos", ("b1__roof.jpg", img, "image/jpeg"))],
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total"] == 1
    assert data["succeeded"] == 1
    assert data["results"][0]["job_id"] == "b1"
    assert data["results"][0]["success"] is True


def test_health_includes_cost_budget(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert "cost_budget" in data
    assert "budget_usd" in data["cost_budget"]


def test_jurisdictions_list(client: TestClient):
    res = client.get("/jurisdictions")
    assert res.status_code == 200
    data = res.json()
    assert len(data["jurisdictions"]) > 0
    assert data["jurisdictions"][0]["code"].startswith("RO-")


def test_public_stats(client: TestClient):
    res = client.get("/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_reports" in data
    assert "by_installer" in data