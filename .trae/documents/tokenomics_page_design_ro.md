# Page Design — Tokenomics (desktop-first)

## Global Styles (aplicabile Home + Tokenomics)
- Layout system: CSS Grid pentru structura paginii + Flexbox pentru aliniere în componente.
- Container: max-width 1200–1280px, padding lateral 24px desktop / 16px mobil.
- Tipografie: titluri (32/24/20), body (16), caption (12–14). Line-height 1.4–1.6.
- Culori (tokens):
  - Background: #0B0F19 (dark) sau #FFFFFF (light), în funcție de designul existent.
  - Surface/card: ușor contrastant (ex. #121A2A).
  - Accent: o culoare principală (ex. cyan/violet) + 4–6 culori pentru categoriile din chart.
  - Stări: hover (ușoară luminozitate), focus ring vizibil, disabled redus la 60% opacitate.
- Butoane/linkuri: CTA primar (solid), secundar (outline), link subliniat la hover.
- Motion: easing standard (easeOut), durată 250–450ms, stagger pe liste (50–120ms).

---

## Page: Home

### Meta Information
- Title: "Home"
- Description: "Prezentare proiect și acces rapid la Tokenomics"
- Open Graph: title/description + imagine social (dacă există asset)

### Page Structure
- Pattern: stacked sections (Hero -> Highlights -> CTA către Tokenomics).

### Sections & Components
1. Header / Nav
   - Elemente: Logo (stânga), linkuri (ex. About, Tokenomics), CTA (dreapta).
   - Interacțiuni: highlight pentru ruta activă.
2. Hero
   - Titlu + subtitlu scurt.
   - CTA: "Vezi Tokenomics" (buton) duce la /tokenomics.
3. Highlights (optional, minimal)
   - 2–3 carduri cu beneficii; fără a dubla informația Tokenomics.

Responsive:
- Sub 768px: meniul trece în drawer; CTA rămâne vizibil.

---

## Page: Tokenomics

### Meta Information
- Title: "Tokenomics"
- Description: "Distribuție, vesting și mecanici ale tokenului, cu chart interactiv"
- Open Graph: title/description + preview chart (dacă există)

### Page Structure
- Pattern: pagină tip "report" cu secțiuni verticale și ancore (opțional) în partea de sus.
- Grid desktop:
  - Rând 1: KPI cards (4 coloane pe desktop)
  - Rând 2: Chart (8 coloane) + Legend/Details panel (4 coloane)
  - Rând 3: Vesting / Timeline full width
  - Rând 4: Token mechanics + Notes/FAQ (dacă există conținut definit)

### Sections & Components
1. Header / Subnav
   - Breadcrumb simplu (Home / Tokenomics) sau doar titlu pagină.
   - (Opțional) anchor nav: "Distribuție", "Vesting", "Mecanici".

2. KPI Summary
   - 3–6 carduri: label, valoare, unitate, tooltip cu definiție.
   - Animație: count-up la intrarea în viewport (o singură dată), cu respect pentru "prefers-reduced-motion".

3. Allocation Chart (interactiv)
   - Tip chart: donut/pie.
   - Componente:
     - Canvas/SVG chart.
     - Tooltip pe hover/focus: categorie, procent, valoare (dacă există).
     - Legendă cu toggle (afișează/ascunde categorie) + stare "selected".
     - Panel detalii (dreapta): descriere categorie + lock/vesting sumar.
   - Interacțiuni:
     - Hover: evidențiază segmentul; diminuează celelalte.
     - Click pe segment/legendă: selectează categoria; sincronizează panelul și secțiunea Vesting.
     - Tastatură: navigare prin segmente (tab) + enter pentru select.

4. Allocation Details (listă/tabel)
   - Tabel: categorie | procent | valoare | note vesting.
   - Interacțiuni: click pe rând selectează categoria (sincron cu chart).

5. Vesting / Timeline
   - Variantă A: timeline vertical cu milestones.
   - Variantă B: stacked area/line per categorie (dacă datele permit).
   - Filtrare: arată "All" sau doar categoria selectată.
   - Animație la scroll: fade + slide-in pe milestone-uri (stagger).

6. Token Mechanics
   - Carduri cu reguli (mint/burn/emissions) strict pe baza datelor definite.
   - Pattern: icon + titlu + 2–4 bullet points.

7. Footer
   - Linkuri standard.

### Scroll animation guidelines
- Trigger: fiecare secțiune folosește "in-view" (threshold 20–35%).
- Stagger: pe liste (KPI, milestones) pentru claritate.
- Reduce motion: dacă utilizatorul are "prefers-reduced-motion", dezactivează parallax/stagger și păstrează doar tranziții minimale.

### Responsive behavior
- <1024px: chart și panel devin stacked (chart sus, panel jos).
- <768px: KPI devin 2 coloane; tabel devine listă accordion.
