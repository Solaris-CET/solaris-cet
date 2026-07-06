"""Cost & report dashboard — design v3."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from src.api_clients.cost_logger import CostLogger
from src.models import project_root
from src.report_registry import ReportRegistry
from src.soft_cost_roi import get_soft_cost_roi

DASHBOARD_VERSION = 3


def get_dashboard_data(
    registry: Optional[ReportRegistry] = None,
    cost_logger: Optional[CostLogger] = None,
) -> dict:
    reg = registry or ReportRegistry()
    cost = cost_logger or CostLogger()
    reports = reg.list_reports(limit=20)
    stats = reg.stats()

    usage_by_provider: dict[str, float] = {}
    usage_path = cost.log_path
    if usage_path.exists():
        import json
        for line in usage_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                rec = json.loads(line)
                prov = rec.get("provider", "unknown")
                usage_by_provider[prov] = usage_by_provider.get(prov, 0) + rec.get("cost_usd", 0)

    total_api = round(cost.total_cost(), 4)
    return {
        "version": DASHBOARD_VERSION,
        "stats": stats,
        "cost_by_provider": {k: round(v, 4) for k, v in usage_by_provider.items()},
        "total_api_cost_usd": total_api,
        "soft_cost_roi": get_soft_cost_roi(registry=reg, total_api_cost_usd=total_api),
        "recent_reports": [
            {
                "report_id": r.report_id,
                "client": r.client_name,
                "city": r.city,
                "score": r.suitability_score,
                "kwp": r.capacity_kwp,
                "cost_usd": r.cost_usd,
                "premium": r.premium_tier,
                "pdf": r.pdf_path,
                "installer_id": r.installer_id,
                "technician": r.technician_name,
            }
            for r in reports
        ],
        "by_installer": stats.get("by_installer", {}),
    }


def format_dashboard_markdown(data: dict) -> str:
    s = data["stats"]
    lines = [
        "## Dashboard SOLARIS CET",
        f"**Rapoarte totale:** {s.get('total_reports', 0)}",
        f"**Scor mediu:** {s.get('avg_score', 0)}/100",
        f"**Capacitate totală:** {s.get('total_capacity_kwp', 0)} kWp",
        f"**Premium:** {s.get('premium_count', 0)}",
        f"**Cost API total:** ${data.get('total_api_cost_usd', 0):.4f}",
        "",
        "### Cost per provider",
    ]
    for prov, c in data.get("cost_by_provider", {}).items():
        lines.append(f"- **{prov}:** ${c:.4f}")
    lines.append("\n### Rapoarte recente")
    for r in data.get("recent_reports", [])[:10]:
        lines.append(
            f"- `{r['report_id']}` · {r['client']} ({r['city']}) · "
            f"{r['score']}/100 · {r['kwp']} kWp · ${r['cost_usd']:.4f}"
        )
    if not data.get("recent_reports"):
        lines.append("_Niciun raport încă._")
    return "\n".join(lines)