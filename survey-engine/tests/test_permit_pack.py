"""Tests for permit export ZIP."""

import zipfile
from pathlib import Path

from src.ahj_export import build_permit_zip, build_permit_zip_from_registry
from src.models import get_sample_survey


def test_build_permit_zip_contents(tmp_path: Path):
    survey = get_sample_survey()
    survey.metadata.jurisdiction_code = "RO-CJ"
    survey.metadata.jurisdiction_name = "Cluj"
    zip_path = build_permit_zip(survey, tmp_path / "PERMIT_test.zip")
    assert zip_path.exists()
    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        assert "AHJ_package.json" in names
        assert "documents_required.txt" in names
        assert "explainable_findings.json" in names
        assert "jurisdiction.json" in names
        assert "README_permit.txt" in names


def test_permit_zip_from_registry(tmp_path: Path):
    survey = get_sample_survey()
    ahj = tmp_path / f"AHJ_{survey.metadata.report_id}.json"
    from src.ahj_export import export_ahj_json
    export_ahj_json(survey, ahj)
    zip_path = build_permit_zip_from_registry(
        survey.metadata.report_id,
        ahj_path=ahj,
        output_dir=tmp_path,
    )
    assert zip_path.suffix == ".zip"
    with zipfile.ZipFile(zip_path) as zf:
        assert "AHJ_package.json" in zf.namelist()