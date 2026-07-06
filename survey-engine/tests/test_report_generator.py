"""Tests for PDF report generation."""

from pathlib import Path

import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from src.models import get_sample_survey, project_root
from src.report_generator import ReportGenerator, generate_report
from src.report_layout import DESIGN_VERSION


@pytest.fixture
def output_dir(tmp_path: Path) -> Path:
    return tmp_path / "reports"


def test_generate_report_creates_pdf(output_dir: Path):
    survey = get_sample_survey()
    pdf_path = generate_report(survey, output_dir)
    assert pdf_path.exists()
    assert pdf_path.suffix == ".pdf"
    assert pdf_path.stat().st_size > 5000


def test_report_filename_contains_report_id(output_dir: Path):
    survey = get_sample_survey()
    pdf_path = generate_report(survey, output_dir)
    assert survey.metadata.report_id in pdf_path.name


def test_logo_path_exists():
    logo = project_root() / "assets" / "logo.jpg"
    assert logo.exists()


def test_report_generator_with_logo(output_dir: Path):
    survey = get_sample_survey()
    gen = ReportGenerator(logo_path=project_root() / "assets" / "logo.jpg")
    pdf_path = output_dir / "test_report.pdf"
    result = gen.generate(survey, pdf_path)
    assert result == pdf_path
    assert pdf_path.stat().st_size > 5000


def test_report_generator_without_logo(tmp_path: Path):
    survey = get_sample_survey()
    gen = ReportGenerator(logo_path=tmp_path / "nonexistent.jpg")
    pdf_path = tmp_path / "no_logo.pdf"
    gen.generate(survey, pdf_path)
    assert pdf_path.exists()


def test_design_version_at_least_v6():
    assert DESIGN_VERSION >= 6


def test_pdf_has_multiple_pages(output_dir: Path):
    survey = get_sample_survey()
    pdf_path = generate_report(survey, output_dir)
    # Count pages by reading PDF structure (simple heuristic: /Type /Page)
    content = pdf_path.read_bytes()
    page_count = content.count(b"/Type /Page")
    # ReportLab may include /Type /Pages too; actual pages should be >= 7
    assert page_count >= 7