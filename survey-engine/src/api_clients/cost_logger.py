"""Log API usage and costs per report."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from src.models import project_root


@dataclass
class UsageRecord:
    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    report_id: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CostLogger:
    def __init__(self, log_path: Optional[Path] = None):
        self.log_path = log_path or (project_root() / "output" / "api_usage.jsonl")

    def log(self, record: UsageRecord) -> None:
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        with self.log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(record), ensure_ascii=False) + "\n")

    def total_cost(self) -> float:
        if not self.log_path.exists():
            return 0.0
        total = 0.0
        for line in self.log_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                total += json.loads(line).get("cost_usd", 0.0)
        return total