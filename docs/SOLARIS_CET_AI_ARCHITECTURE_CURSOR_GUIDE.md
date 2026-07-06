# Solaris CET: Arhitectura Web + AI Integration Playbook (Cursor)

Acest document transforma strategia de design/UX/AI pentru Solaris CET intr-un plan executabil, calibrat pe repository-ul actual.

## 1) Context strategic si limite neschimbabile

Solaris CET este o platforma B2B orientata catre infrastructura telecom + energie, unde increderea, claritatea tehnica si performanta sunt decisive.

In orice implementare, pastreaza invarianti:

- Supply fix: **9,000 CET** (nu modifica wording-ul).
- Chain: **TON**.
- Ancorare geografica/legala: **Cetatuia, Romania**.
- Productie: branch `main` pe Coolify/VPS (`solaris-cet.com`) este blast radius mare.

## 2) Realitatea tehnica a proiectului (obligatoriu)

Designul propus in research mentioneaza Next.js, dar codul din repo ruleaza pe:

- **Vite + React 19 + TypeScript** in `app/`
- **Tailwind CSS v4**
- Animatii existente: **GSAP**
- Suprafata statica OMEGA (fara JS): `static/sovereign/index.html` publicata in `app/public/sovereign/`

Consecinta: noile directive Cursor trebuie optimizate pentru Vite/React, nu pentru App Router Next.js.

## 3) North Star UX pentru segmentul B2B industrial

### 3.1 Reducerea incarcarii cognitive

Aplicare practica:

- Navbar cu 5-7 optiuni primare (Hick + Miller).
- Arhitectura informationala plata; fara submeniuri adanci.
- Datele tehnice se grupeaza pe carduri tematice scanabile.

### 3.2 Formularistica B2B cu friction minim

Regula de implementare:

- Nu marca campurile obligatorii cu `*`.
- Marcheaza doar campurile optionale (`(optional)`).
- Validare inline scurta, mesaje precise, fara zgomot vizual.

### 3.3 Dark-first + contrast functional

- Fundal inchis pentru focus pe modele 3D, metrici si CTA.
- Componente glassmorphism moderate (`bg-white/5`, `border-white/10`, `backdrop-blur`).
- Date financiare/telemetrie in stil tabular monospace.

## 4) Design system operational

### 4.1 Tokeni vizuali recomandati

```css
:root {
  --bg-void: #020617;
  --bg-elevation-1: #0f172a;
  --accent-sovereign: #f2c94c;
  --accent-gold-dim: #b7860b;
  --accent-glow: rgba(242, 201, 76, 0.15);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-surface: rgba(255, 255, 255, 0.05);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-mono: #cbd5e1;
}
```

Principiu: extinde tokenii existenti; nu crea palete paralele in fisiere disparate.

### 4.2 Tipografie

- Foloseste `clamp()` pentru scale fluida responsive.
- Pastreaza lizibilitate tehnica ridicata pe densitati mari de informatie.
- Daca introduci fonturi noi: self-hosted in proiect (fara CDN).

## 5) Arhitectura componentelor: modular, reutilizabil, testabil

Pattern principal: component-driven development.

- Sectiuni pagina in `app/src/sections/`
- Primitive reutilizabile in `app/src/components/ui/`
- Hook-uri comportament in `app/src/hooks/`
- Logica/matematica in `app/src/lib/`

### 5.1 Bento grid pentru dashboard-like storytelling

Pentru homepage/zone de conversie:

- Card mare: produs sau demo vizual.
- Carduri medii: KPI energie/conectivitate.
- Carduri mici: trust signals, testimonials, CTA.

Implementare prin CSS Grid + breakpoints Tailwind (`md`, `lg`, `xl`).

## 6) 3D web: Spline, Sketchfab, Digital Twin readiness

## 6.1 Spline (top-of-funnel marketing)

Checklist minim:

- Container cu dimensiuni explicite (evita CLS).
- Lazy mount in viewport.
- `aria-label` + acces tastatura (`tabIndex`).
- Scene low-poly, texturi comprimate, iluminare baked.

## 6.2 Sketchfab (bottom-of-funnel evaluare tehnica)

