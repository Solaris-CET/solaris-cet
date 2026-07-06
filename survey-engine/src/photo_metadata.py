"""EXIF / GPS metadata extraction from site photos."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image
from PIL.ExifTags import GPSTAGS, TAGS


@dataclass
class PhotoGeo:
    photo_id: str
    filename: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_at: Optional[str] = None


def _dms_to_degrees(values: tuple) -> float:
    d, m, s = values
    return float(d) + float(m) / 60.0 + float(s) / 3600.0


def _extract_gps(gps_info: dict) -> tuple[Optional[float], Optional[float]]:
    lat = lon = None
    lat_ref = gps_info.get("GPSLatitudeRef") or gps_info.get(1)
    lon_ref = gps_info.get("GPSLongitudeRef") or gps_info.get(3)
    lat_vals = gps_info.get("GPSLatitude") or gps_info.get(2)
    lon_vals = gps_info.get("GPSLongitude") or gps_info.get(4)
    if lat_vals:
        lat = _dms_to_degrees(lat_vals)
        if lat_ref in ("S", b"S"):
            lat = -lat
    if lon_vals:
        lon = _dms_to_degrees(lon_vals)
        if lon_ref in ("W", b"W"):
            lon = -lon
    return lat, lon


def extract_photo_geo(path: Path, photo_id: str = "") -> PhotoGeo:
    """Read GPS + datetime from image EXIF when available."""
    geo = PhotoGeo(photo_id=photo_id or path.stem, filename=path.name)
    try:
        with Image.open(path) as img:
            exif = img.getexif()
            if not exif:
                return geo
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag == "DateTimeOriginal" and not geo.captured_at:
                    geo.captured_at = str(value)
                if tag == "GPSInfo":
                    gps_named = {GPSTAGS.get(k, k): v for k, v in value.items()}
                    lat, lon = _extract_gps(gps_named)
                    geo.latitude = lat
                    geo.longitude = lon
    except Exception:
        pass
    return geo


def extract_batch_geo(paths: list[Path]) -> list[PhotoGeo]:
    return [extract_photo_geo(p, f"P{i:03d}") for i, p in enumerate(paths, 1)]


def best_site_coordinates(geos: list[PhotoGeo], fallback_lat: Optional[float], fallback_lon: Optional[float]) -> tuple[Optional[float], Optional[float]]:
    """Prefer browser GPS, else average of photo EXIF coordinates."""
    if fallback_lat is not None and fallback_lon is not None:
        return fallback_lat, fallback_lon
    coords = [(g.latitude, g.longitude) for g in geos if g.latitude is not None and g.longitude is not None]
    if not coords:
        return None, None
    lat = sum(c[0] for c in coords) / len(coords)
    lon = sum(c[1] for c in coords) / len(coords)
    return round(lat, 6), round(lon, 6)