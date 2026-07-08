"""Tests for Fable-inspired agent harness."""

from src.agent_harness import (
    EffortLevel,
    EvidencePacket,
    effort_for_job,
    verifier_loop,
)


def test_effort_for_job_premium_ambiguous():
    assert effort_for_job(premium=True, photo_count=4, ambiguous=True) == EffortLevel.HIGH


def test_effort_for_job_premium_routine():
    assert effort_for_job(premium=True, photo_count=4) == EffortLevel.MEDIUM


def test_effort_for_job_standard_many_photos():
    assert effort_for_job(premium=False, photo_count=10) == EffortLevel.MEDIUM


def test_effort_for_job_standard_light():
    assert effort_for_job(premium=False, photo_count=3) == EffortLevel.LOW


def test_evidence_packet_grounded():
    pkt = EvidencePacket("c1", "Inverter label visible", section="DC")
    grounded = pkt.with_evidence(["P001", "P002"], confidence=0.82)
    assert grounded.is_grounded()
    assert grounded.evidence_photo_ids == ("P001", "P002")


def test_evidence_packet_not_grounded_without_photos():
    pkt = EvidencePacket("c2", "Cable gauge OK", confidence=0.9)
    assert not pkt.is_grounded()


def test_verifier_loop_passes_on_second_round():
    attempts = {"n": 0}

    def produce() -> int:
        attempts["n"] += 1
        return attempts["n"]

    def verify(value: int) -> tuple[bool, str]:
        if value >= 2:
            return True, "stable"
        return False, "needs retry"

    result = verifier_loop(produce, verify, max_rounds=3)
    assert result.passed
    assert result.rounds == 2
    assert result.value == 2
    assert len(result.trace) == 2


def test_verifier_loop_fails_after_max_rounds():
    result = verifier_loop(
        lambda: 0,
        lambda _: (False, "always bad"),
        max_rounds=2,
    )
    assert not result.passed
    assert result.rounds == 2