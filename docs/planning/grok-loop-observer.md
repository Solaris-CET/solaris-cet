# Grok Loop Observer — Audit în fiecare fază Perfect Loop (v2.0 Mature)

**Versiune:** 2.0 Mature · **2026-07-09**  
**Bază:** `grok-observer.md` · `anti-halucinatii-loop.md` · `superpowers-loops.md`  
**Dovadă:** HARD-001 halt la edit în afara BLAST_RADIUS a prevenit drive-by pe `mcps/`

---

## §0 — Adult brief

`grok-observer.md` definește semnalele S1–S8.  
**Acest fișier** mapează **când** rulează observer-ul în loops 0–7 și AUTOPROMPT — și ce face orchestratorul la `halt`.

Verify la final = autopsie (21 min). Observer = **preventiv** — la fiecare 1–3 acțiuni.

**Regulă:** `OBSERVER: halt` nesters = orchestrator **nu acceptă DONE**, indiferent de cât de convingător e prose-ul workerului.

---

## §1 — Semnale S1–S8 × Loop (matrice enforcement)

| Semnal | Loop unde e critic | Severitate | Acțiune |
|---:|---|---|---|
| S1 Edit ∉ BLAST_RADIUS | 2 Build | **HALT** | revert sau amend Pre-Flight |
| S2 Claim fără EVIDENCE | 3 Verify, 7 Retro | **HALT** | Read sau run command |
| S3 Retry #2 aceeași comandă | 2–4 | **WARN** → HALT @3 | DARS — schimbă strategie |
| S4 Diff > 15 files | 2, 7 | **WARN** | scope review / split |
| S5 3 turns fără gate | 2 Build | **HALT** | gate_mic acum |
| S6 Lipsește PRE-FLIGHT | 1→2 tranziție | **HALT** | superpowers Loop 1 |
| S7 tokens < 500 | 4, Ralph batch | **WARN** | compress; split epic |
| S8 git status surpriză | 0 Recovery, 7 | **WARN** | memoria recovery |

---

## §2 — Frecvență per loop / fază

| Loop / Fază | Mod observer | Trigger | Verdict așteptat |
|---|---|---|---|
| **0** Memory | Lite | După stash/graphify | paths reale în GRAPH_NODES? |
| **0b** Graph | Lite | graphify output | ≥5 nodes, nu grep masiv |
| **1** Research / Pre-Flight | Lite | artifact scris | BLAST_RADIUS ⊆ graphify? |
| **2** Build | **Lite every edit** | post-StrReplace | gate plan respectat? |
| **3** Verify | Full | pre-accept DONE | VERIFIED literal + exit 0? |
| **4** Optimize | Lite | escalare P5 | cost vs token-clock estimate? |
| **5** Subagent | Full la return | packet + diff | superpowers packet complet? |
| **6** Feedback | Lite | grok.md edit | doar fapte? |
| **7** Retro | Forensic | pre-[x] tasks.md | verify verde înainte de sync? |

### Moduri (din `grok-observer.md` §3)

| Mod | Input judge | Când |
|---|---|---|
| Lite | last 3 actions + diff stat | fiecare turn în Build |
| Full | diff + VERIFIED + PRE-FLIGHT | pre-DONE, subagent return |
| Forensic | git diff + test rerun | post Grok Code crash |

---

## §3 — AUTOPROMPT hooks (halt conditions)

| Fază | Observer HALT dacă | WARN dacă |
|---|---|---|
| PRIME | graph_nodes < 3 | stash zero hits dar topic nou |
| DECOMPOSE | subtask fără verify_command | estimate > 300 tokens |
| PLAN | zero GATE_PLAN steps | N-BEST doar 1 opțiune |
| EXECUTE | edit fără gate_mic 3 turns | diff 10–15 files |
| VERIFY | VERIFIED fără exit code | retry #1 same command |
| CRITIQUE | lentile 1–3 < 8 | lentile 4–7 < 6 |
| HANDOFF | git dirty fără LEFT | burn înainte de verify |

---

## §4 — Orchestrator loop (pseudocod)

