---
name: "solaris-awwwards-sotd-2026"
description: "Designs Awwwards-grade 3D/AI landing experiences (R3F/WebGL/GSAP) with strict performance + accessibility. Invoke when upgrading Solaris CET UI to cinematic/hologram interactions."
---

# Solaris — Awwwards SOTD 2026

## Obiectiv

Să transformi solaris-cet.com dintr-un landing solid (Vite/React/GSAP) într-o experiență **cinematică**, cu:
- token holografic 3D
- agents mesh (instanced particles)
- scroll storytelling (GSAP choreography)
- perf budgets + fallback (mobile/reduced motion)

## Reguli (non-negociabile)

- Progressive enhancement: WebGL nu trebuie să blocheze conținutul.
- Respectă `prefers-reduced-motion`.
- Bugete: main chunk + LCP/INP/CLS rămân controlate.
- Fallback: dacă WebGL nu e ok, UI rămâne premium (2D/canvas/CSS).

## Arhitectură recomandată

- `app/src/experience/`
  - `SceneRoot` (mount/unmount curat)
  - `PerfGate` (device capability + reduced motion)
  - `AssetLoader` (draco/ktx2 + prefetch controlat)
  - `Shaders/` (hologram scanline/noise, aurora)

## Choreography (GSAP)

- Timeline per secțiune, nu un mega-timeline global.
- ScrollTrigger pentru sync, dar evită pinned heavy pe mobile.

## Checklist de livrare

- Lighthouse desktop: ≥ 95 perf / ≥ 95 SEO / ≥ 95 A11y
- Mobile: fallback valid, fără frame drops
- Zero console errors
- Demo video 60s
