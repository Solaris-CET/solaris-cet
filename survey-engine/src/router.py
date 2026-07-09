"""HARD-004 — Dynamic model router with telemetry, fallback, quality scoring."""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from src.model_router import RoutingDecision, VisionProvider, WritingProvider, route_job
from src.models import project_root

ROUTER_SCHEMA = "solaris-router-decision-v1"
FALLBACK_CHAIN = (
    VisionProvider.KIMI,
    VisionProvider.DEEPSEEK,
)


def decisions_path() -> Path:
    return project_root() / "output" / "router_decisions.jsonl"


def _correction_rate() -> float:
    """Fraction of recent reports with technician corrections (quality signal)."""
    from src.corrections import list_corrections
    from src.report_registry import ReportRegistry

    reports = ReportRegistry().list_reports(limit=100)
    if not reports:
        return 0.0
    corrected_ids = {row.get("report_id") for row in list_corrections(limit=500)}
    hits = sum(1 for r in reports if r.report_id in corrected_ids)
    return round(hits / len(reports), 4)


def route_survey_job(
    num_photos: int,
    premium: bool,
    *,
    kimi_available: bool = False,
    checklist_complexity: int = 0,
    report_id: Optional[str] = None,
) -> RoutingDecision:
    """Route with quality-aware adjustment and durable decision log."""
    correction_rate = _correction_rate()
    prefer_deepseek = correction_rate >= 0.25 and num_photos < 10

    if prefer_deepseek and kimi_available:
        decision = RoutingDecision(
            vision=VisionProvider.DEEPSEEK,
            writing=route_job(num_photos, premium, kimi_available=kimi_available).writing,
            reason=(
                f"Quality score: correction_rate={correction_rate} → prefer DeepSeek; "
                f"{num_photos} poze, checklist={checklist_complexity}"
            ),
        )
    else:
        decision = route_job(num_photos, premium, kimi_available=kimi_available)

    log_routing_decision(
        decision,
        context={
            "num_photos": num_photos,
            "premium": premium,
            "kimi_available": kimi_available,
            "checklist_complexity": checklist_complexity,
            "correction_rate": correction_rate,
            "report_id": report_id or "",
        },
    )
    return decision


def vision_fallback_chain(
    decision: RoutingDecision,
    *,
    kimi_available: bool,
    deepseek_available: bool,
) -> list[str]:
    """Ordered vision providers to attempt (HARD-004 fallback)."""
    primary = decision.vision.value
    chain = [primary]
    for provider in FALLBACK_CHAIN:
        value = provider.value
        if value == primary:
            continue
        if provider == VisionProvider.KIMI and not kimi_available:
            continue
        if provider == VisionProvider.DEEPSEEK and not deepseek_available:
            continue
        chain.append(value)
    return chain


def log_routing_decision(decision: RoutingDecision, *, context: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    entry = {
        "schema": ROUTER_SCHEMA,
        "decision_id": f"rd-{now.strftime('%Y%m%d%H%M%S%f')}",
        "vision": decision.vision.value,
        "writing": decision.writing.value,
        "reason": decision.reason,
        "context": context,
        "timestamp": now.isoformat(),
    }
    path = decisions_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def list_routing_decisions(*, limit: int = 50) -> list[dict[str, Any]]:
    path = decisions_path()
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    cap = min(max(limit, 1), 200)
    return rows[-cap:][::-1]


def get_router_stats() -> dict[str, Any]:
    rows = list_routing_decisions(limit=200)
    by_vision: dict[str, int] = {}
    by_writing: dict[str, int] = {}
    for row in rows:
        vision = str(row.get("vision", "unknown"))
        writing = str(row.get("writing", "unknown"))
        by_vision[vision] = by_vision.get(vision, 0) + 1
        by_writing[writing] = by_writing.get(writing, 0) + 1
    return {
        "schema": "solaris-router-stats-v1",
        "decisions_total": len(rows),
        "correction_rate": _correction_rate(),
        "fallback_chain": [p.value for p in FALLBACK_CHAIN],
        "by_vision": by_vision,
        "by_writing": by_writing,
        "recent": rows[:10],
        "decisions_path": str(decisions_path()),
    }