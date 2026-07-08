"""Tests for Kimi API client helpers."""

from pathlib import Path

import pytest

from src.api_clients.kimi import KimiClient, KimiError


def test_configured_requires_api_key():
    client = KimiClient(api_key="")
    assert client.configured is False
    assert KimiClient(api_key="sk-test").configured is True


def test_extract_json_from_fence():
    client = KimiClient(api_key="sk-test")
    parsed = client._extract_json('```json\n{"photos": [{"photo_id": "1"}]}\n```')
    assert parsed["photos"][0]["photo_id"] == "1"


def test_analyze_images_batch_requires_api_key():
    client = KimiClient(api_key="")
    with pytest.raises(KimiError, match="KIMI_API_KEY"):
        client.analyze_images_batch([], "prompt")


def test_analyze_images_batch_requires_images(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("KIMI_API_KEY", "sk-test")
    client = KimiClient()
    with pytest.raises(KimiError, match="Nicio imagine"):
        client.analyze_images_batch([], "prompt")