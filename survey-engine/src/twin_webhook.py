"""Bidirectional CRM twin webhooks — outbound dispatch + inbound sync (D10)."""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

from src.models import project_root

WEBHOOK_SCHEMA = "solaris-twin-webhook-v1"
DELIVERY_SCHEMA = "solaris-twin-webhook-delivery-v1"


def deliveries_path() -> Path:
    return project_root() / "output" / "twin_webhook_deliveries.jsonl"


def _webhook_url() -> str:
    return os.getenv("TWIN_WEBHOOK_URL", "").strip()


def _webhook_secret() -> str:
    return os.getenv("TWIN_WEBHOOK_SECRET", "").strip()


def log_delivery(
    *,
    direction: str,
    status: str,
    event_type: str,
    report_id: str,
    http_status: Optional[int] = None,
    detail: str = "",
    payload: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    entry = {
        "schema": DELIVERY_SCHEMA,
        "delivery_id": f"wh-{now.strftime('%Y%m%d%H%M%S%f')}",
        "direction": direction,
        "status": status,
        "event_type": event_type,
        "report_id": report_id,
        "http_status": http_status,
        "detail": detail[:500],
        "payload": payload or {},
        "timestamp": now.isoformat(),
    }
    path = deliveries_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def _delivered_event_ids() -> set[str]:
    """Event IDs already delivered outbound (idempotency for HARD-001)."""
    ids: set[str] = set()
    for row in list_deliveries(limit=200, direction="outbound"):
        if row.get("status") not in ("delivered", "duplicate", "skipped"):
            continue
        payload = row.get("payload") or {}
        event = payload.get("event") if isinstance(payload, dict) else {}
        event_id = str((event or {}).get("event_id") or "").strip()
        if event_id:
            ids.add(event_id)
    return ids


def is_event_delivered(event_id: str) -> bool:
    clean = (event_id or "").strip()
    if not clean:
        return False
    return clean in _delivered_event_ids()


def list_deliveries(
    *,
    limit: int = 50,
    direction: Optional[str] = None,
) -> list[dict[str, Any]]:
    path = deliveries_path()
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if direction and row.get("direction") != direction:
            continue
        rows.append(row)
    cap = min(max(limit, 1), 200)
    return rows[-cap:][::-1]


def dispatch_outbound_twin_webhook(event: dict[str, Any]) -> dict[str, Any]:
    """POST twin event to CRM webhook URL; always logs delivery."""
    url = _webhook_url()
    report_id = str(event.get("report_id", ""))
    event_type = str(event.get("event_type", "unknown"))
    event_id = str(event.get("event_id", "")).strip()
    if event_id and is_event_delivered(event_id):
        return log_delivery(
            direction="outbound",
            status="duplicate",
            event_type=event_type,
            report_id=report_id,
            detail=f"event_id {event_id} already delivered",
            payload={"event": event},
        )
    if not url:
        return log_delivery(
            direction="outbound",
            status="skipped",
            event_type=event_type,
            report_id=report_id,
            detail="TWIN_WEBHOOK_URL unset",
            payload={"event": event},
        )

    body = {
        "schema": WEBHOOK_SCHEMA,
        "direction": "outbound",
        "event": event_type,
        "report_id": report_id,
        "twin_event": event,
        "source": "solaris-survey-engine",
        "at": datetime.now(timezone.utc).isoformat(),
    }
    headers = {"Content-Type": "application/json"}
    secret = _webhook_secret()
    if secret:
        headers["X-Twin-Webhook-Secret"] = secret

    max_attempts = 5
    base_delay = 0.5
    max_delay = 30.0
    last_exception: Optional[Exception] = None

    for attempt in range(max_attempts):
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=body, headers=headers)
            ok = 200 <= res.status_code < 300
            if ok or attempt == max_attempts - 1:
                return log_delivery(
                    direction="outbound",
                    status="delivered" if ok else "failed",
                    event_type=event_type,
                    report_id=report_id,
                    http_status=res.status_code,
                    detail=res.text[:200] if not ok else "",
                    payload={"event": event},
                )
            if res.status_code < 500 and res.status_code != 429:
                return log_delivery(
                    direction="outbound",
                    status="failed",
                    event_type=event_type,
                    report_id=report_id,
                    http_status=res.status_code,
                    detail=res.text[:200],
                    payload={"event": event},
                )
        except Exception as exc:
            last_exception = exc
            if attempt == max_attempts - 1:
                break

        delay = min(base_delay * (2 ** attempt), max_delay)
        delay = delay * (0.75 + 0.5 * (hash(report_id) % 1000) / 1000.0)  # jitter
        time.sleep(delay)

    return log_delivery(
        direction="outbound",
        status="error",
        event_type=event_type,
        report_id=report_id,
        detail=str(last_exception)[:200] if last_exception else "Max retries exceeded",
        payload={"event": event},
    )


def handle_inbound_webhook(payload: dict[str, Any]) -> dict[str, Any]:
    """Accept CRM payload and publish `crm_sync` twin event."""
    from src.twin_runtime import publish_twin_event

    report_id = str(payload.get("report_id") or payload.get("reportId") or "").strip()
    event_name = str(payload.get("event") or payload.get("event_type") or "crm_sync").strip()
    if not report_id:
        raise ValueError("report_id required")

    sync_payload = {
        "crm_event": event_name,
        "crm_payload": {k: v for k, v in payload.items() if k not in ("report_id", "reportId", "event")},
    }
    twin_event = publish_twin_event(report_id, "crm_sync", payload=sync_payload)
    delivery = log_delivery(
        direction="inbound",
        status="accepted",
        event_type="crm_sync",
        report_id=report_id,
        http_status=200,
        payload=payload,
    )
    return {"ok": True, "twin_event": twin_event, "delivery": delivery}


def webhook_status() -> dict[str, Any]:
    path = deliveries_path()
    total = 0
    if path.exists():
        total = sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
    return {
        "schema": "solaris-twin-webhook-status-v1",
        "webhook_schema": WEBHOOK_SCHEMA,
        "outbound_configured": bool(_webhook_url()),
        "deliveries_total": total,
        "deliveries_path": str(path),
    }