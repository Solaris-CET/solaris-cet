"""Tests for survey builder."""

from src.models import ChecklistStatus, PhotoAnalysis, PhotoCategory
from src.pipeline import default_checklist
from src.survey_builder import build_survey


def test_build_survey_from_form():
    photos = [
        PhotoAnalysis(
            photo_id="P001",
            category=PhotoCategory.ROOF_OVERVIEW,
            findings=["Acoperiș sud, 40m²"],
            confidence=0.9,
        ),
    ]
    checklist = default_checklist()
    survey = build_survey(
        client_name="Test Client",
        client_address="Str. Test 1",
        client_city="București",
        client_postal="010101",
        client_phone="",
        client_email="",
        technician_name="Tehnician Test",
        roof_type="tile",
        roof_orientation="S",
        roof_pitch=30,
        usable_area_m2=40,
        annual_consumption_kwh=5000,
        grid_connection="single-phase",
        shading_level="low",
        existing_solar=False,
        structural_notes="OK",
        checklist=checklist,
        photo_analyses=photos,
        premium=False,
    )
    assert survey.client.name == "Test Client"
    assert survey.system_estimate.recommended_capacity_kwp > 0
    assert 0 <= survey.executive_summary.suitability_score <= 100
    assert len(survey.recommendations) >= 1


def test_premium_flag():
    photos = [
        PhotoAnalysis(photo_id="P001", category=PhotoCategory.OTHER, findings=["x"]),
    ]
    survey = build_survey(
        client_name="A", client_address="B", client_city="C", client_postal="1",
        client_phone="", client_email="", technician_name="T",
        roof_type="tile", roof_orientation="S", roof_pitch=30,
        usable_area_m2=40, annual_consumption_kwh=5000,
        grid_connection="single-phase", shading_level="low",
        existing_solar=False, structural_notes="",
        checklist=default_checklist(), photo_analyses=photos, premium=True,
    )
    assert survey.metadata.premium_tier is True
    assert "premium" in survey.executive_summary.overview.lower()