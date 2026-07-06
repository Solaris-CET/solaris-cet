"""SOLARIS CET command-line interface."""

from __future__ import annotations

import json
from pathlib import Path

import click
from dotenv import load_dotenv

from src.api_clients.deepseek import DeepSeekClient, DeepSeekError
from src.models import SiteSurvey, get_sample_survey, project_root
from src.photo_analyzer import PhotoAnalyzer
from src.report_generator import generate_report

load_dotenv(project_root() / ".env")


@click.group()
@click.version_option(version="0.1.0", prog_name="SOLARIS CET")
def main():
    """SOLARIS CET — AI-Powered Solar Site Survey & Report System."""


@main.command()
@click.option(
    "--output", "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Output directory for PDF (default: ./output)",
)
def demo(output: Path | None):
    """Generate a demo PDF report from sample data."""
    survey = get_sample_survey()
    out_dir = output or (project_root() / "output")
    pdf_path = generate_report(survey, out_dir)

    click.echo(click.style("✓ Raport demo generat cu succes!", fg="green", bold=True))
    click.echo(f"  Client:    {survey.client.name}")
    click.echo(f"  Raport ID: {survey.metadata.report_id}")
    click.echo(f"  Scor:      {survey.executive_summary.suitability_score}/100")
    click.echo(f"  Design:    v6 (3× refined)")
    click.echo(f"  Fișier:    {pdf_path}")


@main.command()
@click.option(
    "--photos", "-p",
    type=click.Path(exists=True, file_okay=False, path_type=Path),
    required=True,
    help="Director cu poze de șantier (jpg/png)",
)
@click.option(
    "--report-id", "-r",
    default=None,
    help="ID raport pentru logging costuri",
)
@click.option(
    "--output", "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Fișier JSON de output (default: output/analysis_<timestamp>.json)",
)
def analyze(photos: Path, report_id: str | None, output: Path | None):
    """Analizează poze de șantier cu DeepSeek vision."""
    client = DeepSeekClient()
    if not client.configured:
        click.echo(click.style("✗ DEEPSEEK_API_KEY lipsește.", fg="red", bold=True))
        click.echo("  Copiază .env.example → .env și adaugă cheia API.")
        raise SystemExit(1)

    click.echo(click.style("Analiză foto în curs...", fg="yellow"))
    try:
        analyzer = PhotoAnalyzer(client)
        results = analyzer.analyze_directory(photos, report_id=report_id)
    except (DeepSeekError, FileNotFoundError) as e:
        click.echo(click.style(f"✗ Eroare: {e}", fg="red"))
        raise SystemExit(1)

    out_path = output
    if out_path is None:
        from datetime import datetime
        out_dir = project_root() / "output"
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    payload = [r.model_dump() for r in results]
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    total_cost = client.cost_logger.total_cost()
    click.echo(click.style(f"✓ {len(results)} poze analizate!", fg="green", bold=True))
    for r in results:
        click.echo(f"  {r.photo_id} · {r.category.value} · încredere {r.confidence:.0%}")
    click.echo(f"  JSON:  {out_path}")
    click.echo(f"  Cost:  ~${total_cost:.4f} (estimat)")


@main.command()
@click.option(
    "--checklist", "-c",
    type=click.Path(exists=True, path_type=Path),
    required=True,
    help="JSON file with survey data (SiteSurvey schema)",
)
@click.option(
    "--output", "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Output directory for PDF",
)
def generate(checklist: Path, output: Path | None):
    """Generate PDF report from checklist JSON file."""
    data = json.loads(checklist.read_text(encoding="utf-8"))
    survey = SiteSurvey.model_validate(data)
    out_dir = output or (project_root() / "output")
    pdf_path = generate_report(survey, out_dir)

    click.echo(click.style("✓ Raport generat!", fg="green", bold=True))
    click.echo(f"  Fișier: {pdf_path}")


@main.command()
@click.option(
    "--manifest", "-m",
    type=click.Path(exists=True, path_type=Path),
    required=True,
    help="Manifest batch JSON sau CSV",
)
@click.option("--output", "-o", type=click.Path(path_type=Path), default=None)
def batch(manifest: Path, output: Path | None):
    """Procesare batch — mai multe șantiere (Faza 4)."""
    from src.batch_processor import load_manifest, run_batch

    jobs = load_manifest(manifest)
    click.echo(click.style(f"Batch: {len(jobs)} joburi", fg="yellow"))
    summary = run_batch(jobs, output_dir=output)
    click.echo(click.style(
        f"✓ {summary.succeeded}/{summary.total} reușite, {summary.failed} eșuate",
        fg="green" if summary.failed == 0 else "yellow",
        bold=True,
    ))
    for r in summary.results:
        if r.success:
            click.echo(f"  ✓ {r.job_id} → {r.pdf_path}")
        else:
            click.echo(click.style(f"  ✗ {r.job_id}: {r.error}", fg="red"))


@main.command()
def dashboard():
    """Afișează dashboard costuri și istoric rapoarte (Faza 4)."""
    from src.dashboard import format_dashboard_markdown, get_dashboard_data
    click.echo(format_dashboard_markdown(get_dashboard_data()))


@main.command()
@click.option("--port", "-p", default=7860, help="Port server web")
@click.option("--share", is_flag=True, help="Gradio public share link")
def web(port: int, share: bool):
    """Lansează interfața web Gradio (Faza 3)."""
    try:
        from src.web.app import launch
    except ImportError:
        click.echo(click.style("✗ Gradio lipsește.", fg="red", bold=True))
        click.echo("  Rulează: pip install -e \".[ui]\"")
        raise SystemExit(1)
    click.echo(click.style(f"SOLARIS CET Web — http://127.0.0.1:{port}", fg="green", bold=True))
    launch(server_port=port, share=share)


@main.command()
def info():
    """Show project info and paths."""
    root = project_root()
    logo = root / "assets" / "logo.jpg"
    ds = DeepSeekClient()
    click.echo(click.style("SOLARIS CET v0.1.0", fg="yellow", bold=True))
    click.echo(f"  Root:     {root}")
    click.echo(f"  Logo:     {logo} ({'OK' if logo.exists() else 'MISSING'})")
    click.echo(f"  Output:   {root / 'output'}")
    click.echo(f"  DeepSeek: {'configurat' if ds.configured else 'LIPSEȘTE API KEY'}")
    click.echo(f"  Web UI:   python -m src.cli web")
    click.echo(f"  Batch:    python -m src.cli batch -m manifest.json")
    click.echo(f"  Dashboard: python -m src.cli dashboard")


if __name__ == "__main__":
    main()