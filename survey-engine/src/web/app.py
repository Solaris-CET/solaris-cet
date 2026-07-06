"""Gradio web UI — Faza 3 + Faza 4: raport, batch, dashboard."""

from __future__ import annotations

import gradio as gr
from dotenv import load_dotenv

from src.api_clients.claude import ClaudeClient
from src.api_clients.deepseek import DeepSeekClient
from src.batch_processor import load_manifest, run_batch
from src.dashboard import format_dashboard_markdown, get_dashboard_data
from src.models import project_root
from src.pipeline import MAX_PHOTOS, default_checklist, run_pipeline
from src.report_layout import DESIGN_VERSION
from src.solar_calculator import CALC_VERSION

load_dotenv(project_root() / ".env")

ROOF_TYPES = ["tile", "metal", "flat", "slate", "other"]
ORIENTATIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
SHADING = ["none", "low", "moderate", "high", "severe"]
GRID = ["single-phase", "three-phase"]
STATUS = ["pass", "warning", "fail", "na"]

CSS = """
.gradio-container { max-width: 1150px !important; }
.hero { text-align: center; padding: 1rem 0 0.5rem; }
.hero h1 { color: #0A1628; font-size: 1.8rem; margin: 0; }
.hero p { color: #4A6278; font-size: 0.95rem; }
"""


def generate_report_ui(
    photos, premium,
    client_name, client_address, client_city, client_postal, client_phone, client_email,
    technician_name,
    roof_type, roof_orientation, roof_pitch, usable_area, consumption,
    grid_connection, shading_level, existing_solar, structural_notes,
    chk_struct, chk_electric, chk_shading, chk_access, chk_docs, chk_compliance,
    progress=gr.Progress(),
):
    if not photos:
        raise gr.Error("Încarcă cel puțin o poză (max 20).")
    if len(photos) > MAX_PHOTOS:
        raise gr.Error(f"Maxim {MAX_PHOTOS} poze per raport.")

    paths = [p if isinstance(p, str) else p.name for p in photos]

    result = run_pipeline(
        photo_paths=paths,
        client_name=client_name,
        client_address=client_address,
        client_city=client_city,
        client_postal=client_postal,
        client_phone=client_phone,
        client_email=client_email,
        technician_name=technician_name,
        roof_type=roof_type,
        roof_orientation=roof_orientation,
        roof_pitch=roof_pitch,
        usable_area_m2=usable_area,
        annual_consumption_kwh=consumption,
        grid_connection=grid_connection,
        shading_level=shading_level,
        existing_solar=existing_solar,
        structural_notes=structural_notes,
        checklist=default_checklist(
            chk_struct, chk_electric, chk_shading, chk_access, chk_docs, chk_compliance,
        ),
        premium=premium,
        progress=lambda p, m: progress(p, desc=m),
    )

    s = result.survey
    summary = (
        f"**Raport:** {s.metadata.report_id}\n\n"
        f"**Scor:** {s.executive_summary.suitability_score}/100\n\n"
        f"**Verdict:** {s.executive_summary.suitability_verdict}\n\n"
        f"**Sistem:** {s.system_estimate.recommended_capacity_kwp} kWp · "
        f"{s.system_estimate.estimated_annual_production_kwh:,.0f} kWh/an\n\n"
        f"**Rutare:** {result.routing_reason}\n\n"
        f"**Cost API:** ~${result.cost_usd:.4f}\n\n"
        f"**AHJ export:** `{result.ahj_path.name}`"
    )
    return str(result.pdf_path), str(result.ahj_path), summary


def run_batch_ui(manifest_file, progress=gr.Progress()):
    if not manifest_file:
        raise gr.Error("Încarcă un fișier manifest JSON sau CSV.")
    path = manifest_file if isinstance(manifest_file, str) else manifest_file.name
    jobs = load_manifest(__import__("pathlib").Path(path))

    def prog(p, m):
        progress(p, desc=m)

    summary = run_batch(jobs, progress=prog)
    lines = [
        f"**Batch finalizat:** {summary.succeeded}/{summary.total} reușite",
        f"**Eșuate:** {summary.failed}",
        "",
    ]
    for r in summary.results:
        status = "OK" if r.success else f"ERR: {r.error}"
        lines.append(f"- `{r.job_id}`: {status}" + (f" · scor {r.score}" if r.success else ""))
    return "\n".join(lines)


def refresh_dashboard():
    return format_dashboard_markdown(get_dashboard_data())


