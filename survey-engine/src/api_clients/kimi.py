"""Kimi / Moonshot API client — long-context multi-image vision."""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
from pathlib import Path
from typing import Optional

import httpx

from src.api_clients.cost_logger import CostLogger, UsageRecord

KIMI_BASE_URL = os.environ.get("KIMI_BASE_URL", "https://api.moonshot.ai/v1")
DEFAULT_MODEL = os.environ.get("KIMI_MODEL", "moonshot-v1-8k-vision-preview")

INPUT_COST_PER_M = 0.50
OUTPUT_COST_PER_M = 2.00


class KimiError(Exception):
    pass


class KimiClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        cost_logger: Optional[CostLogger] = None,
    ):
        self.api_key = api_key or os.environ.get("KIMI_API_KEY", "")
        self.model = model
        self.cost_logger = cost_logger or CostLogger()

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def _encode_image(self, image_path: Path) -> tuple[str, str]:
        mime, _ = mimetypes.guess_type(str(image_path))
        mime = mime or "image/jpeg"
        data = base64.b64encode(image_path.read_bytes()).decode("utf-8")
        return mime, data

    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        return (input_tokens * INPUT_COST_PER_M + output_tokens * OUTPUT_COST_PER_M) / 1_000_000

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if fence:
            text = fence.group(1)
        return json.loads(text)

    def analyze_images_batch(
        self,
        image_paths: list[Path],
        prompt: str,
        report_id: Optional[str] = None,
    ) -> list[dict]:
        """Analyze multiple images in one long-context request."""
        if not self.configured:
            raise KimiError("KIMI_API_KEY lipsește")
        if not image_paths:
            raise KimiError("Nicio imagine pentru Kimi")

        content: list[dict] = [
            {
                "type": "text",
                "text": (
                    f"{prompt}\n\nAnalizează toate cele {len(image_paths)} imagini. "
                    "Returnează JSON cu cheia \"photos\": array de obiecte "
                    "(photo_id, category, findings, issues, actionable_notes, confidence)."
                ),
            },
        ]
        for i, path in enumerate(image_paths, 1):
            if not path.exists():
                continue
            mime, b64 = self._encode_image(path)
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            })
            content.append({"type": "text", "text": f"photo_id: P{i:03d} — {path.name}"})

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 8000,
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        with httpx.Client(timeout=180.0) as client:
            res = client.post(f"{KIMI_BASE_URL}/chat/completions", json=payload, headers=headers)
            if res.status_code >= 400:
                raise KimiError(f"Kimi API {res.status_code}: {res.text[:500]}")
            data = res.json()

        usage = data.get("usage", {})
        input_tokens = int(usage.get("prompt_tokens", 0))
        output_tokens = int(usage.get("completion_tokens", 0))
        self.cost_logger.log(UsageRecord(
            provider="kimi",
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=self._estimate_cost(input_tokens, output_tokens),
            report_id=report_id,
        ))

        text = data["choices"][0]["message"]["content"]
        parsed = self._extract_json(text)
        photos = parsed.get("photos", parsed if isinstance(parsed, list) else [parsed])
        if isinstance(photos, dict):
            photos = [photos]
        return photos if isinstance(photos, list) else []