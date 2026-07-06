"""Update app/public/api/state.json with live CET token and pool data from DeDust.

On-chain addresses default from the same TypeScript sources as the app
(`app/src/lib/cetContract.ts`, `app/src/lib/dedustUrls.ts`). Override with
`CET_CONTRACT` / `DEDUST_POOL` env vars when needed.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _parse_ts_string_const(rel_path: str, const_name: str) -> str:
    """Read `export const NAME = '...'` (possibly multiline before the quote)."""
    path = _repo_root() / rel_path
    text = path.read_text(encoding="utf-8")
    pat = rf"export const {re.escape(const_name)}\s*=\s*[\s\n]*'([^']+)'"
    m = re.search(pat, text)
    if not m:
        raise RuntimeError(f"Could not find {const_name} string literal in {path}")
    return m.group(1)


def _env_or_ts(env_key: str, rel_path: str, const_name: str) -> str:
    if env_key in os.environ:
        return os.environ[env_key]
    return _parse_ts_string_const(rel_path, const_name)


CET_CONTRACT = _env_or_ts("CET_CONTRACT", "app/src/lib/cetContract.ts", "CET_CONTRACT_ADDRESS")
DEDUST_POOL = _env_or_ts("DEDUST_POOL", "app/src/lib/dedustUrls.ts", "DEDUST_POOL_ADDRESS")
CET_DECIMALS = int(os.environ.get("CET_DECIMALS", "9"))
TIMESTAMP = os.environ.get("TIMESTAMP") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

TONAPI_BASE = "https://tonapi.io/v2"
DEDUST_BASE = "https://api.dedust.io/v2"
TIMEOUT = 15  # seconds


def fetch_json(url: str) -> "dict | list | None":
    """Fetch JSON from *url*, returning None on any error."""
    try:
        resp = requests.get(url, headers={"Accept": "application/json"}, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except (ValueError, TypeError, requests.exceptions.RequestException) as exc:
        print(f"WARNING: failed to fetch {url}: {exc}", file=sys.stderr)
        return None


# ── 1. Jetton metadata ────────────────────────────────────────────────────────
jetton: dict = fetch_json(f"{TONAPI_BASE}/jettons/{CET_CONTRACT}") or {}
meta: dict = jetton.get("metadata", {}) if isinstance(jetton, dict) else {}
total_supply = jetton.get("total_supply") if isinstance(jetton, dict) else None
decimals_raw = meta.get("decimals")

# ── 2. DeDust single-pool info ────────────────────────────────────────────────
pool: dict = fetch_json(f"{DEDUST_BASE}/pools/{DEDUST_POOL}") or {}

# ── 3. DeDust prices list ─────────────────────────────────────────────────────
prices = fetch_json(f"{DEDUST_BASE}/prices") or []

# ── TON / CET USD price from DeDust prices list ───────────────────────────────
ton_price_usd: float | None = None
cet_price_usd: float | None = None

if isinstance(prices, list):
    for entry in prices:
        if isinstance(entry, dict):
            addr = str(entry.get("address", "")).lower()
            price_str = entry.get("price")
            if addr == "native" and price_str:
                try:
                    ton_price_usd = float(price_str)
                except (ValueError, TypeError):
                    pass
            if CET_CONTRACT and addr == CET_CONTRACT.lower() and price_str:
                try:
                    cet_price_usd = float(price_str)
                except (ValueError, TypeError):
                    pass

# ── Pool reserves ─────────────────────────────────────────────────────────────
# DeDust single-pool endpoint: reserveLeft (TON, nanoTON), reserveRight (CET, nano-CET)
reserve_left_raw = pool.get("reserveLeft") if isinstance(pool, dict) else None
reserve_right_raw = pool.get("reserveRight") if isinstance(pool, dict) else None

tvl_ton: float | None = None
if reserve_left_raw is not None:
    try:
        tvl_ton = float(reserve_left_raw) / 1e9 * 2  # both sides of symmetric pool
    except (ValueError, TypeError):
        tvl_ton = None

# Fall back to computing CET price from reserves if not in prices list
if cet_price_usd is None and ton_price_usd and reserve_left_raw and reserve_right_raw:
    try:
        ton_reserve = float(reserve_left_raw) / 1e9
        cet_reserve = float(reserve_right_raw) / (10 ** CET_DECIMALS)
        if cet_reserve > 0:
            cet_price_usd = (ton_reserve / cet_reserve) * ton_price_usd
    except (ValueError, TypeError, ZeroDivisionError):
        pass

tvl_usd: float | None = None
if tvl_ton is not None and ton_price_usd is not None:
    try:
        tvl_usd = tvl_ton * ton_price_usd
    except (ValueError, TypeError):
        tvl_usd = None

# ── Write state ───────────────────────────────────────────────────────────────
state = {
    "token": {
        "symbol": meta.get("symbol") or "CET",
        "name": meta.get("name") or "SOLARIS CET",
        "contract": CET_CONTRACT,
        "totalSupply": total_supply if total_supply is not None else None,
        "decimals": int(decimals_raw) if decimals_raw is not None else CET_DECIMALS,
    },
    "pool": {
        "address": DEDUST_POOL,
        "tvlTon": round(tvl_ton, 4) if tvl_ton is not None else 0,
        "tvlUsd": round(tvl_usd, 4) if tvl_usd is not None else 0,
        "priceUsd": round(cet_price_usd, 4) if cet_price_usd is not None else 0,
        "tonPriceUsd": round(ton_price_usd, 4) if ton_price_usd is not None else 0,
    },
    "updatedAt": TIMESTAMP,
}

os.makedirs("app/public/api", exist_ok=True)

with open("app/public/api/state.json", "w") as f:
    json.dump(state, f, indent=2)

print("state.json written successfully")
