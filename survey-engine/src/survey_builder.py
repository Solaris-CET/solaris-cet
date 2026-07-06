"""Build a complete SiteSurvey from form data + photo analyses."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from src.models import (
    ChecklistItem,
    ChecklistStatus,
    ClientInfo,
    ExecutiveSummary,
    PhotoAnalysis,
    Recommendation,
    ReportMetadata,
    RoofOrientation,
    RoofType,
    ShadingLevel,
    SiteInfo,
    SiteSurvey,
    SystemEstimate,
)
from src.solar_calculator import estimate_production


def _estimate_system(site: SiteInfo) -> SystemEstimate:
    prod = estimate_production(site)
    return SystemEstimate(
        recommended_capacity_kwp=prod.capacity_kwp,
        estimated_annual_production_kwh=prod.annual_kwh,
        estimated_self_consumption_pct=65,
        panel_count=prod.panel_count,
        inverter_type=f"Hibrid monofazat {int(prod.capacity_kwp)}kW",
    )


def _suitability_score(checklist: list[ChecklistItem], photos: list[PhotoAnalysis]) -> int:
    base = 70
    for item in checklist:
        if item.status == ChecklistStatus.PASS:
            base += 4
        elif item.status == ChecklistStatus.WARNING:
            base -= 3
        elif item.status == ChecklistStatus.FAIL:
            base -= 12
    for photo in photos:
        base += int(photo.confidence * 3)
        base -= len(photo.issues) * 4
    return max(0, min(100, base))


def _build_summary(
    client: ClientInfo,
    site: SiteInfo,
    photos: list[PhotoAnalysis],
    estimate: SystemEstimate,
    score: int,
    premium: bool,
) -> ExecutiveSummary:
    findings: list[str] = []
    for p in photos:
        findings.extend(p.findings[:2])
    findings = findings[:5] or ["Analiză foto completă — date extrase cu succes"]

    coverage = estimate.estimated_annual_production_kwh / site.annual_consumption_kwh * 100
    overview = (
        f"Evaluarea șantierului pentru {client.name} ({client.city}) indică fezabilitate "
        f"{'ridicată' if score >= 75 else 'moderată' if score >= 50 else 'redusă'}. "
        f"Sistem recomandat: {estimate.recommended_capacity_kwp} kWp "
        f"({estimate.panel_count} panouri), producție estimată "
        f"{estimate.estimated_annual_production_kwh:,.0f} kWh/an — acoperire "
        f"{coverage:.0f}% din consumul declarat de {site.annual_consumption_kwh:,.0f} kWh."
    )
    if premium:
        overview += (
            " Raport generat la tier premium cu analiză extinsă "
            "și formulări optimizate pentru documentație AHJ."
        )

    if score >= 75:
        verdict = "Recomandat — instalare fezabilă cu verificări minime suplimentare"
    elif score >= 50:
        verdict = "Condiționat — necesită remedierea punctelor de atenție înainte de execuție"
    else:
        verdict = "Nerecomandat în forma actuală — evaluare suplimentară obligatorie"

    return ExecutiveSummary(
        overview=overview,
        key_findings=findings,
        suitability_score=score,
        suitability_verdict=verdict,
    )


def _build_recommendations(
    photos: list[PhotoAnalysis],
    checklist: list[ChecklistItem],
    estimate: SystemEstimate,
) -> list[Recommendation]:
    recs: list[Recommendation] = []

    for photo in photos:
        for note in photo.actionable_notes[:1]:
            recs.append(Recommendation(
                priority="high",
                title=f"Acțiune {photo.photo_id}: {photo.category.value}",
                description=note,
            ))
        for issue in photo.issues[:1]:
            recs.append(Recommendation(
                priority="medium",
                title=f"Remediere: {issue[:60]}",
                description=issue,
            ))

    for item in checklist:
        if item.status == ChecklistStatus.WARNING:
            recs.append(Recommendation(
                priority="medium",
                title=f"Verificare {item.category}",
                description=item.notes or item.description,
            ))
        elif item.status == ChecklistStatus.FAIL:
            recs.append(Recommendation(
                priority="high",
                title=f"Blocaj: {item.category}",
                description=item.notes or item.description,
            ))

    recs.append(Recommendation(
        priority="high",
        title=f"Dimensionare {estimate.recommended_capacity_kwp} kWp",
        description=(
            f"Configurație: {estimate.panel_count} panouri + {estimate.inverter_type}. "
            f"Autoconsum estimat {estimate.estimated_self_consumption_pct}%."
        ),
        estimated_cost_eur=round(estimate.recommended_capacity_kwp * 1400),
    ))
    recs.append(Recommendation(
        priority="low",
        title="Documentație autorizație",
        description="Plan situație, schema unifilară, declarație conformitate ANRE.",
    ))

    seen: set[str] = set()
    unique: list[Recommendation] = []
    for r in recs:
        if r.title not in seen:
            seen.add(r.title)
            unique.append(r)
    return unique[:6]


def build_survey(
    *,
    client_name: str,
    client_address: str,
    client_city: str,
    client_postal: str,
    client_phone: str,
    client_email: str,
    technician_name: str,
    roof_type: str,
    roof_orientation: str,
    roof_pitch: float,
    usable_area_m2: float,
    annual_consumption_kwh: float,
    grid_connection: str,
    shading_level: str,
    existing_solar: bool,
    structural_notes: str,
    checklist: list[ChecklistItem],
    photo_analyses: list[PhotoAnalysis],
    premium: bool = False,
    report_id: Optional[str] = None,
    jurisdiction_code: Optional[str] = None,
    jurisdiction_name: Optional[str] = None,
    grid_operator: Optional[str] = None,
    site_latitude: Optional[float] = None,
    site_longitude: Optional[float] = None,
) -> SiteSurvey:
    client = ClientInfo(
        name=client_name,
        address=client_address,
        city=client_city,
        postal_code=client_postal,
        phone=client_phone or None,
        email=client_email or None,
    )
    site = SiteInfo(
        roof_type=RoofType(roof_type),
        roof_orientation=RoofOrientation(roof_orientation),
        roof_pitch_degrees=roof_pitch,
        usable_area_m2=usable_area_m2,
        annual_consumption_kwh=annual_consumption_kwh,
        grid_connection=grid_connection,
        existing_solar=existing_solar,
        shading_level=ShadingLevel(shading_level),
        structural_notes=structural_notes or None,
    )
    estimate = _estimate_system(site)
    score = _suitability_score(checklist, photo_analyses)
    rid = report_id or f"SOL-{datetime.now().strftime('%Y%m%d-%H%M')}"

    return SiteSurvey(
        metadata=ReportMetadata(
            report_id=rid,
            generated_at=datetime.now(),
            technician_name=technician_name,
            survey_date=date.today(),
            premium_tier=premium,
            jurisdiction_code=jurisdiction_code,
            jurisdiction_name=jurisdiction_name,
            grid_operator=grid_operator,
            site_latitude=site_latitude,
            site_longitude=site_longitude,
        ),
        client=client,
        site=site,
        photo_analyses=photo_analyses,
        checklist=checklist,
        system_estimate=estimate,
        executive_summary=_build_summary(client, site, photo_analyses, estimate, score, premium),
        recommendations=_build_recommendations(photo_analyses, checklist, estimate),
    )