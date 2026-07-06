"""Tests for Faza 7–10: Kimi routing, jurisdictions, metadata, auth, rate limit."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.api_clients.kimi import KimiClient
from src.installer_auth import require_key_if_configured, validate_installer_key
from src.jurisdictions import resolve_jurisdiction
from src.model_router import VisionProvider, route_job
from src.photo_metadata import PhotoGeo, best_site_coordinates
from src.rate_limit import check_rate_limit, reset_limits


def test_route_kimi_when_available():
    d = route_job(12, premium=False, kimi_available=True)
    assert d.vision == VisionProvider.KIMI


def test_resolve_jurisdiction_by_city():
    j = resolve_jurisdiction(city="Cluj-Napoca")
    assert j.code == "RO-CJ"


def test_resolve_jurisdiction_by_code():
    j = resolve_jurisdiction(code="RO-VS")
    assert j.name == "Vaslui"


def test_best_site_coordinates_prefers_browser():
    geos = [PhotoGeo("P001", "a.jpg", 46.0, 27.0)]
    lat, lon = best_site_coordinates(geos, 45.5, 25.5)
    assert lat == 45.5
    assert lon == 25.5


def test_installer_auth_disabled_by_default(monkeypatch):
    monkeypatch.delenv("INSTALLER_API_KEYS", raising=False)
    ok, msg = require_key_if_configured(None)
    assert ok is True


def test_installer_auth_valid_key(monkeypatch):
    monkeypatch.setenv("INSTALLER_API_KEYS", '{"INST-A":"secret-key"}')
    assert validate_installer_key("secret-key") == "INST-A"
    ok, installer = require_key_if_configured("secret-key")
    assert ok is True
    assert installer == "INST-A"


def test_rate_limit_blocks_after_threshold():
    reset_limits()
    for _ in range(5):
        allowed, _ = check_rate_limit("test-key", limit=5, window_s=3600)
        assert allowed is True
    allowed, retry = check_rate_limit("test-key", limit=5, window_s=3600)
    assert allowed is False
    assert retry > 0
    reset_limits()


def test_kimi_not_configured():
    client = KimiClient(api_key="")
    assert client.configured is False


def test_kimi_analyze_batch_mock(tmp_path: Path):
    img = tmp_path / "p.jpg"
    img.write_bytes(b"\xff\xd8\xff" + b"\x00" * 80)
    client = KimiClient(api_key="test-key")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": '{"photos":[{"photo_id":"P001","category":"other","findings":["ok"],"issues":[],"actionable_notes":[],"confidence":0.9}]}'}}],
        "usage": {"prompt_tokens": 100, "completion_tokens": 50},
    }
    with patch("httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.post.return_value = mock_resp
        result = client.analyze_images_batch([img], "analyze")
    assert len(result) == 1
    assert result[0]["photo_id"] == "P001"