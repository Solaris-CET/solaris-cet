"""Anthropic Claude API — Sonnet 5 + Fable 5 text writing."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Optional

import httpx

from src.api_clients.cost_logger import CostLogger, UsageRecord
from src.models import project_root

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
SONNET_MODEL = "claude-sonnet-5-20250929"
FABLE_MODEL = "claude-fable-5"

SONNET_IN_PER_M = 2.0
SONNET_OUT_PER_M = 10.0
FABLE_IN_PER_M = 10.0
FABLE_OUT_PER_M = 50.0


class ClaudeError(Exception):
    pass


class ClaudeClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        cost_logger: Optional[CostLogger] = None,
    ):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.cost_logger = cost_logger or CostLogger()
        self._system_prompt: Optional[str] = None

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def _load_system_prompt(self) -> str:
        if self._system_prompt is None:
            path = project_root() / "prompts" / "system_solaris_v1.txt"
            text = path.read_text(encoding="utf-8")
            # Pad to encourage caching eligibility (≥2048 tokens ≈ 6000+ chars)
            if len(text) < 6000:
                text += "\n\n" + ("[REF] " * 400)
            self._system_prompt = text
        return self._system_prompt

    def _cost(self, model: str, inp: int, out: int) -> float:
        if "fable" in model:
            return (inp * FABLE_IN_PER_M + out * FABLE_OUT_PER_M) / 1_000_000
        return (inp * SONNET_IN_PER_M + out * SONNET_OUT_PER_M) / 1_000_000

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if fence:
            text = fence.group(1)
        return json.loads(text)

    def write_report_text(
        self,
        survey_data: dict,
        premium: bool = False,
        report_id: Optional[str] = None,
    ) -> dict:
        if not self.configured:
            raise ClaudeError("ANTHROPIC_API_KEY lipsește")

        model = FABLE_MODEL if premium else SONNET_MODEL
        system = self._load_system_prompt()
        user_msg = json.dumps(survey_data, ensure_ascii=False, indent=2)

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        body: dict = {
            "model": model,
            "max_tokens": 4000,
            "system": system,
            "messages": [{"role": "user", "content": user_msg}],
        }

        if premium:
            body["betas"] = ["server-side-fallback-2026-06-01"]
            body["output_config"] = {"effort": "medium"}

        with httpx.Client(timeout=120.0) as client:
            response = client.post(ANTHROPIC_URL, headers=headers, json=body)

        if response.status_code != 200:
            raise ClaudeError(f"Claude API {response.status_code}: {response.text[:400]}")

        data = response.json()
        usage = data.get("usage", {})
        inp = usage.get("input_tokens", 0)
        out = usage.get("output_tokens", 0)

        self.cost_logger.log(UsageRecord(
            provider="anthropic",
            model=model,
            input_tokens=inp,
            output_tokens=out,
            cost_usd=self._cost(model, inp, out),
            report_id=report_id,
        ))

        blocks = data.get("content", [])
        text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
        return self._extract_json(text)