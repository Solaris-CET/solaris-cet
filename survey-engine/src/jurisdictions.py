"""Romania jurisdiction / grid operator mapping for AHJ export."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Jurisdiction:
    code: str
    name: str
    grid_operator: str
    ahj_authority: str


# Subset + common counties; fallback for unknown cities
JURISDICTIONS: dict[str, Jurisdiction] = {
    "RO-AB": Jurisdiction("RO-AB", "Alba", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-AR": Jurisdiction("RO-AR", "Arad", "Rețele Electrice Banat", "Primărie / Urbanism"),
    "RO-B": Jurisdiction("RO-B", "București", "Rețele Electrice Muntenia", "PMB / Urbanism"),
    "RO-BC": Jurisdiction("RO-BC", "Bacău", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-BH": Jurisdiction("RO-BH", "Bihor", "Rețele Electrice Banat", "Primărie / Urbanism"),
    "RO-BN": Jurisdiction("RO-BN", "Bistrița-Năsăud", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-BR": Jurisdiction("RO-BR", "Brăila", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-BT": Jurisdiction("RO-BT", "Botoșani", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-BV": Jurisdiction("RO-BV", "Brașov", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-CJ": Jurisdiction("RO-CJ", "Cluj", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-CT": Jurisdiction("RO-CT", "Constanța", "Rețele Electrice Dobrogea", "Primărie / Urbanism"),
    "RO-CV": Jurisdiction("RO-CV", "Covasna", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-DB": Jurisdiction("RO-DB", "Dâmbovița", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-DJ": Jurisdiction("RO-DJ", "Dolj", "Rețele Electrice Oltenia", "Primărie / Urbanism"),
    "RO-GL": Jurisdiction("RO-GL", "Galați", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-GR": Jurisdiction("RO-GR", "Giurgiu", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-HD": Jurisdiction("RO-HD", "Hunedoara", "Rețele Electrice Banat", "Primărie / Urbanism"),
    "RO-HR": Jurisdiction("RO-HR", "Harghita", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-IF": Jurisdiction("RO-IF", "Ilfov", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-IS": Jurisdiction("RO-IS", "Iași", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-MM": Jurisdiction("RO-MM", "Maramureș", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-MS": Jurisdiction("RO-MS", "Mureș", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-NT": Jurisdiction("RO-NT", "Neamț", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-OT": Jurisdiction("RO-OT", "Olt", "Rețele Electrice Oltenia", "Primărie / Urbanism"),
    "RO-PH": Jurisdiction("RO-PH", "Prahova", "Rețele Electrice Muntenia", "Primărie / Urbanism"),
    "RO-SB": Jurisdiction("RO-SB", "Sibiu", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-SJ": Jurisdiction("RO-SJ", "Sălaj", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-SM": Jurisdiction("RO-SM", "Satu Mare", "Electrica Distribuție", "Primărie / Urbanism"),
    "RO-SV": Jurisdiction("RO-SV", "Suceava", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-TL": Jurisdiction("RO-TL", "Tulcea", "Rețele Electrice Dobrogea", "Primărie / Urbanism"),
    "RO-TM": Jurisdiction("RO-TM", "Timiș", "Rețele Electrice Banat", "Primărie / Urbanism"),
    "RO-VL": Jurisdiction("RO-VL", "Vâlcea", "Rețele Electrice Oltenia", "Primărie / Urbanism"),
    "RO-VN": Jurisdiction("RO-VN", "Vrancea", "Delgaz Grid", "Primărie / Urbanism"),
    "RO-VS": Jurisdiction("RO-VS", "Vaslui", "Delgaz Grid", "Primărie / Urbanism"),
}


_CITY_ALIASES: dict[str, str] = {
    "bucuresti": "RO-B",
    "bucharest": "RO-B",
    "cluj-napoca": "RO-CJ",
    "cluj": "RO-CJ",
    "timisoara": "RO-TM",
    "iasi": "RO-IS",
    "constanta": "RO-CT",
    "brasov": "RO-BV",
    "craiova": "RO-DJ",
    "galati": "RO-GL",
    "ploiesti": "RO-PH",
    "oradea": "RO-BH",
    "sibiu": "RO-SB",
    "vaslui": "RO-VS",
}


def resolve_jurisdiction(code: Optional[str] = None, city: Optional[str] = None) -> Jurisdiction:
    if code and code in JURISDICTIONS:
        return JURISDICTIONS[code]
    if city:
        key = city.lower().strip().replace("ă", "a").replace("â", "a").replace("î", "i").replace("ș", "s").replace("ț", "t")
        for alias, jcode in _CITY_ALIASES.items():
            if alias in key:
                return JURISDICTIONS[jcode]
        for j in JURISDICTIONS.values():
            if j.name.lower().replace("ă", "a").replace("â", "a").replace("î", "i").replace("ș", "s").replace("ț", "t") in key:
                return j
    return Jurisdiction("RO-XX", city or "Necunoscut", "Operator rețea — de confirmat", "Primărie / Urbanism local")


def list_jurisdiction_codes() -> list[dict[str, str]]:
    return [{"code": j.code, "name": j.name, "grid_operator": j.grid_operator} for j in JURISDICTIONS.values()]