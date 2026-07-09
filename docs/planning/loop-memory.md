# Loop Memory — Memorie în Perfect Loops 0–7 (Grok 4.5)

**Bază:** `memoria.md` · `SOLARIS-LOOPS-MASTER.md` · `find-loops-skills.md`

---

## Loop 0 — Memory Prime

```bash
npm run skills:prime -- "<topic>"
npm run stash:prime -- "<topic>"
npm run graphify:prime -- "<topic>"
```

**Output obligatoriu:**
```
MEMORY_PRIME:
  stash_hits: [...]
  graph_nodes: [5-12 paths]
  handoff_blockers: [...]
  open_questions: [...]
```

**Interzis:** Loop 1 fără `MEMORY_PRIME` scris.

---

## Loop 1 — Research (memorie activă)

- Citește doar fișiere din `graph_nodes`
- Notează **contradicții** între Stash și cod (surfacing conflict)
- Nu scrie încă în agent-memory

---

## Loop 2–3 — Build + Verify (episod)

Menține `.progress.md` sau state AUTOPROMPT:
```json
{ "reads": [], "edits": [], "gates": [{ "cmd": "...", "exit": 0 }] }
```

---

## Loop 6 — Feedback

Actualizează `grok.md` doar cu:
- ce s-a livrat (faptic)
- ce BLOCKER rămâne
- nu roadmap aspirational

---

## Loop 7 — Retro + Consolidare

```bash
npm run stash:sync
```

Checklist:
- [ ] Anti-pattern nou? → `agent-memory.md`
- [ ] Decizie arhitectură? → feature `design.md` sau global.md
- [ ] Skill gap? → patch SKILL.md + `skills:install`
- [ ] Task bifat doar după verify

---

## AUTOPROMPT COMPRESS fază

Extrage **o singură** lecție semantică:
```
LESSON: <ce nu mai facem>
STORE: agent-memory | skill:<name> | none
```

---

## Ralph outer loop memory

State în fișiere, nu chat:
- `tasks.md` — ce rămâne deschis
- `.autoprompt/state-*.json` — fază curentă
- `.token-clock/state.json` — tokens rămași
- `HANDOFF.md` — BLOCKER extern

**La `loops:next` = 0 tasks:** memoria spune să treci la `10_HARD_RANDOM_TASKS.md`, nu să inventezi epic.