"""Tests for agentic survey orchestration."""

from src.survey_agent import assess_permit_risk, build_orchestration_plan, plan_from_form


def test_assess_permit_risk_low():
    risk = assess_permit_risk(score=85, jurisdiction_code="", checklist_warnings=0)
    assert risk["permit_recommended"] is False
    assert risk["score"] < 50


def test_assess_permit_risk_high_with_jurisdiction():
    risk = assess_permit_risk(
        score=75,
        jurisdiction_code="RO-CJ",
        checklist_warnings=2,
        shading_level="high",
    )
    assert risk["permit_recommended"] is True
    assert len(risk["reasons"]) >= 2


def test_orchestration_plan_steps():
    plan = build_orchestration_plan(
        report_id="SOL-AG-1",
        score=80,
        capacity_kwp=6.0,
        verdict="Recomandat",
        jurisdiction_code="RO-VS",
        checklist_warnings=3,
        platform_base_url="https://test.local",
    )
    assert plan["schema"] == "solaris-orchestration-v1"
    assert plan["auto_crm"] is True
    assert plan["auto_permit_hint"] is True
    ids = [s["id"] for s in plan["steps"]]
    assert "generate" in ids
    assert "crm" in ids
    assert "contact_offer" in ids


def test_plan_from_form_checklist_fails():
    plan = plan_from_form(
        report_id="SOL-AG-2",
        score=60,
        capacity_kwp=8.0,
        verdict="Condiționat",
        jurisdiction_code="",
        shading_level="moderate",
        premium=False,
        checklist_statuses={"CHK-01": "fail", "CHK-02": "warning"},
    )
    assert plan["permit_risk"]["permit_recommended"] is True