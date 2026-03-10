"""Update app/public/api/state.json with current CET token and pool data."""

import json
import os

cet_contract = os.environ["CET_CONTRACT"]
dedust_pool = os.environ["DEDUST_POOL"]
timestamp = os.environ["TIMESTAMP"]

CET_DECIMALS = 9

with open("/tmp/jetton.json") as f:
    jetton = json.load(f)

with open("/tmp/pool.json") as f:
    pool = json.load(f)

with open("/tmp/prices.json") as f:
    prices = json.load(f)

# ── Token metadata from tonapi ────────────────────────────────────────────────
meta = jetton.get("metadata", {})
total_supply = jetton.get("total_supply")
decimals_raw = meta.get("decimals")

# ── USD prices from DeDust prices endpoint ────────────────────────────────────
ton_price_usd = None
cet_price_usd = None
cet_address_lower = cet_contract.lower()

for entry in (prices if isinstance(prices, list) else []):
    addr = entry.get("address", "").lower()
    price_str = entry.get("price")
    if addr == "native" and price_str:
        try:
            ton_price_usd = float(price_str) or None
        except (ValueError, TypeError):
            pass
    elif addr == cet_address_lower and price_str:
        try:
            cet_price_usd = float(price_str) or None
        except (ValueError, TypeError):
            pass

# ── Pool reserves from DeDust individual pool endpoint ───────────────────────
# reserveLeft = TON reserve (nanoTON), reserveRight = CET reserve (nano-CET)
reserve_left_str = pool.get("reserveLeft")
reserve_right_str = pool.get("reserveRight")

tvl_ton = None
if reserve_left_str is not None:
    try:
        tvl_ton = round(float(reserve_left_str) / 1e9 * 2, 4)
    except (ValueError, TypeError):
        tvl_ton = None

# Derive CET price from reserves if not available in the prices endpoint
if cet_price_usd is None and reserve_left_str and reserve_right_str and ton_price_usd:
    try:
        ton_reserve = float(reserve_left_str) / 1e9
        cet_reserve = float(reserve_right_str) / 10 ** CET_DECIMALS
        if cet_reserve > 0:
            cet_price_usd = round(ton_reserve / cet_reserve * ton_price_usd, 6)
    except (ValueError, TypeError, ZeroDivisionError):
        cet_price_usd = None

tvl_usd = None
if tvl_ton is not None and ton_price_usd is not None:
    tvl_usd = round(tvl_ton * ton_price_usd, 2)

state = {
    "token": {
        "symbol": meta.get("symbol") or "CET",
        "name": meta.get("name") or "SOLARIS CET",
        "contract": cet_contract,
        "totalSupply": total_supply if total_supply is not None else None,
        "decimals": int(decimals_raw) if decimals_raw is not None else CET_DECIMALS,
    },
    "pool": {
        "address": dedust_pool,
        "tvlTon": tvl_ton,
        "tvlUsd": tvl_usd,
        "priceUsd": cet_price_usd,
        "tonPriceUsd": ton_price_usd,
    },
    "updatedAt": timestamp,
}

with open("app/public/api/state.json", "w") as f:
    json.dump(state, f, indent=2)

print("state.json written successfully")
