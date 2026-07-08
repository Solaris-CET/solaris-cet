"""Tests for DeepSeek API client helpers."""

from pathlib import Path

import pytest

from src.api_clients.deepseek import DeepSeekClient, DeepSeekError


def test_configured_requires_api_key():
    client = DeepSeekClient(api_key="")
    assert client.configured is False
    assert DeepSeekClient(api_key="sk-test").configured is True


def test_extract_json_plain_object():
    client = DeepSeekClient(api_key="sk-test")
    assert client._extract_json('{"photos": []}') == {"photos": []}


def test_analyze_image_requires_api_key(tmp_path: Path):
    client = DeepSeekClient(api_key="")
    with pytest.raises(DeepSeekError, match="DEEPSEEK_API_KEY"):
        client.analyze_image(tmp_path / "x.jpg", "prompt", "p1")


def test_analyze_image_missing_file(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "sk-test")
    client = DeepSeekClient()
    missing = tmp_path / "missing.jpg"
    with pytest.raises(DeepSeekError, match="nu există"):
        client.analyze_image(missing, "prompt", "p1")