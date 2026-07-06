"""Twin AI agent — recommendations over twin feed + OODA orchestration (D10 + S5)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from src.context_api import build_report_context
from src.survey_agent import plan_from_form
from src.twin_feed import SCHEMA_ID as TWIN_FEED_SCHEMA, build_twin_feed
from src.twin_runtime import list_twin_events, publish_twin_event

SCHEMA_ID = "solaris-twin-agent-v1"
AGENT_VERSION = 1

ACTION_TYPES = frozenset({
    "suggest_crm",
    "suggest_permit",
    "suggest_correction",
    "suggest_contact",
    "escalate_low_confidence",
    "refresh_twin",
})

AGENT_EVENT_TYPES = frozenset({
    "agent_plan_ready",
    "agent_action",
    "agent_reassess",
})


def _action(
    action_id: str,
    action_type: str,
    label: str,
    *,
    priority: str = "normal",
    reason: str = "",
    url: str = "",
    auto: bool = False,
) -> dict[str, Any]:
    return {
        "id": action_id,
        "type": action_type,
        "label": label,
        "priority": priority,
        "reason": reason,
        "url": url,
        "auto": auto,
        "status": "pending",
    }


def build_twin_agent_plan(
    report_id: str,
    *,
    platform_base_url: str = "",
    budget_alert: bool = False,
    budget_exceeded: bool = False,
) -> dict[str, Any]:
    """Fuse twin feed + orchestration into actionable agent recommendations."""
    feed = build_twin_feed(report_id, platform_base_url=platform_base_url)
    ctx = build_report_context(report_id, platform_base_url=platform_base_url)
    r = ctx["report"]
    loc = ctx.get("site_location") or {}
    jurisdiction_raw = (ctx.get("jurisdiction") or {}).get("code", "") if isinstance(ctx.get("jurisdiction"), dict) else ""
    jurisdiction = str(jurisdiction_raw or "").strip()

    shading = "low"
    if isinstance(loc, dict):
        shading = str(loc.get("shading_level") or "low")

    orch = plan_from_form(
        report_id=report_id,
        score=int(r.get("suitability_score") or 0),
        capacity_kwp=float(r.get("capacity_kwp") or 0),
        verdict=str(r.get("verdict") or ""),
        jurisdiction_code=jurisdiction,
        shading_level=shading,
        premium=bool(r.get("premium_tier")),
        checklist_statuses={},
        platform_base_url=platform_base_url,
        budget_alert=budget_alert,
        budget_exceeded=budget_exceeded,
    )

    actions: list[dict[str, Any]] = []
    reasoning: list[str] = []
    low_conf = int(feed.get("low_confidence_count") or 0)
    corrections = int(feed.get("corrections_count") or 0)
    score = int(feed.get("system", {}).get("suitability_score") or 0)

    if low_conf > 0:
        actions.append(
            _action(
                "act-correction",
                "suggest_correction",
                "Corectează câmpuri cu încredere scăzută",
                priority="high",
                reason=f"{low_conf} finding-uri sub prag în twin feed",
            ),
        )
        reasoning.append(f"{low_conf} finding-uri low-confidence — agent recomandă corecții")

    if orch.get("auto_permit_hint"):
        actions.append(
            _action(
                "act-permit",
                "suggest_permit",
                "Descarcă pachet autorizație AHJ",
                priority="high",
                reason=f"Risc permit {orch['permit_risk']['score']}/100",
                url=str(orch.get("permit_pack_url") or ""),
            ),
        )
        reasoning.append("OODA orient: risc permit peste prag")

    if orch.get("auto_crm"):
        actions.append(
            _action(
                "act-crm",
                "suggest_crm",
                "Trimite raport în CRM",
                priority="normal",
                reason="Orchestrare auto-CRM activă",
                auto=True,
            ),
        )
        reasoning.append("Agent S5: auto-CRM permis de budget guard")

    if corrections >= 2:
        actions.append(
            _action(
                "act-escalate",
                "escalate_low_confidence",
                "Escaladează către admin (corecții multiple)",
                priority="high",
                reason=f"{corrections} corecții înregistrate",
            ),
        )
        reasoning.append(f"{corrections} corecții — escaladare recomandată")

    actions.append(
        _action(
            "act-contact",
            "suggest_contact",
            "Cere ofertă client",
            priority="normal",
            reason=f"Scor {score}/100 — flux ofertă",
            url=str(orch.get("contact_url") or ""),
        ),
    )

    actions.append(
        _action(
            "act-refresh",
            "refresh_twin",
            "Reîmprospătează twin feed",
            priority="low",
            reason="Sincronizare feed după acțiuni",
        ),
    )

    priority_rank = {"high": 0, "normal": 1, "low": 2}
    actions.sort(key=lambda a: priority_rank.get(a["priority"], 9))
    confidence = min(0.98, 0.55 + (score / 200) + (0.1 if not low_conf else 0))

    return {
        "schema": SCHEMA_ID,
        "agent_version": AGENT_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report_id": report_id,
        "confidence": round(confidence, 2),
        "reasoning": reasoning,
        "twin_feed_schema": TWIN_FEED_SCHEMA,
        "orchestration_schema": orch.get("schema"),
        "permit_risk": orch.get("permit_risk"),
        "auto_crm": orch.get("auto_crm"),
        "actions": actions,
        "recommended_next": actions[0]["id"] if actions else None,
        "actions_total": len(actions),
    }


def publish_agent_plan(
    report_id: str,
    *,
    platform_base_url: str = "",
    budget_alert: bool = False,
    budget_exceeded: bool = False,
) -> dict[str, Any]:
    plan = build_twin_agent_plan(
        report_id,
        platform_base_url=platform_base_url,
        budget_alert=budget_alert,
        budget_exceeded=budget_exceeded,
    )
    publish_twin_event(
        report_id,
        "agent_plan_ready",
        payload={
            "actions_total": plan["actions_total"],
            "recommended_next": plan["recommended_next"],
            "confidence": plan["confidence"],
        },
    )
    return plan


def execute_agent_action(
    report_id: str,
    *,
    action_id: str,
    action_type: str,
    payload: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    if action_type not in ACTION_TYPES:
        raise ValueError(f"Unknown agent action type: {action_type}")
    body = payload or {}
    event = publish_twin_event(
        report_id,
        "agent_action",
        payload={
            "action_id": action_id,
            "action_type": action_type,
            "executed_by": body.get("executed_by", "technician"),
            "detail": body.get("detail", ""),
        },
    )
    return {
        "ok": True,
        "report_id": report_id,
        "action_id": action_id,
        "action_type": action_type,
        "event": event,
    }


def publish_agent_reassess(report_id: str, *, reason: str = "correction") -> dict[str, Any]:
    publish_twin_event(report_id, "agent_reassess", payload={"reason": reason})
    return {"ok": True, "report_id": report_id, "reason": reason}


def list_agent_decisions(
    report_id: Optional[str] = None,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    rows = list_twin_events(report_id, limit=min(limit, 200))
    return [r for r in rows if r.get("event_type") in AGENT_EVENT_TYPES]


def agent_status() -> dict[str, Any]:
    return {
        "schema": "solaris-twin-agent-status-v1",
        "agent_schema": SCHEMA_ID,
        "agent_version": AGENT_VERSION,
        "action_types": sorted(ACTION_TYPES),
        "event_types": sorted(AGENT_EVENT_TYPES),
    }