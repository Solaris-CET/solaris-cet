"""Survey generation distributed tracing — jsonl spans (HARD-005)."""

from __future__ import annotations

import json
import re
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, Optional

from src.models import project_root

TRACE_SCHEMA = "solaris-survey-trace-v1"
_TRACEPARENT_RE = re.compile(
    r"^00-(?P<trace>[0-9a-f]{32})-(?P<span>[0-9a-f]{16})-(?P<flags>[0-9a-f]{2})$",
    re.IGNORECASE,
)


def traces_path() -> Path:
    return project_root() / "output" / "survey_traces.jsonl"


def new_trace_id() -> str:
    return uuid.uuid4().hex


def parse_traceparent(header: Optional[str]) -> tuple[str, str]:
    """Return (trace_id, parent_span_id). Generates trace_id if header missing/invalid."""
    raw = (header or "").strip()
    match = _TRACEPARENT_RE.match(raw)
    if match:
        return match.group("trace").lower(), match.group("span").lower()
    return new_trace_id(), uuid.uuid4().hex[:16]


def format_traceparent(trace_id: str, span_id: Optional[str] = None) -> str:
    sid = (span_id or uuid.uuid4().hex[:16]).lower()
    return f"00-{trace_id.lower()}-{sid}-01"


def record_span(
    *,
    trace_id: str,
    span_name: str,
    duration_ms: float,
    report_id: Optional[str] = None,
    parent_span_id: Optional[str] = None,
    status: str = "ok",
    **attrs: Any,
) -> dict[str, Any]:
    """Append one span row to survey_traces.jsonl."""
    path = traces_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    span_id = uuid.uuid4().hex[:16]
    row = {
        "schema": TRACE_SCHEMA,
        "trace_id": trace_id,
        "span_id": span_id,
        "parent_span_id": parent_span_id,
        "span_name": span_name,
        "report_id": report_id,
        "duration_ms": round(duration_ms, 2),
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "attrs": {k: v for k, v in attrs.items() if v is not None},
    }
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return row


@contextmanager
def span(
    trace_id: str,
    span_name: str,
    *,
    report_id: Optional[str] = None,
    parent_span_id: Optional[str] = None,
    **attrs: Any,
) -> Iterator[dict[str, Any]]:
    start = time.perf_counter()
    row: dict[str, Any] = {}
    try:
        yield row
        dur = (time.perf_counter() - start) * 1000
        row = record_span(
            trace_id=trace_id,
            span_name=span_name,
            duration_ms=dur,
            report_id=report_id or row.get("report_id"),
            parent_span_id=parent_span_id,
            status="ok",
            **attrs,
        )
    except Exception as exc:
        dur = (time.perf_counter() - start) * 1000
        record_span(
            trace_id=trace_id,
            span_name=span_name,
            duration_ms=dur,
            report_id=report_id,
            parent_span_id=parent_span_id,
            status="error",
            error=str(exc),
            **attrs,
        )
        raise


def query_traces(*, report_id: Optional[str] = None, trace_id: Optional[str] = None, limit: int = 200) -> list[dict[str, Any]]:
    path = traces_path()
    if not path.exists():
        return []
    out: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if report_id and row.get("report_id") != report_id:
                continue
            if trace_id and row.get("trace_id") != trace_id:
                continue
            out.append(row)
    return out[-limit:]


def trace_summary_for_report(report_id: str) -> dict[str, Any]:
    spans = query_traces(report_id=report_id)
    if not spans:
        return {"report_id": report_id, "trace_id": None, "spans": [], "total_duration_ms": 0}
    trace = spans[0].get("trace_id")
    total = sum(float(s.get("duration_ms") or 0) for s in spans)
    cost = sum(float((s.get("attrs") or {}).get("cost_usd") or 0) for s in spans)
    return {
        "report_id": report_id,
        "trace_id": trace,
        "spans": spans,
        "span_count": len(spans),
        "total_duration_ms": round(total, 2),
        "total_cost_usd": round(cost, 4),
    }