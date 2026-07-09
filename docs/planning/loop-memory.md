# Loop Memory — Memorie în Perfect Loops 0–7 (v2.0 Mature)

**Versiune:** 2.0 Mature · **2026-07-09**  
**Bază:** `memoria.md` · `SOLARIS-LOOPS-MASTER.md` · `find-loops-skills.md`  
**Caz canon:** Grok Code a lăsat 101 fișiere necommitate — memoria adultă = `git diff` + stash, nu chat vechi

---

## §0 — Adult brief

`memoria.md` definește straturile (episodic → semantic).  
**Acest fișier** spune **în ce loop** citești, **în ce loop** scrii, și **ce e interzis** să promovezi în `agent-memory.md`.

**Regulă:** Loop 1 Research **nu pornește** fără `MEMORY_PRIME` din Loop 0.  
**Regulă:** Loop 7 Retro **nu bifează** `tasks.md` fără verify + `stash:sync`.

---

## §1 — Straturi × Loop (unde trăiește memoria)

| Strat | Loop principal | Locație | Promovare în semantic |
|---|---|---|---|
| Episodic | 2–3 Build/Verify | checkpoint chat | niciodată direct |
| Working | 2–7 | `git diff`, `.autoprompt/state-*.json` | la HANDOFF dacă necommitat |
| Semantic | 7 Retro | `agent-memory.md`, Stash | după verify verde + impact |
| Procedural | 0, 7 | skills, `AGENTS.md` | maintainers only |
| BLOCKER extern | 0 Memory | `HANDOFF.md` §1 | nu se „rezolvă” din cod |

---

## §2 — Loop 0 — Memory Prime (runbook)

```bash
npm run skills:prime -- "<topic>"
npm run stash:prime -- "<topic>"
npm run graphify:prime -- "<topic>"
stash search "<topic>" --json
```

### Ordine citire (fixă, din `memoria.md` §2)

1. `HANDOFF.md` liniile 1–80
2. `agent-memory.md` — tabel anti-pattern
3. `grok.md` — ultimele 2 update-uri
4. `global.md`
5. `features/<slug>/design.md` dacă există
6. `10_HARD_RANDOM_TASKS.md` dacă `loops:next` = 0 tasks

### Output obligatoriu (blocant pentru Loop 1)

```
MEMORY_PRIME:
  handoff_blockers: [DNS Shopify → solaris-cet.com, Coolify redeploy pending, …]
  anti_patterns_relevant: [push GitHub not Gitea, user runs tests, verify:all fiction, …]
  stash_hits: [<session/file ids din stash search>]
  graph_nodes: [5–12 paths reale din graphify]
  open_questions: [max 3 — ce nu știi încă]
```

**Interzis:** Loop 1 fără `MEMORY_PRIME` scris. Orchestrator = HALT.

### Recovery variant (sesiune întreruptă)

```bash
git status --short
git diff --stat
npm run stash:prime -- "recovery interrupted session Grok Code"
cat docs/planning/HANDOFF.md | head -60
ls .autoprompt/ 2>/dev/null
```

```
MEMORY_PRIME:
  recovered_from: interrupted session | Grok Code
  uncommitted_files: <din git status>
  prior_claims_untrusted: true
  next_gate: <verify command din task, rulat ACUM>
```

---

## §3 — Loop 1 — Research (memorie activă, read-only semantic)

- Citește **doar** fișiere din `graph_nodes` — nu grep pe tot repo-ul
- Notează **contradicții** Stash vs cod → surface în checkpoint, nu ghicește
- **Nu scrie** încă în `agent-memory.md` (prea devreme)
- Completează Pre-Flight (`superpowers-loops.md`) — memoria alimentează BLAST_RADIUS

### Contradicție template

```
CONFLICT: Stash spune X; cod la path:line spune Y
RESOLUTION: cred cod + citation; actualizez Stash la Retro dacă verify verde
```

---

## §4 — Loop 2–3 — Build + Verify (episod working)

Menține state în fișier, nu doar chat:

```json
{
  "reads": ["survey-engine/src/twin_runtime.py"],
  "edits": ["survey-engine/src/twin_runtime.py"],
  "gates": [
    { "cmd": "pytest tests/test_twin_runtime.py -q", "exit": 0, "ts": "2026-07-09T21:00:00Z" }
  ]
}
```

Locații: `.autoprompt/state-*.json` sau `.progress.md` la root task.

