"""Golden tests for explainable findings."""

import json

from src.ahj_export import build_ahj_package
from src.explainable import build_explainable_findings, build_basis_narrative
from src.models import get_sample_survey


def test_explainable_findings_golden_shape():
    survey = get_sample_survey()
    rows = build_explainable_findings(survey)
    assert len(rows) >= 4
    first = rows[0]
    assert "claim" in first
    assert "confidence" in first
    assert "evidence_photo_ids" in first
    assert isinstance(first["evidence_photo_ids"], list)
    assert len(first["evidence_photo_ids"]) >= 1
    assert 0 <= first["confidence"] <= 1


def test_ahj_includes_explainable_findings():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    assert "explainable_findings" in pkg
    assert len(pkg["explainable_findings"]) >= 4
    sample = pkg["explainable_findings"][0]
    assert sample["evidence_photo_ids"]


def test_basis_narrative_non_empty():
    survey = get_sample_survey()
    narrative = build_basis_narrative(build_explainable_findings(survey))
    assert len(narrative) >= 1
    assert "încredere" in narrative[0].lower() or "dovezi" in narrative[0].lower()


def test_explainable_json_serializable():
    survey = get_sample_survey()
    pkg = build_ahj_package(survey)
    text = json.dumps(pkg["explainable_findings"])
    parsed = json.loads(text)
    assert isinstance(parsed, list)