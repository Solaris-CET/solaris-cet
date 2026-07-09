# Memoria — Memorie durabilă multi-agent (v2.0 Mature)

**Versiune:** 2.0 Mature · **Skill:** `.agents/skills/memoria/SKILL.md` · **Loop:** `loop-memory.md`

---

## §0 — Adult brief

Memoria nu e „summary de chat”. E **sistemul de fișiere + Stash** care supraviețuiește când Grok Code închide terminalul, Kimi pierde contextul, sau Fable 5 costă $50/1M output.

**Regulă:** training-ul modelului = ipoteză. `agent-memory.md` + `git diff` = probă.

---

## §1 — Straturi (cu TTL și owner)

| Strat | TTL | Locație | Owner | Exemplu SOLARIS |
|---|---|---|---|---|
| Episodic | Sesiune | checkpoint chat | worker | „pytest 142 passed 21:08” |
| Working | Zile | `git diff`, `.autoprompt/` | worker | diff necommitat Grok Code |
| Semantic | Luni+ | `agent-memory.md`, Stash | echipă | „Prod remote = Gitea solaris-clean” |
| Procedural | Permanent | skills, `AGENTS.md` | maintainers | Pre-Flight obligatoriu |
| BLOCKER extern | Până la human | `HANDOFF.md` §1 | PM | DNS Shopify, Hetzner L002DD869 |

**Nu promova episodic → semantic** decât dacă: (a) verify verde, (b) repetat 2× sau impact arhitectură.

---

## §2 — Retrieve runbook (P0)

```bash
npm run skills:prime -- "<topic>"
npm run stash:prime -- "<topic>"
stash search "<topic>" --json
```

### Ordine de citire (fixă)

1. **`HANDOFF.md` liniile 1–80** — BLOCKER care nu se rezolvă din cod
2. **`agent-memory.md`** — anti-pattern (tabel „did BADLY”)
3. **`grok.md`** — ultimele 2 update-uri PM
4. **`global.md`** — routing modele, bridge survey
5. **`features/<slug>/design.md`** — dacă există epic
6. **`10_HARD_RANDOM_TASKS.md`** — dacă `loops:next` = 0 tasks

### Output obligatoriu

```
MEMORY_PRIME:
  handoff_blockers: [DNS Shopify, Coolify redeploy pending, …]
  anti_patterns_relevant: [wrong git remote, told user to test, …]
  stash_hits: [file/session ids]
  open_questions: [max 3]
```

---

## §3 — Store runbook (P6)

```bash
npm run stash:sync
```

### Ce scrii în `agent-memory.md` (criterii stricte)

| Da | Nu |
|---|---|
| „Push doar pe Gitea origin” | Output pytest din sesiune |
| „surveyRouteRegistry prinde rute lipsă” | Listă 50 fișiere citite |
| „Windows: npm run ci:install nu paralel” | Opinii despre calitate cod |

### Stash 409 (pagină există)

Folosește `stash files edit-page <id>` — vezi `stash-sync.mjs`. Nu repeta upload orb.

---

## §4 — Recovery Grok Code / sesiune întreruptă

**Caz real 2026-07-09:** 101 fișiere modificate, 0 commit, terminal închis.

```bash
git status --short
git diff --stat
git log -1 --oneline
npm run stash:prime -- "recovery interrupted"
cat docs/planning/HANDOFF.md | head -60
```

| Situație | Acțiune adultă |
|---|---|
| Diff bun, teste necunoscute | Rulează gate din task, apoi commit |
| Diff parțial, teste fail | Diagnostic, nu reîncepe de la zero |
| Duplicate cu alt agent | `git diff` + reconcile, nu suprascrie orb |

Checkpoint:
```
RECOVERED_FROM: Grok Code interrupted
EVIDENCE: git diff --stat · pytest/vitest output this session
```

---

## §5 — Memoria vs anti-halucinație (matrice)

| Afirmație | Memoria | Verificare obligatorie acum |
|---|---|---|
| „Coolify deployează main” | HANDOFF: pending | `deploy:status` |
| „62+ pytest” | agent-memory | `cd survey-engine && pytest tests/ -q` |
| „Epics done” | loops history | `npm run loops:status` |
| „Push făcut” | — | `git log origin/main -1` |

---

## §6 — MAPLE consolidation (episod → skill)

După task verify-verde:

```
EPISODE: trigger=HARD-001 · action=twin-replay bridge · outcome=10+8 tests · verify=pytest+vitest
LESSON: Every new /api/survey/* needs index.cjs tuple + surveyOpenApi SURVEY_ROUTE_IDS
STORE: agent-memory (one row) OR superpowers.md GATE_PLAN template
```

---

## §7 — Comenzi

```bash
npm run stash:prime -- "<topic>"
npm run stash:sync
npm run stash:verify
stash search "coolify deploy" --json
stash vfs "rg 'twin replay' /"
```