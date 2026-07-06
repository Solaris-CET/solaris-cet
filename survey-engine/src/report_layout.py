"""Layout primitives & canvas drawing for SOLARIS CET reports."""

from __future__ import annotations

import math
from typing import Optional

from reportlab.graphics.shapes import Drawing, Rect, String, Wedge
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

# Design v6 — three refinement passes (v4 typography, v5 components, v6 polish)
DESIGN_VERSION = 6

INK = colors.HexColor("#0A1628")
INK_SOFT = colors.HexColor("#1E3A5F")
SLATE = colors.HexColor("#4A6278")
SILVER = colors.HexColor("#8FA3B8")
PEARL = colors.HexColor("#F4F6F9")
WHITE = colors.HexColor("#FFFFFF")
GOLD = colors.HexColor("#F0A030")
COPPER = colors.HexColor("#D4641A")
COPPER_PALE = colors.HexColor("#FFF4EC")
TEAL = colors.HexColor("#0E8F6A")
TEAL_PALE = colors.HexColor("#E6F6F0")
GOLD_PALE = colors.HexColor("#FFF8E8")
RUST = colors.HexColor("#B83232")
RUST_PALE = colors.HexColor("#FCEEED")
LINE = colors.HexColor("#D8E0EA")
LINE_SOFT = colors.HexColor("#E8EDF3")

ML = 2.0 * cm
MR = 2.0 * cm
MT = 2.4 * cm
MB = 2.0 * cm
CW = A4[0] - ML - MR

FONT_BODY = "Times-Roman"
FONT_BODY_B = "Times-Bold"
FONT_UI = "Helvetica"
FONT_UI_B = "Helvetica-Bold"


def build_styles() -> dict:
    b = getSampleStyleSheet()
    return {
        "sec_ghost": ParagraphStyle("Ghost", fontName=FONT_UI_B, fontSize=42, textColor=LINE_SOFT, leading=42),
        "sec_tag": ParagraphStyle("Tag", fontName=FONT_UI, fontSize=7, textColor=COPPER, leading=9, spaceAfter=2),
        "sec_title": ParagraphStyle("Title", fontName=FONT_UI_B, fontSize=18, textColor=INK, leading=22, spaceAfter=3),
        "sec_sub": ParagraphStyle("Sub", fontName=FONT_BODY, fontSize=9.5, textColor=SLATE, leading=13, spaceAfter=12),
        "body": ParagraphStyle("Body", fontName=FONT_BODY, fontSize=10, textColor=INK, leading=15, alignment=TA_JUSTIFY, spaceAfter=7),
        "body_sm": ParagraphStyle("Sm", fontName=FONT_UI, fontSize=8.5, textColor=SLATE, leading=12),
        "bullet": ParagraphStyle("Bul", fontName=FONT_BODY, fontSize=9.5, textColor=INK, leftIndent=12, leading=14, spaceAfter=4),
        "toc": ParagraphStyle("Toc", fontName=FONT_BODY, fontSize=10.5, textColor=INK, leading=26),
        "toc_dots": ParagraphStyle("Dots", fontName=FONT_UI, fontSize=8, textColor=LINE, alignment=TA_CENTER),
        "kpi_v": ParagraphStyle("KpiV", fontName=FONT_UI_B, fontSize=20, textColor=INK, alignment=TA_CENTER, leading=24),
        "kpi_l": ParagraphStyle("KpiL", fontName=FONT_UI, fontSize=7, textColor=SILVER, alignment=TA_CENTER, leading=9),
        "card_h": ParagraphStyle("CardH", fontName=FONT_UI_B, fontSize=10.5, textColor=INK, leading=13, spaceAfter=3),
        "legal": ParagraphStyle("Legal", fontName=FONT_BODY, fontSize=7.5, textColor=SILVER, alignment=TA_JUSTIFY, leading=11),
    }


def draw_solar_grid(canvas, x: float, y: float, w: float, h: float, alpha: float = 0.15):
    """Decorative PV cell grid."""
    cols, rows = 14, 8
    cw, rh = w / cols, h / rows
    for r in range(rows):
        for c in range(cols):
            shade = colors.HexColor("#12243C") if (r + c) % 2 else colors.HexColor("#0F1F33")
            canvas.setFillColor(shade)
            canvas.rect(x + c * cw + 1, y + r * rh + 1, cw - 2, rh - 2, fill=1, stroke=0)


