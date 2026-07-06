"""Tests for solar production calculator."""

from src.models import RoofOrientation, ShadingLevel, SiteInfo, RoofType
from src.solar_calculator import CALC_VERSION, estimate_production


def _site(**kwargs) -> SiteInfo:
    defaults = dict(
        roof_type=RoofType.TILE,
        roof_orientation=RoofOrientation.S,
        roof_pitch_degrees=35,
        usable_area_m2=42,
        annual_consumption_kwh=4800,
        shading_level=ShadingLevel.LOW,
    )
    defaults.update(kwargs)
    return SiteInfo(**defaults)


def test_south_beats_north():
    south = estimate_production(_site(roof_orientation=RoofOrientation.S))
    north = estimate_production(_site(roof_orientation=RoofOrientation.N))
    assert south.annual_kwh > north.annual_kwh


def test_shading_reduces_production():
    low = estimate_production(_site(shading_level=ShadingLevel.LOW))
    high = estimate_production(_site(shading_level=ShadingLevel.HIGH))
    assert low.annual_kwh > high.annual_kwh


def test_monthly_profile_sums():
    prod = estimate_production(_site())
    assert len(prod.monthly_kwh) == 12
    assert prod.confidence_low_kwh < prod.annual_kwh < prod.confidence_high_kwh


def test_calc_version():
    assert CALC_VERSION >= 3