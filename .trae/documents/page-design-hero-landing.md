# Page Design — Landing (Hero high-impact)

## Global Styles (design tokens)
- Layout grid: max-width 1200px (desktop), padding lateral 24px; pe mobil padding 16px.
- Culori:
  - Background: #07070A (near-black)
  - Overlay: rgba(0,0,0,0.55) + gradient (sus 65% → jos 35%)
  - Text primar: #F5F6FA
  - Text secundar: #B7BCC8
  - Accent auriu (CTA): #D4AF37
  - Accent auriu glow: rgba(212,175,55,0.55)
- Tipografie (desktop-first):
  - H1: 56–64px / 1.05, font-weight 700–800
  - Subheadline: 18–20px / 1.5
  - Body: 16px / 1.6
- Butoane:
  - Primar: fundal auriu, text #0B0B10; hover: glow + ușoară creștere luminozitate.
  - Secundar: transparent + border auriu; hover: glow mai subtil.
  - Focus: ring 2px auriu + offset 2px (vizibil pe overlay).
- Motion:
  - Respectă `prefers-reduced-motion`: dezactivează video autoplay (sau înlocuiește cu poster), dezactivează numărătoarea animată și reduce tranzițiile.

## Meta Information
- Title: „Landing — Hero cu video, CTA dual și stats”
- Description: „Hero cu fundal video/animat, overlay întunecat, două CTA-uri cu accent auriu și statistici animate; optimizat pentru mobil.”
- Open Graph:
  - og:title: idem Title
  - og:description: idem Description
  - og:type: website
  - og:image: preview static (poster) din hero

## Page Structure (desktop-first)
Structură pe secțiuni stivuite, cu un hero full-bleed (100vh max) și un bloc de statistici imediat sub/în hero.

---

## Pagina: Landing (/) — Layout & Components

### 1) Hero (full-bleed)
**Layout:**
- Container root: `position: relative; min-height: 80vh (desktop), 70vh (mobil)`.
- Background media layer: `position: absolute; inset: 0; overflow: hidden`.
- Content layer: `position: relative; z-index: 2; display: grid`.
  - Desktop: grid 12 coloane; conținutul (headline + CTAs) ocupă 6–7 coloane stânga.
  - Mobil: o singură coloană, conținut centrat pe verticală cu spațiere mai compactă.

**Elemente:**
1. Video/animated background
   - `<video>` full-cover (`object-fit: cover`) cu poster.
   - Fallback: imagine statică (poster) dacă video nu pornește.
2. Dark overlay
   - Layer separat peste media: gradient negru pentru contrast constant.
3. Headline (H1)
   - Text scurt, puternic; max 2 rânduri desktop, 3 rânduri mobil.
4. Subheadline
   - Clarifică beneficiul; max 3 rânduri desktop, 4 rânduri mobil.
5. Dual CTAs (buton primar + secundar)
   - Grupare orizontală desktop (gap 12–16px).
   - Pe mobil: stivuite vertical, CTA primar primul, full-width.

**Interacțiuni & stări:**
- CTA glow:
  - Desktop: glow vizibil pe hover + focus.
  - Mobil: glow redus (pentru a evita „haloul” excesiv), focus clar pentru accesibilitate.
- Tranziții: 150–200ms ease-out; dezactivate la `prefers-reduced-motion`.

### 2) Stats counters (în hero jos sau imediat sub hero)
**Layout:**
- Card strip pe desktop: 3–6 „cards” într-o grilă (ex: 3 coloane) cu background semi-transparent.
- Mobil: 2 coloane (sau 1 coloană dacă spațiul e foarte redus).

**Elemente per statistică:**
- Valoare mare (număr) + sufix (ex: %, +, k) aliniat baseline.
- Label scurt (text secundar).

**Comportament:**
- Pornește animația doar când blocul intră în viewport.
- Dacă `prefers-reduced-motion`, afișează direct valorile finale (fără numărare).

### 3) Mobile-optimized simplified layout (reguli)
- Breakpoint recomandat: ≤ 640px.
- În modul simplificat:
  - Înlocuiește video cu poster (sau oprește autoplay) pentru performanță.
  - Reduce intensitatea glow-ului auriu.
  - Reduce spațierea verticală și înălțimea hero-ului.
  - Prioritizează CTA primar (full-width) și păstrează CTA secundar vizibil dar secundar.

### 4) Considerații de accesibilitate (aplicabile paginii)
- Contrast: text alb peste overlay; verificare WCAG pentru CTA.
- Focus: ring vizibil pe overlay (nu doar glow).
- Navigare tastatură: tab order natural (H1 → subheadline → CTA prim