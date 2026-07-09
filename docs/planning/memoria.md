# Memoria — Memorie durabilă multi-agent (Grok 4.5)

**Skill:** `.agents/skills/memoria/SKILL.md`  
**Loop:** `loop-memory.md`  
**Surse:** Stash · `agent-memory.md` · `grok.md` · `HANDOFF.md` · MAPLE/Synapse (`.claude/skills/memory/`)

---

## Teza

Contextul LLM e **RAM volatilă**. Memoria proiectului e **fișiere + Stash + graf**.

Un agent care „își amintește” din training **halucinează istoric**. Un agent care citește Memoria **moștenește munca echipei**.

---

## Cele 3 straturi

| Strat | Durată | Unde | Ce stochezi |
|---|---|---|---|
| **Episodic** | Sesiune | chat, checkpoint | ce ai făcut azi, output comenzi |
| **Semantic** | Luni | `agent-memory.md`, Stash | decizii arhitectură, anti-pattern |
| **Procedural** | Permanent | skills, `tasks.md` | cum se lucrează (loops, superpowers) |

**Regulă:** episodic → nu copia în agent-memory decât dacă e lecție permanentă.

---

## Protocol Retrieve (P0)

```bash
npm run stash:prime -- "<topic>"
stash search "<topic>" --json
```

Citește în ordine:
1. `HANDOFF.md` (primele 60 linii) — BLOCKER extern
2. `agent-memory.md` — anti-pattern
3. `grok.md` — PM decisions
4. `features/<slug>/design.md` — dacă există

---

## Protocol Store (P6)

```bash
npm run stash:sync
```

Actualizează `agent-memory.md` **doar** pentru:
- anti-pattern nou confirmat (2+ agenți sau 1 cu verify)
- decizie arhitectură care nu se renegociază

**Nu stoca:** output pytest, path-uri temp, status git nepersistent.

---

## Consolidare MAPLE (meta)

După task DONE:
1. Episod: `trigger → acțiune → outcome → verify`
2. Dacă similar cu skill existent → întărește skill, nu duplică doc
3. Dacă unic → propune 1 linie în `agent-memory.md` sau skill patch

---

## Memoria vs anti-halucinație

| Memoria spune | Anti-halucinația cere |
|---|---|
| „În trecut am folosit Coolify” | Dovadă `deploy:status` **acum** |
| „Epic X e done” | `loops:status` **acum** |
| „Grok Code a lucrat la twin” | `git diff` **acum** |

Memoria = **ipoteze de încercat**, nu adevăr final.

---

## Recovery sesiune întreruptă

```bash
git status --short
git diff --stat
ls .autoprompt/ .token-clock/ 2>/dev/null
npm run stash:prime -- "recovery"
```

Scrie în checkpoint: `RECOVERED_FROM: <tool> · diff lines: N`

---

## Comenzi

```bash
npm run stash:prime -- "<topic>"
npm run stash:sync
npm run stash:verify
stash search "<q>" --json
```