# Page Design — Upgrade vizual global (desktop-first)

## Global Styles (aplicate peste tot)
- Design tokens (CSS variables)
  - Culori: `--bg-0` (spațiu profund), `--bg-1` (nebuloasă), `--fg-0` (text principal), `--accent-a` (cyan/teal), `--accent-b` (magenta/violet), `--stroke-holo` (iridescent)
  - Spacing: scară 4/8/12/16/24/32/48/64; ritm vertical coerent între secțiuni
  - Radius: 8–14px; Elevations: 2–3 trepte (shadow soft, fără glow agresiv)
  - Tipografie: 16px bază; line-height 1.4–1.6; max-width text 60–75ch
- Linkuri: subliniere vizibilă; hover = creștere contrast, nu doar culoare
- Butoane: stări clare (default/hover/focus/disabled); focus ring 2px + offset
- Motion (global)
  - Default: tranziții scurte (120–220ms), easing standard; fără animații infinite în UI critic
  - `prefers-reduced-motion: reduce`: oprește fundalul animat și efectele continue; păstrează doar feedback instant (fără parallax)
- Fallback performant (mobile)
  - Fundal: 1 gradient static + 1 noise mic (imagine optimizată) în loc de multiple straturi cu blur
  - Disable: Canvas/particule; reduce transparențe suprapuse; evită `backdrop-filter` pe mobile

---

## 1) Layout global (aplicat pe toate paginile)
### Layout
- Sistem: CSS Grid pentru schelet (header / content / footer) + Flexbox în componente.
- Container: max-width desktop (ex: 1200–1320px), padding lateral 16–24px; pe ultra-wide adaugă „content rails” (nu spațiu gol).
- Breakpoints (orientativ):
  - Mobile: 0–767 (profil lite)
  - Tablet: 768–1023
  - Desktop: 1024–1439
  - Large desktop: 1440+

### Meta Information
- Title: dinamic per pagină (ex: „{Pagina} — Solaris CET”)
- Description: scurt, coerent; fără promisiuni vizuale care depind de animații
- Open Graph: imagine statică (fallback), nu GIF/video

### Page Structure
- Header sticky (opțional): logo, navigație, CTA principal
- Main: secțiuni modulare, ritm vertical; grile de carduri pentru densitate
- Footer: linkuri utile, info legal

### Sections & Components
- Cosmic Background (stratificat)
  - Strat 1: gradient radial + vignetting discret
  - Strat 2: nebuloasă (SVG sau imagine AVIF/WebP) cu opacitate mică
  - Strat 3: „holo grid” (SVG pattern) aplicat doar pe zone non-text sau cu mask
  - Strat 4 (opțional): particule Canvas, doar pe desktop și doar dacă motion permis
- Hologram surfaces
  - Carduri: border iridescent 1px + highlight pe hover; fără glow care scade contrastul
  - CTA: gradient accent + focus ring vizibil
- A11y layer
  - Contrast: text pe suprafețe cu overlay solid/semi-solid
  - Focus: consistent pe toate elementele interactive; tab order corect

---

## 2) Home
### Layout
- Pattern: secțiuni stacked + grilă de carduri (3 coloane desktop / 2 tablet / 1 mobile).

### Meta Information
- Title: „Home — Solaris CET”
- Description: propoziție unică despre valoare

### Page Structure
1. Hero (stânga text, dreapta vizual)
2. Secțiune beneficii (3–6 carduri)
3. Conținut principal (liste/carduri)
4. CTA final

### Sections & Components
- Hero
  - Headline + subheadline + CTA
  - Visual: element cosmic static by default; animație subtilă doar dacă motion permis
- Card grid
  - Carduri cu înălțimi aliniate; spacing redus pentru a elimina „golurile”
- CTA
  - Buton primar + secundar; stări hover/focus clare

---

## 3) Pagină de conținut (template generic)
### Layout
- Pattern: coloană principală (60–75ch) + sidebar opțional (desktop), fără spațiu mort.

### Meta Information
- Title: „{Titlu} — Solaris CET”
- Description: extras scurt al conținutului

### Page Structure
1. Header titlu (titlu, meta, acțiuni)
2. Corp (paragrafe, liste, tabele)
3. Secțiuni aferente (carduri conexe)

### Sections & Components
- Typography
  - Heading scale clar; spacing între paragrafe; highlight-uri discrete (callout)
- Tables/Lists
  - Linii și zebra subtilă; focus pe citibilitate (nu pe efecte)
- Interactions
  - Hover/focus: schimbare de border/contrast, nu mișcare mare
  - Reduced motion: fără scroll-jacking, fără parallax
