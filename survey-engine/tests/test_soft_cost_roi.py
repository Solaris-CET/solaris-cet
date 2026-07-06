"""Tests for soft-cost ROI metrics."""

from src.report_registry import ReportRecord
from src.soft_cost_roi import compute_soft_cost_roi, roi_config


def _record(installer_id: str, kwp: float = 5.0, cost: float = 0.05) -> ReportRecord:
    return ReportRecord(
        report_id=f"SOL-TEST-{installer_id}",
        client_name="Test",
        city="București",
        pdf_path="/tmp/x.pdf",
        capacity_kwp=kwp,
        suitability_score=80,
        cost_usd=cost,
        installer_id=installer_id,
    )


def test_roi_config_defaults():
    cfg = roi_config()
    assert cfg["minutes_saved_per_report"] == 40.0
    assert cfg["eur_labor_saved_per_report"] == 23.33


def test_compute_platform_totals():
    cfg = roi_config()
    reports = [_record("INST-A"), _record("INST-A"), _record("INST-B")]
    roi = compute_soft_cost_roi(reports, total_api_cost_usd=0.15, config=cfg)
    p = roi["platform"]
    assert p["total_reports"] == 3
    assert p["minutes_saved_total"] == 120.0
    assert p["eur_labor_saved_total"] == 69.99
    assert p["eur_per_report_labor"] == 23.33
    assert len(roi["by_installer"]) == 2
    inst_a = next(x for x in roi["by_installer"] if x["installer_id"] == "INST-A")
    assert inst_a["reports"] == 2
    assert inst_a["minutes_saved"] == 80.0
    assert inst_a["eur_labor_saved"] == 46.66


def test_dashboard_includes_soft_cost_roi(client):
    res = client.get("/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "soft_cost_roi" in data
    assert "platform" in data["soft_cost_roi"]
    assert "by_installer" in data["soft_cost_roi"]


def test_stats_includes_soft_cost_roi(client):
    res = client.get("/stats")
    assert res.status_code == 200
    data = res.json()
    assert "soft_cost_roi" in data