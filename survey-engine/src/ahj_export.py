"""AHJ / ANRE permit-ready export — design v3."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from src.models import SiteSurvey
from src.solar_calculator import estimate_production

EXPORT_VERSION = 3
SCHEMA_ID = "solaris-ahj-v1"


def _documents_required(survey: SiteSurvey) -> list[str]:
    base = [
        "Plan de situație cu amplasarea panourilor",
        "Schema unifilară electrică",
        "Declarație de conformitate CE / ANRE",
        "Certificat de performanță energetică (dacă e cazul)",
        "Cerere racordare operator rețea",
        "Dovadă proprietate / acord administrator",
    ]
    if survey.metadata.premium_tier:
        base.append("Memoriu tehnic detaliat (tier premium)")
    return base


def _compliance_checklist(survey: SiteSurvey) -> list[dict[str, Any]]:
    items = []
    for c in survey.checklist:
        items.append({
            "id": c.id,
            "category": c.category,
            "description": c.description,
            "status": c.status.value,
            "ahj_relevant": c.category in ("Structură", "Electric", "Conformitate", "Documentație"),
            "notes": c.notes,
        })
    return items


def build_ahj_package(survey: SiteSurvey) -> dict[str, Any]:
    """Iteration 3: full AHJ package with production detail + compliance."""
    prod = estimate_production(survey.site)
    est = survey.system_estimate

    return {
        "schema": SCHEMA_ID,
        "export_version": EXPORT_VERSION,
        "generated_at": datetime.now().isoformat(),
        "report_id": survey.metadata.report_id,
        "applicant": {
            "name": survey.client.name,
            "address": survey.client.address,
            "city": survey.client.city,
            "postal_code": survey.client.postal_code,
            "phone": survey.client.phone,
            "email": survey.client.email,
        },
        "installation": {
            "capacity_kwp": est.recommended_capacity_kwp,
            "panel_count": est.panel_count,
            "inverter": est.inverter_type,
            "grid_connection": survey.site.grid_connection,
            "roof_type": survey.site.roof_type.value,
            "orientation": survey.site.roof_orientation.value,
            "pitch_degrees": survey.site.roof_pitch_degrees,
            "usable_area_m2": survey.site.usable_area_m2,
            "existing_solar": survey.site.existing_solar,
        },
        "production_estimate": {
            "annual_kwh": prod.annual_kwh,
            "specific_yield_kwh_per_kwp": prod.specific_yield_kwh_per_kwp,
            "monthly_kwh": prod.monthly_kwh,
            "confidence_range_kwh": [prod.confidence_low_kwh, prod.confidence_high_kwh],
            "derating_factors": prod.derating_factors,
            "calc_version": prod.calc_version,
        },
        "technical_summary": {
            "suitability_score": survey.executive_summary.suitability_score,
            "verdict": survey.executive_summary.suitability_verdict,
            "key_findings": survey.executive_summary.key_findings,
            "shading_level": survey.site.shading_level.value,
            "structural_notes": survey.site.structural_notes,
        },
        "compliance_checklist": _compliance_checklist(survey),
        "documents_required": _documents_required(survey),
        "recommendations": [r.model_dump() for r in survey.recommendations],
        "technician": survey.metadata.technician_name,
        "survey_date": str(survey.metadata.survey_date),
        "premium_tier": survey.metadata.premium_tier,
        "jurisdiction": {
            "code": survey.metadata.jurisdiction_code,
            "name": survey.metadata.jurisdiction_name,
            "grid_operator": survey.metadata.grid_operator,
            "ahj_authority": "Primărie / Urbanism local",
        },
        "site_location": {
            "latitude": survey.metadata.site_latitude,
            "longitude": survey.metadata.site_longitude,
        },
    }


def validate_ahj_package(package: dict[str, Any]) -> list[str]:
    """Iteration 2→3: schema validation, returns error list."""
    errors: list[str] = []
    required = ["schema", "report_id", "applicant", "installation", "production_estimate"]
    for key in required:
        if key not in package:
            errors.append(f"Lipsește câmpul obligatoriu: {key}")
    if package.get("schema") != SCHEMA_ID:
        errors.append(f"Schema invalidă: {package.get('schema')}")
    if not package.get("applicant", {}).get("name"):
        errors.append("Nume applicant lipsă")
    cap = package.get("installation", {}).get("capacity_kwp", 0)
    if cap <= 0:
        errors.append("Capacitate invalidă")
    return errors


def export_ahj_json(survey: SiteSurvey, output_path: Path) -> Path:
    package = build_ahj_package(survey)
    errors = validate_ahj_package(package)
    package["validation_errors"] = errors
    package["validation_passed"] = len(errors) == 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(package, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path