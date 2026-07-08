# Claude Fable 5 — leaked system prompt reference

**Purpose:** public archive link + patterns to adopt in SOLARIS CET agents (photo/checklist workflows).

## Primary source (no DM / no paywall)

| Resource | URL |
|---|---|
| Repo | https://github.com/elder-plinius/CL4R1T4S |
| File | https://github.com/elder-plinius/CL4R1T4S/blob/main/ANTHROPIC/CLAUDE-FABLE-5.md |
| **Raw (copy/download)** | https://raw.githubusercontent.com/elder-plinius/CL4R1T4S/main/ANTHROPIC/CLAUDE-FABLE-5.md |

Leaked by Pliny the Liberator (~June 2026). Instagram/Threads “comment Fable” posts are engagement bait — same public GitHub link.

## Why it matters for SOLARIS CET

Installers need **long-horizon, evidence-linked** agents:

- Batch photo workflows (compliance, shading, wiring)
- DC / AC / ACM checklists with auditable chains
- No hallucination on technical specs — every claim cites `evidence_photo_ids`

Fable 5’s internal prompt emphasizes **structure over personality**: effort levels, verifier loops, file/packet discipline, tool use. We replicate those patterns on **DeepSeek V4 Pro** (vision) and **Claude Fable 5** (top-tier text only).

## Patterns adopted in code

| Pattern | Implementation |
|---|---|
| Effort calibration | `survey-engine/src/agent_harness.py` → `effort_for_job()` |
| Evidence packets | `EvidencePacket` + existing `evidence_photo_ids` in `explainable.py` |
| Verifier loop | `verifier_loop()` — produce → verify until pass |
| API effort param | `api_clients/claude.py` — `output_config.effort` for Fable tier |

## Routing reminder

- **Fable 5:** text only, ≤15–20% premium reports — see `BUGET_FABLE5_API.md`
- **DeepSeek V4 Pro:** default vision + checklist extraction
- **Kimi:** 8–20+ photos in one context

**Last updated:** 2026-07-08