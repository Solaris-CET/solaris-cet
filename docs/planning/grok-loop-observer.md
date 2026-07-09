# Grok Loop Observer — Observer în fiecare fază

**Bază:** `grok-observer.md` · `anti-halucinatii-loop.md` · `superpowers-loops.md`

---

## Frecvență per loop

| Loop / Fază | Observer mode | Trigger |
|---|---|---|
| 0 Memory | Lite | După stash/graphify — paths reale? |
| 1 Research / Pre-Flight | Lite | BLAST_RADIUS ⊆ graphify? |
| 2 Build | **Lite every edit** | Gate plan respectat? |
| 3 Verify | Full | VERIFIED literal? |
| 4 Optimize | Lite | Escalare justificată? |
| 5 Subagent | Full la return | Packet superpowers complet? |
| 6 Feedback | Lite | grok.md = fapte? |
| 7 Retro | Forensic | tasks.md [x] după verify? |

---

## AUTOPROMPT hooks

| Fază | Observer halt dacă |
|---|---|
| PRIME | graph_nodes < 3 |
| DECOMPOSE | subtask fără verify_command |
| EXECUTE | edit fără gate_mic |
| CRITIQUE | lensă 1–3 < 8 în anti-halucinatii |
| HANDOFF | git status dirty fără LEFT |

---

## Orchestrator loop

```
while task_open:
  pulse = observer(signals)
  if pulse == halt: break → HANDOFF
  run_phase()
  pulse = observer(post_phase)
```

Max **3 halt** per task → `BLOCKED` + human.

---

## Metrici (opțional în `.observer/metrics.jsonl`)

```json
{ "ts": "...", "phase": "EXECUTE", "verdict": "warn", "reason": "no gate 3 turns" }
```

Meta-learn: ce fază produce cel mai mult `halt`?