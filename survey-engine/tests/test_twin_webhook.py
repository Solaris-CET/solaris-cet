"""Tests for bidirectional twin CRM webhooks."""

from pathlib import Path

import pytest

from src.twin_webhook import (
    DELIVERY_SCHEMA,
    dispatch_outbound_twin_webhook,
    handle_inbound_webhook,
    list_deliveries,
    log_delivery,
    webhook_status,
)


def test_log_and_list_deliveries(tmp_path: Path, monkeypatch):
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    log_delivery(
        direction="outbound",
        status="skipped",
        event_type="report_generated",
        report_id="SOL-WH-1",
        detail="test",
    )
    rows = list_deliveries(limit=10)
    assert len(rows) == 1
    assert rows[0]["schema"] == DELIVERY_SCHEMA
    assert rows[0]["report_id"] == "SOL-WH-1"


def test_outbound_idempotent_by_event_id(tmp_path: Path, monkeypatch):
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.delenv("TWIN_WEBHOOK_URL", raising=False)
    event = {"report_id": "SOL-WH-ID", "event_type": "twin_ready", "event_id": "dup-1"}
    first = dispatch_outbound_twin_webhook(event)
    second = dispatch_outbound_twin_webhook(event)
    assert first["status"] == "skipped"
    assert second["status"] == "duplicate"
    rows = list_deliveries(limit=10)
    assert len(rows) == 2


def test_outbound_skipped_without_url(tmp_path: Path, monkeypatch):
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.delenv("TWIN_WEBHOOK_URL", raising=False)
    event = {"report_id": "SOL-WH-2", "event_type": "twin_ready", "event_id": "e1"}
    row = dispatch_outbound_twin_webhook(event)
    assert row["status"] == "skipped"


def test_inbound_publishes_crm_sync(tmp_path: Path, monkeypatch):
    events_file = tmp_path / "output" / "twin_events.jsonl"
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_runtime.events_path", lambda: events_file)
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    monkeypatch.setenv("TWIN_WEBHOOK_URL", "")

    result = handle_inbound_webhook({"report_id": "SOL-IN-1", "event": "crm_lead_updated", "lead_id": "L1"})
    assert result["ok"] is True
    assert result["twin_event"]["event_type"] == "crm_sync"

    from src.twin_runtime import list_twin_events

    events = list_twin_events("SOL-IN-1")
    assert len(events) == 1
    inbound_rows = list_deliveries(direction="inbound")
    assert len(inbound_rows) >= 1


def test_webhook_status(tmp_path: Path, monkeypatch):
    deliveries_file = tmp_path / "output" / "twin_webhook_deliveries.jsonl"
    monkeypatch.setattr("src.twin_webhook.deliveries_path", lambda: deliveries_file)
    status = webhook_status()
    assert status["deliveries_total"] == 0
    assert "outbound_configured" in status