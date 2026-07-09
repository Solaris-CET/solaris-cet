# Unique Design — ADN vizual SOLARIS (Grok 4.5)

**Skill:** `.agents/skills/unique-design/SKILL.md`  
**Domeniu:** solar field-survey · CRM · twin runtime · installer SaaS

---

## Concept: Tri-Helix Design DNA

Ca ADN-ul uman împletit cu 1.000.000 de specii care **nu există încă** — fiecare combinație produce ceva **recognoscibil dar never-before-seen**.

Nu biomimetic decorativ. **Biomimetic funcțional:** forma urmează fluxul de adevăr al survey-ului.

### Helix 1 — Solis (lumina ca date)

- Gradienturi = **golden hour pe acoperiș**, nu purple AI slop
- Luminozitate = **confidence score** (nu culoare random)
- Highlight = unde AI-ul e sigur; umbră = unde tehnicianul trebuie să confirme

### Helix 2 — Field (terenul ca grid)

- Linii topografice subtile = **survey grid**, nu background generativ
- Spacing Tailwind = **pași de măsurătoare** (4/8/16 = 1m / 2m / 4m mental)
- Carduri = **parcele**, nu containere Material

### Helix 3 — Trust (AHJ ca gravitas)

- Tipografie: headings cu **weight consistent** — autoritate fără serif kitsch
- Cifre kWp/kWh: **tabular nums**, aliniate — inginerie, nu marketing
- Erori/warning: aceeași limbă ca checklist șantier (română tehnică clară)

---

## Specii unice (pattern-uri care nu există în alt SaaS)

| Specie | Comportament UI | De ce e wow |
|---|---|---|
| **Lumina-scor** | Score ring pulsează la sync twin | Starea live e vizibilă fără badge „Live” |
| **Parcelă-draft** | Offline draft = hartă parcelată în SurveyPage | PWA nu e „listă”, e teren |
| **Verdict-thermal** | Recomandat/Condiționat = temperatură cromatică | Verdictul e felt, nu citit |
| **Corridor-evidence** | Poze legate de findings prin linii subtile 1px | Evidence linking vizibil |
| **Installer-ledger** | Cost/token per raport ca ledger, nu chart generic | HARD-002 devine UI natural |

---

## Legi de execuție (non-negociabile)

1. **Reuse** `cn()`, tokens existente, componente admin/survey — zero design system paralel
2. **Motion = semnificație** — animație doar pentru sync, loading pipeline, twin heartbeat
3. **Mobile șantier first** — butoane mari, contrast soare, offline states clare
4. **Fără stock solar** — soare cartoon, panouri clip-art, gradient violet „AI”

---

## Checklist înainte de PR UI

- [ ] Răspunde „where on the roof is the truth?” în 3 secunde?
- [ ] Folosește tokens existente (nu 20 clase noi)?
- [ ] Twin/offline states au feedback non-blocking?
- [ ] RO tehnic consistent cu restul app?
- [ ] Vitest/Playwright smoke pentru shell-ul atins?

---

## Prompt designer agent

```markdown
Design SOLARIS Unique Design Tri-Helix: Solis (light=data), Field (grid=terrain), Trust (AHJ gravitas).
Invent one "species pattern" from unique-design.md table — never generic AI dashboard.
Match existing Tailwind + cn(). Mobile field-first.
```