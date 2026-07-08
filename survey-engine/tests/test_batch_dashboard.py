"""Tests for batch processor and dashboard."""

import json
from pathlib import Path

from src.batch_processor import (
    BATCH_VERSION,
    BatchJob,
    load_manifest,
    load_manifest_csv,
    load_manifest_json,
    parse_upload_photo_key,
    run_batch,
    run_batch_uploaded,
)
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


def test_batch_csv_manifest(tmp_path: Path):
    manifest = tmp_path / "jobs.csv"
    manifest.write_text(
        "job_id,photos_dir,client_name,client_city,premium\n"
        f"csv-1,{tmp_path / 'photos'},CSV Client,Cluj,true\n",
        encoding="utf-8",
    )
    photos = tmp_path / "photos"
    photos.mkdir()
    (photos / "roof.jpg").write_bytes(b"\xff\xd8\xff" + b"\x00" * 50)
    jobs = load_manifest_csv(manifest)
    assert len(jobs) == 1
    assert jobs[0].job_id == "csv-1"
    assert jobs[0].premium is True
    assert load_manifest(manifest)[0].client_name == "CSV Client"


def test_run_batch_uploaded_missing_photos(tmp_path: Path):
    jobs = [BatchJob(job_id="empty", client_name="No Photos")]
    summary = run_batch_uploaded(jobs, photos_by_job={}, output_dir=tmp_path / "out")
    assert summary.failed == 1
    assert summary.results[0].error == "Nicio poză pentru job"
    summary_json = json.loads((tmp_path / "out" / "batch_summary.json").read_text(encoding="utf-8"))
    assert summary_json["batch_version"] == BATCH_VERSION


def test_run_batch_missing_photos_dir(tmp_path: Path):
    jobs = [BatchJob(job_id="missing-dir", photos_dir=str(tmp_path / "nope"), client_name="X")]
    summary = run_batch(jobs, output_dir=tmp_path / "out")
    assert summary.failed == 1
    assert "inexistent" in (summary.results[0].error or "").lower()


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