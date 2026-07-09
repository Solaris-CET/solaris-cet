# Anti-Halucinații — Protocol universal SOLARIS CET (Grok 4.5)

**Proiect:** SOLARIS CET  
**Versiune:** 1.0  
**Data:** 2026-07-09  
**Audiență:** toate modelele (Grok 4.5 · Grok Code · Kimi · DeepSeek · Claude Fable/Sonnet/Haiku/Opus) · toți orchestratorii (AUTOPROMPT · Ralph · AEP · kimi:aep · Cursor · Claude Code)  
**Companion:** `anti-halucinatii-loop.md` — integrare în Perfect Loops 0–7 și AUTOPROMPT v4.5

---

## Teza centrală (Grok 4.5)

Un model inteligent care **nu verifică** este mai periculos decât unul mediocru care verifică.

**Halucinația în inginerie software nu e „inventat fapte despre lume”.**  
În acest repo, halucinația = orice afirmație despre cod, stare sau mediu **fără dovadă observabilă în sesiunea curentă**.

| Tip halucinație | Exemplu tipic | De ce e fatal |
|---|---|---|
| **Fișier fantomă** | „Am editat `useTwinStream.ts`” dar fișierul nu există sau path-ul e greșit | Diff pierdut, task blocat |
| **Comandă fantomă** | „Rulează `npm run verify:all`” — script inexistent | User/orchestrator pierde timp |
| **Gate fantomă** | „Toate testele trec” fără output | Livrare falsă, regresii în prod |
| **API fantomă** | „Endpoint-ul returnează X” fără curl/pytest | Contract rupt |
| **Git/deploy fantomă** | „Am dat push pe main” / „prod e verde” fără `deploy:status` | BLOCKER mascat |
| **Memorie fantomă** | „Am făcut asta ieri” din training, nu din Stash | Refacere muncă, conflicte |
| **Scope fantomă** | „Am terminat epic-ul” cu 3 fișiere netestate | Datorie tehnică ascunsă |

**Regula de aur:** *Nu există „probabil merge”. Există doar „am rulat comanda și am văzut exit 0 / comportamentul așteptat”.*

---

## Ierarhia adevărului (ordine obligatorie)

Când două surse contrazic, câștigă sursa de **prioritate mai mare**:

```
1. Output comandă rulată în sesiunea curentă (pytest, vitest, curl, git status)
2. Fișier citit cu Read tool în sesiunea curentă (path + linii)
3. Graphify query/path/explain (graphify-out/graph.json)
4. Stash search / stash:prime / docs/planning/*.md
5. Inferență model — ULTIMUL loc, niciodată suficient singur
```

**Interzis:** să tratezi inferența de la nivelul 5 ca pe nivelul 1.

---

## Cele 12 Legi Anti-Halucinație (toate modelele)

### L1 — Citește înainte de a scrie
Nu editezi cod pe care nu l-ai citit **în această sesiune**. Fără excepții.

### L2 — Graphify înainte de grep orb
`npm run graphify:prime -- "<topic>"` sau `python -m graphify query "…"` înainte de navigare la întâmplare.

### L3 — Stash înainte de mișcare
`npm run stash:prime -- "<topic>"` — deciziile anterioare ale echipei bat memoria parametrică a modelului.

### L4 — O afirmație = o dovadă
Orice claim despre cod/stare/mediu trebuie să aibă:
- citare `startLine:endLine:filepath`, **sau**
- output literal de comandă (`VERIFIED: npm run X → exit 0`).

### L5 — Nu inventa comenzi
Înainte de a recomanda un script npm, verifică `package.json` (root sau `app/`). Dacă nu există — spui explicit.

### L6 — Nu inventa fișiere sau rute API
Verifică cu Glob/Grep/Read. Rutele survey trec prin `app/api/lib/surveyOpenApi.ts` și `app/server/index.cjs`.

