"""Simple in-memory rate limiting for survey API."""

from __future__ import annotations

import os
import time
from collections import defaultdict
from threading import Lock

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)

DEFAULT_LIMIT = int(os.environ.get("SURVEY_RATE_LIMIT_PER_HOUR", "60"))


def check_rate_limit(key: str, limit: int = DEFAULT_LIMIT, window_s: int = 3600) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds)."""
    now = time.time()
    with _lock:
        bucket = _buckets[key]
        bucket[:] = [t for t in bucket if now - t < window_s]
        if len(bucket) >= limit:
            retry = int(window_s - (now - bucket[0])) + 1
            return False, max(1, retry)
        bucket.append(now)
        return True, 0


def reset_limits() -> None:
    with _lock:
        _buckets.clear()