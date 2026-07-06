"""DeepSeek V4 Pro API client — vision + text extraction."""

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

DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEFAULT_MODEL = "deepseek-v4-pro"

# Approximate pricing (USD per 1M tokens) — vision uses standard rates
INPUT_COST_PER_M = 0.27
OUTPUT_COST_PER_M = 1.10


class DeepSeekError(Exception):
    pass


class DeepSeekClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        cost_logger: Optional[CostLogger] = None,
    ):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY", "")
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

    def analyze_image(
        self,
        image_path: Path,
        prompt: str,
        photo_id: str,
        report_id: Optional[str] = None,
    ) -> dict:
        if not self.configured:
            raise DeepSeekError(
                "DEEPSEEK_API_KEY lipsește. Setează variabila de mediu sau adaugă în .env"
            )
        if not image_path.exists():
            raise DeepSeekError(f"Imaginea nu există: {image_path}")

        mime, b64 = self._encode_image(image_path)
        user_content = [
            {"type": "text", "text": f"{prompt}\n\nphoto_id pentru acest apel: {photo_id}"},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ești un expert în evaluarea șantierelor fotovoltaice. "
                        "Răspunde DOAR cu JSON valid conform formatului cerut."
                    ),
                },
                {"role": "user", "content": user_content},
            ],
            "max_tokens": 2000,
            "stream": False,
        }

        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{DEEPSEEK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code != 200:
            raise DeepSeekError(f"DeepSeek API error {response.status_code}: {response.text[:300]}")

        body = response.json()
        usage = body.get("usage", {})
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)

        self.cost_logger.log(UsageRecord(
            provider="deepseek",
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=self._estimate_cost(input_tokens, output_tokens),
            report_id=report_id,
        ))

        content = body["choices"][0]["message"]["content"]
        return self._extract_json(content)