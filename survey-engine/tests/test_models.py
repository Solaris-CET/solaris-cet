"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from src.models import ChecklistItem, ChecklistStatus, PhotoAnalysis, PhotoCategory, SiteSurvey, get_sample_survey


def test_sample_survey_valid():
    survey = get_sample_survey()
    assert survey.metadata.report_id == "SOL-2026-0042"
    assert len(survey.photo_analyses) >= 1
    assert len(survey.checklist) >= 1


def test_sample_survey_suitability_score_in_range():
    survey = get_sample_survey()
    assert 0 <= survey.executive_summary.suitability_score <= 100


def test_survey_requires_photos():
    survey = get_sample_survey()
    data = survey.model_dump()
    data["photo_analyses"] = []
    with pytest.raises(ValidationError):
        SiteSurvey.model_validate(data)


def test_survey_requires_checklist():
    survey = get_sample_survey()
    data = survey.model_dump()
    data["checklist"] = []
    with pytest.raises(ValidationError):
        SiteSurvey.model_validate(data)


def test_checklist_status_values():
    item = ChecklistItem(
        id="T1",
        category="Test",
        description="Test item",
        status=ChecklistStatus.PASS,
    )
    assert item.status == ChecklistStatus.PASS


def test_photo_analysis_defaults():
    photo = PhotoAnalysis(
        photo_id="P99",
        category=PhotoCategory.OTHER,
        findings=["test finding"],
    )
    assert photo.issues == []
    assert photo.confidence == 0.85