---
title: "AUDIT — solaris-cet.com (Pre-Awwwards Upgrade)"
date: "2026-04-16"
scope: "Production landing (Vite/React/GSAP) + deploy pipeline (Coolify)"
---

# AUDIT PROFESIONAL — SOLARIS-CET.COM

Data: **16 aprilie 2026**  
Scop: audit realist pentru upgrade la nivel **Awwwards/SOTD** fără să rupem stabilitatea în producție.

## 0) Context tehnic real (verificat în repo)

- Framework: **Vite 7 + React 19 + TypeScript**
- Styling: **Tailwind CSS 4** (+ shadcn/Radix)
- Motion: **GSAP 3 + ScrollTrigger**
- Deploy: **VPS + Coolify** (build din monorepo root; workspaces: `app`, `api`, `contracts`, `scripts`)
- Routing: SPA fallback la `index.html` + suprafețe statice `/sovereign/` și `/apocalypse/`
- PWA: `vite-plugin-pwa` + offline fallback

## 1) Verdict (scor)

- Deploy readiness (stabilitate): **8.5 / 10**
- Awwwards readiness (wow factor): **4 / 10**

Explicație:
- Site-ul este stabil (health/rute/build), dar încă nu are stratul cinematic WebGL/holografic + storytelling “SOTD”.

## 2) Ce merge bine (puncte forte)

- Mesaj core: **RWA (Cetățuia) + supply 9,000 + AI agents + TON + RAV Grok×Gemini**.
- Există fundație pentru experiență imersivă:
  - Canvas layers în Hero (quantum field / solar rays / particles)
  - GSAP timelines (intrări/ieșiri) + ScrollTrigger
  - Route-level pages: `/rwa`, `/cet-ai` (deep links reale)
- Quality gates există deja:
  - CI (lint/typecheck/unit/E2E)
  - Lighthouse CI thresholds

## 3) Probleme reale (prioritizate)

### P0 — Deploy/ops (blocante)

- **Lockfile drift**: dacă `package-lock.json` nu e în sync cu workspaces, `npm ci` eșuează (și Coolify build moare).
  - Politică: orice modificare în `app/package.json` trebuie să vină cu lockfile actualizat.

### P1 — Performanță / Core Web Vitals

- Chunk-uri grele (Mermaid/Cytoscape/ONNX) trebuie controlate strict:
  - să nu ajungă “above the fold”
  - să fie lazy-loaded la interacțiune sau la intrarea în view
- PWA precache este mare (workbox raportează ~9MB precache). Trebuie bugete:
  - ce e precache (critic)
  - ce rămâne runtime cache

### P1 — “Wow factor” insuficient pentru SOTD

- Avem vibe cosmic/quantum, dar lipsesc elemente “signature”:
  - token CET ca **obiect 3D holografic** (shader + lighting + postprocessing)
  - “200k agents mesh” ca sistem coerent (instancing/particles cu sens narativ)
  - transitions/storytelling scroll-driven (RWA → AI mesh → tokenomics → proof)

### P2 — SEO/A11y advanced

- SEO basic e ok (title/description/canonical), dar pentru SOTD/press lipsesc:
  - OG images dedicate per rută (`/rwa`, `/cet-ai`)
  - JSON-LD (schema.org) + disclaimere (token/organization/website)
- A11y: audit complet focus/contrast + `prefers-reduced-motion` pentru toate animațiile.

## 4) Recomandări “Awwwards-grade” (fără să rupem site-ul)

### Strategie: Progressive WebGL

- Desktop: activează WebGL cinematic doar dacă:
  - `prefers-reduced-motion` este OFF
  - device/browser suportă performant
- Mobile/low-end: fallback la CSS/canvas light (fără frame drops).

### Tehnici recomandate (în stack-ul actual)

- **React Three Fiber + Drei**: token 3D + scene manager
- **Postprocessing**: Bloom + chromatic aberration + scanline/noise hologram
- **GSAP + ScrollTrigger**: timeline-uri curate per secțiune (fără pin heavy pe mobile)
- **Asset pipeline**: glTF Draco/KTX2, prefetch controlat, code-splitting

## 5) Checklist pre-SOTD

- Lighthouse desktop: Perf ≥ 95, A11y ≥ 95, SEO ≥ 95, BP ≥ 95
- Lighthouse mobile: Perf ≥ 85–90 (cu fallback)
- Zero erori console
- Test wallet connect + CET AI flows pe Chrome/Safari/Firefox + iOS/Android
- Demo video 60s + press kit

## 6) Notă de copy (RO)

Recomandat:
- „Primul token RWA ancorat în **Cetățuia, România** — 9,000 CET. Imutabil.”
