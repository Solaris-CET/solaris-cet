"""Agentic survey orchestration — OODA loop for field technician (S5)."""

from __future__ import annotations

from typing import Any, Optional

SCHEMA_ID = "solaris-orchestration-v1"
PERMIT_RISK_THRESHOLD = 50


def assess_permit_risk(
    *,
    score: int,
    jurisdiction_code: str = "",
    checklist_warnings: int = 0,
    checklist_fails: int = 0,
    shading_level: str = "low",
    premium: bool = False,
    capacity_kwp: float = 0.0,
) -> dict[str, Any]:
    """Score 0–100: cât de probabil e nevoie de pachet autorizație AHJ."""
    risk = 0
    reasons: list[str] = []

    if jurisdiction_code.strip():
        risk += 25
        reasons.append(f"Județ setat ({jurisdiction_code}) — documentație AHJ recomandată")
    if checklist_fails > 0:
        risk += 30
        reasons.append(f"{checklist_fails} verificări respinse în checklist")
    if checklist_warnings > 0:
        risk += 10 * min(checklist_warnings, 3)
        reasons.append(f"{checklist_warnings} atenționări checklist")
    if shading_level in ("high", "severe"):
        risk += 15
        reasons.append(f"Umbrire {shading_level} — verificare suplimentară permit")
    if score < 70:
        risk += 20
        reasons.append(f"Scor fezabilitate {score}/100 sub prag recomandat")
    if premium:
        risk += 10
        reasons.append("Tier premium — memoriu tehnic extins")
    if capacity_kwp >= 10:
        risk += 10
        reasons.append(f"Capacitate {capacity_kwp} kWp — prag comercial/industrial")

    risk = min(100, risk)
    return {
        "score": risk,
        "permit_recommended": risk >= PERMIT_RISK_THRESHOLD,
        "reasons": reasons,
        "threshold": PERMIT_RISK_THRESHOLD,
    }


def _step(id_: str, label: str, status: str, **extra: Any) -> dict[str, Any]:
    return {"id": id_, "label": label, "status": status, **extra}


def build_orchestration_plan(
    *,
    report_id: str,
    score: int,
    capacity_kwp: float,
    verdict: str,
    jurisdiction_code: str = "",
    checklist_warnings: int = 0,
    checklist_fails: int = 0,
    shading_level: str = "low",
    premium: bool = False,
    platform_base_url: str = "",
    budget_alert: bool = False,
    budget_exceeded: bool = False,
) -> dict[str, Any]:
    """OODA execution plan post-generare: permit pack → CRM → contact offer."""
    base = platform_base_url.rstrip("/")
    risk = assess_permit_risk(
        score=score,
        jurisdiction_code=jurisdiction_code,
        checklist_warnings=checklist_warnings,
        checklist_fails=checklist_fails,
        shading_level=shading_level,
        premium=premium,
        capacity_kwp=capacity_kwp,
    )

    pdf_url = f"{base}/api/survey/files?file=" if base else "/api/survey/files?file="
    permit_url = f"{base}/api/survey/permit-pack?report_id={report_id}" if base else f"/api/survey/permit-pack?report_id={report_id}"
    contact_url = (
        f"{base}/contact?from=survey&report_id={report_id}&kwp={capacity_kwp}&score={score}"
        if base
        else f"/contact?from=survey&report_id={report_id}&kwp={capacity_kwp}&score={score}"
    )

    steps = [
        _step("observe", "Upload + analiză vision", "done"),
        _step("orient", "Evaluare risc permit", "done", permit_risk=risk["score"]),
        _step(
            "decide",
            "Rutare PDF" + (" + pachet AHJ" if risk["permit_recommended"] else " standard"),
            "done",
            permit_recommended=risk["permit_recommended"],
        ),
        _step("generate", "Raport PDF generat", "done", verdict=verdict),
    ]
    if risk["permit_recommended"]:
        steps.append(_step("permit_pack", "Descarcă pachet autorizație", "pending", url=permit_url))
    else:
        steps.append(_step("permit_pack", "Pachet autorizație", "skipped"))

    auto_crm = not budget_exceeded
    steps.append(_step("crm", "Trimite în CRM", "pending" if auto_crm else "blocked", auto=auto_crm))
    steps.append(_step("contact_offer", "Cere ofertă client", "pending", url=contact_url))

    return {
        "schema": SCHEMA_ID,
        "report_id": report_id,
        "permit_risk": risk,
        "auto_crm": auto_crm,
        "auto_permit_hint": risk["permit_recommended"],
        "budget_guard": {"alert": budget_alert, "exceeded": budget_exceeded},
        "steps": steps,
        "contact_url": contact_url,
        "permit_pack_url": permit_url if risk["permit_recommended"] else None,
    }


def checklist_counts(checklist: list[Any]) -> tuple[int, int]:
    """Count warnings and fails from ChecklistItem list or dict statuses."""
    warnings = fails = 0
    for item in checklist:
        status = getattr(item, "status", None)
        if status is None and isinstance(item, dict):
            status = item.get("status")
        val = getattr(status, "value", status) if status is not None else ""
        if val == "warning":
            warnings += 1
        elif val == "fail":
            fails += 1
    return warnings, fails


def plan_from_form(
    *,
    report_id: str,
    score: int,
    capacity_kwp: float,
    verdict: str,
    jurisdiction_code: str,
    shading_level: str,
    premium: bool,
    checklist_statuses: dict[str, str],
    platform_base_url: str = "",
    budget_alert: bool = False,
    budget_exceeded: bool = False,
) -> dict[str, Any]:
    """Build plan from generate form fields (before full SiteSurvey available)."""
    warnings = fails = 0
    for status in checklist_statuses.values():
        if status == "warning":
            warnings += 1
        elif status == "fail":
            fails += 1
    return build_orchestration_plan(
        report_id=report_id,
        score=score,
        capacity_kwp=capacity_kwp,
        verdict=verdict,
        jurisdiction_code=jurisdiction_code,
        checklist_warnings=warnings,
        checklist_fails=fails,
        shading_level=shading_level,
        premium=premium,
        platform_base_url=platform_base_url,
        budget_alert=budget_alert,
        budget_exceeded=budget_exceeded,
    )


def batch_orchestration_summary(
    results: list[dict[str, Any]],
    *,
    platform_base_url: str = "",
) -> dict[str, Any]:
    """Aggregate permit risk across batch jobs for installer dashboard."""
    permit_count = 0
    scores: list[int] = []
    for r in results:
        if not r.get("success"):
            continue
        score = int(r.get("score") or 0)
        scores.append(score)
        risk = assess_permit_risk(score=score, jurisdiction_code=r.get("jurisdiction_code", ""))
        if risk["permit_recommended"]:
            permit_count += 1
    return {
        "schema": "solaris-batch-orchestration-v1",
        "jobs_total": len(results),
        "jobs_succeeded": sum(1 for r in results if r.get("success")),
        "permit_recommended_count": permit_count,
        "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "platform_base_url": platform_base_url,
    }