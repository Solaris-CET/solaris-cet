"""Soft-cost ROI metrics — NREL/DOE labor documentation savings narrative."""

from __future__ import annotations

import os
from typing import Optional

from src.report_registry import ReportRecord, ReportRegistry


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def roi_config() -> dict:
    baseline = _env_float("SURVEY_BASELINE_MINUTES", 60.0)
    target = _env_float("SURVEY_TARGET_MINUTES", 20.0)
    hourly_eur = _env_float("INSTALLER_HOURLY_RATE_EUR", 35.0)
    usd_per_w = _env_float("SOFT_COST_USD_PER_W", 0.17)
    eur_usd = _env_float("EUR_USD_RATE", 0.92)
    minutes_saved = max(0.0, baseline - target)
    eur_labor_per_report = round((minutes_saved / 60.0) * hourly_eur, 2)
    return {
        "baseline_minutes_manual": baseline,
        "target_minutes_solaris": target,
        "minutes_saved_per_report": round(minutes_saved, 1),
        "installer_hourly_rate_eur": hourly_eur,
        "soft_cost_usd_per_w": usd_per_w,
        "eur_usd_rate": eur_usd,
        "eur_labor_saved_per_report": eur_labor_per_report,
    }


def _installer_key(record: ReportRecord) -> str:
    return (record.installer_id or record.technician_name or "unknown").strip() or "unknown"


def compute_soft_cost_roi(
    reports: list[ReportRecord],
    total_api_cost_usd: float = 0.0,
    config: Optional[dict] = None,
) -> dict:
    cfg = config or roi_config()
    minutes_per = cfg["minutes_saved_per_report"]
    eur_labor_per = cfg["eur_labor_saved_per_report"]
    usd_per_w = cfg["soft_cost_usd_per_w"]
    eur_usd = cfg["eur_usd_rate"]

    by_installer: dict[str, dict] = {}
    total_capacity_kwp = 0.0

    for r in reports:
        key = _installer_key(r)
        bucket = by_installer.setdefault(
            key,
            {
                "installer_id": key,
                "reports": 0,
                "capacity_kwp": 0.0,
                "api_cost_usd": 0.0,
                "minutes_saved": 0.0,
                "eur_labor_saved": 0.0,
                "eur_design_benchmark_saved": 0.0,
            },
        )
        bucket["reports"] += 1
        bucket["capacity_kwp"] = round(bucket["capacity_kwp"] + r.capacity_kwp, 2)
        bucket["api_cost_usd"] = round(bucket["api_cost_usd"] + r.cost_usd, 4)
        total_capacity_kwp += r.capacity_kwp

    total_reports = len(reports)
    for bucket in by_installer.values():
        n = bucket["reports"]
        bucket["minutes_saved"] = round(n * minutes_per, 1)
        bucket["eur_labor_saved"] = round(n * eur_labor_per, 2)
        design_usd = bucket["capacity_kwp"] * 1000.0 * usd_per_w
        bucket["eur_design_benchmark_saved"] = round(design_usd * eur_usd, 2)
        bucket["eur_net_labor_minus_api"] = round(
            bucket["eur_labor_saved"] - bucket["api_cost_usd"] * eur_usd,
            2,
        )

    total_minutes = round(total_reports * minutes_per, 1)
    total_eur_labor = round(total_reports * eur_labor_per, 2)
    total_design_eur = round(total_capacity_kwp * 1000.0 * usd_per_w * eur_usd, 2)
    total_api_eur = round(total_api_cost_usd * eur_usd, 2)

    installers = sorted(by_installer.values(), key=lambda x: x["eur_labor_saved"], reverse=True)

    return {
        "config": cfg,
        "platform": {
            "total_reports": total_reports,
            "total_capacity_kwp": round(total_capacity_kwp, 2),
            "minutes_saved_total": total_minutes,
            "eur_labor_saved_total": total_eur_labor,
            "eur_design_benchmark_saved_total": total_design_eur,
            "api_cost_usd_total": round(total_api_cost_usd, 4),
            "api_cost_eur_total": total_api_eur,
            "eur_net_value_total": round(total_eur_labor - total_api_eur, 2),
            "eur_per_report_labor": eur_labor_per,
            "minutes_per_report": minutes_per,
        },
        "by_installer": installers,
    }


def get_soft_cost_roi(
    registry: Optional[ReportRegistry] = None,
    total_api_cost_usd: float = 0.0,
) -> dict:
    reg = registry or ReportRegistry()
    reports = reg.list_reports(limit=5000)
    return compute_soft_cost_roi(reports, total_api_cost_usd=total_api_cost_usd)