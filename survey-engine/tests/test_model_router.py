"""Tests for model router."""

from src.model_router import VisionProvider, route_job


def test_route_standard_job():
    d = route_job(4, premium=False)
    assert d.vision == VisionProvider.DEEPSEEK
    assert "DeepSeek" in d.reason


def test_route_many_photos_without_kimi():
    d = route_job(12, premium=False, kimi_available=False)
    assert d.vision == VisionProvider.DEEPSEEK


def test_route_many_photos_with_kimi():
    d = route_job(12, premium=False, kimi_available=True)
    assert d.vision == VisionProvider.KIMI


def test_route_premium():
    d = route_job(3, premium=True)
    assert "Fable" in d.reason or "local" in d.reason.lower() or "Claude" in d.reason