def create_app() -> gr.Blocks:
    ds = DeepSeekClient()
    cl = ClaudeClient()
    apis = []
    apis.append("DeepSeek ✓" if ds.configured else "DeepSeek demo")
    apis.append("Claude ✓" if cl.configured else "Claude local")

    with gr.Blocks(title="SOLARIS CET", css=CSS, theme=gr.themes.Soft(primary_hue="orange")) as app:
        gr.HTML(
            f'<div class="hero"><h1>SOLARIS CET</h1>'
            f"<p>v0.3 · PDF v{DESIGN_VERSION} · Solar calc v{CALC_VERSION} · {' · '.join(apis)}</p></div>"
        )

        with gr.Tabs():
            with gr.Tab("Raport nou"):
                with gr.Row():
                    with gr.Column():
                        photos = gr.File(label=f"Poze (max {MAX_PHOTOS})", file_count="multiple", file_types=["image"], type="filepath")
                        premium = gr.Checkbox(label="Premium (Claude Fable 5)", value=False)
                    with gr.Column():
                        client_name = gr.Textbox(label="Client", value="Maria Ionescu")
                        client_address = gr.Textbox(label="Adresă", value="Str. Energiei Verde 12")
                        client_city = gr.Textbox(label="Oraș", value="Cluj-Napoca")
                        client_postal = gr.Textbox(label="Cod poștal", value="400001")
                        technician_name = gr.Textbox(label="Tehnician", value="Alexandru Popescu")

                with gr.Accordion("Șantier & Checklist", open=False):
                    roof_type = gr.Dropdown(ROOF_TYPES, value="tile", label="Acoperiș")
                    roof_orientation = gr.Dropdown(ORIENTATIONS, value="S", label="Orientare")
                    roof_pitch = gr.Slider(0, 60, value=35, label="Înclinare")
                    usable_area = gr.Number(value=42.5, label="Suprafață m²")
                    consumption = gr.Number(value=4800, label="Consum kWh/an")
                    shading_level = gr.Dropdown(SHADING, value="low", label="Umbrire")
                    grid_connection = gr.Dropdown(GRID, value="single-phase", label="Rețea")
                    existing_solar = gr.Checkbox(label="Solar existent", value=False)
                    structural_notes = gr.Textbox(label="Note structurale")
                    with gr.Row():
                        chk_struct = gr.Dropdown(STATUS, value="pass", label="Structură")
                        chk_electric = gr.Dropdown(STATUS, value="pass", label="Electric")
                        chk_shading = gr.Dropdown(STATUS, value="warning", label="Umbrire")
                    with gr.Row():
                        chk_access = gr.Dropdown(STATUS, value="pass", label="Acces")
                        chk_docs = gr.Dropdown(STATUS, value="pass", label="Docs")
                        chk_compliance = gr.Dropdown(STATUS, value="warning", label="Conformitate")
                    client_phone = gr.Textbox(value="+40 722 123 456", visible=False)
                    client_email = gr.Textbox(value="client@email.ro", visible=False)

                gen_btn = gr.Button("Generează Raport + AHJ", variant="primary")
                with gr.Row():
                    pdf_out = gr.File(label="PDF")
                    ahj_out = gr.File(label="AHJ JSON")
                summary_out = gr.Markdown()

                gen_btn.click(
                    generate_report_ui,
                    [photos, premium, client_name, client_address, client_city, client_postal,
                     client_phone, client_email, technician_name, roof_type, roof_orientation,
                     roof_pitch, usable_area, consumption, grid_connection, shading_level,
                     existing_solar, structural_notes, chk_struct, chk_electric, chk_shading,
                     chk_access, chk_docs, chk_compliance],
                    [pdf_out, ahj_out, summary_out],
                )

            with gr.Tab("Batch"):
                gr.Markdown("Procesare mai multe șantiere din manifest **JSON** sau **CSV**.")
                manifest = gr.File(label="Manifest batch", file_types=[".json", ".csv"])
                batch_btn = gr.Button("Rulează Batch", variant="primary")
                batch_out = gr.Markdown()
                batch_btn.click(run_batch_ui, [manifest], [batch_out])

            with gr.Tab("Dashboard"):
                dash_btn = gr.Button("Reîmprospătează")
                dash_out = gr.Markdown(value=refresh_dashboard())
                dash_btn.click(refresh_dashboard, outputs=[dash_out])

    return app


def launch(server_port: int = 7860, share: bool = False):
    create_app().launch(server_port=server_port, share=share, show_error=True)


if __name__ == "__main__":
    launch()