- Embed pentru inspectie detaliata modele.
- Optional AR pe mobil pentru validare spatiala 1:1 la client.

## 6.3 Digital Twin (faza ulterioara)

- Pregatire endpoint-uri pentru telemetrie IoT.
- Contract API clar pentru ingestie date de stare.
- Vizualizare avansata separata de landing, ca modul enterprise.

## 7) Motion architecture: performanta + claritate

Ierarhie recomandata:

1. CSS transitions pentru micro-interactiuni simple.
2. Framer Motion doar unde aduce valoare clara (scroll-linked, layout transitions).
3. Respect strict `prefers-reduced-motion`.

Pentru Lottie:

- prefera `.lottie`;
- lazy load la intrare in viewport;
- evita rerender-uri inutile in componente React.

## 8) AI integration architecture (Cursor-first delivery)

## 8.1 Fisier constitution: `.cursorrules`

Acest repo include acum `.cursorrules` cu reguli operationale:

- stack real Vite/React;
- UX rules B2B (inclusiv formulare fara `*` pentru required);
- reguli accesibilitate/performance pentru 3D/motion;
- workflow de validare (`lint`, `typecheck`, `test`, `build`).

## 8.2 Plan-first execution

Pentru taskuri mari:

1. mapare componente/rute existente;
2. lista explicita fisiere modificate;
3. implementare incrementala;
4. rerulare automata a verificarii dupa fiecare pas.

## 8.3 TDD + autonomie controlata

- Scrie intai testele pentru comportamente noi.
- Ruleaza si confirma fail initial.
- Implementeaza minimul necesar pana cand testele trec.
- Ruleaza build final inainte de merge.

## 9) Quality gates si Definition of Done

Pentru orice schimbare in `app/`:

```bash
cd app
npm run lint
npm run typecheck
npm run test
npm run build
```

DoD:

- build verde;
- accesibilitate de baza valida;
- fara regresii in navigatie/formulare;
- fara dependinte CDN runtime;
- fara secrete in repo.

## 10) Roadmap recomandat pe faze

### Faza A - Foundation hardening

- consolideaza tokenii;
- uniformizeaza dark mode;
- normalizeaza pattern-uri de formular.

### Faza B - Conversion UX uplift

- homepage bento layout;
- CTA architecture;
- formulare quote/contact cu friction redus.

### Faza C - Visual immersion

- modul Spline optimizat in hero;
- animatii Lottie pentru flux energetic;
- scroll choreography minimalista.

### Faza D - Advanced enterprise

- modul Sketchfab + optional AR flow;
- pregatire contracte API pentru telemetrie;
- pilot dashboard digital twin.

## 11) Prompt pack pentru Cursor (copy/paste)

### 11.1 Prompt de planificare

```text
Audit this repository section before coding. List existing components, hooks, and style tokens that can be reused. Then propose a minimal-diff implementation plan with exact file paths and validation steps. Do not write code yet.
```

### 11.2 Prompt de implementare

```text
Implement the approved plan in small commits. Keep strict TypeScript, reuse existing UI primitives, avoid external runtime CDNs, and preserve Solaris CET domain invariants (9,000 CET, TON, Cetatuia anchor). After each increment, run lint/typecheck/tests/build as applicable and fix all failures before proceeding.
```

### 11.3 Prompt de verificare finala

```text
Run a final production safety pass: accessibility checks for interactive elements, reduced-motion behavior, potential CLS sources, and bundle/performance risks. Return a concise diff summary and any residual risks.
```

## 12) Decizie arhitecturala finala

Abordarea recomandata pentru Solaris CET este hibrida:

- **Landing performant in Vite/React**, cu UX industrial de inalta claritate.
- **Suprafata OMEGA statica fara JS** pentru cerinte de suveranitate/compatibilitate hard.
- **Module immersive progresive** (Spline/Lottie/Framer) activate responsabil, orientate pe conversie, nu pe efecte gratuite.

Acest model maximizeaza conversia B2B, mentine disciplina operationala si permite extinderea ulterioara spre experiente enterprise (AR, digital twin, telemetrie in timp real).
