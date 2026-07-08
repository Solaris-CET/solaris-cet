"""Tests for Claude API client helpers."""

import pytest

from src.api_clients.claude import ClaudeClient, ClaudeError


def test_configured_requires_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    client = ClaudeClient(api_key="")
    assert client.configured is False
    client_with_key = ClaudeClient(api_key="sk-test")
    assert client_with_key.configured is True


def test_extract_json_from_fence():
    client = ClaudeClient(api_key="sk-test")
    parsed = client._extract_json('```json\n{"ok": true}\n```')
    assert parsed == {"ok": True}


def test_cost_estimates_differ_by_model():
    client = ClaudeClient(api_key="sk-test")
    sonnet = client._cost("claude-sonnet-5-20250929", 1_000_000, 0)
    fable = client._cost("claude-fable-5", 1_000_000, 0)
    assert fable > sonnet


def test_write_report_text_without_key_raises(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    client = ClaudeClient(api_key="")
    with pytest.raises(ClaudeError, match="ANTHROPIC_API_KEY"):
        client.write_report_text({"site": {}}, premium=False)