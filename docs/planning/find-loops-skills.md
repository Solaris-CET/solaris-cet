# Find Loops Skills — Skills per fază Perfect Loop (Grok 4.5)

**Companion:** `find-skills.md` · `SOLARIS-LOOPS-MASTER.md` · `anti-halucinatii-loop.md`

---

## Mapare Loop → Skills obligatorii

| Loop | Skills (ordine) | Docs |
|---:|---|---|
| **0** Memory | `find-skills` → `memoria` → `loops` | `memoria.md`, `loop-memory.md` |
| **0b** Graph | `graphify` | `GRAPH_REPORT.md` |
| **1** Research | `superpowers` → `engineering` | `superpowers-loops.md` § Pre-Flight |
| **2** Build | `engineering` → `observer` | `anti-halucinatii-loop.md` |
| **3** Verify | `verify` → `anti-halucinatii` | verify skill |
| **4** Optimize | `engineering` (P5) → `token-clock` | `token-clock-loop.md` |
| **5** Agent | `find-skills` (routing subagent) | `grok-loop-observer.md` |
| **6** Feedback | `memoria` → `observer` | `grok.md` |
| **7** Retro | `memoria` → `loops` | `agent-memory.md` |

---

## AUTOPROMPT overlay

| Fază AUTOPROMPT | + Skills |
|---|---|
| PRIME | find-skills, memoria, graphify |
| DECOMPOSE | superpowers, token-clock (estimate burn) |
| PLAN | superpowers, observer |
| EXECUTE | engineering, observer, anti-halucinatii |
| VERIFY | verify, anti-halucinatii |
| CRITIQUE | review, observer |
| HANDOFF | memoria, token-clock:burn |

---

## Comenzi Ralph outer loop

```bash
npm run loops:next
npm run skills:prime -- "$(npm run loops:next 2>&1 | tail -1)"
npm run stash:prime -- <slug>
# inner loops 0-7 cu skills de mai sus
npm run stash:sync
npm run token-clock:burn -- --task "<task-id>" --tokens <estimate>
```

---

## Subagent brief template

```markdown
SKILLS_LOADED: find-skills, superpowers, observer, verify
LOOP_PHASE: 2 Build
SUCCESS: <comandă verify>
FORBIDDEN: edit without Pre-Flight from superpowers-loops.md
OBSERVER: report warn/halt each 3 turns
```