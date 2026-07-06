"""Photo analysis pipeline using DeepSeek vision."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from src.api_clients.deepseek import DeepSeekClient, DeepSeekError
from src.models import PhotoAnalysis, PhotoCategory, project_root

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
CATEGORY_FROM_FILENAME = {
    "roof": PhotoCategory.ROOF_OVERVIEW,
    "acoperis": PhotoCategory.ROOF_OVERVIEW,
    "panel": PhotoCategory.ELECTRICAL_PANEL,
    "tablou": PhotoCategory.ELECTRICAL_PANEL,
    "electric": PhotoCategory.ELECTRICAL_PANEL,
    "shading": PhotoCategory.SHADING,
    "umbrire": PhotoCategory.SHADING,
    "umbra": PhotoCategory.SHADING,
    "access": PhotoCategory.ACCESS,
    "acces": PhotoCategory.ACCESS,
    "meter": PhotoCategory.METER,
    "contor": PhotoCategory.METER,
    "detail": PhotoCategory.ROOF_DETAIL,
    "detaliu": PhotoCategory.ROOF_DETAIL,
}


def load_prompt(version: str = "v1") -> str:
    path = project_root() / "prompts" / f"photo_analysis_{version}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Prompt not found: {path}")
    return path.read_text(encoding="utf-8")


def guess_category(filename: str) -> PhotoCategory:
    lower = filename.lower()
    for keyword, category in CATEGORY_FROM_FILENAME.items():
        if keyword in lower:
            return category
    return PhotoCategory.OTHER


def list_photos(photos_dir: Path) -> list[Path]:
    if not photos_dir.is_dir():
        raise FileNotFoundError(f"Directorul de poze nu există: {photos_dir}")
    photos = sorted(
        p for p in photos_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )
    if not photos:
        raise FileNotFoundError(f"Nicio imagine găsită în {photos_dir}")
    return photos


def parse_photo_analysis(data: dict, file_path: Path) -> PhotoAnalysis:
    category_raw = data.get("category", "other")
    try:
        category = PhotoCategory(category_raw)
    except ValueError:
        category = guess_category(file_path.name)

    return PhotoAnalysis(
        photo_id=data.get("photo_id", file_path.stem),
        category=category,
        file_path=str(file_path),
        findings=data.get("findings", []),
        issues=data.get("issues", []),
        actionable_notes=data.get("actionable_notes", []),
        confidence=float(data.get("confidence", 0.8)),
    )


class PhotoAnalyzer:
    def __init__(self, client: Optional[DeepSeekClient] = None):
        self.client = client or DeepSeekClient()
        self.prompt = load_prompt()

    def analyze_directory(
        self,
        photos_dir: Path,
        report_id: Optional[str] = None,
    ) -> list[PhotoAnalysis]:
        photos = list_photos(photos_dir)
        results: list[PhotoAnalysis] = []

        for i, photo_path in enumerate(photos, start=1):
            photo_id = f"P{i:03d}"
            data = self.client.analyze_image(
                image_path=photo_path,
                prompt=self.prompt,
                photo_id=photo_id,
                report_id=report_id,
            )
            if "photo_id" not in data:
                data["photo_id"] = photo_id
            if "category" not in data:
                data["category"] = guess_category(photo_path.name).value
            results.append(parse_photo_analysis(data, photo_path))

        return results

    def analyze_single(self, photo_path: Path, photo_id: str = "P001") -> PhotoAnalysis:
        data = self.client.analyze_image(
            image_path=photo_path,
            prompt=self.prompt,
            photo_id=photo_id,
        )
        return parse_photo_analysis(data, photo_path)