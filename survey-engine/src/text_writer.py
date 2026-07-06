"""Enhance survey text with Claude or local fallback — v3."""

from __future__ import annotations

import json

from src.api_clients.claude import ClaudeClient, ClaudeError
from src.models import ExecutiveSummary, Recommendation, SiteSurvey


def _survey_context(survey: SiteSurvey) -> dict:
    return {
        "client": survey.client.model_dump(),
        "site": survey.site.model_dump(),
        "system_estimate": survey.system_estimate.model_dump(),
        "checklist": [c.model_dump() for c in survey.checklist],
        "photo_analyses": [
            {
                "photo_id": p.photo_id,
                "category": p.category.value,
                "findings": p.findings,
                "issues": p.issues,
                "actionable_notes": p.actionable_notes,
            }
            for p in survey.photo_analyses
        ],
        "current_score": survey.executive_summary.suitability_score,
    }


def enhance_survey_text(survey: SiteSurvey, premium: bool = False) -> SiteSurvey:
    """Iteration 3: Claude if configured, else keep local text."""
    client = ClaudeClient()
    if not client.configured:
        return survey

    try:
        data = client.write_report_text(
            _survey_context(survey),
            premium=premium,
            report_id=survey.metadata.report_id,
        )
    except (ClaudeError, json.JSONDecodeError, KeyError):
        return survey

    recs = []
    for r in data.get("recommendations", [])[:6]:
        recs.append(Recommendation(
            priority=r.get("priority", "medium"),
            title=r.get("title", "Recomandare"),
            description=r.get("description", ""),
            estimated_cost_eur=r.get("estimated_cost_eur"),
        ))

    survey.executive_summary = ExecutiveSummary(
        overview=data.get("overview", survey.executive_summary.overview),
        key_findings=data.get("key_findings", survey.executive_summary.key_findings),
        suitability_score=survey.executive_summary.suitability_score,
        suitability_verdict=data.get("suitability_verdict", survey.executive_summary.suitability_verdict),
    )
    if recs:
        survey.recommendations = recs
    return survey