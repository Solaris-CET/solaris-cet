"""Intelligent model routing based on job complexity and tier."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class VisionProvider(str, Enum):
    DEEPSEEK = "deepseek-v4-pro"
    KIMI = "kimi"


class WritingProvider(str, Enum):
    LOCAL = "local"  # heuristic builder (no API)
    SONNET = "claude-sonnet-5"
    FABLE = "claude-fable-5"


@dataclass
class RoutingDecision:
    vision: VisionProvider
    writing: WritingProvider
    reason: str


def route_job(num_photos: int, premium: bool, kimi_available: bool = False) -> RoutingDecision:
    """Choose vision + writing models for a survey job."""
    if num_photos >= 10 and kimi_available:
        vision = VisionProvider.KIMI
        vision_reason = f"{num_photos} poze → Kimi (long-context multi-image)"
    else:
        vision = VisionProvider.DEEPSEEK
        vision_reason = f"{num_photos} poze → DeepSeek V4 Pro (vision standard)"

    import os
    claude_ok = bool(os.environ.get("ANTHROPIC_API_KEY", ""))

    if claude_ok:
        if premium:
            writing = WritingProvider.FABLE
            write_reason = "Tier premium → Claude Fable 5"
        else:
            writing = WritingProvider.SONNET
            write_reason = "Tier standard → Claude Sonnet 5"
    else:
        writing = WritingProvider.LOCAL
        write_reason = "Claude indisponibil → builder local"

    return RoutingDecision(
        vision=vision,
        writing=writing,
        reason=f"{vision_reason}; {write_reason}",
    )