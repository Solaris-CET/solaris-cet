# Find Skills — Routing disciplinat de skills (Grok 4.5 Mature v2.0)

**Versiune:** 2.0 Mature · **2026-07-09**  
**Audiență:** orchestratori și workeri care au învățat pe pielea lor că „știu repo-ul” = halucinație  
**Skill:** `.agents/skills/find-skills/SKILL.md` · **Loop:** `find-loops-skills.md`  
**Manifest:** `.agents/skills-manifest.json` (generat de `npm run skills:install`)

---

## §0 — Brief de 30 secunde (pentru veterani)

Nu există „agent generalist”. Există **12 skills canonice** în `.agents/skills/`, copiate automat în `.claude/skills/` și `.cursor/skills/`.  
Înainte de orice `Read` pe `app/` sau `survey-engine/`: **`skills:prime` → `stash:prime` → `graphify:prime` → Pre-Flight (`superpowers.md`)**.  
Fără această secvență, munca e tratată ca **neonat** — respinsă de orchestrator indiferent de model (Grok 4.5, Kimi, Fable 5).

---

## §1 — De ce există (lecții din teren)

| Incident real (agent-memory / HANDOFF) | Ce lipsea | Skill care îl previne |
|---|---|---|
| Grok Code: terminal închis, 101 fișiere necommitate | Recovery + git truth | `memoria` + `anti-halucinatii` |
| Agent: „rulează verify:all” (script inexistent) | Verificare package.json | `anti-halucinatii` L5 |
| Push pe GitHub în loc de Gitea `solaris-clean` | Remote map | `memoria` + `agent-memory.md` |
| `../node_modules/.bin/vite` pe Windows | npm scripts only | `engineering` |
| „Prod e OK” cu DNS pe Shopify | deploy:status | `anti-halucinatii` L12 |
| AUTOPROMPT stub `done=true` fără pytest | Observer + verify | `observer` + `verify` |
| UI generic purple-gradient AI slop | Design DNA | `unique-design` |

**Find Skills** nu e documentație de onboarding. E **sistemul de operare** al echipei de agenți.

---

## §2 — Instalare & sincronizare (runbook)

### O dată per mașină / după `git pull` cu skills noi

```bash
cd "C:/Users/CCons/Desktop/SOLARIS CET"   # sau repo root
npm run skills:install
```

**Ce face concret:**
1. Copiază 12 skills din `.agents/skills/` → `.claude/skills/` + `.cursor/skills/`
2. Rescrie `.agents/skills-manifest.json` cu lista docs + `prime_command`
3. Rulează `graphify install --platform cursor` (dacă `graphifyy` e instalat)

### Verificare instalare

```bash
npm run skills:prime -- "smoke test routing"
cat .agents/skills-manifest.json
# Trebuie 12 skills în array; docs list complet
```

### După ce adaugi un skill nou în `.agents/skills/<name>/SKILL.md`

```bash
npm run skills:install
# Commit .agents/skills/ + .claude/skills/ + .cursor/skills/ + manifest
```

---

## §3 — Prime protocol (fiecare sesiune, fiecare task)

```bash
npm run skills:prime -- "<obiectiv exact>"
npm run stash:prime -- "<obiectiv exact>"
npm run graphify:prime -- "<obiectiv exact>"
```

**Output obligatoriu în checkpoint (copiat din skills:prime):**
```
SKILLS_LOADED: find-skills, engineering, superpowers, observer, anti-halucinatii, …
DOCS_READ: find-skills.md, superpowers.md, …
GRAPH_NODES: survey-engine/src/twin_runtime.py, app/api/survey/twin-replay/route.ts, …
```

---

## §4 — Harta skills (canonică, nu negociabilă)

| Skill | Trigger | Doc | Gate asociat |
|---|---|---|---|
| `find-skills` | Orice sesiune | acest fișier | `skills:prime` exit 0 |
| `engineering` | Task netrivial | `AGENT-ENGINEERING.md` | AEP P0–P6 |
| `superpowers` | Înainte de primul edit produs | `superpowers.md` | `PRE-FLIGHT: PASS` |
| `anti-halucinatii` | Checkpoint, DONE, recovery | `anti-halucinatii.md` | `EVIDENCE` + `VERIFIED` literal |
| `loops` | Epic, `tasks.md`, Ralph | `SOLARIS-LOOPS-MASTER.md` | `loops:status` |
| `graphify` | Înainte de grep masiv | `graphify-out/` | `graphify query` output |
| `verify` | Înainte de DONE | `.agents/skills/verify/` | `npm run verify` / domain |
| `review` | P4 | `.agents/skills/review/` | 6 lenses ≥8 |
| `memoria` | Loop 0, 7, recovery | `memoria.md` | `stash:sync` |
| `observer` | Fiecare 3 tool-calls | `grok-observer.md` | `OBSERVER: clear` |
| `token-clock` | DONE, batch plan | `token-clock.md` | burn după verify |
| `unique-design` | UI/UX survey/CRM | `unique-design.md` | Vitest + tokens existente |

