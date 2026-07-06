"""Solar production estimator — design v3 (3 refinement passes)."""

from __future__ import annotations

from dataclasses import dataclass, field

from src.models import RoofOrientation, ShadingLevel, SiteInfo

CALC_VERSION = 3

# Romania reference yield (kWh/kWp/year) at optimal conditions
BASE_YIELD_RO = 1200.0

# Iteration 1: orientation factors
ORIENTATION_FACTOR: dict[RoofOrientation, float] = {
    RoofOrientation.S: 1.00,
    RoofOrientation.SE: 0.96,
    RoofOrientation.SW: 0.96,
    RoofOrientation.E: 0.82,
    RoofOrientation.W: 0.82,
    RoofOrientation.NE: 0.72,
    RoofOrientation.NW: 0.72,
    RoofOrientation.N: 0.55,
}

# Iteration 2: shading derating
SHADING_FACTOR: dict[ShadingLevel, float] = {
    ShadingLevel.NONE: 1.00,
    ShadingLevel.LOW: 0.95,
    ShadingLevel.MODERATE: 0.88,
    ShadingLevel.HIGH: 0.75,
    ShadingLevel.SEVERE: 0.60,
}

# Iteration 3: monthly distribution (Romania normalized)
MONTHLY_PROFILE: dict[str, float] = {
    "Ian": 0.045, "Feb": 0.055, "Mar": 0.085, "Apr": 0.095,
    "Mai": 0.110, "Iun": 0.115, "Iul": 0.120, "Aug": 0.115,
    "Sep": 0.095, "Oct": 0.080, "Nov": 0.050, "Dec": 0.035,
}


@dataclass
class ProductionEstimate:
    capacity_kwp: float
    panel_count: int
    annual_kwh: float
    specific_yield_kwh_per_kwp: float
    monthly_kwh: dict[str, float] = field(default_factory=dict)
    confidence_low_kwh: float = 0.0
    confidence_high_kwh: float = 0.0
    derating_factors: dict[str, float] = field(default_factory=dict)
    calc_version: int = CALC_VERSION


def _pitch_factor(pitch_deg: float) -> float:
    """Optimal ~35° for Romania; penalty outside 15-45°."""
    optimal = 35.0
    delta = abs(pitch_deg - optimal)
    return max(0.82, 1.0 - delta * 0.004)


def _area_capacity(usable_m2: float, consumption_kwh: float) -> float:
    raw = min(usable_m2 * 0.14, consumption_kwh / BASE_YIELD_RO)
    return max(min(round(raw * 2) / 2, 10.0), 3.0)


def estimate_production(site: SiteInfo) -> ProductionEstimate:
    """Full production estimate with orientation, pitch, shading (v3)."""
    capacity = _area_capacity(site.usable_area_m2, site.annual_consumption_kwh)
    panel_w = 430
    panel_count = max(int(capacity * 1000 / panel_w), 6)
    actual_kwp = panel_count * panel_w / 1000

    orient_f = ORIENTATION_FACTOR.get(site.roof_orientation, 0.85)
    pitch_f = _pitch_factor(site.roof_pitch_degrees)
    shade_f = SHADING_FACTOR.get(site.shading_level, 0.90)
    existing_penalty = 0.95 if site.existing_solar else 1.0

    combined = orient_f * pitch_f * shade_f * existing_penalty
    specific_yield = BASE_YIELD_RO * combined
    annual = actual_kwp * specific_yield

    monthly = {m: round(annual * pct) for m, pct in MONTHLY_PROFILE.items()}
    uncertainty = 0.08 + (1 - shade_f) * 0.12  # wider band with more shading

    return ProductionEstimate(
        capacity_kwp=round(actual_kwp, 1),
        panel_count=panel_count,
        annual_kwh=round(annual),
        specific_yield_kwh_per_kwp=round(specific_yield, 1),
        monthly_kwh=monthly,
        confidence_low_kwh=round(annual * (1 - uncertainty)),
        confidence_high_kwh=round(annual * (1 + uncertainty)),
        derating_factors={
            "orientation": round(orient_f, 3),
            "pitch": round(pitch_f, 3),
            "shading": round(shade_f, 3),
            "existing_solar": existing_penalty,
            "combined": round(combined, 3),
        },
    )