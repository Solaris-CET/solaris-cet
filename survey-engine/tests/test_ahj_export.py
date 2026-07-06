"""Tests for AHJ export."""

import json
from pathlib import Path

from src.ahj_export import EXPORT_VERSION, build_ahj_package, export_ahj_json, validate_ahj_package
from src.models import get_sample_survey


def test_build_ahj_package():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    assert pkg["schema"] == "solaris-ahj-v1"
    assert pkg["export_version"] == EXPORT_VERSION
    assert pkg["production_estimate"]["monthly_kwh"]
    assert len(pkg["documents_required"]) >= 5


def test_validate_passes_sample():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    assert validate_ahj_package(pkg) == []


def test_export_file(tmp_path: Path):
    survey = get_sample_survey()
    out = export_ahj_json(survey, tmp_path / "ahj.json")
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["validation_passed"] is True