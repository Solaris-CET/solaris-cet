"""Batch processing for multiple sites — design v3."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field, fields
from pathlib import Path
from typing import Any, Optional

from src.pipeline import default_checklist, run_pipeline

BATCH_VERSION = 3


@dataclass
class BatchJob:
    job_id: str
    client_name: str
    photos_dir: str = ""
    client_address: str = ""
    client_city: str = ""
    client_postal: str = ""
    technician_name: str = "Tehnician SOLARIS"
    roof_type: str = "tile"
    roof_orientation: str = "S"
    roof_pitch: float = 35.0
    usable_area_m2: float = 40.0
    annual_consumption_kwh: float = 5000.0
    grid_connection: str = "single-phase"
    shading_level: str = "low"
    existing_solar: bool = False
    structural_notes: str = ""
    premium: bool = False


@dataclass
class BatchResult:
    job_id: str
    success: bool
    pdf_path: Optional[str] = None
    ahj_path: Optional[str] = None
    error: Optional[str] = None
    score: int = 0


@dataclass
class BatchSummary:
    total: int = 0
    succeeded: int = 0
    failed: int = 0
    results: list[BatchResult] = field(default_factory=list)


def _photos_from_dir(directory: Path) -> list[str]:
    exts = {".jpg", ".jpeg", ".png", ".webp"}
    return [str(p) for p in sorted(directory.iterdir()) if p.suffix.lower() in exts]


def load_manifest_json(path: Path) -> list[BatchJob]:
    data = json.loads(path.read_text(encoding="utf-8"))
    jobs_raw = data if isinstance(data, list) else data.get("jobs", [])
    allowed = {f.name for f in fields(BatchJob)}
    return [BatchJob(**{k: v for k, v in j.items() if k in allowed}) for j in jobs_raw]


def load_manifest_csv(path: Path) -> list[BatchJob]:
    jobs: list[BatchJob] = []
    with path.open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            jobs.append(BatchJob(
                job_id=row.get("job_id", f"job-{len(jobs)+1}"),
                photos_dir=row["photos_dir"],
                client_name=row.get("client_name", "Client"),
                client_address=row.get("client_address", ""),
                client_city=row.get("client_city", ""),
                client_postal=row.get("client_postal", ""),
                technician_name=row.get("technician_name", "Tehnician"),
                roof_type=row.get("roof_type", "tile"),
                roof_orientation=row.get("roof_orientation", "S"),
                roof_pitch=float(row.get("roof_pitch", 35)),
                usable_area_m2=float(row.get("usable_area_m2", 40)),
                annual_consumption_kwh=float(row.get("annual_consumption_kwh", 5000)),
                premium=row.get("premium", "").lower() in ("1", "true", "yes"),
            ))
    return jobs


def load_manifest(path: Path) -> list[BatchJob]:
    if path.suffix.lower() == ".csv":
        return load_manifest_csv(path)
    return load_manifest_json(path)


def parse_upload_photo_key(filename: str) -> tuple[str, str] | None:
    """job_id__photo.jpg or job_id/photo.jpg → (job_id, basename)."""
    name = (filename or "").replace("\\", "/").strip()
    if "__" in name:
        job_id, rest = name.split("__", 1)
        if job_id.strip() and rest.strip():
            return job_id.strip(), rest.strip()
    if "/" in name:
        job_id, rest = name.rsplit("/", 1)
        if job_id.strip() and rest.strip():
            return job_id.strip(), rest.strip()
    return None


def run_batch_uploaded(
    jobs: list[BatchJob],
    photos_by_job: dict[str, list[Path]],
    output_dir: Optional[Path] = None,
    progress=None,
) -> BatchSummary:
    """Run batch when photos are supplied per job_id (web upload)."""
    from src.models import project_root

    out = output_dir or (project_root() / "output" / "batch")
    out.mkdir(parents=True, exist_ok=True)
    summary = BatchSummary(total=len(jobs))

    for i, job in enumerate(jobs):
        if progress:
            progress(i / max(len(jobs), 1), f"Batch {job.job_id}...")
        photos = photos_by_job.get(job.job_id, [])
        if not photos:
            summary.results.append(BatchResult(job.job_id, False, error="Nicio poză pentru job"))
            summary.failed += 1
            continue
        try:
            job_out = out / job.job_id
            result = run_pipeline(
                photo_paths=photos,
                client_name=job.client_name,
                client_address=job.client_address or "—",
                client_city=job.client_city or "—",
                client_postal=job.client_postal or "—",
                client_phone="", client_email="",
                technician_name=job.technician_name,
                roof_type=job.roof_type,
                roof_orientation=job.roof_orientation,
                roof_pitch=job.roof_pitch,
                usable_area_m2=job.usable_area_m2,
                annual_consumption_kwh=job.annual_consumption_kwh,
                grid_connection=job.grid_connection,
                shading_level=job.shading_level,
                existing_solar=job.existing_solar,
                structural_notes=job.structural_notes,
                checklist=default_checklist(),
                premium=job.premium,
                output_dir=job_out,
            )
            ahj = job_out / f"AHJ_{result.survey.metadata.report_id}.json"
            summary.results.append(BatchResult(
                job_id=job.job_id,
                success=True,
                pdf_path=str(result.pdf_path),
                ahj_path=str(ahj) if ahj.exists() else None,
                score=result.survey.executive_summary.suitability_score,
            ))
            summary.succeeded += 1
        except Exception as e:
            summary.results.append(BatchResult(job.job_id, False, error=str(e)))
            summary.failed += 1

    summary_path = out / "batch_summary.json"
    summary_path.write_text(json.dumps({
        "batch_version": BATCH_VERSION,
        "total": summary.total,
        "succeeded": summary.succeeded,
        "failed": summary.failed,
        "results": [r.__dict__ for r in summary.results],
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


def run_batch(
    jobs: list[BatchJob],
    output_dir: Optional[Path] = None,
    progress=None,
) -> BatchSummary:
    """Iteration 3: sequential batch with per-job error isolation."""
    from src.models import project_root

    out = output_dir or (project_root() / "output" / "batch")
    out.mkdir(parents=True, exist_ok=True)
    summary = BatchSummary(total=len(jobs))

    for i, job in enumerate(jobs):
        if progress:
            progress(i / len(jobs), f"Batch {job.job_id}...")
        photos_dir = Path(job.photos_dir)
        if not photos_dir.is_dir():
            summary.results.append(BatchResult(job.job_id, False, error=f"Director inexistent: {photos_dir}"))
            summary.failed += 1
            continue
        photos = _photos_from_dir(photos_dir)
        if not photos:
            summary.results.append(BatchResult(job.job_id, False, error="Nicio poză"))
            summary.failed += 1
            continue
        try:
            job_out = out / job.job_id
            result = run_pipeline(
                photo_paths=photos,
                client_name=job.client_name,
                client_address=job.client_address or "—",
                client_city=job.client_city or "—",
                client_postal=job.client_postal or "—",
                client_phone="", client_email="",
                technician_name=job.technician_name,
                roof_type=job.roof_type,
                roof_orientation=job.roof_orientation,
                roof_pitch=job.roof_pitch,
                usable_area_m2=job.usable_area_m2,
                annual_consumption_kwh=job.annual_consumption_kwh,
                grid_connection=job.grid_connection,
                shading_level=job.shading_level,
                existing_solar=job.existing_solar,
                structural_notes=job.structural_notes,
                checklist=default_checklist(),
                premium=job.premium,
                output_dir=job_out,
            )
            ahj = job_out / f"AHJ_{result.survey.metadata.report_id}.json"
            summary.results.append(BatchResult(
                job_id=job.job_id,
                success=True,
                pdf_path=str(result.pdf_path),
                ahj_path=str(ahj) if ahj.exists() else None,
                score=result.survey.executive_summary.suitability_score,
            ))
            summary.succeeded += 1
        except Exception as e:
            summary.results.append(BatchResult(job.job_id, False, error=str(e)))
            summary.failed += 1

    summary_path = out / "batch_summary.json"
    summary_path.write_text(json.dumps({
        "batch_version": BATCH_VERSION,
        "total": summary.total,
        "succeeded": summary.succeeded,
        "failed": summary.failed,
        "results": [r.__dict__ for r in summary.results],
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary