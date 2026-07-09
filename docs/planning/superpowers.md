# Superpowers — Plan & Verify Before Code (SOLARIS × Grok 4.5)

**Versiune:** 2.0 SOLARIS (peste obra/superpowers)  
**Skill:** `.agents/skills/superpowers/SKILL.md`  
**Loop:** `superpowers-loops.md`

---

## De ce există

[obra/superpowers](https://github.com/obra/superpowers) (~247k★): subagent per task, TDD, verify-before-done.

**Gap în OSS:** nu forțează orchestratorul să **respingă** munca fără plan artifact.  
**SOLARIS Superpowers v2** = plan obligatoriu **înainte** de atingerea `app/` sau `survey-engine/`.

---

## Pre-Flight Gate (BLOCKER absolut)

Nicio unealtă Read/Write/StrReplace pe cod produs până nu completezi:

### 1. SPEC (1 propoziție)
> Done = `<comandă>` exit 0 SAU `<URL/behavior>` observabil.

### 2. N-BEST (2–3 abordări)
Scor 1–5 pe: **Verifiability** (prioritate), Simplicity, Risk, Token cost.

### 3. BLAST RADIUS
Listează fișiere din **graphify query**, nu din memorie:
```bash
npm run graphify:suggest -- "<task>"
```

### 4. PRE-MORTEM (1 paragraf)
„Această soluție va eșua pentru că ___.”

### 5. GATE PLAN
| Pas | Edit | Gate imediat |
|---|---|---|
| 1 | … | `pytest …` / `vitest …` |

**Artifact obligatoriu în chat/checkpoint:**
```
PRE-FLIGHT: PASS
SPEC: ...
APPROACH: #2 because Verifiability=5
BLAST_RADIUS: [paths]
PRE-MORTEM: ...
GATE_PLAN: ...
```

---

## Cele 7 Superpowers (SOLARIS)

| # | Superpower | Efect |
|---:|---|---|
| 1 | **Spec-first** | Nu cod fără criteriu de succes măsurabil |
| 2 | **TDD bond** | Test în același pas cu comportament nou |
| 3 | **Subagent atomic** | 1 subtask = 1 verify command |
| 4 | **Orchestrator skeptic** | Respinge DONE fără output literal |
| 5 | **Red team P4** | review skill înainte de checkpoint |
| 6 | **Graphify scope** | Blast radius din graf, nu imaginație |
| 7 | **No user testing** | Tu rulezi gate-ul |

---

## Orchestrator: când RESPINGI workerul

- Lipsește `PRE-FLIGHT: PASS`
- `VERIFIED` fără comandă + exit code
- Diff conține fișiere în afara `BLAST_RADIUS` (observer halt)
- Teste lipsă la behavior change

---

## Diferență față de obra/superpowers

| obra | SOLARIS v2 |
|---|---|
| TDD recomandat | TDD + gate plan per edit |
| Verify before done | Verify before **first** product file read |
| Subagent | + brief cu SKILLS_LOADED + OBSERVER |
| — | Integrat AEP P0–P6 + anti-halucinatii |
| — | token-clock burn doar după verify verde |

---

## Prompt scurt (lipire system)

```markdown
SUPERPOWERS SOLARIS v2: Complete Pre-Flight (SPEC, N-BEST, BLAST_RADIUS, PRE-MORTEM, GATE_PLAN)
before ANY Read/Write on app/ or survey-engine/. No PRE-FLIGHT: PASS = no code.
Read: docs/planning/superpowers.md
```