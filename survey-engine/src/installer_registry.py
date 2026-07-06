"""Installer registry — aggregate stats per installer from report history."""

from __future__ import annotations

from typing import Any, Optional

from src.installer_auth import _load_keys
from src.report_registry import ReportRegistry, ReportRecord


def _installer_key(record: ReportRecord) -> str:
    return record.installer_id or record.technician_name or "unknown"


def aggregate_installers(registry: Optional[ReportRegistry] = None) -> list[dict[str, Any]]:
    """Public aggregate list for SaaS admin and twin consumers."""
    reg = registry or ReportRegistry()
    reports = reg.list_reports(limit=1000)
    buckets: dict[str, list[ReportRecord]] = {}
    for row in reports:
        buckets.setdefault(_installer_key(row), []).append(row)

    configured = set(_load_keys().keys())
    for installer_id in configured:
        buckets.setdefault(installer_id, [])

    out: list[dict[str, Any]] = []
    for installer_id, rows in sorted(buckets.items()):
        scores = [r.suitability_score for r in rows]
        techs = sorted({r.technician_name for r in rows if r.technician_name})
        out.append({
            "installer_id": installer_id,
            "report_count": len(rows),
            "total_capacity_kwp": round(sum(r.capacity_kwp for r in rows), 1),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "premium_count": sum(1 for r in rows if r.premium_tier),
            "last_report_at": max((r.timestamp for r in rows), default=""),
            "technician_names": techs,
            "api_key_configured": installer_id in configured,
        })
    return out


def get_installer_profile(
    installer_id: str,
    *,
    registry: Optional[ReportRegistry] = None,
) -> dict[str, Any]:
    """Profile for authenticated installer (GET /installer/me)."""
    reg = registry or ReportRegistry()
    reports = [r for r in reg.list_reports(limit=1000) if _installer_key(r) == installer_id]
    configured = installer_id in _load_keys()
    recent = sorted(reports, key=lambda r: r.timestamp, reverse=True)[:10]
    scores = [r.suitability_score for r in reports]
    return {
        "installer_id": installer_id,
        "report_count": len(reports),
        "api_key_configured": configured,
        "stats": {
            "total_capacity_kwp": round(sum(r.capacity_kwp for r in reports), 1),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "premium_count": sum(1 for r in reports if r.premium_tier),
            "total_cost_usd": round(sum(r.cost_usd for r in reports), 4),
            "by_month": _reports_by_month(reports),
        },
        "recent_reports": [
            {
                "report_id": r.report_id,
                "client": r.client_name,
                "city": r.city,
                "score": r.suitability_score,
                "kwp": r.capacity_kwp,
                "timestamp": r.timestamp,
            }
            for r in recent
        ],
    }


def _reports_by_month(reports: list[ReportRecord]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in reports:
        month = row.timestamp[:7] if row.timestamp else "unknown"
        counts[month] = counts.get(month, 0) + 1
    return counts