### L7 — Rulezi tu gate-ul, nu userul
„Te rog testează” = eșec de protocol. Rulezi `npm run verify`, `survey:test`, smoke — tu.

### L8 — Fail loud
Dacă o comandă eșuează, raportezi stderr/exit code. Nu maschezi cu „ar trebui să meargă”.

### L9 — Starea trăiește în fișiere
Progresul e în `tasks.md`, `HANDOFF.md`, `.autoprompt/`, nu în chat. Chatul poate dispărea oricând (vezi sesiuni Grok Code întrerupte).

### L10 — Un task = context fresh
Nu continui un task eșuat cu același plan. Max 3 retry, apoi `BLOCKED` + `HANDOFF.md`.

### L11 — Adversarial înainte de DONE
Faza P4 / CRITIQUE: încearcă activ să demonstrezi că munca e greșită. Doar dacă eșuezi, accepti.

### L12 — Nu declara commit/push/deploy fără dovadă
`git status`, `git log -1`, `npm run deploy:status` — altfel scrii explicit „necommitat / neverificat pe prod”.

---

## Protocol pe rol (orchestrator vs worker)

### Orchestrator (Grok 4.5 · AUTOPROMPT · Ralph · manager)

| Obligație | Anti-halucinație |
|---|---|
| Descompune taskuri atomice | Fiecare subtask are **criteriu de succes observabil** (comandă sau URL) |
| Alocă modelul potrivit | Nu trimite worker ieftin la decizii arhitecturale fără N-best |
| Verifică checkpoint-ul | Respinge `VERIFIED` fără output concret |
| Nu accepta „done” parțial | `LEFT` gol sau `-` doar dacă chiar nu rămâne nimic |
| Recuperare sesiune întreruptă | Citește `git status` + `HANDOFF.md` înainte de orice cod |

### Worker (Kimi · DeepSeek · Sonnet · subagent)

| Obligație | Anti-halucinație |
|---|---|
| Execută un singur subtask | Nu „anticipează” fișiere pe care nu le-a citit |
| Raportează BLOCKED devreme | După 3 încercări distincte, nu repeta aceeași comandă verbatim |
| Nu extrapola din nume | `twin_runtime.py` ≠ știi ce face până nu citești funcția |

### Judge ieftin (Haiku · clasificare · CRITIQUE)

| Obligație | Anti-halucinație |
|---|---|
| Verifică doar ce i se dă | Nu „completează” context lipsă cu presupuneri |
| Listează gap-uri de dovadă | „Lipsește output pytest pentru X” > „probabil OK” |

---

## Reguli per model (routing anti-halucinație)

| Model | Tendință halucinație | Contramăsură obligatorie |
|---|---|---|
| **Grok 4.5 / Grok Code** | Over-confidence pe planuri mari; sesiune întreruptă fără commit | Micro-loop ≤8 pași; checkpoint după fiecare subtask; `git status` la reluare |
| **Kimi k2.7** | Context lung → amestec fișiere similare | Graphify path între 2 simboluri; citește callers |
| **DeepSeek** | Răspunsuri rapide, uneori API-uri inexistente | Verifică `package.json` + grep înainte de orice comandă nouă |
| **Claude Fable 5** | Proză premium pe text AHJ — risc „factoid” juridic | Marchează `[NEEDS_AHJ_SOURCE]` dacă nu e în `jurisdictions.py` / docs |
| **Claude Sonnet** | Refactor over-scope | Diff maxim focalizat; review skill obligatoriu |
| **Haiku** | Judge superficial | Primește doar diff + output test; nu codebase întreg |

**Fable 5 gate:** folosit doar pentru text customer-facing (≤15–20% cazuri), niciodată pentru „a trecut testele” fără pytest/vitest real.

---

## Ce este interzis explicit (blacklist)

