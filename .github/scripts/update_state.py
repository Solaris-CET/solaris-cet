"""Update app/public/api/state.json with current CET token and pool data.

Produces the schema expected by chain-state.ts / ChainStateWidget:
  token.totalSupply    – human-readable decimal string or null
  pool.reserveTon      – TON reserve as human-readable decimal string or null
  pool.reserveCet      – CET reserve as human-readable decimal string or null
  pool.lpSupply        – always null (not available from REST)
  pool.priceTonPerCet  – spot price in TON per CET or null
"""

import json
import os

cet_contract = os.environ["CET_CONTRACT"]
dedust_pool = os.environ["DEDUST_POOL"]
timestamp = os.environ["TIMESTAMP"]

with open("/tmp/jetton.json") as f:
    jetton = json.load(f)

with open("/tmp/pool.json") as f:
    pool = json.load(f)


def nano_to_decimal(raw, decs=9):
    """Convert a nano-unit integer/string to a human-readable decimal string."""
    try:
        value = int(raw) / (10 ** decs)
        result = f"{value:.{decs}f}".rstrip("0").rstrip(".")
        return result if result else "0"
    except (TypeError, ValueError):
        return None


# ── Token metadata ────────────────────────────────────────────────────────────
meta = jetton.get("metadata", {})
decimals_raw = meta.get("decimals")
decimals = int(decimals_raw) if decimals_raw is not None else 9
decimals_divisor = 10 ** decimals

total_supply_raw = jetton.get("total_supply")
total_supply = nano_to_decimal(total_supply_raw, decimals)

# ── Pool reserves ─────────────────────────────────────────────────────────────
# DeDust single-pool endpoint returns reserveLeft (TON, nanoTON)
# and reserveRight (CET, nano-CET).
reserve_ton = nano_to_decimal(pool.get("reserveLeft"), 9)
reserve_cet = nano_to_decimal(pool.get("reserveRight"), decimals)

# ── Spot price in TON per CET ─────────────────────────────────────────────────
# price = (reserveLeft / 10^9) / (reserveRight / 10^decimals)
#       = reserveLeft * 10^decimals / (reserveRight * 10^9)
# Expressed as a 9-decimal fixed-point integer:
#   price_raw = reserveLeft * decimals_divisor / reserveRight
# Then nano_to_decimal(price_raw, 9) = price_raw / 10^9 = correct TON/CET value
price_ton_per_cet = None
try:
    r_ton = int(pool.get("reserveLeft", 0))
    r_cet = int(pool.get("reserveRight", 0))
    if r_ton > 0 and r_cet > 0:
        price_raw = (r_ton * decimals_divisor) // r_cet
        price_ton_per_cet = nano_to_decimal(price_raw, 9)
except (TypeError, ValueError, ZeroDivisionError):
    price_ton_per_cet = None

state = {
    "token": {
        "symbol": meta.get("symbol") or "CET",
        "name": meta.get("name") or "SOLARIS CET",
        "contract": cet_contract,
        "totalSupply": total_supply,
        "decimals": decimals,
    },
    "pool": {
        "address": dedust_pool,
        "reserveTon": reserve_ton,
        "reserveCet": reserve_cet,
        "lpSupply": None,
        "priceTonPerCet": price_ton_per_cet,
    },
    "updatedAt": timestamp,
}

with open("app/public/api/state.json", "w") as f:
    json.dump(state, f, indent=2)

print("state.json written successfully")
