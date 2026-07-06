"""Digital Twin runtime — event log + SSE stream (D10)."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, Optional

from src.models import project_root

EVENT_SCHEMA = "solaris-twin-event-v1"
RUNTIME_VERSION = 1

EVENT_TYPES = frozenset({
    "report_generated",
    "correction_logged",
    "feed_refreshed",
    "twin_ready",
    "crm_sync",
})


def events_path() -> Path:
    return project_root() / "output" / "twin_events.jsonl"


def publish_twin_event(
    report_id: str,
    event_type: str,
    *,
    payload: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Append immutable twin event for SSE consumers and admin monitor."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown twin event type: {event_type}")
    now = datetime.now(timezone.utc)
    event = {
        "schema": EVENT_SCHEMA,
        "runtime_version": RUNTIME_VERSION,
        "event_id": f"{report_id}-{now.strftime('%Y%m%d%H%M%S%f')}",
        "report_id": report_id,
        "event_type": event_type,
        "payload": payload or {},
        "timestamp": now.isoformat(),
    }
    path = events_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")
    try:
        from src.twin_webhook import dispatch_outbound_twin_webhook

        dispatch_outbound_twin_webhook(event)
    except Exception:
        pass
    return event


def list_twin_events(
    report_id: Optional[str] = None,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    path = events_path()
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if report_id and row.get("report_id") != report_id:
            continue
        rows.append(row)
    cap = min(max(limit, 1), 200)
    return rows[-cap:][::-1]


def runtime_status() -> dict[str, Any]:
    path = events_path()
    total = 0
    if path.exists():
        total = sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
    return {
        "schema": "solaris-twin-runtime-v1",
        "runtime_version": RUNTIME_VERSION,
        "event_schema": EVENT_SCHEMA,
        "events_total": total,
        "events_path": str(path),
        "sse_supported": True,
        "persistent_sse": True,
    }


def iter_sse_stream(report_id: str, *, event_limit: int = 30) -> Iterator[str]:
    """Yield SSE frames: snapshot feed + recent events + ready."""
    from src.twin_feed import SCHEMA_ID, build_twin_feed

    try:
        feed = build_twin_feed(report_id)
        yield _sse_frame("snapshot", feed)
    except KeyError as exc:
        yield _sse_frame("error", {"error": str(exc)})
        return

    for event in reversed(list_twin_events(report_id, limit=event_limit)):
        yield _sse_frame(event["event_type"], event)

    yield _sse_frame("ready", {"report_id": report_id, "feed_schema": SCHEMA_ID})


def iter_sse_persistent_stream(
    report_id: str,
    *,
    event_limit: int = 30,
    poll_seconds: float = 2.0,
    heartbeat_seconds: float = 15.0,
) -> Iterator[str]:
    """Long-lived SSE: initial burst then heartbeat + live event polling."""
    seen: set[str] = set()
    for frame in iter_sse_stream(report_id, event_limit=event_limit):
        yield frame
        if frame.startswith("event: ") and "\ndata: " in frame:
            event_name = frame.split("\n", 1)[0].removeprefix("event: ").strip()
            if event_name not in ("snapshot", "ready", "heartbeat", "error"):
                try:
                    data_line = next(
                        ln.removeprefix("data: ").strip()
                        for ln in frame.split("\n")
                        if ln.startswith("data:")
                    )
                    row = json.loads(data_line)
                    if row.get("event_id"):
                        seen.add(str(row["event_id"]))
                except (StopIteration, json.JSONDecodeError, KeyError):
                    pass

    last_heartbeat = time.monotonic()
    while True:
        for event in list_twin_events(report_id, limit=event_limit):
            event_id = str(event.get("event_id", ""))
            if not event_id or event_id in seen:
                continue
            seen.add(event_id)
            yield _sse_frame(event["event_type"], event)

        now = time.monotonic()
        if now - last_heartbeat >= heartbeat_seconds:
            yield _sse_frame(
                "heartbeat",
                {"report_id": report_id, "ts": datetime.now(timezone.utc).isoformat()},
            )
            last_heartbeat = now
        time.sleep(poll_seconds)


def _sse_frame(event_name: str, data: dict[str, Any]) -> str:
    return f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"