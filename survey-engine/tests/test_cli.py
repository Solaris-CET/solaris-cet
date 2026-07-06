"""Tests for CLI commands."""

from click.testing import CliRunner

from src.cli import demo, info, main


def test_cli_demo_generates_pdf(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    runner = CliRunner()
    result = runner.invoke(demo, ["--output", str(tmp_path / "out")])
    assert result.exit_code == 0
    assert "Raport demo generat" in result.output
    pdfs = list((tmp_path / "out").glob("*.pdf"))
    assert len(pdfs) == 1


def test_cli_info():
    runner = CliRunner()
    result = runner.invoke(info)
    assert result.exit_code == 0
    assert "SOLARIS CET" in result.output


def test_cli_main_help():
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "demo" in result.output
    assert "analyze" in result.output
    assert "web" in result.output
    assert "batch" in result.output
    assert "dashboard" in result.output