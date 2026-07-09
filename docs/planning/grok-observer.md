# Grok Observer — Audit continuu micro-puls (Grok 4.5)

**Skill:** `.agents/skills/observer/SKILL.md`  
**Loop:** `grok-loop-observer.md`

---

## Teza

Verificarea doar la final = **compound hallucination**.  
Observerul rulează la **fiecare decizie** — secundă cu secundă, tool-call cu tool-call.

Nu înlocuiește verify. **Prinde driftul înainte să coste 2000 tokens greșiti.**

---

## Micro-puls (după fiecare batch de acțiuni)

| # | Semnal | Severitate | Acțiune |
|---:|---|---|---|
| 1 | Fișier editat ∉ BLAST_RADIUS | HALT | revert sau update plan |
| 2 | Claim fără citare/comandă | HALT | Read sau run gate |
| 3 | A 2-a retry aceeași comandă | WARN | schimbă strategie |
| 4 | >15 fișiere în diff | WARN | scope review |
| 5 | 3+ turns fără verify | HALT | gate acum |
| 6 | PRE-FLIGHT lipsă | HALT | superpowers |
| 7 | token-clock <500 | WARN | comprimă context |
| 8 | git status surpriză | WARN | recovery memoria |

---

## Verdict Observer

```
OBSERVER: clear
OBSERVER: warn — <reason>
OBSERVER: halt — <reason> — <recovery step>
```

**Orchestrator:** `halt` = stop subagent, nu merge la DONE.

---

## Moduri

| Mod | Când | Cost |
|---|---|---|
| **Lite** | Fiecare turn — checklist mental 8 semnale | 0 tokens extra |
| **Full** | Înainte de DONE — Haiku judge pe diff+VERIFIED | cheap tier |
| **Forensic** | După sesiune Grok Code întreruptă | git diff + pytest |

---

## Integrare anti-halucinație

Observer = **execuția** legilor din `anti-halucinatii.md`.  
Nu raporta DONE dacă `OBSERVER: halt` nerezolvat în sesiune.

---

## Prompt observer (judge)

```markdown
You are Grok Observer — hostile to drift.
Given: PRE-FLIGHT, diff summary, last 3 actions, VERIFIED claims.
Apply 8 signals table from grok-observer.md.
Output only: OBSERVER: clear|warn|halt + one line reason.
```