def draw_cover(canvas, survey, logo_path, design_version: int = DESIGN_VERSION):
    w, h = A4
    score = survey.executive_summary.suitability_score
    canvas.saveState()

    # Full navy canvas
    canvas.setFillColor(INK)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

    # Solar grid top-right (v4)
    draw_solar_grid(canvas, w * 0.52, h * 0.55, w * 0.48, h * 0.45)

    # Copper accent band
    canvas.setFillColor(COPPER)
    canvas.rect(0, h - 0.45 * cm, w, 0.45 * cm, fill=1, stroke=0)

    # Logo
    if logo_path.exists():
        try:
            reader = ImageReader(str(logo_path))
            iw, ih = reader.getSize()
            lw = 5.2 * cm
            lh = lw * ih / iw
            canvas.drawImage(reader, ML, h - MT - lh, lw, lh, preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    # Title stack (v4 typography)
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_UI_B, 11)
    canvas.drawString(ML, h - 5.8 * cm, "SOLARIS CET")
    canvas.setFont(FONT_UI_B, 34)
    canvas.drawString(ML, h - 7.2 * cm, "RAPORT TEHNIC")
    canvas.setFont(FONT_UI, 12)
    canvas.setFillColor(SILVER)
    canvas.drawString(ML, h - 7.95 * cm, "Evaluare Șantier Fotovoltaic")
    canvas.setFont(FONT_UI, 9)
    canvas.drawString(ML, h - 8.55 * cm, "Document permit-ready  ·  Analiză AI  ·  Conform standardelor SOLARIS")

    # Certification chips (v5)
    chips = ["PERMIT-READY", "AI-VERIFIED", "FIELD-SURVEY"]
    cx = ML
    for chip in chips:
        tw = canvas.stringWidth(chip, FONT_UI, 7) + 16
        canvas.setFillColor(INK_SOFT)
        canvas.roundRect(cx, h - 9.6 * cm, tw, 0.55 * cm, 3, fill=1, stroke=0)
        canvas.setFillColor(GOLD)
        canvas.setFont(FONT_UI_B, 7)
        canvas.drawString(cx + 8, h - 9.35 * cm, chip)
        cx += tw + 8

    # Floating client card with shadow (v5)
    card_x, card_y, card_w, card_h = ML, 4.8 * cm, w - ML - MR, 5.6 * cm
    canvas.setFillColor(colors.HexColor("#00000020"))
    canvas.roundRect(card_x + 4, card_y - 4, card_w, card_h, 10, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.roundRect(card_x, card_y, card_w, card_h, 10, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.roundRect(card_x, card_y, card_w, card_h, 10, fill=0, stroke=1)

    canvas.setFillColor(SLATE)
    canvas.setFont(FONT_UI, 7)
    canvas.drawString(card_x + 16, card_y + card_h - 22, "PROPRIETAR / CLIENT")
    canvas.setFillColor(INK)
    canvas.setFont(FONT_UI_B, 16)
    canvas.drawString(card_x + 16, card_y + card_h - 44, survey.client.name)
    canvas.setFont(FONT_BODY, 10)
    canvas.setFillColor(SLATE)
    canvas.drawString(
        card_x + 16, card_y + card_h - 62,
        f"{survey.client.address}, {survey.client.city} {survey.client.postal_code}",
    )

    # Meta row inside card
    meta = [
        ("ID RAPORT", survey.metadata.report_id),
        ("DATA VIZITĂ", survey.metadata.survey_date.strftime("%d.%m.%Y")),
        ("TEHNICIAN", survey.metadata.technician_name),
    ]
    mx = card_x + 16
    for label, value in meta:
        canvas.setFont(FONT_UI, 6.5)
        canvas.setFillColor(SILVER)
        canvas.drawString(mx, card_y + 38, label)
        canvas.setFont(FONT_UI_B, 9.5)
        canvas.setFillColor(INK)
        canvas.drawString(mx, card_y + 24, value[:28])
        mx += (card_w - 32) / 3

    # Score gauge — donut (v6)
    gx, gy = card_x + card_w - 2.8 * cm, card_y + card_h / 2 + 0.2 * cm
    r_outer, r_inner = 2.1 * cm, 1.5 * cm
    canvas.setFillColor(PEARL)
    canvas.circle(gx, gy, r_outer, fill=1, stroke=0)
    sc = TEAL if score >= 75 else GOLD if score >= 50 else RUST
    canvas.setFillColor(sc)
    canvas.wedge(gx - r_outer, gy - r_outer, gx + r_outer, gy + r_outer, 90, 90 - score / 100 * 360, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.circle(gx, gy, r_inner, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont(FONT_UI_B, 22)
    canvas.drawCentredString(gx, gy + 2, str(score))
    canvas.setFont(FONT_UI, 6.5)
    canvas.setFillColor(SILVER)
    canvas.drawCentredString(gx, gy - 14, "FEZABILITATE")

    # Verdict ribbon
    canvas.setFillColor(COPPER_PALE)
    canvas.roundRect(card_x + 16, card_y + 10, card_w - 32 - 3.2 * cm, 1.1 * cm, 4, fill=1, stroke=0)
    canvas.setFillColor(COPPER)
    canvas.rect(card_x + 16, card_y + 10, 3, 1.1 * cm, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont(FONT_UI_B, 8)
    canvas.drawString(card_x + 26, card_y + 22, "VERDICT")
    canvas.setFont(FONT_BODY, 8.5)
    canvas.setFillColor(SLATE)
    v = survey.executive_summary.suitability_verdict
    canvas.drawString(card_x + 26, card_y + 14, v[:72] + ("…" if len(v) > 72 else ""))

    # Footer
    canvas.setFillColor(INK_SOFT)
    canvas.rect(0, 0, w, 1.1 * cm, fill=1, stroke=0)
    canvas.setFillColor(SILVER)
    canvas.setFont(FONT_UI, 6.5)
    canvas.drawString(ML, 0.35 * cm, "SOLARIS CET · Confidențial · Usage intern și autorizări")
    canvas.drawRightString(w - MR, 0.35 * cm, f"Design v{design_version}")

    canvas.restoreState()


def draw_content_page(canvas, doc, logo_path):
    w, h = A4
    canvas.saveState()

    # Left sidebar accent (v6)
    canvas.setFillColor(COPPER)
    canvas.rect(0, MB, 0.12 * cm, h - MT - MB, fill=1, stroke=0)

    # Watermark
    canvas.saveState()
    canvas.translate(w * 0.62, h * 0.42)
    canvas.rotate(35)
    canvas.setFillColor(colors.HexColor("#0A162808"))
    canvas.setFont(FONT_UI_B, 52)
    canvas.drawCentredString(0, 0, "SOLARIS")
    canvas.restoreState()

    # Header
    canvas.setFillColor(INK)
    canvas.rect(0, h - 1.35 * cm, w, 1.35 * cm, fill=1, stroke=0)
    canvas.setFillColor(COPPER)
    canvas.rect(0, h - 1.35 * cm, w, 1.5, fill=1, stroke=0)

    if logo_path.exists():
        try:
            reader = ImageReader(str(logo_path))
            iw, ih = reader.getSize()
            lh = 0.85 * cm
            lw = lh * iw / ih
            canvas.drawImage(reader, ML, h - 1.15 * cm, lw, lh, preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_UI_B, 7.5)
    canvas.drawString(ML + 1.2 * cm, h - 0.82 * cm, "SOLARIS CET")
    canvas.setFont(FONT_UI, 6.5)
    canvas.setFillColor(SILVER)
    canvas.drawString(ML + 1.2 * cm, h - 1.02 * cm, getattr(doc, "_section", ""))
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_UI, 6.5)
    canvas.drawRightString(w - MR, h - 0.92 * cm, doc.survey_id)

    # Footer
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(ML, 1.5 * cm, w - MR, 1.5 * cm)
    canvas.setFillColor(SILVER)
    canvas.setFont(FONT_UI, 6.5)
    canvas.drawString(ML, 0.85 * cm, "Raport evaluare șantier fotovoltaic — SOLARIS CET")
    canvas.drawRightString(w - MR, 0.85 * cm, f"Pag. {canvas.getPageNumber()}")

    canvas.restoreState()


def section_block(styles, num: str, title: str, desc: str = "") -> list:
    """Section header with ghost number (v4)."""
    ghost = Paragraph(num, styles["sec_ghost"])
    head = Table(
        [[ghost, [Paragraph("SECȚIUNEA " + num, styles["sec_tag"]),
                  Paragraph(title, styles["sec_title"]),
                  Paragraph(desc, styles["sec_sub"]) if desc else Spacer(1, 1)]]],
        colWidths=[1.6 * cm, CW - 1.6 * cm],
    )
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    rule = Table([[""]], colWidths=[CW], rowHeights=[1.5])
    rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), COPPER)]))
    return [head, Spacer(1, 0.15 * cm), rule, Spacer(1, 0.4 * cm)]


