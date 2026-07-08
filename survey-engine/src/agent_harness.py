"""Fable 5-inspired agent harness — effort calibration, evidence packets, verifier loops.

Patterns adapted from the public Claude Fable 5 system prompt leak (see
docs/planning/FABLE5-LEAK-REFERENCE.md). Used for checklist + photo workflows
where every claim must cite evidence_photo_ids.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


class EffortLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    XHIGH = "xhigh"


@dataclass(frozen=True)
class EvidencePacket:
    """Structured evidence bundle for a single checklist claim."""

    claim_id: str
    claim: str
    evidence_photo_ids: tuple[str, ...] = ()
    confidence: float = 0.0
    section: str = ""  # e.g. DC, AC, ACM

    def with_evidence(self, photo_ids: list[str], *, confidence: float) -> EvidencePacket:
        return EvidencePacket(
            claim_id=self.claim_id,
            claim=self.claim,
            evidence_photo_ids=tuple(photo_ids),
            confidence=confidence,
            section=self.section,
        )

    def is_grounded(self, *, min_confidence: float = 0.5) -> bool:
        return bool(self.evidence_photo_ids) and self.confidence >= min_confidence


def effort_for_job(
    *,
    premium: bool,
    photo_count: int,
    ambiguous: bool = False,
) -> EffortLevel:
    """Map survey job traits to API effort (Fable effort calibration)."""
    if premium and (ambiguous or photo_count >= 12):
        return EffortLevel.HIGH
    if premium:
        return EffortLevel.MEDIUM
    if photo_count >= 8 or ambiguous:
        return EffortLevel.MEDIUM
    return EffortLevel.LOW


@dataclass
class VerifierResult(Generic[T]):
    value: T
    trace: list[str] = field(default_factory=list)
    passed: bool = False
    rounds: int = 0


def verifier_loop(
    produce: Callable[[], T],
    verify: Callable[[T], tuple[bool, str]],
    *,
    max_rounds: int = 3,
) -> VerifierResult[T]:
    """Produce → verify until pass or max_rounds (Fable verifier pattern)."""
    trace: list[str] = []
    last: T | None = None
    for round_idx in range(1, max_rounds + 1):
        last = produce()
        ok, reason = verify(last)
        trace.append(f"round {round_idx}: {'pass' if ok else 'fail'} — {reason}")
        if ok:
            return VerifierResult(value=last, trace=trace, passed=True, rounds=round_idx)
    assert last is not None
    return VerifierResult(value=last, trace=trace, passed=False, rounds=max_rounds)