# Grok Observer — Audit continuu (v2.0 Mature)

**Versiune:** 2.0 Mature · **Loop:** `grok-loop-observer.md`

---

## §0 — Adult brief

Verify la final e autopsie. Observer e **preventiv** — la fiecare 1–3 acțiuni.

Țintă: prinde drift înainte să ajungă la `npm run verify` (21 min) sau la push pe remote greșit.

---

## §1 — Cele 8 semnale (cu acțiune fixă)

| # | Semnal | Severitate | Acțiune imediată |
|---:|---|---|---|
| S1 | Edit ∉ BLAST_RADIUS | **HALT** | revert sau amend Pre-Flight |
| S2 | Claim fără EVIDENCE | **HALT** | Read sau run command |
| S3 | Retry #2 aceeași comandă | **WARN** | schimbă strategie (DARS) |
| S4 | >15 files în diff | **WARN** | scope review / split task |
| S5 | 3 turns fără gate | **HALT** | run gate_mic acum |
| S6 | Lipsește PRE-FLIGHT | **HALT** | superpowers |
| S7 | tokens remaining <500 | **WARN** | compress context |
| S8 | `git status` surpriză | **WARN** | memoria recovery |

---

## §2 — Verdict format

```
OBSERVER: clear
OBSERVER: warn — retry #2 same pytest without code change
OBSERVER: halt — edited app/package.json not in BLAST_RADIUS
```

Orchestrator: **halt** nesters = stop; nu accepta DONE.

---

## §3 — Moduri

| Mod | Când | Input judge |
|---|---|---|
| Lite | fiecare turn | last 3 actions + diff stat |
| Full | pre-DONE | diff + VERIFIED + PRE-FLIGHT |
| Forensic | post Grok Code crash | git diff + test rerun |

### Full judge prompt (Haiku / Sonnet)

```markdown
Role: Grok Observer hostile reviewer.
Input: PRE-FLIGHT, BLAST_RADIUS, files changed, VERIFIED claims.
Apply signals S1-S8. Output OBSERVER: clear|warn|halt + one line.
Reject ACCEPT if any claim lacks command output.
```

---

## §4 — Exemple SOLARIS

**clear:** HARD-001 — 8 files in radius, pytest 10, vitest 8, route in index.cjs  
**warn:** 3rd attempt `npm run verify` fără code change între ele  
**halt:** added `mcps/` drive-by while task was twin-replay  

---

## §5 — Metrici (opțional)

Append `.observer/metrics.jsonl`:
```json
{"ts":"2026-07-09T21:00:00Z","phase":"EXECUTE","verdict":"warn","reason":"S5 no gate 3 turns"}
```

Retro: care fază produce cele mai multe halt-uri?