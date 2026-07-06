"""Unified report context — report + jurisdiction + CRM + cost (S1 / L-FS-6)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from src.explainable import build_explainable_findings_from_ahj
from src.models import project_root
from src.report_registry import ReportRecord, ReportRegistry


def _relative_output_path(path_str: str) -> str:
    root = (project_root() / "output").resolve()
    try:
        return str(Path(path_str).resolve().relative_to(root)).replace("\\", "/")
    except ValueError:
        return Path(path_str).name


def _load_ahj(ahj_path: Optional[str]) -> Optional[dict[str, Any]]:
    if not ahj_path:
        return None
    path = Path(ahj_path)
    if not path.is_absolute():
        path = project_root() / "output" / path
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def build_report_context(
    report_id: str,
    *,
    registry: Optional[ReportRegistry] = None,
    platform_base_url: str = "",
) -> dict[str, Any]:
    """Aggregate report, jurisdiction, CRM links, and API cost for one report_id."""
    reg = registry or ReportRegistry()
    record = reg.find_by_report_id(report_id)
    if not record:
        raise KeyError(f"Raport negăsit: {report_id}")

    ahj = _load_ahj(record.ahj_path)
    jurisdiction = (ahj or {}).get("jurisdiction") or {}
    if not jurisdiction and ahj:
        jurisdiction = {
            "code": None,
            "name": record.city,
            "grid_operator": None,
            "ahj_authority": "Primărie / Urbanism local",
        }

    pdf_rel = _relative_output_path(record.pdf_path)
    ahj_rel = _relative_output_path(record.ahj_path) if record.ahj_path else None
    base = platform_base_url.rstrip("/")

    return {
        "schema": "solaris-context-v1",
        "report_id": record.report_id,
        "report": {
            "client_name": record.client_name,
            "city": record.city,
            "capacity_kwp": record.capacity_kwp,
            "annual_kwh": record.annual_kwh,
            "suitability_score": record.suitability_score,
            "premium_tier": record.premium_tier,
            "installer_id": record.installer_id,
            "technician_name": record.technician_name,
            "timestamp": record.timestamp,
            "routing": record.routing,
        },
        "jurisdiction": jurisdiction,
        "site_location": (ahj or {}).get("site_location"),
        "crm": {
            "submit_url": f"{base}/api/survey/crm" if base else "/api/survey/crm",
            "lead_search_key": record.report_id,
            "context_url": f"{base}/api/survey/context?report_id={record.report_id}" if base else f"/api/survey/context?report_id={record.report_id}",
        },
        "cost": {
            "api_usd": round(record.cost_usd, 4),
            "routing": record.routing,
        },
        "files": {
            "pdf": pdf_rel,
            "ahj": ahj_rel,
            "pdf_url": f"{base}/api/survey/files?file={pdf_rel}" if base else f"/api/survey/files?file={pdf_rel}",
            "ahj_url": f"{base}/api/survey/files?file={ahj_rel}" if ahj_rel and base else (f"/api/survey/files?file={ahj_rel}" if ahj_rel else None),
            "permit_pack_url": f"{base}/api/survey/permit-pack?report_id={record.report_id}" if base else f"/api/survey/permit-pack?report_id={record.report_id}",
        },
        "explainable": build_explainable_findings_from_ahj(ahj) if ahj else {"findings": [], "low_confidence_count": 0},
    }


def record_from_context(ctx: dict[str, Any]) -> ReportRecord:
    """Reconstruct a minimal ReportRecord from context (tests)."""
    r = ctx["report"]
    f = ctx["files"]
    return ReportRecord(
        report_id=ctx["report_id"],
        client_name=r["client_name"],
        city=r["city"],
        pdf_path=f["pdf"],
        ahj_path=f.get("ahj"),
        capacity_kwp=r["capacity_kwp"],
        annual_kwh=r["annual_kwh"],
        suitability_score=r["suitability_score"],
        premium_tier=r["premium_tier"],
        cost_usd=ctx["cost"]["api_usd"],
        routing=ctx["cost"]["routing"],
        installer_id=r.get("installer_id", ""),
        technician_name=r.get("technician_name", ""),
    )