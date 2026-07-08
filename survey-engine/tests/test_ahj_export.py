"""Tests for AHJ export."""

import json
import zipfile
from pathlib import Path

from src.ahj_export import (
    EXPORT_VERSION,
    SCHEMA_ID,
    build_ahj_package,
    build_permit_zip,
    build_permit_zip_from_registry,
    export_ahj_json,
    validate_ahj_package,
)
from src.models import get_sample_survey


def test_build_ahj_package():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    assert pkg["schema"] == SCHEMA_ID
    assert pkg["export_version"] == EXPORT_VERSION
    assert pkg["production_estimate"]["monthly_kwh"]
    assert len(pkg["documents_required"]) >= 5
    assert "jurisdiction" in pkg


def test_validate_passes_sample():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    assert validate_ahj_package(pkg) == []


def test_validate_reports_missing_fields():
    errors = validate_ahj_package({"schema": "wrong", "installation": {"capacity_kwp": 0}})
    assert any("schema" in e.lower() or "Schema" in e for e in errors)
    assert any("applicant" in e.lower() or "Capacitate" in e for e in errors)


def test_export_file(tmp_path: Path):
    survey = get_sample_survey()
    out = export_ahj_json(survey, tmp_path / "ahj.json")
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["validation_passed"] is True


def test_build_permit_zip_contains_expected_files(tmp_path: Path):
    survey = get_sample_survey()
    zip_path = build_permit_zip(survey, tmp_path / "permit.zip")
    assert zip_path.exists()
    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
    assert "AHJ_package.json" in names
    assert "documents_required.txt" in names
    assert "explainable_findings.json" in names
    assert "README_permit.txt" in names


def test_build_permit_zip_from_registry(tmp_path: Path):
    ahj_path = tmp_path / "ahj.json"
    ahj_path.write_text(
        json.dumps(
            {
                "schema": SCHEMA_ID,
                "documents_required": ["Cerere racordare"],
                "jurisdiction": {"code": "VS", "name": "Vaslui"},
                "explainable_findings": [],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    zip_path = build_permit_zip_from_registry(
        "SOL-REG-1",
        ahj_path=ahj_path,
        output_dir=tmp_path / "out",
    )
    assert zip_path.name == "PERMIT_SOL-REG-1.zip"
    with zipfile.ZipFile(zip_path) as zf:
        assert "AHJ_package.json" in zf.namelist()