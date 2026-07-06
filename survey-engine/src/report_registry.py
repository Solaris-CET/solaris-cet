"""Report history registry — v3."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from src.models import SiteSurvey, project_root


@dataclass
class ReportRecord:
    report_id: str
    client_name: str
    city: str
    pdf_path: str
    ahj_path: Optional[str] = None
    capacity_kwp: float = 0.0
    annual_kwh: float = 0.0
    suitability_score: int = 0
    premium_tier: bool = False
    cost_usd: float = 0.0
    routing: str = ""
    installer_id: str = ""
    technician_name: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReportRegistry:
    def __init__(self, index_path: Optional[Path] = None):
        self.index_path = index_path or (project_root() / "output" / "reports_index.jsonl")

    def register(
        self,
        survey: SiteSurvey,
        pdf_path: Path,
        ahj_path: Optional[Path] = None,
        cost_usd: float = 0.0,
        routing: str = "",
        installer_id: str = "",
    ) -> ReportRecord:
        record = ReportRecord(
            report_id=survey.metadata.report_id,
            client_name=survey.client.name,
            city=survey.client.city,
            pdf_path=str(pdf_path),
            ahj_path=str(ahj_path) if ahj_path else None,
            capacity_kwp=survey.system_estimate.recommended_capacity_kwp,
            annual_kwh=survey.system_estimate.estimated_annual_production_kwh,
            suitability_score=survey.executive_summary.suitability_score,
            premium_tier=survey.metadata.premium_tier,
            cost_usd=cost_usd,
            routing=routing,
            installer_id=installer_id,
            technician_name=survey.metadata.technician_name,
        )
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        with self.index_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(record), ensure_ascii=False) + "\n")
        return record

    def list_reports(self, limit: int = 50) -> list[ReportRecord]:
        if not self.index_path.exists():
            return []
        records = []
        for line in self.index_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                d = json.loads(line)
                records.append(ReportRecord(**d))
        return records[-limit:][::-1]

    def stats(self) -> dict:
        reports = self.list_reports(limit=1000)
        if not reports:
            return {"total_reports": 0, "total_cost_usd": 0.0, "avg_score": 0}
        by_installer: dict[str, int] = {}
        for r in reports:
            key = r.installer_id or r.technician_name or "unknown"
            by_installer[key] = by_installer.get(key, 0) + 1
        return {
            "total_reports": len(reports),
            "total_cost_usd": round(sum(r.cost_usd for r in reports), 4),
            "avg_score": round(sum(r.suitability_score for r in reports) / len(reports), 1),
            "total_capacity_kwp": round(sum(r.capacity_kwp for r in reports), 1),
            "premium_count": sum(1 for r in reports if r.premium_tier),
            "by_installer": by_installer,
        }