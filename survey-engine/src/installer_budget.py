"""HARD-002 — Per-installer monthly AI budget enforcement."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Optional

from src.report_registry import ReportRegistry


class BudgetExceededError(Exception):
    """Raised when installer monthly budget is exhausted."""


def _load_budgets() -> dict[str, float]:
    raw = os.environ.get("INSTALLER_BUDGETS", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return {str(k): float(v) for k, v in data.items()}
    except (json.JSONDecodeError, TypeError, ValueError):
        pass
    return {}


def monthly_budget_usd(installer_id: str) -> Optional[float]:
    clean = (installer_id or "").strip()
    if not clean:
        return None
    return _load_budgets().get(clean)


def monthly_spend_usd(installer_id: str, *, registry: Optional[ReportRegistry] = None) -> float:
    clean = (installer_id or "").strip()
    if not clean:
        return 0.0
    reg = registry or ReportRegistry()
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    reports = [
        r for r in reg.list_reports(limit=2000)
        if (r.installer_id or "").strip() == clean and r.timestamp.startswith(month)
    ]
    return round(sum(r.cost_usd for r in reports), 4)


def budget_status(installer_id: str, *, registry: Optional[ReportRegistry] = None) -> dict[str, Any]:
    clean = (installer_id or "").strip()
    spent = monthly_spend_usd(clean, registry=registry) if clean else 0.0
    budget = monthly_budget_usd(clean) if clean else None
    if budget is None:
        return {
            "configured": False,
            "installer_id": clean,
            "spent_usd": spent,
            "month": datetime.now(timezone.utc).strftime("%Y-%m"),
        }
    remaining = max(0.0, budget - spent)
    return {
        "configured": True,
        "installer_id": clean,
        "monthly_budget_usd": budget,
        "spent_usd": spent,
        "remaining_usd": round(remaining, 4),
        "alert": spent >= budget * 0.85,
        "exceeded": spent >= budget,
        "month": datetime.now(timezone.utc).strftime("%Y-%m"),
    }


def assert_budget_available(installer_id: str, *, registry: Optional[ReportRegistry] = None) -> None:
    """Hard stop before generation when monthly installer budget is exceeded."""
    status = budget_status(installer_id, registry=registry)
    if status.get("configured") and status.get("exceeded"):
        budget = status["monthly_budget_usd"]
        spent = status["spent_usd"]
        raise BudgetExceededError(
            f"Buget lunar instalator depășit ({spent:.2f}/{budget:.2f} USD)"
        )