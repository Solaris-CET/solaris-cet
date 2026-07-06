"""Digital Twin feed — lightweight snapshot for D10 integration (S6)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from src.context_api import build_report_context
from src.corrections import list_corrections
from src.report_registry import ReportRegistry

SCHEMA_ID = "solaris-twin-feed-v1"
FEED_VERSION = 1


def build_twin_feed(
    report_id: str,
    *,
    registry: Optional[ReportRegistry] = None,
    platform_base_url: str = "",
) -> dict[str, Any]:
    """Aggregate context + geo + production + explainable for twin consumers."""
    ctx = build_report_context(report_id, registry=registry, platform_base_url=platform_base_url)
    r = ctx["report"]
    loc = ctx.get("site_location") or {}
    explainable = ctx.get("explainable") or {}
    corrections = list_corrections(report_id, limit=20)

    return {
        "schema": SCHEMA_ID,
        "feed_version": FEED_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report_id": report_id,
        "site": {
            "client_name": r["client_name"],
            "city": r["city"],
            "latitude": loc.get("latitude") if isinstance(loc, dict) else None,
            "longitude": loc.get("longitude") if isinstance(loc, dict) else None,
        },
        "system": {
            "capacity_kwp": r["capacity_kwp"],
            "annual_kwh": r["annual_kwh"],
            "suitability_score": r["suitability_score"],
            "premium_tier": r.get("premium_tier", False),
        },
        "jurisdiction": ctx.get("jurisdiction"),
        "explainable": explainable,
        "low_confidence_count": explainable.get("low_confidence_count", 0),
        "corrections_count": len(corrections),
        "corrections_recent": corrections[-5:],
        "files": ctx.get("files"),
        "cost": ctx.get("cost"),
        "crm": ctx.get("crm"),
    }