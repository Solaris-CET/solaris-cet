"""End-to-end survey pipeline: photos → analysis → PDF + AHJ."""

from __future__ import annotations

import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

from src.ahj_export import export_ahj_json
from src.api_clients.claude import ClaudeClient
from src.api_clients.deepseek import DeepSeekClient
from src.api_clients.kimi import KimiClient
from src.jurisdictions import resolve_jurisdiction
from src.model_router import VisionProvider, route_job
from src.photo_metadata import best_site_coordinates, extract_batch_geo
from src.models import ChecklistItem, ChecklistStatus, PhotoAnalysis, SiteSurvey, project_root
from src.photo_analyzer import PhotoAnalyzer, guess_category
from src.report_generator import generate_report
from src.report_registry import ReportRegistry
from src.survey_builder import build_survey
from src.text_writer import enhance_survey_text

ProgressFn = Callable[[float, str], None]
MAX_PHOTOS = 20


@dataclass
class PipelineResult:
    survey: SiteSurvey
    pdf_path: Path
    ahj_path: Path
    routing_reason: str
    cost_usd: float


def _noop_progress(pct: float, msg: str) -> None:
    pass


def _mock_photo_analysis(photo_path: Path, photo_id: str) -> PhotoAnalysis:
    cat = guess_category(photo_path.name)
    return PhotoAnalysis(
        photo_id=photo_id,
        category=cat,
        file_path=str(photo_path),
        findings=[f"Imagine {photo_path.name} înregistrată pentru raport"],
        issues=[],
        actionable_notes=["Validare manuală recomandată fără API DeepSeek"],
        confidence=0.6,
        evidence_photo_ids=[photo_id],
        reasoning_short=f"Analiză demo categorie {cat.value}",
    )


def run_pipeline(
    *,
    photo_paths: list[str | Path],
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
    premium: bool = False,
    output_dir: Optional[Path] = None,
    installer_id: str = "",
    jurisdiction_code: str = "",
    site_latitude: Optional[float] = None,
    site_longitude: Optional[float] = None,
    progress: ProgressFn = _noop_progress,
) -> PipelineResult:
    if not photo_paths:
        raise ValueError("Încarcă cel puțin o poză")
    if len(photo_paths) > MAX_PHOTOS:
        raise ValueError(f"Maxim {MAX_PHOTOS} poze per raport")

    progress(0.05, "Rutare model...")
    claude_ok = ClaudeClient().configured
    kimi_client = KimiClient()
    ds_client = DeepSeekClient()
    routing = route_job(len(photo_paths), premium, kimi_available=kimi_client.configured)
    progress(0.1, routing.reason)

    work_dir = Path(tempfile.mkdtemp(prefix="solaris_"))
    stored: list[Path] = []
    try:
        for i, raw in enumerate(photo_paths[:MAX_PHOTOS], 1):
            src = Path(raw)
            if not src.exists():
                continue
            dest = work_dir / f"P{i:03d}_{src.name}"
            shutil.copy2(src, dest)
            stored.append(dest)

        if not stored:
            raise ValueError("Nicio imagine validă găsită")

        progress(0.12, "Extragere metadata poze...")
        geos = extract_batch_geo(stored)
        lat, lon = best_site_coordinates(geos, site_latitude, site_longitude)
        jurisdiction = resolve_jurisdiction(jurisdiction_code or None, client_city)

        progress(0.15, f"Analiză {len(stored)} poze...")
        analyses: list[PhotoAnalysis] = []
        from src.photo_analyzer import load_prompt, parse_photo_analysis

        if routing.vision == VisionProvider.KIMI and kimi_client.configured:
            progress(0.2, "Analiză Kimi multi-image...")
            prompt = load_prompt()
            batch = kimi_client.analyze_images_batch(stored, prompt)
            for i, (path, data) in enumerate(zip(stored, batch), 1):
                if not isinstance(data, dict):
                    analyses.append(_mock_photo_analysis(path, f"P{i:03d}"))
                    continue
                if "photo_id" not in data:
                    data["photo_id"] = f"P{i:03d}"
                analyses.append(parse_photo_analysis(data, path))
            while len(analyses) < len(stored):
                analyses.append(_mock_photo_analysis(stored[len(analyses)], f"P{len(analyses)+1:03d}"))
        elif ds_client.configured:
            analyzer = PhotoAnalyzer(ds_client)
            for i, path in enumerate(stored, 1):
                pct = 0.15 + (i / len(stored)) * 0.50
                progress(pct, f"Analiză {path.name}...")
                data = ds_client.analyze_image(
                    path, analyzer.prompt, f"P{i:03d}",
                    report_id=None,
                )
                analyses.append(parse_photo_analysis(data, path))
        else:
            progress(0.3, "Mod demo — fără API vision")
            for i, path in enumerate(stored, 1):
                analyses.append(_mock_photo_analysis(path, f"P{i:03d}"))

        progress(0.68, "Construire raport...")
        survey = build_survey(
            client_name=client_name,
            client_address=client_address,
            client_city=client_city,
            client_postal=client_postal,
            client_phone=client_phone,
            client_email=client_email,
            technician_name=technician_name,
            roof_type=roof_type,
            roof_orientation=roof_orientation,
            roof_pitch=roof_pitch,
            usable_area_m2=usable_area_m2,
            annual_consumption_kwh=annual_consumption_kwh,
            grid_connection=grid_connection,
            shading_level=shading_level,
            existing_solar=existing_solar,
            structural_notes=structural_notes,
            checklist=checklist,
            photo_analyses=analyses,
            premium=premium,
            jurisdiction_code=jurisdiction.code,
            jurisdiction_name=jurisdiction.name,
            grid_operator=jurisdiction.grid_operator,
            site_latitude=lat,
            site_longitude=lon,
        )

        if claude_ok:
            progress(0.78, "Scriere premium Claude...")
            survey = enhance_survey_text(survey, premium=premium)

        out = output_dir or (project_root() / "output")
        out.mkdir(parents=True, exist_ok=True)

        progress(0.85, "Export AHJ...")
        ahj_path = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")

        progress(0.92, "Generare PDF...")
        pdf_path = generate_report(survey, out)

        total_cost = (
            ds_client.cost_logger.total_cost()
            + kimi_client.cost_logger.total_cost()
            + ClaudeClient().cost_logger.total_cost()
        )
        ReportRegistry().register(
            survey, pdf_path, ahj_path, cost_usd=total_cost, routing=routing.reason,
            installer_id=installer_id,
        )

        progress(1.0, "Gata!")
        return PipelineResult(
            survey=survey,
            pdf_path=pdf_path,
            ahj_path=ahj_path,
            routing_reason=routing.reason,
            cost_usd=total_cost,
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def default_checklist(
    struct_status: str = "pass",
    electric_status: str = "pass",
    shading_status: str = "warning",
    access_status: str = "pass",
    docs_status: str = "pass",
    compliance_status: str = "warning",
) -> list[ChecklistItem]:
    items = [
        ("CHK-01", "Structură", "Starea structurală a acoperișului", struct_status),
        ("CHK-02", "Electric", "Capacitate tablou electric", electric_status),
        ("CHK-03", "Umbrire", "Analiză umbrire statică/dinamică", shading_status),
        ("CHK-04", "Acces", "Acces sigur pentru montaj", access_status),
        ("CHK-05", "Documentație", "Acte proprietate și acorduri", docs_status),
        ("CHK-06", "Conformitate", "Distanțe coș fum / muchii", compliance_status),
    ]
    return [
        ChecklistItem(id=i, category=c, description=d, status=ChecklistStatus(s))
        for i, c, d, s in items
    ]