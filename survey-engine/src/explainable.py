"""Explainable findings — confidence + evidence_photo_ids (S4 / L-SUP-GATE)."""

from __future__ import annotations

from typing import Any, Optional

from src.models import PhotoAnalysis, SiteSurvey

LOW_CONFIDENCE_THRESHOLD = 0.7


def enrich_photo_analysis(analysis: PhotoAnalysis) -> PhotoAnalysis:
    """Ensure evidence_photo_ids defaults to the photo itself."""
    ids = analysis.evidence_photo_ids or [analysis.photo_id]
    reasoning = analysis.reasoning_short or f"Analiză vizuală categorie {analysis.category.value}"
    if analysis.evidence_photo_ids == ids and analysis.reasoning_short == reasoning:
        return analysis
    return analysis.model_copy(update={
        "evidence_photo_ids": ids,
        "reasoning_short": reasoning,
    })


def build_explainable_findings(survey: SiteSurvey) -> list[dict[str, Any]]:
    """One row per vision claim with traceability."""
    rows: list[dict[str, Any]] = []
    for photo in survey.photo_analyses:
        enriched = enrich_photo_analysis(photo)
        evidence = enriched.evidence_photo_ids or [enriched.photo_id]
        for claim in enriched.findings:
            rows.append({
                "claim": claim,
                "confidence": round(enriched.confidence, 3),
                "evidence_photo_ids": evidence,
                "reasoning_short": enriched.reasoning_short,
                "category": enriched.category.value,
                "photo_id": enriched.photo_id,
            })
    return rows


def build_explainable_findings_from_ahj(ahj: Optional[dict[str, Any]]) -> dict[str, Any]:
    """Read explainable block from AHJ package or derive from technical summary."""
    if not ahj:
        return {"findings": [], "low_confidence_count": 0}
    if "explainable_findings" in ahj:
        findings = ahj["explainable_findings"]
    else:
        findings = []
        for finding in ahj.get("technical_summary", {}).get("key_findings", []):
            findings.append({
                "claim": finding,
                "confidence": 0.85,
                "evidence_photo_ids": [],
                "reasoning_short": "Constatare din sumar executiv",
            })
    low = sum(1 for f in findings if float(f.get("confidence", 1)) < LOW_CONFIDENCE_THRESHOLD)
    return {"findings": findings, "low_confidence_count": low}


def build_basis_narrative(findings: list[dict[str, Any]]) -> list[str]:
    """Short paragraphs for PDF „Basis of opinion” section."""
    if not findings:
        return ["Nu există constatări vision înregistrate pentru acest raport."]
    lines: list[str] = []
    for i, row in enumerate(findings[:12], 1):
        evidence = ", ".join(row.get("evidence_photo_ids") or []) or "—"
        conf = int(float(row.get("confidence", 0)) * 100)
        lines.append(
            f"{i}. {row['claim']} "
            f"(încredere {conf}%, dovezi: {evidence}) — {row.get('reasoning_short', '')}"
        )
    if len(findings) > 12:
        lines.append(f"… și încă {len(findings) - 12} constatări documentate în JSON AHJ.")
    return lines