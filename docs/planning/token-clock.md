# Token Clock — Economie de seriozitate (v2.0 Mature)

**Versiune:** 2.0 Mature · **State:** `.token-clock/state.json` (gitignored) · **Loop:** `token-clock-loop.md`

---

## §0 — De ce nu e gimmick

Agenții tratează contextul ca infinit. Proiectul real are:
- **verify** = 21 min (`npm run verify`)
- **sessiuni pierdute** = sute de mii de tokeni arși fără commit
- **rework** = agent-memory „did BADLY”

Token Clock traduce asta în **cost fictiv $280k/token × 9000** — suficient să schimbe comportamentul, fără să înlocuiască AEP cost ladder.

---

## §1 — Reguli economice (legi)

| Regulă | Detaliu |
|---|---|
| Budget total | 9 000 tokeni |
| Preț | $280 000 / token |
| Burn trigger | Task DONE **și** verify exit 0 |
| Null State | remaining=0 → stop taskuri noi |
| Reset | doar uman: `token-clock:init -- --confirm` |
| Orchestrator | estimează la DECOMPOSE; arde la HANDOFF |

---

## §2 — Estimare mature (calibrată SOLARIS)

| Activitate | Tokens | Notes |
|---|---:|---|
| skills+stash+graphify prime | 8–20 | obligatoriu |
| Pre-Flight superpowers | 15–30 | scris, nu mental |
| Read 5 files (targeted) | 20–50 | nu 50 files |
| 1 surgical edit + gate_mic | 25–45 | pytest subset |
| Bridge route (engine+app+tests) | 80–150 | HARD-001 class |
| Full `npm run verify` | 120–220 | 1838 tests |
| Retry același eșec | +40–80 | observer halt @2 |
| Epic greșit reluat | 200–500 | **prevent with superpowers** |

### Formula DECOMPOSE

```
estimate = prime + preflight + (edits × 35) + (gates × 15) + verify_full?
```

Dacă estimate > 250 → N-best # mai ieftin sau split subtask.

---

## §3 — Comenzi & state

```bash
npm run token-clock:status
npm run token-clock:burn -- --task "HARD-001-complete" --tokens 95
npm run token-clock:init -- --confirm
```

**Exemplu status după 2 taskuri:**
```
Remaining: 8810 / 9000
Burned: 190 tokens ($53,200,000)
```

---

## §4 — Null State procedure

1. `burn` returnează exit 2
2. Agentul oprește taskuri noi
3. Raportează umanului: tokens + ce a rămas în `LEFT`
4. Reset explicit — nu automat

---

## §5 — Integrare checkpoint

```
TOKENS_ESTIMATE: 95
TOKENS_BURNED: 95 ($26,600,000)
TOKEN_CLOCK_REMAINING: 8905
VERIFIED: pytest 10 passed; vitest 8 passed  ← burn legal doar cu asta
```

---

## §6 — Anti-patterns

| Greșeală | Consecință |
|---|---|
| Burn înainte de verify | invalidează ceasul (orchestrator reject) |
| Subestimate epic | Null State prematur |
| Agent `init` singur | interzis |
| Ignoră ceasul | scope creep → rework real $$ |

---

## §7 — Legătura cu superpowers

Pre-Flight scump în tokens, ieftin în **rework**.  
Un plan de 25 tokens care evită un verify de 200 tokens e **investiție**, nu cost.