"""Tests for end-to-end pipeline."""

from pathlib import Path

from src.pipeline import MAX_PHOTOS, run_pipeline, default_checklist


def test_pipeline_demo_mode(tmp_path: Path):
    photo = tmp_path / "roof_south.jpg"
    photo.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 100)

    result = run_pipeline(
        photo_paths=[photo],
        client_name="Test",
        client_address="Str 1",
        client_city="Cluj",
        client_postal="400001",
        client_phone="",
        client_email="",
        technician_name="Tech",
        roof_type="tile",
        roof_orientation="S",
        roof_pitch=35,
        usable_area_m2=42,
        annual_consumption_kwh=4800,
        grid_connection="single-phase",
        shading_level="low",
        existing_solar=False,
        structural_notes="",
        checklist=default_checklist(),
        premium=False,
        output_dir=tmp_path / "out",
    )

    assert result.pdf_path.exists()
    assert result.ahj_path.exists()
    assert result.survey.photo_analyses
    assert result.survey.executive_summary.suitability_score > 0


def test_pipeline_rejects_empty():
    import pytest
    with pytest.raises(ValueError, match="poză"):
        run_pipeline(
            photo_paths=[],
            client_name="T", client_address="A", client_city="C", client_postal="1",
            client_phone="", client_email="", technician_name="X",
            roof_type="tile", roof_orientation="S", roof_pitch=30,
            usable_area_m2=40, annual_consumption_kwh=5000,
            grid_connection="single-phase", shading_level="low",
            existing_solar=False, structural_notes="",
            checklist=default_checklist(),
        )


def test_max_photos_constant():
    assert MAX_PHOTOS == 20