def pill(label: str, fg, bg) -> Table:
    t = Table([[Paragraph(f'<font color="{fg.hexval()}"><b>{label}</b></font>', ParagraphStyle(
        "p", fontName=FONT_UI_B, fontSize=7, alignment=TA_CENTER, leading=8,
    ))]], colWidths=[1.9 * cm], rowHeights=[0.55 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t


def kpi_dashboard(styles, items: list[tuple[str, str, colors.Color]]) -> Table:
    cells = []
    for val, lbl, accent in items:
        inner = Table(
            [[Paragraph(val, styles["kpi_v"])], [Paragraph(lbl.upper(), styles["kpi_l"])]],
            colWidths=[CW / len(items) - 0.25 * cm],
        )
        inner.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), WHITE),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LINEBELOW", (0, 1), (-1, 1), 2, accent),
        ]))
        cells.append(inner)
    outer = Table([cells], colWidths=[CW / len(items)] * len(items))
    outer.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2)]))
    return outer


def donut_chart(production: float, consumption: float, coverage: float) -> Drawing:
    """Energy donut (v6)."""
    d = Drawing(CW, 4.2 * cm)
    cx, cy, r = 2.2 * cm, 2.0 * cm, 1.55 * cm
    d.add(String(4.8 * cm, 3.5 * cm, "Balanță energetică estimată", fontSize=9, fillColor=INK, fontName=FONT_UI_B))
    d.add(Wedge(cx - r, cy - r, cx + r, cy + r, 0, 360, fillColor=LINE_SOFT, strokeColor=None))
    angle = min(coverage, 100) / 100 * 360
    d.add(Wedge(cx - r, cy - r, cx + r, cy + r, 90, 90 - angle, fillColor=COPPER, strokeColor=None))
    d.add(Wedge(cx - 0.95 * cm, cy - 0.95 * cm, cx + 0.95 * cm, cy + 0.95 * cm, 0, 360, fillColor=WHITE, strokeColor=None))
    d.add(String(cx - 12, cy + 2, f"{coverage:.0f}%", fontSize=14, fillColor=INK, fontName=FONT_UI_B))
    d.add(String(cx - 18, cy - 12, "acoperire", fontSize=7, fillColor=SLATE, fontName=FONT_UI))
    lines = [
        (f"Producție: {production:,.0f} kWh/an", COPPER),
        (f"Consum: {consumption:,.0f} kWh/an", INK_SOFT),
        (f"Surplus: {max(production - consumption * 0.65, 0):,.0f} kWh/an", TEAL),
    ]
    y = 2.6 * cm
    for text, col in lines:
        d.add(Rect(4.8 * cm, y, 6, 6, fillColor=col, strokeColor=None))
        d.add(String(5.0 * cm, y, text, fontSize=8.5, fillColor=INK, fontName=FONT_BODY))
        y -= 0.55 * cm
    return d


