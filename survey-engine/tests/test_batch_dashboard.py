"""Tests for batch processor and dashboard."""

import json
from pathlib import Path

from src.batch_processor import BatchJob, load_manifest_json, parse_upload_photo_key, run_batch
from src.dashboard import get_dashboard_data, format_dashboard_markdown
from src.models import get_sample_survey
from src.report_registry import ReportRegistry
from src.pipeline import run_pipeline, default_checklist


def test_parse_upload_photo_key():
    assert parse_upload_photo_key("site1__roof.jpg") == ("site1", "roof.jpg")
    assert parse_upload_photo_key("site2/panel.png") == ("site2", "panel.png")
    assert parse_upload_photo_key("plain.jpg") is None


def test_batch_json_manifest(tmp_path: Path):
    photos = tmp_path / "photos"
    photos.mkdir()
    (photos / "roof.jpg").write_bytes(b"\xff\xd8\xff" + b"\x00" * 50)
    manifest = tmp_path / "jobs.json"
    manifest.write_text(json.dumps([{
        "job_id": "test-1",
        "photos_dir": str(photos),
        "client_name": "Test Client",
        "client_city": "Cluj",
    }]), encoding="utf-8")
    jobs = load_manifest_json(manifest)
    assert len(jobs) == 1
    assert jobs[0].job_id == "test-1"


def test_batch_run(tmp_path: Path):
    photos = tmp_path / "site1"
    photos.mkdir()
    (photos / "a.jpg").write_bytes(b"\xff\xd8\xff" + b"\x00" * 50)
    jobs = [BatchJob(job_id="s1", photos_dir=str(photos), client_name="A")]
    summary = run_batch(jobs, output_dir=tmp_path / "out")
    assert summary.succeeded == 1
    assert summary.results[0].pdf_path


def test_dashboard_with_registry(tmp_path: Path):
    reg = ReportRegistry(index_path=tmp_path / "index.jsonl")
    survey = get_sample_survey()
    reg.register(survey, tmp_path / "r.pdf", cost_usd=0.05, routing="test", installer_id="INST-A")
    data = get_dashboard_data(registry=reg)
    assert data["stats"]["total_reports"] == 1
    assert data["stats"]["by_installer"]["INST-A"] == 1
    md = format_dashboard_markdown(data)
    assert "Dashboard" in md


def test_pipeline_exports_ahj(tmp_path: Path):
    photo = tmp_path / "p.jpg"
    photo.write_bytes(b"\xff\xd8\xff" + b"\x00" * 50)
    result = run_pipeline(
        photo_paths=[photo],
        client_name="T", client_address="A", client_city="C", client_postal="1",
        client_phone="", client_email="", technician_name="X",
        roof_type="tile", roof_orientation="S", roof_pitch=35,
        usable_area_m2=42, annual_consumption_kwh=4800,
        grid_connection="single-phase", shading_level="low",
        existing_solar=False, structural_notes="",
        checklist=default_checklist(),
        output_dir=tmp_path / "out",
    )
    assert result.ahj_path.exists()
    assert result.pdf_path.exists()