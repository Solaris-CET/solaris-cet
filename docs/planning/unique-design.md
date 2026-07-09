# Unique Design — ADN vizual SOLARIS (v2.0 Mature)

**Versiune:** 2.0 Mature · **Skill:** `.agents/skills/unique-design/SKILL.md`  
**Stack:** Tailwind v4 · React 19 · `cn()` · tokens existente în `app/`

---

## §0 — Adult brief

„Frumos” fără funcție = clipart. În SOLARIS, designul e **interfață pentru adevărul de pe acoperiș** — score, twin, offline queue, cost instalator.

Generic AI dashboard = respins. Tri-Helix = **biomimetic funcțional**, nu decor.

---

## §1 — Tri-Helix DNA (implementare concretă)

### Helix Solis — lumina = confidence

| Token UI | Mapare date | Unde în app |
|---|---|---|
| Golden gradient subtle | suitability_score 80+ | Twin panels, feed cards |
| Cooler gray edge | low_confidence_count > 0 | Survey checklist warnings |
| Pulse animation 2s | twin SSE heartbeat | `useTwinStream` connected |

**Cod:** reutilizează `--color-*` din theme; nu hardcode `#FFD700`.

### Helix Field — grid = teren

| Pattern | Implementare |
|---|---|
| Topographic 1px lines | background `SurveyPage` sections, nu global body |
| Spacing 4/8/16 | mapare mentală „pași măsurătoare” |
| Parcel cards | offline draft tiles, nu list rows |

### Helix Trust — AHJ gravitas

| Element | Regulă |
|---|---|
| Headings | weight consistent; fără 6 font-size diferite pe pagină |
| kWp, kWh, cost_usd | `tabular-nums`, align right în tabele installer |
| Verdict text | RO tehnic din `translations.ts`, nu marketing |

---

## §2 — Specii unice (pattern library)

| ID | Specie | Component target | Acceptance |
|---|---|---|---|
| SP-01 | Lumina-scor | `TwinRuntimePanel` | pulse doar când `connected` |
| SP-02 | Parcelă-draft | offline IndexedDB UI | hartă/grid, nu listă simplă |
| SP-03 | Verdict-thermal | suitability badge | culoare = verdict enum |
| SP-04 | Corridor-evidence | photo → finding link | 1px line sau index chip |
| SP-05 | Installer-ledger | installer profile cost | HARD-002 data vizibil |
| SP-06 | Replay-catchup | twin event list | dedupe by event_id vizibil |

---

## §3 — Legi de execuție

1. **Reuse** — `cn()`, componente admin/survey existente
2. **Motion = meaning** — animație doar pentru sync/loading/twin
3. **Field-first** — touch targets ≥44px pe `/survey`
4. **Fără** purple AI gradient, stock solar clipart, generic shadcn clone

---

## §4 — Pre-Flight design (înainte de UI edit)

```
DESIGN_SPEC: SP-03 Verdict-thermal on TwinFeedPanel score chip
BLAST_RADIUS: TwinFeedPanel.tsx, twinFeed.ts types, *.test.tsx
A11Y: contrast 4.5:1 pe soare (test with existing tokens)
VERIFY: vitest TwinFeedPanel + visual sanity on /survey demo
```

---

## §5 — Anti-patterns (văzute în SaaS generic)

| Respins | Înlocuitor SOLARIS |
|---|---|
| „AI magic” copy | date din twin feed / survey engine |
| Chart.js random pe admin | installer ledger din `ReportRecord` |
| Modal peste modal | inline conflict UI (HARD-003 viitor) |

---

## §6 — Checklist PR UI

- [ ] Răspunde „where on the roof is the truth?” în 3s
- [ ] ≤5 clase noi Tailwind; restul tokens
- [ ] Vitest pentru componenta atinsă
- [ ] RO tehnic aliniat `translations.ts`
- [ ] Mobile 375px — buton principal vizibil fără scroll