"""FastAPI server — bridge între platformă Node și survey engine."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from typing import Optional

from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from src.api_clients.cost_logger import CostLogger
from src.ahj_export import build_permit_zip_from_registry, export_ahj_json
from src.context_api import build_report_context
from src.corrections import log_correction
from src.batch_processor import BatchJob, parse_upload_photo_key, run_batch_uploaded
from src.dashboard import format_dashboard_markdown, get_dashboard_data
from src.models import get_sample_survey, project_root
from src.pipeline import MAX_PHOTOS, default_checklist, run_pipeline
from src.installer_auth import require_key_if_configured
from src.jurisdictions import list_jurisdiction_codes
from src.rate_limit import check_rate_limit
from src.report_generator import generate_report
from src.report_registry import ReportRegistry

load_dotenv(project_root() / ".env")


def _guard_api(request: Request, x_installer_key: Optional[str]) -> str:
    ok, msg = require_key_if_configured(x_installer_key)
    if not ok:
        raise HTTPException(401, msg)
    rate_key = x_installer_key or (request.client.host if request.client else "anon")
    allowed, retry = check_rate_limit(rate_key)
    if not allowed:
        raise HTTPException(429, f"Rate limit — reîncearcă în {retry}s")
    return msg

app = FastAPI(title="SOLARIS CET Survey Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cost_budget_status() -> dict:
    budget = float(os.getenv("SURVEY_COST_BUDGET_USD", "15") or "15")
    total = CostLogger().total_cost()
    return {
        "budget_usd": budget,
        "spent_usd": round(total, 4),
        "remaining_usd": round(max(0.0, budget - total), 4),
        "alert": total >= budget * 0.85,
        "exceeded": total >= budget,
    }


@app.get("/health")
def health():
    from src.api_clients.deepseek import DeepSeekClient
    from src.api_clients.claude import ClaudeClient
    from src.api_clients.kimi import KimiClient
    from src.installer_auth import keys_configured
    ds = DeepSeekClient()
    cl = ClaudeClient()
    km = KimiClient()
    cost = _cost_budget_status()
    return {
        "ok": True,
        "service": "survey-engine",
        "deepseek": ds.configured,
        "claude": cl.configured,
        "kimi": km.configured,
        "installer_keys_required": keys_configured(),
        "root": str(project_root()),
        "cost_budget": cost,
    }


@app.get("/jurisdictions")
def jurisdictions():
    return {"jurisdictions": list_jurisdiction_codes()}


@app.get("/stats")
def public_stats():
    data = get_dashboard_data()
    return {
        "total_reports": data["stats"].get("total_reports", 0),
        "avg_score": data["stats"].get("avg_score", 0),
        "total_capacity_kwp": data["stats"].get("total_capacity_kwp", 0),
        "total_api_cost_usd": data.get("total_api_cost_usd", 0),
        "by_installer": data["stats"].get("by_installer", {}),
        "soft_cost_roi": data.get("soft_cost_roi"),
    }


@app.get("/dashboard")
def dashboard():
    return get_dashboard_data()


@app.get("/dashboard/markdown")
def dashboard_md():
    return {"markdown": format_dashboard_markdown(get_dashboard_data())}


class DemoResponse(BaseModel):
    report_id: str
    pdf_path: str
    score: int


@app.post("/demo", response_model=DemoResponse)
def demo_report():
    survey = get_sample_survey()
    out = project_root() / "output"
    pdf = generate_report(survey, out)
    ahj = export_ahj_json(survey, out / f"AHJ_{survey.metadata.report_id}.json")
    ReportRegistry().register(survey, pdf, ahj, cost_usd=0.0, routing="demo", installer_id="demo")
    return DemoResponse(
        report_id=survey.metadata.report_id,
        pdf_path=str(pdf),
        score=survey.executive_summary.suitability_score,
    )


class GenerateResponse(BaseModel):
    report_id: str
    pdf_filename: str
    ahj_filename: str
    pdf_path: str
    score: int
    verdict: str
    capacity_kwp: float
    annual_kwh: float
    routing_reason: str
    cost_usd: float
    installer_id: str = ""


@app.post("/generate", response_model=GenerateResponse)
async def generate_survey(
    request: Request,
    photos: list[UploadFile] = File(...),
    x_installer_key: Optional[str] = Header(None),
    premium: bool = Form(False),
    client_name: str = Form("Client"),
    client_address: str = Form(""),
    client_city: str = Form(""),
    client_postal: str = Form(""),
    client_phone: str = Form(""),
    client_email: str = Form(""),
    technician_name: str = Form("Tehnician"),
    installer_id: str = Form(""),
    installer_name: str = Form(""),
    roof_type: str = Form("tile"),
    roof_orientation: str = Form("S"),
    roof_pitch: float = Form(35.0),
    usable_area_m2: float = Form(42.5),
    annual_consumption_kwh: float = Form(4800.0),
    grid_connection: str = Form("single-phase"),
    shading_level: str = Form("low"),
    existing_solar: bool = Form(False),
    structural_notes: str = Form(""),
    chk_struct: str = Form("pass"),
    chk_electric: str = Form("pass"),
    chk_shading: str = Form("warning"),
    chk_access: str = Form("pass"),
    chk_docs: str = Form("pass"),
    chk_compliance: str = Form("warning"),
    jurisdiction_code: str = Form(""),
    site_latitude: Optional[float] = Form(None),
    site_longitude: Optional[float] = Form(None),
):
    auth_installer = _guard_api(request, x_installer_key)
    if not photos:
        raise HTTPException(400, "Încarcă cel puțin o poză")
    if len(photos) > MAX_PHOTOS:
        raise HTTPException(400, f"Maxim {MAX_PHOTOS} poze per raport")

    work_dir = Path(tempfile.mkdtemp(prefix="solaris_upload_"))
    stored: list[Path] = []
    try:
        for i, upload in enumerate(photos[:MAX_PHOTOS], 1):
            suffix = Path(upload.filename or f"photo_{i}.jpg").suffix or ".jpg"
            dest = work_dir / f"P{i:03d}{suffix}"
            with dest.open("wb") as f:
                shutil.copyfileobj(upload.file, f)
            stored.append(dest)

        tech = installer_name.strip() or technician_name.strip() or "Tehnician"
        effective_installer = installer_id.strip() or auth_installer
        result = run_pipeline(
            photo_paths=stored,
            client_name=client_name,
            client_address=client_address,
            client_city=client_city,
            client_postal=client_postal,
            client_phone=client_phone,
            client_email=client_email,
            technician_name=tech,
            roof_type=roof_type,
            roof_orientation=roof_orientation,
            roof_pitch=roof_pitch,
            usable_area_m2=usable_area_m2,
            annual_consumption_kwh=annual_consumption_kwh,
            grid_connection=grid_connection,
            shading_level=shading_level,
            existing_solar=existing_solar,
            structural_notes=structural_notes,
            checklist=default_checklist(
                chk_struct, chk_electric, chk_shading,
                chk_access, chk_docs, chk_compliance,
            ),
            premium=premium,
            installer_id=effective_installer,
            jurisdiction_code=jurisdiction_code.strip(),
            site_latitude=site_latitude,
            site_longitude=site_longitude,
        )
        survey = result.survey
        return GenerateResponse(
            report_id=survey.metadata.report_id,
            pdf_filename=result.pdf_path.name,
            ahj_filename=result.ahj_path.name,
            pdf_path=str(result.pdf_path),
            score=survey.executive_summary.suitability_score,
            verdict=survey.executive_summary.suitability_verdict,
            capacity_kwp=survey.system_estimate.recommended_capacity_kwp,
            annual_kwh=survey.system_estimate.estimated_annual_production_kwh,
            routing_reason=result.routing_reason,
            cost_usd=round(result.cost_usd, 4),
            installer_id=effective_installer,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, f"Eroare generare raport: {exc}") from exc
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


class BatchResultItem(BaseModel):
    job_id: str
    success: bool
    report_id: str = ""
    pdf_filename: str = ""
    ahj_filename: str = ""
    score: int = 0
    error: str = ""


class BatchResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    results: list[BatchResultItem]


@app.post("/batch", response_model=BatchResponse)
async def batch_surveys(
    request: Request,
    manifest: str = Form(...),
    photos: list[UploadFile] = File(default=[]),
    x_installer_key: Optional[str] = Header(None),
):
    """Multipart batch: manifest JSON array + photos named job_id__photo.jpg."""
    _guard_api(request, x_installer_key)
    try:
        jobs_raw = json.loads(manifest)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, "Manifest JSON invalid") from exc
    if not isinstance(jobs_raw, list) or not jobs_raw:
        raise HTTPException(400, "Manifest trebuie să fie un array nevid")

    from dataclasses import fields as dc_fields
    allowed = {f.name for f in dc_fields(BatchJob)}
    jobs = [BatchJob(**{k: v for k, v in j.items() if k in allowed}) for j in jobs_raw]

    work_dir = Path(tempfile.mkdtemp(prefix="solaris_batch_"))
    photos_by_job: dict[str, list[Path]] = {j.job_id: [] for j in jobs}
    try:
        for upload in photos:
            parsed = parse_upload_photo_key(upload.filename or "")
            if not parsed:
                continue
            job_id, base = parsed
            if job_id not in photos_by_job:
                photos_by_job[job_id] = []
            dest = work_dir / job_id / base
            dest.parent.mkdir(parents=True, exist_ok=True)
            with dest.open("wb") as f:
                shutil.copyfileobj(upload.file, f)
            photos_by_job[job_id].append(dest)

        summary = run_batch_uploaded(jobs, photos_by_job)
        output_root = project_root() / "output"
        items: list[BatchResultItem] = []
        for r in summary.results:
            pdf_name = ""
            ahj_name = ""
            if r.pdf_path:
                try:
                    pdf_name = str(Path(r.pdf_path).resolve().relative_to(output_root.resolve())).replace("\\", "/")
                except ValueError:
                    pdf_name = Path(r.pdf_path).name
            if r.ahj_path:
                try:
                    ahj_name = str(Path(r.ahj_path).resolve().relative_to(output_root.resolve())).replace("\\", "/")
                except ValueError:
                    ahj_name = Path(r.ahj_path).name
            report_id = ""
            if ahj_name.startswith("AHJ_"):
                report_id = ahj_name[4:].replace(".json", "")
            elif pdf_name:
                report_id = pdf_name
            items.append(BatchResultItem(
                job_id=r.job_id,
                success=r.success,
                report_id=report_id,
                pdf_filename=pdf_name,
                ahj_filename=ahj_name,
                score=r.score or 0,
                error=r.error or "",
            ))
        return BatchResponse(
            total=summary.total,
            succeeded=summary.succeeded,
            failed=summary.failed,
            results=items,
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


@app.get("/context/{report_id}")
def report_context(report_id: str, request: Request):
    base = str(request.base_url).rstrip("/")
    try:
        return build_report_context(report_id, platform_base_url=base)
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.get("/permit-pack/{report_id}")
def permit_pack(report_id: str):
    reg = ReportRegistry().find_by_report_id(report_id)
    if not reg:
        raise HTTPException(404, f"Raport negăsit: {report_id}")
    pdf_path = Path(reg.pdf_path) if reg.pdf_path else None
    ahj_path = Path(reg.ahj_path) if reg.ahj_path else None
    if pdf_path and not pdf_path.is_absolute():
        pdf_path = project_root() / "output" / pdf_path
    if ahj_path and not ahj_path.is_absolute():
        ahj_path = project_root() / "output" / ahj_path
    zip_path = build_permit_zip_from_registry(
        report_id,
        pdf_path=pdf_path if pdf_path and pdf_path.exists() else None,
        ahj_path=ahj_path if ahj_path and ahj_path.exists() else None,
    )
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=zip_path.name,
    )


class CorrectionRequest(BaseModel):
    report_id: str
    field: str
    original: str = ""
    corrected: str
    technician: str = ""
    notes: str = ""


@app.post("/corrections")
def post_correction(body: CorrectionRequest, request: Request, x_installer_key: Optional[str] = Header(None)):
    _guard_api(request, x_installer_key)
    try:
        entry = log_correction(
            report_id=body.report_id,
            field=body.field,
            original=body.original,
            corrected=body.corrected,
            technician=body.technician,
            notes=body.notes,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"ok": True, "correction": entry}


@app.get("/files/{name:path}")
def download_file(name: str):
    output_root = (project_root() / "output").resolve()
    path = (output_root / name).resolve()
    if not str(path).startswith(str(output_root)) or not path.exists():
        raise HTTPException(404, "File not found")
    media = "application/pdf" if name.lower().endswith(".pdf") else "application/json"
    return FileResponse(path, media_type=media, filename=name)