```
❌  „Ar trebui să funcționeze” / „în teorie” / „de obicei în proiecte similare”
❌  „Am rulat verify” fără a fi rulat
❌  Path-uri inventate (../node_modules/.bin pe Windows — folosește npm scripts)
❌  „Toate epicele complete” fără npm run loops:status
❌  „Prod e OK” fără deploy:status / health curl
❌  npm audit fix --force fără aprobare explicită
❌  Commit/push declarat dar neexecutat
❌  Citare cod cu linii greșite sau din memorie
❌  „Userul poate rula X” când tu ai shell
❌  Înlocuirea HANDOFF.md cu parere proprie când BLOCKER extern e documentat
```

---

## Checklist rapid (înainte de DONE)

Bifează mental — dacă orice e **NU**, nu scrii DONE:

- [ ] Am citit fișierele pe care le-am modificat (+ callers relevanți)?
- [ ] Fiecare path menționat există (Glob/Read)?
- [ ] Fiecare comandă npm există în `package.json`?
- [ ] Am rulat gate-ul din task (verify / survey:test / smoke)?
- [ ] `VERIFIED` conține comanda **și** rezultatul (exit code / număr teste)?
- [ ] Diff-ul e minimal și legat strict de task?
- [ ] Am încercat să stric singur soluția (P4) și am notat ce am verificat?
- [ ] `LEFT` și `BLOCKED` sunt oneste?
- [ ] Dacă sesiunea a fost întreruptă: am verificat `git status` pentru muncă necommitată?

---

## Format checkpoint (extins anti-halucinație)

```
DONE: <ce s-a livrat, factual>
VERIFIED: <comandă exactă> → <exit code / N passed / output relevant>
EVIDENCE: <paths citite | graphify query | stash hit>
LEFT: <ce rămâne, fără cosmetizare>
BLOCKED: <blocker real sau ->
HALLUCINATION_RISK: low | medium — <ce nu am putut verifica>
```

Orchestratorul **respinge** checkpoint-uri fără `VERIFIED` cu comandă reală.

---

## Recuperare după sesiune întreruptă (Grok Code / terminal închis)

Protocol obligatoriu pentru agentul care preia:

```bash
git status --short
git diff --stat
cat docs/planning/HANDOFF.md   # primele 40 linii
npm run loops:status
ls .autoprompt/ 2>/dev/null || true
```

1. **Nu presupune** ce a făcut sesiunea anterioară — citește diff-ul.
2. **Nu reîncepe de la zero** dacă munca e 80% — termină + verify.
3. **Nu da commit** decât dacă userul cere explicit (regulă AGENTS.md).
4. Scrie în `HANDOFF.md` dacă găsești muncă neterminată fără BLOCKED.

---

## Integrare în documentele existente

| Document | Rol |
|---|---|
| `AGENT-ENGINEERING.md` (AEP) | P3 Verify + P4 Adversarial = anti-halucinație structurală |
| `AUTOPROMPT.md` | Faza VERIFY + CRITIQUE = gate obligatoriu |
| `SOLARIS-LOOPS-MASTER.md` | Loop 3 Verify + checkpoint Stash |
| `HANDOFF.md` | Adevăr despre prod/DNS/git când codul nu poate minți |
| `anti-halucinatii-loop.md` | Pași per fază de loop |

---

## Prompt scurt (lipire în orice orchestrator)

```markdown
Anti-halucinație SOLARIS CET — legi absolute:
1. Citește fișierul înainte de edit. 2. Graphify/Stash înainte de grep.
3. Orice claim = citare cod sau output comandă din sesiunea curentă.
4. Nu inventa npm scripts, paths, API-uri, stare git/prod.
5. Tu rulezi verify — userul nu. 6. Fără DONE fără VERIFIED literal.
7. După sesiune întreruptă: git status + diff înainte de continuare.
Încalcarea = task invalid, reia de la PRIME.
```

---

**Acest document este sursa de adevăr pentru comportamentul onest al tuturor agenților din SOLARIS CET.**  
Orice orchestrator nou (AUTOPROMPT v5, Ralph, Kimi AEP) trebuie să încarce acest fișier la startul sesiunii.