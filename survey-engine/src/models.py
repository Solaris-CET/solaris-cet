"""Pydantic models for solar site survey data."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class RoofType(str, Enum):
    TILE = "tile"
    METAL = "metal"
    FLAT = "flat"
    SLATE = "slate"
    OTHER = "other"


class RoofOrientation(str, Enum):
    N = "N"
    NE = "NE"
    E = "E"
    SE = "SE"
    S = "S"
    SW = "SW"
    W = "W"
    NW = "NW"


class ShadingLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


class ChecklistStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    NA = "na"


class PhotoCategory(str, Enum):
    ROOF_OVERVIEW = "roof_overview"
    ROOF_DETAIL = "roof_detail"
    ELECTRICAL_PANEL = "electrical_panel"
    SHADING = "shading"
    ACCESS = "access"
    METER = "meter"
    OTHER = "other"


class ClientInfo(BaseModel):
    name: str
    address: str
    city: str
    postal_code: str
    phone: Optional[str] = None
    email: Optional[str] = None


class SiteInfo(BaseModel):
    roof_type: RoofType
    roof_orientation: RoofOrientation
    roof_pitch_degrees: float = Field(ge=0, le=90)
    usable_area_m2: float = Field(gt=0)
    annual_consumption_kwh: float = Field(gt=0)
    grid_connection: str = "single-phase"
    existing_solar: bool = False
    shading_level: ShadingLevel = ShadingLevel.LOW
    structural_notes: Optional[str] = None


class PhotoAnalysis(BaseModel):
    photo_id: str
    category: PhotoCategory
    file_path: Optional[str] = None
    findings: list[str]
    issues: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1, default=0.85)
    evidence_photo_ids: list[str] = Field(default_factory=list)
    reasoning_short: Optional[str] = None
    actionable_notes: list[str] = Field(default_factory=list)


class ChecklistItem(BaseModel):
    id: str
    category: str
    description: str
    status: ChecklistStatus
    notes: Optional[str] = None


class Recommendation(BaseModel):
    priority: str = Field(pattern=r"^(high|medium|low)$")
    title: str
    description: str
    estimated_cost_eur: Optional[float] = None


class SystemEstimate(BaseModel):
    recommended_capacity_kwp: float = Field(gt=0)
    estimated_annual_production_kwh: float = Field(gt=0)
    estimated_self_consumption_pct: float = Field(ge=0, le=100)
    panel_count: int = Field(gt=0)
    inverter_type: str


class ReportMetadata(BaseModel):
    report_id: str
    generated_at: datetime
    technician_name: str
    survey_date: date
    version: str = "0.1.0"
    premium_tier: bool = False
    jurisdiction_code: Optional[str] = None
    jurisdiction_name: Optional[str] = None
    grid_operator: Optional[str] = None
    site_latitude: Optional[float] = None
    site_longitude: Optional[float] = None


class ExecutiveSummary(BaseModel):
    overview: str
    key_findings: list[str]
    suitability_score: int = Field(ge=0, le=100)
    suitability_verdict: str


class SiteSurvey(BaseModel):
    metadata: ReportMetadata
    client: ClientInfo
    site: SiteInfo
    photo_analyses: list[PhotoAnalysis]
    checklist: list[ChecklistItem]
    system_estimate: SystemEstimate
    executive_summary: ExecutiveSummary
    recommendations: list[Recommendation]

    @field_validator("photo_analyses")
    @classmethod
    def at_least_one_photo(cls, v: list[PhotoAnalysis]) -> list[PhotoAnalysis]:
        if not v:
            raise ValueError("At least one photo analysis is required")
        return v

    @field_validator("checklist")
    @classmethod
    def at_least_one_checklist_item(cls, v: list[ChecklistItem]) -> list[ChecklistItem]:
        if not v:
            raise ValueError("At least one checklist item is required")
        return v


def get_sample_survey() -> SiteSurvey:
    """Return realistic demo data for CLI --demo and tests."""
    return SiteSurvey(
        metadata=ReportMetadata(
            report_id="SOL-2026-0042",
            generated_at=datetime(2026, 7, 5, 14, 30),
            technician_name="Alexandru Popescu",
            survey_date=date(2026, 7, 4),
        ),
        client=ClientInfo(
            name="Maria Ionescu",
            address="Str. Energiei Verde 12",
            city="Cluj-Napoca",
            postal_code="400001",
            phone="+40 722 123 456",
            email="maria.ionescu@email.ro",
        ),
        site=SiteInfo(
            roof_type=RoofType.TILE,
            roof_orientation=RoofOrientation.S,
            roof_pitch_degrees=35.0,
            usable_area_m2=42.5,
            annual_consumption_kwh=4800,
            grid_connection="single-phase",
            existing_solar=False,
            shading_level=ShadingLevel.LOW,
            structural_notes="Structură lemn + beton, fără semne de degradare vizibilă.",
        ),
        photo_analyses=[
            PhotoAnalysis(
                photo_id="P001",
                category=PhotoCategory.ROOF_OVERVIEW,
                findings=[
                    "Acoperiș orientat spre sud, suprafață utilizabilă ~42 m²",
                    "Țiglă ceramică în stare bună, montată 2018",
                    "Fără obstacole majore pe suprafața principală",
                ],
                issues=["Coș de fum pe partea estică — verificare distanță minimă panouri"],
                actionable_notes=["Marchează zona estică ca exclusă din layout"],
                confidence=0.92,
                evidence_photo_ids=["P001"],
                reasoning_short="Orientare sud și țiglă vizibile în P001",
            ),
            PhotoAnalysis(
                photo_id="P002",
                category=PhotoCategory.ELECTRICAL_PANEL,
                findings=[
                    "Tablou electric monofazat 230V, 40A",
                    "Spațiu disponibil pentru protecții DC/AC",
                    "Împământare prezentă și conformă vizual",
                ],
                issues=[],
                actionable_notes=["Propune poziționare invertor la max 8m de tablou"],
                confidence=0.88,
                evidence_photo_ids=["P002"],
                reasoning_short="Tablou monofazat identificat în P002",
            ),
            PhotoAnalysis(
                photo_id="P003",
                category=PhotoCategory.SHADING,
                findings=[
                    "Umbrire minimă pe suprafața principală (09:00–16:00)",
                    "Copac la 12m pe vest — umbrire parțială după-amiază târziu",
                ],
                issues=["Umbrire sezonieră estimată 3–5% pe string-ul vestic"],
                actionable_notes=["Simulare producție cu obiect de umbrire vestic"],
                confidence=0.81,
                evidence_photo_ids=["P003"],
                reasoning_short="Copac vestic vizibil în P003",
            ),
            PhotoAnalysis(
                photo_id="P004",
                category=PhotoCategory.ACCESS,
                findings=[
                    "Acces sigur pe scară fixă din spate",
                    "Potrivit pentru transport materiale pe acoperiș",
                ],
                issues=[],
                confidence=0.95,
                evidence_photo_ids=["P004"],
                reasoning_short="Scară fixă și acces sigur în P004",
            ),
        ],
        checklist=[
            ChecklistItem(
                id="CHK-01",
                category="Structură",
                description="Starea structurală a acoperișului",
                status=ChecklistStatus.PASS,
                notes="Fără deformări sau infiltrații vizibile",
            ),
            ChecklistItem(
                id="CHK-02",
                category="Electric",
                description="Capacitate tablou electric pentru injectare",
                status=ChecklistStatus.PASS,
                notes="40A suficient pentru 6 kWp monofazat",
            ),
            ChecklistItem(
                id="CHK-03",
                category="Umbrire",
                description="Analiză umbrire statică și dinamică",
                status=ChecklistStatus.WARNING,
                notes="Copac vestic — monitorizare recomandată",
            ),
            ChecklistItem(
                id="CHK-04",
                category="Acces",
                description="Acces sigur pentru montaj",
                status=ChecklistStatus.PASS,
            ),
            ChecklistItem(
                id="CHK-05",
                category="Documentație",
                description="Acte proprietate și acorduri vecinătate",
                status=ChecklistStatus.PASS,
                notes="Acte verificate pe teren",
            ),
            ChecklistItem(
                id="CHK-06",
                category="Conformitate",
                description="Distanțe față de coș fum / muchii",
                status=ChecklistStatus.WARNING,
                notes="Verificare distanță minimă 0.5m de coș",
            ),
        ],
        system_estimate=SystemEstimate(
            recommended_capacity_kwp=6.0,
            estimated_annual_production_kwh=7200,
            estimated_self_consumption_pct=65,
            panel_count=14,
            inverter_type="Hibrid monofazat 6kW",
        ),
        executive_summary=ExecutiveSummary(
            overview=(
                "Proprietatea din Cluj-Napoca prezintă condiții excelente pentru "
                "instalarea unui sistem fotovoltaic de 6 kWp. Acoperișul orientat "
                "spre sud, cu 42.5 m² utilizabili și consum anual de 4.800 kWh, "
                "permite acoperirea a peste 100% din necesarul energetic al gospodăriei."
            ),
            key_findings=[
                "Orientare optimă S, înclinare 35° — randament estimat 1.200 kWh/kWp/an",
                "Tablou electric pregătit pentru integrare invertor hibrid",
                "Umbrire redusă — impact estimat sub 5% pe producție anuală",
                "Acces montaj sigur, fără restricții logistice majore",
            ],
            suitability_score=87,
            suitability_verdict="Recomandat — instalare fezabilă fără lucrări pregătitoare majore",
        ),
        recommendations=[
            Recommendation(
                priority="high",
                title="Layout panouri — excludere zonă estică",
                description=(
                    "Evitați montajul în zona coșului de fum (est). "
                    "Configurație recomandată: 14 panouri 430W pe 2 string-uri."
                ),
            ),
            Recommendation(
                priority="high",
                title="Invertor hibrid cu baterie opțională",
                description=(
                    "Invertor hibrid 6kW monofazat cu posibilitate extindere baterie 5–10 kWh "
                    "pentru autoconsum sporit (țintă 65%+)."
                ),
                estimated_cost_eur=8500,
            ),
            Recommendation(
                priority="medium",
                title="Monitorizare umbrire copac vestic",
                description=(
                    "Programați re-evaluare umbrire la 6 luni. Dacă creșterea copacului "
                    "depășește 8% pierdere, considerați optimizatori per panou pe string vestic."
                ),
            ),
            Recommendation(
                priority="low",
                title="Pregătire documentație autorizație",
                description=(
                    "Pregătiți plan de situație, schema unifilară și declarație conformitate "
                    "conform cerințelor ANRE/AHJ locale."
                ),
            ),
        ],
    )


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent