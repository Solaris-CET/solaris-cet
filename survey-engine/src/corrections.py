"""Technician correction log — adaptive feedback loop (S3 / L-FS-6 factor 3)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from src.models import project_root

CORRECTIONS_VERSION = 1


def corrections_path(custom: Optional[Path] = None) -> Path:
    return custom or (project_root() / "output" / "corrections.jsonl")


def log_correction(
    *,
    report_id: str,
    field: str,
    original: str,
    corrected: str,
    technician: str = "",
    notes: str = "",
    path: Optional[Path] = None,
) -> dict[str, Any]:
    """Append one correction event to corrections.jsonl."""
    entry = {
        "version": CORRECTIONS_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "report_id": report_id.strip(),
        "field": field.strip(),
        "original": original.strip(),
        "corrected": corrected.strip(),
        "technician": technician.strip(),
        "notes": notes.strip(),
    }
    if not entry["report_id"] or not entry["field"]:
        raise ValueError("report_id și field sunt obligatorii")

    out = corrections_path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def list_corrections(report_id: Optional[str] = None, limit: int = 50) -> list[dict[str, Any]]:
    path = corrections_path()
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
    return rows[-limit:]