**Reguli:**
- Fiecare `edit` → un `gate` în ≤3 turns
- `gates[].exit` trebuie să fie 0 înainte de Loop 7
- Output verify → copiat literal în `VERIFIED` (anti-halucinatii L3)

---

## §5 — Loop 6 — Feedback (grok.md discipline)

Actualizează `grok.md` **doar** cu:

| Permis | Interzis |
|---|---|
| Ce s-a livrat (path + test count) | Roadmap aspirational |
| BLOCKER rămas (din HANDOFF) | „Prod e OK” fără deploy:status |
| Decizie arhitectură **verify-verde** | Opinii despre model |

### Șablon update grok.md

```markdown
## 2026-07-09 — HARD-001 twin replay
- Livrat: replay_twin_events, GET /api/survey/twin-replay, useTwinStream dedupe
- Verify: pytest 10 passed; vitest twin* 8 passed
- Necommitat: <dacă git status dirty>
- BLOCKER: DNS Shopify (HANDOFF) — unchanged
```

---

## §6 — Loop 7 — Retro + Consolidare

```bash
npm run stash:sync
```

### Checklist (toate bifate sau BLOCKED documentat)

- [ ] Anti-pattern nou confirmat 2×? → `agent-memory.md` rând în „did BADLY”
- [ ] Decizie arhitectură? → `features/*/design.md` sau `global.md`
- [ ] Skill gap observat? → patch `SKILL.md` + `npm run skills:install`
- [ ] Task `[x]` în `tasks.md` **doar** după gate din task
- [ ] `LEFT` include muncă necommitată dacă `git status` dirty
- [ ] `token-clock:burn` după verify verde

### Ce promovezi în semantic (memoria.md §3)

| Promovează | Nu promova |
|---|---|
| „Prod remote = gitea solaris-clean” | „pytest a trecut o dată” |
| „Route survey trebuie în index.cjs” | output terminal complet |
| „Windows: npm scripts, nu .bin paths” | path-uri temp, `/tmp/...` |

---

## §7 — AUTOPROMPT COMPRESS (fază META-LEARN)

Extrage **o singură** lecție:

```
LESSON: <ce nu mai facem — imperativ>
STORE: agent-memory | skill:<name> | none
EVIDENCE: <gate care a prins greșeala>
```

Exemplu:

```
LESSON: Nu marca tasks.md [x] fără pytest output în sesiunea curentă
STORE: agent-memory
EVIDENCE: recovery Grok Code — git diff 101 files, zero VERIFIED
```

---

## §8 — Ralph outer loop memory (state în fișiere)

| Fișier | Rol | Cine scrie |
|---|---|---|
| `tasks.md` | taskuri deschise / [x] | `stash:sync` după verify |
| `.autoprompt/state-*.json` | fază AUTOPROMPT | orchestrator |
| `.token-clock/state.json` | tokens rămași | `token-clock:burn` |
| `HANDOFF.md` | BLOCKER extern | uman / PM |
| `agent-memory.md` | semantic echipă | Loop 7, conservator |
| `grok.md` | status PM | Loop 6, factual |

**La `loops:next` = 0 tasks:** memoria spune `10_HARD_RANDOM_TASKS.md` sau `improve:next` — **nu inventa epic**.

---

## §9 — Incidente → loop memory fix

| Incident | Loop rupt | Fix v2 |
|---|---|---|
| „Am terminat ieri” după crash | 0 Recovery | `git diff` înainte de orice |
| Push pe remote greșit | 7 Retro | anti-pattern în agent-memory |
| Stash ignorat, re-derivare greșită | 0 | `stash_hits` obligatoriu |
| grok.md eseu aspirational | 6 | doar fapte + BLOCKER |
| agent-memory umplut cu loguri | 7 | TTL — doar durable |

---

## §10 — Rubrică neonat vs adult

| | Neonat | Adult |
|---|---|---|
| Loop 0 | „Știu proiectul” | MEMORY_PRIME + graph_nodes |
| Loop 1 | grep 500 linii | read doar graph_nodes |
| Loop 7 | sync fără verify | gate verde → sync → [x] |
| Recovery | reîncepe task | diff + continuă |
| Semantic | tot în chat | agent-memory conservator |

---

## §11 — Checkpoint memory extension

```
MEMORY_PRIME: <§2 output>
MEMORY_STORE: agent-memory | grok.md | stash:sync | none
MEMORY_LEFT: <uncommitted / open questions>
```

---

**Părinte:** `memoria.md` · **Skills per loop:** `find-loops-skills.md` · **Recovery:** `anti-halucinatii-loop.md` § Recovery