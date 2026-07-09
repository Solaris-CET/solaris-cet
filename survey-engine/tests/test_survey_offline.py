"""Tests for survey offline PWA hints."""

from src.survey_offline import SCHEMA_ID, offline_hints, offline_status


def test_offline_hints_schema():
    hints = offline_hints()
    assert hints["schema"] == SCHEMA_ID
    assert hints["queue_supported"] is True
    assert "/survey" in hints["prefetch_urls"]
    assert hints["indexeddb_schema"] == "solaris-survey-v1"
    assert hints["draft_schema"] == "solaris-survey-draft-v2"
    assert hints["conflict_resolution"] == "version_vector_lamport"
    assert hints["draft_sync_path"] == "/api/survey/draft-sync"


def test_offline_status():
    status = offline_status()
    assert status["engine_hints_available"] is True
    assert status["offline_schema"] == SCHEMA_ID