"""Tests for HARD-002 installer budget enforcement."""

from pathlib import Path

import pytest

from src.installer_budget import (
    BudgetExceededError,
    assert_budget_available,
    budget_status,
    monthly_spend_usd,
)
from src.models import get_sample_survey
from src.report_registry import ReportRegistry


def test_budget_status_unconfigured(monkeypatch):
    monkeypatch.delenv("INSTALLER_BUDGETS", raising=False)
    status = budget_status("INST-X")
    assert status["configured"] is False


def test_budget_exceeded_blocks_generation(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("INSTALLER_BUDGETS", '{"INST-BLOCK": 1.0}')
    reg = ReportRegistry(index_path=tmp_path / "reports_index.jsonl")
    survey = get_sample_survey()
    reg.register(
        survey,
        tmp_path / "r.pdf",
        cost_usd=1.5,
        installer_id="INST-BLOCK",
    )
    monkeypatch.setattr("src.installer_budget.ReportRegistry", lambda: reg)

    status = budget_status("INST-BLOCK", registry=reg)
    assert status["exceeded"] is True
    with pytest.raises(BudgetExceededError):
        assert_budget_available("INST-BLOCK", registry=reg)


def test_monthly_spend_filters_by_installer(tmp_path: Path):
    reg = ReportRegistry(index_path=tmp_path / "reports_index.jsonl")
    s1 = get_sample_survey()
    s2 = get_sample_survey()
    reg.register(s1, tmp_path / "a.pdf", cost_usd=0.2, installer_id="INST-A")
    reg.register(s2, tmp_path / "b.pdf", cost_usd=0.4, installer_id="INST-B")
    assert monthly_spend_usd("INST-A", registry=reg) == 0.2