### Skills `.trae/skills/solaris-*` (17 bucăți)

Sunt **domeniu-specific** (deploy, E2E, TON, SEO). Nu le încărca pe toate.  
`skills:prime` le sugerează doar dacă topic-ul conține: `coolify`, `e2e`, `ton`, `lighthouse`, `awwwards`.

---

## §5 — Arbore de decizie (cu exemple SOLARIS)

```
INPUT: goal string
│
├─ conține "twin" | "replay" | "SSE"
│   → engineering, graphify, superpowers, observer
│   → docs: 10_HARD_RANDOM_TASKS.md HARD-001
│   → blast: twin_runtime.py, useTwinStream.ts, twin-replay/route.ts
│   → verify: pytest test_twin_* + vitest useTwinStream
│
├─ conține "budget" | "installer" | "cost"
│   → HARD-002 path: installer_budget.py, INSTALLER_BUDGETS
│   → verify: pytest test_installer_budget.py
│
├─ conține "router" | "model" | "Kimi" | "DeepSeek"
│   → HARD-004: router.py, /api/survey/router/stats
│   → verify: pytest test_router.py
│
├─ conține "UI" | "SurveyPage" | "design"
│   → unique-design + superpowers
│   → verify: vitest component + survey.spec.ts dacă E2E atins
│
├─ conține "deploy" | "coolify" | "prod"
│   → memoria (HANDOFF BLOCKER) — NU promite prod verde
│   → verify: deploy:status (SOFT_FAIL=1 dacă DNS Shopify)
│
├─ "recovery" | "interrupted" | "Grok Code"
│   → memoria + anti-halucinatii + git status/diff FIRST
│
├─ "autoprompt" | "batch" | "HARD"
│   → autoprompt + token-clock + observer
│   → 10_HARD_RANDOM_TASKS.md ca sursă task
│
└─ default
    → engineering + superpowers + observer + verify
```

---

## §6 — Exemplu complet: task „twin replay catch-up”

```bash
npm run skills:prime -- "HARD-001 twin replay catch-up"
npm run graphify:suggest -- "twin replay"
```

**SKILLS_LOADED:** find-skills, engineering, superpowers, graphify, verify, observer, anti-halucinatii, memoria

**DOCS_READ:** find-skills.md, superpowers.md, 10_HARD_RANDOM_TASKS.md § HARD-001

**BLAST_RADIUS (din graphify):**
- `survey-engine/src/twin_runtime.py`
- `survey-engine/src/twin_webhook.py`
- `app/api/lib/surveyTwinReplay.ts`
- `app/api/survey/twin-replay/route.ts`
- `app/src/hooks/useTwinStream.ts`
- `app/server/index.cjs` (route tuple)

**VERIFY PLAN:**
```bash
cd survey-engine && python -m pytest tests/test_twin_runtime.py tests/test_twin_webhook.py -q
cd app && npm run test -- src/__tests__/useTwinStream.test.ts src/__tests__/twinReplayRoute.test.ts
cd app && npm run test -- src/__tests__/surveyRouteRegistry.test.ts
```

---

## §7 — Orchestrator: respingere formală

Template când workerul sare Find Skills:

```markdown
REJECTED — Find Skills v2.0
Reason: Missing SKILLS_LOADED / DOCS_READ / PRE-FLIGHT
Required rerun:
  npm run skills:prime -- "<goal>"
  Complete superpowers.md Pre-Flight artifact
Do not touch app/ or survey-engine/ until resubmit.
```

---

## §8 — Rubrică maturitate (neonat vs adult)

| Criteriu | Neonat (v1) | Adult (v2) |
|---|---|---|
| Skills | „Știu React” | `skills:prime` output atașat |
| Scope | grep 500 linii | graphify 5–12 nodes |
| Verify | „ar trebui să treacă” | exit code + N passed |
| Prod | presupune deploy | HANDOFF BLOCKER citit |
| Recovery | reîncepe de la zero | `git diff` + termină |

---

## §9 — Comenzi rapide

```bash
npm run skills:install
npm run skills:prime -- "<topic>"
npm run graphify:suggest -- "<topic>"
npm run loops:status
npm run stash:verify
```

**Următorul nivel:** `find-loops-skills.md` — aceeași disciplină mapată pe Perfect Loops 0–7.