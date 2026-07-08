"""Tests for api_clients package exports."""

import src.api_clients as api_clients
from src.api_clients import (
    ClaudeClient,
    ClaudeError,
    CostLogger,
    DeepSeekClient,
    DeepSeekError,
    KimiClient,
    KimiError,
    UsageRecord,
)


def test_package_exports_public_clients():
    assert api_clients.__all__ == [
        "ClaudeClient",
        "ClaudeError",
        "CostLogger",
        "DeepSeekClient",
        "DeepSeekError",
        "KimiClient",
        "KimiError",
        "UsageRecord",
    ]
    assert ClaudeClient is api_clients.ClaudeClient
    assert DeepSeekClient is api_clients.DeepSeekClient
    assert KimiClient is api_clients.KimiClient
    assert CostLogger is api_clients.CostLogger
    assert UsageRecord is api_clients.UsageRecord


def test_error_types_are_exceptions():
    assert issubclass(ClaudeError, Exception)
    assert issubclass(DeepSeekError, Exception)
    assert issubclass(KimiError, Exception)