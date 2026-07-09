# Find Skills — Descoperire & încărcare skills (Grok 4.5)

**Proiect:** SOLARIS CET  
**Versiune:** 1.0 · **2026-07-09**  
**Skill:** `.agents/skills/find-skills/SKILL.md`  
**Companion:** `find-loops-skills.md`

---

## Problema

Agenții au 27+ skills în repo (`.agents/`, `.claude/`, `.trae/`). Fără routing → încarcă greșit, sar peste verify, sau halucinează că „știu deja”.

**Find Skills** = GPS-ul: **care skill, care doc, în ce ordine**, înainte de primul `Read` pe cod produs.

---

## Instalare (o dată / după pull)

```bash
npm run skills:install
```

Copiază skills din `.agents/skills/` → `.claude/skills/` + `.cursor/skills/`  
Scrie `.agents/skills-manifest.json`  
Încearcă `graphify install --platform cursor`

---

## Prime la fiecare sesiune

```bash
npm run skills:prime -- "<obiectiv task>"
npm run stash:prime -- "<obiectiv task>"
npm run graphify:prime -- "<obiectiv task>"
```

---

## Harta completă skills

| Skill | Când | Doc principal |
|---|---|---|
| `find-skills` | Întotdeauna primul | acest fișier |
| `engineering` | Orice task netrivial | `AGENT-ENGINEERING.md` |
| `superpowers` | Înainte de orice edit | `superpowers.md` |
| `anti-halucinatii` | Checkpoint + DONE | `anti-halucinatii.md` |
| `loops` | Epics / tasks.md | `SOLARIS-LOOPS-MASTER.md` |
| `graphify` | Înainte de grep | `graphify-out/` |
| `verify` | Înainte de DONE | verify skill |
| `review` | P4 adversarial | review skill |
| `memoria` | Loop 0 + Loop 7 | `memoria.md` |
| `observer` | Fiecare micro-pas | `grok-observer.md` |
| `token-clock` | DONE + orchestrare | `token-clock.md` |
| `unique-design` | UI/UX | `unique-design.md` |

---

## Arbore de decizie (60 secunde)

```
Task nou?
├─ Epic / tasks.md?     → loops + find-loops-skills + superpowers-loops
├─ UI / design?         → unique-design + superpowers
├─ Survey / Python?     → engineering + graphify + verify
├─ Autonom batch?       → autoprompt + observer + token-clock
├─ Sesiune întreruptă?  → anti-halucinatii + memoria + git status
└─ Default              → engineering + superpowers + observer
```

---

## Regulă orchestrator

**EXECUTE interzis** dacă checkpoint-ul Pre-Flight nu conține:
- `SKILLS_LOADED: find-skills, …`
- `DOCS_READ: …`

---

## Anti-pattern

❌ „Am skill-ul în training”  
❌ Sări peste `skills:install` după clone  
❌ Un singur skill generic pentru tot repo-ul  

✅ `skills:prime` topic-aware la fiecare goal nou