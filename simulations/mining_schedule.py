"""
mining_schedule.py
──────────────────────────────────────────────────────────────────────────────
BTC-S 90-year smooth-decay mining schedule.

Instead of the abrupt halving shocks used by Bitcoin, BTC-S uses a continuous
exponential decay so that the reward curve is always differentiable and
validator income can be predicted precisely at any future block height.

    R(h) = R₀ · e^(−λ · h)

The initial reward R₀ and decay constant λ are set so that:
  • The integral from 0 → ∞ converges to exactly TOTAL_SUPPLY (21 M BTC-S).
  • The block reward halves every HALVING_INTERVAL blocks (~4 years at the
    2-second target block time), matching Bitcoin's emission cadence.

These two constraints uniquely determine R₀ and λ:
    λ  = ln(2) / HALVING_INTERVAL
    R₀ = λ · TOTAL_SUPPLY

With a 2-second block time the halving period spans ~4 years (63,072,000
blocks), and after 90 years (≈22 halvings) >99.9999 % of supply has been
emitted.

Usage
─────
    python simulations/mining_schedule.py

Outputs a summary table plus an optional matplotlib chart when the library
is installed.
"""

from __future__ import annotations

import math
import sys


# ──────────────────────────────────────────────────────────────────────────────
# Parameters
# ──────────────────────────────────────────────────────────────────────────────

TOTAL_SUPPLY: float = 21_000_000          # BTC-S hard cap
BLOCK_TIME_SECONDS: int = 2               # 2-second target block time
YEARS_TO_SIMULATE: int = 90

# Halving every ~4 years in 2-second block time
# (mirrors Bitcoin's 210,000-block interval scaled to a 2-second block time)
HALVING_INTERVAL_BLOCKS: int = 4 * 365 * 24 * 3600 // BLOCK_TIME_SECONDS  # 63,072,000

# Smooth-decay constant: reward halves every HALVING_INTERVAL_BLOCKS
LAMBDA: float = math.log(2) / HALVING_INTERVAL_BLOCKS

# Initial block reward: set so ∫₀^∞ R(h) dh = TOTAL_SUPPLY
INITIAL_REWARD: float = LAMBDA * TOTAL_SUPPLY


# ──────────────────────────────────────────────────────────────────────────────
# Core formula
# ──────────────────────────────────────────────────────────────────────────────

def block_reward(block_height: int) -> float:
    """Return the mining reward at *block_height* using smooth exponential decay."""
    return INITIAL_REWARD * math.exp(-LAMBDA * block_height)


def cumulative_supply(up_to_block: int) -> float:
    """Analytically compute coins mined from block 0 through *up_to_block* (exclusive)."""
    # ∫₀^n R₀·e^(−λh) dh = R₀/λ · (1 − e^(−λn)) = TOTAL_SUPPLY · (1 − e^(−λn))
    return TOTAL_SUPPLY * (1.0 - math.exp(-LAMBDA * up_to_block))


# ──────────────────────────────────────────────────────────────────────────────
# Simulation
# ──────────────────────────────────────────────────────────────────────────────

def run_simulation() -> None:
    blocks_per_year = (365 * 24 * 3600) // BLOCK_TIME_SECONDS  # ≈ 15,768,000
    total_blocks = YEARS_TO_SIMULATE * blocks_per_year

    print(
        f"BTC-S Smooth-Decay Mining Schedule\n"
        f"{'─' * 60}\n"
        f"  Hard cap              : {TOTAL_SUPPLY:>14,.0f} BTC-S\n"
        f"  Block time            : {BLOCK_TIME_SECONDS} s\n"
        f"  Blocks / year         : {blocks_per_year:>14,}\n"
        f"  Halving interval      : {HALVING_INTERVAL_BLOCKS:>14,} blocks (~4 yr)\n"
        f"  Decay constant (λ)    : {LAMBDA:>14.4e}\n"
        f"  Initial block reward  : {INITIAL_REWARD:>14.6f} BTC-S\n"
        f"{'─' * 60}\n"
    )

    print(
        f"{'Year':>6}  {'Block':>14}  {'Reward (BTC-S)':>18}  "
        f"{'Mined %':>8}  {'Mined total':>16}"
    )
    print(f"{'─'*6}  {'─'*14}  {'─'*18}  {'─'*8}  {'─'*16}")

    sample_years = sorted({0, 1, 4, 8, 10, 20, 30, 45, 60, 75, 90})

    for year in sample_years:
        block = year * blocks_per_year
        reward = block_reward(block)
        mined = cumulative_supply(block)
        pct = mined / TOTAL_SUPPLY * 100
        print(
            f"{year:>6}  {block:>14,}  {reward:>18.6f}  "
            f"{pct:>7.4f}%  {mined:>16,.2f}"
        )

    # Final verification
    mined_90 = cumulative_supply(total_blocks)
    remaining = TOTAL_SUPPLY - mined_90

    print(
        f"\n{'─' * 60}\n"
        f"  Mined after {YEARS_TO_SIMULATE} years  : {mined_90:>14,.4f} BTC-S\n"
        f"  Remaining (tail)      : {remaining:>14.4f} BTC-S\n"
        f"  % of cap mined        : {mined_90/TOTAL_SUPPLY*100:>14.8f} %\n"
        f"{'─' * 60}"
    )

    assert mined_90 <= TOTAL_SUPPLY + 1e-6, "Supply cap violation!"
    assert mined_90 / TOTAL_SUPPLY >= 0.999, (
        f"Less than 99.9 % of supply mined in {YEARS_TO_SIMULATE} years — tune λ."
    )

    print("\nAll supply-cap assertions passed ✓")

    # Optional chart
    _try_plot(blocks_per_year, total_blocks)


def _try_plot(blocks_per_year: int, total_blocks: int) -> None:
    try:
        import matplotlib.pyplot as plt  # type: ignore[import-untyped]
    except ImportError:
        print("\nInstall matplotlib to generate a chart:  pip install matplotlib")
        return

    sample_blocks = range(0, total_blocks + 1, blocks_per_year)
    years = [b / blocks_per_year for b in sample_blocks]
    rewards = [block_reward(b) for b in sample_blocks]
    cumulative = [cumulative_supply(b) / 1_000_000 for b in sample_blocks]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))
    fig.suptitle("BTC-S Smooth-Decay Mining Schedule", fontsize=14, fontweight="bold")

    ax1.plot(years, rewards, color="#F5A623", linewidth=2)
    ax1.set_xlabel("Year")
    ax1.set_ylabel("Block Reward (BTC-S)")
    ax1.set_title("Block Reward Over Time")
    ax1.grid(True, alpha=0.3)

    ax2.plot(years, cumulative, color="#4FC3F7", linewidth=2)
    ax2.axhline(TOTAL_SUPPLY / 1_000_000, color="#EF5350", linestyle="--", label="Hard cap (21 M)")
    ax2.set_xlabel("Year")
    ax2.set_ylabel("Cumulative Supply (millions)")
    ax2.set_title("Cumulative BTC-S Mined")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    output_path = "simulations/mining_schedule.png"
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"\nChart saved → {output_path}")
    plt.show()


# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    run_simulation()
    sys.exit(0)
