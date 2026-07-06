"""SOLARIS CET PDF report generator — uses report_layout v6."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from src.models import ChecklistStatus, PhotoAnalysis, PhotoCategory, SiteSurvey, project_root
from src.report_layout import (
    COPPER,
    COPPER_PALE,
    CW,
    DESIGN_VERSION,
    FONT_UI,
    FONT_UI_B,
    GOLD,
    GOLD_PALE,
    INK,
    LINE,
    MB,
    ML,
    MR,
    MT,
    PEARL,
    RUST,
    RUST_PALE,
    SLATE,
    TEAL,
    TEAL_PALE,
    WHITE,
    build_styles,
    donut_chart,
    draw_content_page,
    draw_cover,
    insight_panel,
    kpi_dashboard,
    pill,
    section_block,
    signature_block,
    spec_table,
)

CATEGORY_LABELS = {
    PhotoCategory.ROOF_OVERVIEW: "Vedere Generală Acoperiș",
    PhotoCategory.ROOF_DETAIL: "Detaliu Acoperiș",
    PhotoCategory.ELECTRICAL_PANEL: "Tablou Electric",
    PhotoCategory.SHADING: "Analiză Umbrire",
    PhotoCategory.ACCESS: "Acces Montaj",
    PhotoCategory.METER: "Contor Energie",
    PhotoCategory.OTHER: "Altele",
}

ROOF_LABELS = {"tile": "Țiglă ceramică", "metal": "Tablă metalică", "flat": "Acoperiș plat", "slate": "Șindrilă", "other": "Alt tip"}
SHADING_LABELS = {"none": "Fără", "low": "Redusă", "moderate": "Moderată", "high": "Ridicată", "severe": "Severă"}

STATUS_CFG = {
    ChecklistStatus.PASS: ("TRECUT", TEAL, TEAL_PALE),
    ChecklistStatus.FAIL: ("RESPINS", RUST, RUST_PALE),
    ChecklistStatus.WARNING: ("ATENȚIE", GOLD, GOLD_PALE),
    ChecklistStatus.NA: ("N/A", SLATE, PEARL),
}

PRIORITY_CFG = {
    "high": ("RIDICATĂ", RUST, RUST_PALE),
    "medium": ("MEDIE", GOLD, GOLD_PALE),
    "low": ("SCĂZUTĂ", TEAL, TEAL_PALE),
}


class SolarisDocTemplate(BaseDocTemplate):
    def __init__(self, survey: SiteSurvey, on_cover, on_content, **kwargs):
        super().__init__(**kwargs)
        self.survey = survey
        self.survey_id = survey.metadata.report_id
        self._section = "Cuprins"
        cover = Frame(0, 0, A4[0], A4[1], leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        content = Frame(ML, MB, CW, A4[1] - MT - MB)
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover], onPage=on_cover),
            PageTemplate(id="content", frames=[content], onPage=on_content),
        ])


class ReportGenerator:
    def __init__(self, logo_path: Optional[Path] = None):
        self.logo_path = logo_path or (project_root() / "assets" / "logo.jpg")
        self.styles = build_styles()
        self._extra = {
            "photo_caption": ParagraphStyle("Cap", fontName=FONT_UI, fontSize=7.5, textColor=SLATE, alignment=1, leading=10),
        }

    def _set(self, doc: SolarisDocTemplate, name: str):
        doc._section = name

    def _hero_summary(self, text: str) -> Table:
        t = Table([[Paragraph(text, self.styles["body"])]], colWidths=[CW])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PEARL),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("LINEBEFORE", (0, 0), (0, -1), 4, COPPER),
            ("TOPPADDING", (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ]))
        return t

    def _toc_row(self, num: str, title: str) -> list:
        dots = "." * max(4, int((CW - 5 * cm) / 3.5))
        return [
            Paragraph(f'<font color="{COPPER.hexval()}"><b>{num}</b></font>', self.styles["toc"]),
            Paragraph(f'{title}<font color="{LINE.hexval()}"> {dots}</font>', self.styles["toc"]),
        ]

    def _confidence(self, value: float) -> Table:
        col = TEAL if value >= 0.85 else GOLD if value >= 0.7 else RUST
        bar = Table([[""] * 2], colWidths=[CW * 0.55 * value, CW * 0.55 * (1 - value)], rowHeights=[5])
        bar.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), col),
            ("BACKGROUND", (1, 0), (1, 0), LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        outer = Table([
            [Paragraph(f"Încredere AI <b>{value:.0%}</b>", self.styles["body_sm"])],
            [bar],
        ], colWidths=[CW])
        return outer

    def _photo_magazine(self, photo: PhotoAnalysis) -> list:
        cat = CATEGORY_LABELS.get(photo.category, photo.category.value)
        header = Table([[
            Paragraph(f"<b>{photo.photo_id}</b>", ParagraphStyle("id", fontName=FONT_UI_B, fontSize=9, textColor=WHITE)),
            Paragraph(cat, ParagraphStyle("c", fontName=FONT_UI, fontSize=8, textColor=WHITE)),
        ]], colWidths=[1.4 * cm, CW - 1.4 * cm])
        header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), INK),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ]))

        body_parts = [self._confidence(photo.confidence), Spacer(1, 0.15 * cm)]
        if photo.file_path and Path(photo.file_path).exists():
            try:
                reader = ImageReader(photo.file_path)
                iw, ih = reader.getSize()
                iw_max = CW - 0.4 * cm
                ih_max = 5.5 * cm
                ratio = min(iw_max / iw, ih_max / ih)
                img = Image(photo.file_path, width=iw * ratio, height=ih * ratio)
                frame = Table([[img]], colWidths=[CW])
                frame.setStyle(TableStyle([
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0A1628")),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]))
                body_parts = [frame, Spacer(1, 0.2 * cm)] + body_parts
            except Exception:
                pass

        for label, items, color in [
            ("Constatări", photo.findings, INK),
            ("Probleme", photo.issues, RUST),
            ("Acțiuni", photo.actionable_notes, TEAL),
        ]:
            if items:
                body_parts.append(Paragraph(f'<font color="{color.hexval()}"><b>{label}</b></font>', self.styles["body_sm"]))
                for item in items:
                    body_parts.append(Paragraph(f"• {item}", self.styles["bullet"]))

        card = Table([[header], [body_parts]], colWidths=[CW])
        card.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("BACKGROUND", (0, 1), (-1, 1), WHITE),
            ("TOPPADDING", (0, 1), (-1, 1), 12),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
            ("LEFTPADDING", (0, 1), (-1, 1), 12),
            ("RIGHTPADDING", (0, 1), (-1, 1), 12),
        ]))
        return [KeepTogether([card, Spacer(1, 0.4 * cm)])]

    def _rec_card(self, n: int, priority: str, title: str, desc: str, cost: Optional[float]) -> Table:
        lbl, stripe, bg = PRIORITY_CFG.get(priority, ("", SLATE, PEARL))
        ghost = Paragraph(f"{n:02d}", ParagraphStyle("g", fontName=FONT_UI_B, fontSize=28, textColor=LINE, leading=30))
        content = [
            Paragraph(f'<font color="{stripe.hexval()}">PRIORITATE {lbl}</font>', self.styles["body_sm"]),
            Paragraph(title, self.styles["card_h"]),
            Paragraph(desc, self.styles["body"]),
        ]
        if cost:
            content.append(Paragraph(f"Estimare investiție: <b>{cost:,.0f} €</b>", self.styles["body_sm"]))
        inner = Table([[ghost, content]], colWidths=[1.5 * cm, CW - 1.5 * cm - 0.3 * cm])
        inner.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
        wrap = Table([[inner]], colWidths=[CW])
        wrap.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("LINEBEFORE", (0, 0), (0, -1), 4, stripe),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        return wrap

    def _timeline(self, steps: list[str]) -> Table:
        rows = []
        for i, step in enumerate(steps, 1):
            badge = Table([[str(i)]], colWidths=[0.75 * cm], rowHeights=[0.75 * cm])
            badge.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COPPER),
                ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
                ("FONTNAME", (0, 0), (-1, -1), FONT_UI_B),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            rows.append([badge, Paragraph(step, self.styles["body"])])
        t = Table(rows, colWidths=[1.1 * cm, CW - 1.1 * cm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
        ]))
        return t

    # ── Pages ─────────────────────────────────────────────────────────────────

    def _page_toc(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "Cuprins")
        sections = [("01", "Rezumat Executiv"), ("02", "Client & Șantier"), ("03", "Analiză Fotografică"),
                    ("04", "Checklist Tehnic"), ("05", "Estimare Sistem"), ("06", "Recomandări"), ("07", "Concluzii")]
        rows = [self._toc_row(n, t) for n, t in sections]
        toc = Table(rows, colWidths=[1.1 * cm, CW - 1.1 * cm])
        toc.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        return [*section_block(self.styles, "00", "Cuprins", "Structura documentului tehnic"), toc, PageBreak()]

    def _page_executive(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "01 · Rezumat Executiv")
        est = s.system_estimate
        cov = est.estimated_annual_production_kwh / s.site.annual_consumption_kwh * 100
        return [
            *section_block(self.styles, "01", "Rezumat Executiv", "Evaluare sintetică a fezabilității instalării"),
            self._hero_summary(s.executive_summary.overview),
            Spacer(1, 0.45 * cm),
            kpi_dashboard(self.styles, [
                (f"{est.recommended_capacity_kwp}", "kWp instalat", COPPER),
                (f"{est.estimated_annual_production_kwh:,.0f}", "kWh/an", TEAL),
                (f"{cov:.0f}%", "acoperire consum", INK),
                (str(s.executive_summary.suitability_score), "scor", GOLD),
            ]),
            Spacer(1, 0.45 * cm),
            Paragraph("Constatări cheie", ParagraphStyle("h", fontName=FONT_UI_B, fontSize=11, textColor=INK, spaceAfter=8)),
            insight_panel(self.styles, s.executive_summary.key_findings, columns=2),
            Spacer(1, 0.4 * cm),
            donut_chart(est.estimated_annual_production_kwh, s.site.annual_consumption_kwh, cov),
            PageBreak(),
        ]

    def _page_site(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "02 · Client & Șantier")
        c, site = s.client, s.site
        half = CW / 2 - 0.12 * cm
        left = spec_table([
            ["Câmp", "Valoare"], ["Client", c.name],
            ["Adresă", f"{c.address}, {c.city}"], ["Cod poștal", c.postal_code],
            ["Telefon", c.phone or "—"], ["Email", c.email or "—"],
        ], [2.2 * cm, half - 2.2 * cm])
        right = spec_table([
            ["Parametru", "Valoare"],
            ["Acoperiș", ROOF_LABELS.get(site.roof_type.value, site.roof_type.value)],
            ["Orientare", site.roof_orientation.value], ["Înclinare", f"{site.roof_pitch_degrees}°"],
            ["Suprafață", f"{site.usable_area_m2} m²"],
            ["Umbrire", SHADING_LABELS.get(site.shading_level.value, site.shading_level.value)],
            ["Rețea", site.grid_connection], ["Solar existent", "Da" if site.existing_solar else "Nu"],
        ], [2.6 * cm, half - 2.6 * cm])
        grid = Table([[left, right]], colWidths=[half, half])
        story = [*section_block(self.styles, "02", "Informații Client & Șantier", "Date identificare și parametri tehnici"), grid]
        if site.structural_notes:
            story += [Spacer(1, 0.35 * cm), Paragraph("Note structurale", self.styles["card_h"]),
                      insight_panel(self.styles, [site.structural_notes])]
        story.append(PageBreak())
        return story

    def _page_photos(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "03 · Analiză Fotografică")
        story = [*section_block(self.styles, "03", "Analiză Fotografică",
                                f"{len(s.photo_analyses)} imagini — constatări acționabile per categorie")]
        for p in s.photo_analyses:
            story.extend(self._photo_magazine(p))
        story.append(PageBreak())
        return story

    def _page_checklist(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "04 · Checklist")
        pn = sum(1 for x in s.checklist if x.status == ChecklistStatus.PASS)
        wn = sum(1 for x in s.checklist if x.status == ChecklistStatus.WARNING)
        fn = sum(1 for x in s.checklist if x.status == ChecklistStatus.FAIL)
        rows = [["ID", "Categorie", "Verificare", "Status", "Note"]]
        for item in s.checklist:
            lbl, fg, bg = STATUS_CFG[item.status]
            rows.append([item.id, item.category, item.description, pill(lbl, fg, bg),
                         Paragraph(item.notes or "—", self.styles["body_sm"])])
        tbl = Table(rows, colWidths=[1.4 * cm, 2.2 * cm, 5.4 * cm, 2.0 * cm, CW - 11.0 * cm], repeatRows=1)
        tbl.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), FONT_UI),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), FONT_UI_B),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PEARL]),
        ]))
        return [
            *section_block(self.styles, "04", "Checklist Tehnic", "Protocol verificări standardizate SOLARIS CET"),
            kpi_dashboard(self.styles, [(str(pn), "trecute", TEAL), (str(wn), "atenție", GOLD),
                                        (str(fn), "respinse", RUST), (str(len(s.checklist)), "total", INK)]),
            Spacer(1, 0.4 * cm), tbl, PageBreak(),
        ]

    def _page_system(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "05 · Estimare Sistem")
        e = s.system_estimate
        pw = e.recommended_capacity_kwp / e.panel_count * 1000
        rows = [
            ["Componentă", "Specificație", "Detalii"],
            ["☀ Capacitate", f"{e.recommended_capacity_kwp} kWp", "Dimensionare optimă"],
            ["☀ Panouri", f"{e.panel_count} × ~{pw:.0f}W", "Monocristalin"],
            ["⚡ Invertor", e.inverter_type, "Hibrid monofazat"],
            ["📊 Producție/an", f"{e.estimated_annual_production_kwh:,.0f} kWh", "Estimare România"],
            ["🏠 Autoconsum", f"{e.estimated_self_consumption_pct}%", "Fără baterie"],
            ["↗ Surplus", f"{e.estimated_annual_production_kwh * (1 - e.estimated_self_consumption_pct/100):,.0f} kWh", "Compensare rețea"],
        ]
        cov = e.estimated_annual_production_kwh / s.site.annual_consumption_kwh * 100
        return [
            *section_block(self.styles, "05", "Estimare Sistem Fotovoltaic", "Dimensionare preliminară — validare inginer necesară"),
            spec_table(rows, [3.8 * cm, 4.2 * cm, CW - 8.0 * cm]),
            Spacer(1, 0.45 * cm),
            donut_chart(e.estimated_annual_production_kwh, s.site.annual_consumption_kwh, cov),
            PageBreak(),
        ]

    def _page_recs(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "06 · Recomandări")
        order = {"high": 0, "medium": 1, "low": 2}
        story = [*section_block(self.styles, "06", "Recomandări", "Acțiuni prioritizate pentru instalare și conformitate")]
        for i, r in enumerate(sorted(s.recommendations, key=lambda x: order.get(x.priority, 9)), 1):
            story += [self._rec_card(i, r.priority, r.title, r.description, r.estimated_cost_eur), Spacer(1, 0.3 * cm)]
        story.append(PageBreak())
        return story

    def _page_close(self, doc, s: SiteSurvey) -> list:
        self._set(doc, "07 · Concluzii")
        pn = sum(1 for x in s.checklist if x.status == ChecklistStatus.PASS)
        wn = sum(1 for x in s.checklist if x.status == ChecklistStatus.WARNING)
        steps = [
            "Validare layout panouri cu clientul",
            "Ofertă echipamente: panouri, invertor, structură, protecții",
            "Documentație autorizație: plan, schema unifilară, declarație",
            "Cerere racordare operator rețea",
            "Programare instalare post-aviz",
        ]
        meta = spec_table([
            ["Câmp", "Valoare"],
            ["ID", s.metadata.report_id],
            ["Generat", s.metadata.generated_at.strftime("%d.%m.%Y %H:%M")],
            ["Versiune", f"SOLARIS v{s.metadata.version} · Design v{DESIGN_VERSION}"],
            ["Tehnician", s.metadata.technician_name],
            ["Tier", "Premium" if s.metadata.premium_tier else "Standard"],
            ["Imagini", str(len(s.photo_analyses))],
        ], [4.5 * cm, CW - 4.5 * cm])
        legal = Table([[Paragraph(
            "<b>Notă legală:</b> Raport generat de SOLARIS CET. Estimările sunt orientative. "
            "Validare ANRE obligatorie înainte de execuție. Document confidențial.",
            self.styles["legal"],
        )]], colWidths=[CW])
        legal.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PEARL),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ]))
        footer_row = Table([[signature_block(self.styles, s.metadata.technician_name), meta]], colWidths=[CW * 0.42, CW * 0.58])
        footer_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        return [
            *section_block(self.styles, "07", "Concluzii & Următorii Pași"),
            Paragraph(
                f"Șantierul <b>{s.client.name}</b>: <i>{s.executive_summary.suitability_verdict}</i>. "
                f"<b>{pn}</b> verificări trecute, <b>{wn}</b> cu atenție.",
                self.styles["body"],
            ),
            Spacer(1, 0.35 * cm),
            Paragraph("Plan de acțiune", self.styles["card_h"]),
            self._timeline(steps),
            Spacer(1, 0.5 * cm),
            footer_row,
            Spacer(1, 0.45 * cm),
            legal,
        ]

    def generate(self, survey: SiteSurvey, output_path: Path) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc = SolarisDocTemplate(
            survey=survey,
            on_cover=lambda c, d: draw_cover(c, survey, self.logo_path),
            on_content=lambda c, d: draw_content_page(c, d, self.logo_path),
            filename=str(output_path),
            pagesize=A4,
            title=f"SOLARIS CET — {survey.metadata.report_id}",
            author="SOLARIS CET",
        )
        story = [Spacer(1, 1), NextPageTemplate("content"), PageBreak()]
        for fn in (self._page_toc, self._page_executive, self._page_site, self._page_photos,
                   self._page_checklist, self._page_system, self._page_recs, self._page_close):
            story.extend(fn(doc, survey))
        doc.build(story)
        return output_path


def generate_report(survey: SiteSurvey, output_dir: Optional[Path] = None) -> Path:
    out = output_dir or (project_root() / "output")
    name = f"SOLARIS_{survey.metadata.report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return ReportGenerator().generate(survey, out / name)