def spec_table(rows: list, col_widths: list) -> Table:
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("FONTNAME", (0, 0), (-1, -1), FONT_BODY),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PEARL]),
    ]
    cmds += [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), FONT_UI_B),
        ("FONTSIZE", (0, 0), (-1, 0), 7.5),
    ]
    for r in range(1, len(rows)):
        cmds += [("FONTNAME", (0, r), (0, r), FONT_UI_B), ("TEXTCOLOR", (0, r), (0, r), SLATE), ("FONTSIZE", (0, r), (0, r), 8)]
    t.setStyle(TableStyle(cmds))
    return t


def insight_panel(styles, findings: list[str], columns: int = 1) -> Table:
    """Key findings as panel cards (v5)."""
    if columns == 1:
        rows = [[Paragraph(f"<bullet>&bull;</bullet> {f}", styles["bullet"])] for f in findings]
        t = Table(rows, colWidths=[CW])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PEARL),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("LINEBEFORE", (0, 0), (0, -1), 3, COPPER),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ]))
        return t

    half = CW / 2 - 0.1 * cm
    cells = []
    for i, f in enumerate(findings):
        cell = Table([[Paragraph(f"<b>{i+1}.</b> {f}", styles["body_sm"])]], colWidths=[half])
        cell.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WHITE),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ]))
        cells.append(cell)
    while len(cells) % 2:
        cells.append(Table([[""]], colWidths=[half]))
    grid_rows = [cells[i:i+2] for i in range(0, len(cells), 2)]
    t = Table(grid_rows, colWidths=[half, half])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    return t


def signature_block(styles, technician: str) -> Table:
    t = Table([
        [Paragraph("<b>Validat de tehnician</b>", styles["body_sm"])],
        [Spacer(1, 0.6 * cm)],
        [Paragraph("_" * 42, styles["body_sm"])],
        [Paragraph(technician, styles["body_sm"])],
        [Paragraph("Semnătură și ștampilă", ParagraphStyle("s", fontName=FONT_UI, fontSize=7, textColor=SILVER))],
    ], colWidths=[CW * 0.45])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PEARL),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ]))
    return t