```
halt_count = 0
while task_open:
  pulse = observer_lite(last_3_actions)
  if pulse == halt:
    halt_count += 1
    if halt_count >= 3:
      BLOCKED → human + HANDOFF
      break
    continue  # worker fix, nu avansa fază

  run_phase()  # Loop 0..7 sau AUTOPROMPT fază

  pulse = observer_post_phase()
  if pulse == halt at Loop 3 or 7:
    break  # nu accepta DONE

checkpoint += "OBSERVER: clear|warn:<reason>|halt:<reason>"
```

**Max 3 halt** per task → `BLOCKED` + escalare umană. Nu ignora warn-urile repetate — devin halt la #3.

---

## §5 — Verdict format (obligatoriu în checkpoint)

```
OBSERVER: clear
OBSERVER: warn — S3 retry #2 pytest test_router.py without code change
OBSERVER: halt — S1 edited mcps/github/ not in BLAST_RADIUS (task: HARD-001)
```

### Orchestrator decision table

| Verdict | Accept DONE? | Acțiune |
|---|---|---|
| clear | Da, dacă VERIFIED OK | burn tokens |
| warn (≤2 consecutive) | Da, cu notă | log în metrics |
| warn (3× same reason) | Nu | tratează ca halt |
| halt | **Nu** | worker fix sau BLOCKED |

---

## §6 — Exemple SOLARIS (din sesiunea HARD)

| Task | Verdict | Motiv |
|---|---|---|
| HARD-001 twin replay | **clear** | 8 files ∈ radius; pytest 10; vitest 8; route în index.cjs |
| Retry verify fără edit | **warn** S3 | al 3-lea → halt, diagnose |
| Drive-by `mcps/` la twin task | **halt** S1 | revert mcps, amend radius sau split |
| „Prod OK” fără deploy:status | **halt** S2 | HANDOFF DNS Shopify |
| Grok Code recovery | **Forensic** | git diff 101 files → LEFT obligatoriu |

---

## §7 — Full judge prompt (Loop 3, 5, 7)

```markdown
Role: Grok Observer hostile reviewer (SOLARIS v2).
Input:
  - PRE-FLIGHT artifact
  - BLAST_RADIUS list
  - files changed (git diff --stat)
  - VERIFIED claims
  - last 3 tool calls

Apply S1–S8 from grok-observer.md.
Output exactly one line: OBSERVER: clear | warn — <reason> | halt — <reason>
Reject worker DONE if any VERIFIED claim lacks command output from this session.
If subagent return: check packet from find-loops-skills.md §5 was honored.
```

---

## §8 — Metrici (opțional, `.observer/metrics.jsonl`)

```json
{"ts":"2026-07-09T21:15:00Z","task":"HARD-001","phase":"EXECUTE","verdict":"warn","signal":"S5","reason":"no gate 3 turns"}
{"ts":"2026-07-09T21:45:00Z","task":"HARD-001","phase":"VERIFY","verdict":"clear","signal":null,"reason":null}
```

### Meta-learn (Loop 7 sau batch retro)

- Care fază produce cel mai mult `halt`?
- Care semnal S* e cel mai frecvent?
- Corectează skill/doc — nu doar „agentul a greșit”.

---

## §9 — Integrare cu celelalte straturi

| Layer | Observer rol |
|---|---|
| superpowers | S6 — Pre-Flight înainte de Build |
| anti-halucinatii | S2 — VERIFIED literal |
| token-clock | S7 — budget; halt waste |
| memoria | S8 — recovery git truth |
| find-loops-skills | Loop 5 — packet subagent |

---

## §10 — Rubrică neonat vs adult

| | Neonat | Adult |
|---|---|---|
| Observer | „totul pare OK” | OBSERVER: clear în checkpoint |
| Build | 10 edits, 0 gate | Lite pulse după fiecare edit |
| DONE | trust worker prose | Full judge pe VERIFIED |
| Halt | ignorat, continuă | stop, fix, max 3 |
| Recovery | Forensic skip | git diff + rerun gate |

---

## §11 — Respingere orchestrator

```markdown
REJECTED — Grok Loop Observer v2.0
OBSERVER: halt — S5 three turns without gate_mic after editing twin_runtime.py
Required: run pytest tests/test_twin_runtime.py -q; resubmit with OBSERVER: clear
```

---

**Părinte:** `grok-observer.md` · **Anti-halucinație fază:** `anti-halucinatii-loop.md` · **Pre-Flight:** `superpowers-loops.md`