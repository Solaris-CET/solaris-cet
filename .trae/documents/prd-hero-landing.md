## 1. Product Overview
O pagină de tip landing (desktop-first) centrată pe un hero cu fundal video/animat.
Scop: crește conversia prin 2 CTA-uri vizibile, stats animate și layout simplificat pe mobil.

## 2. Core Features

### 2.1 Feature Module
Produsul include următoarele pagini:
1. **Landing (pagina principală)**: hero cu fundal video/animat + overlay întunecat, 2 CTA-uri cu glow auriu, contori de statistici animați, comportament optimizat pentru mobil.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Landing (pagina principală) | Hero background (video/animat) | Reda fundal video/animat în buclă; folosește poster/fallback static; oprește/înlocuiește pe mobil dacă e necesar pentru performanță. |
| Landing (pagina principală) | Dark overlay | Aplică overlay întunecat (gradient/solid) peste fundal pentru contrast; păstrează lizibilitatea textului pe orice cadru video. |
| Landing (pagina principală) | Headline + subheadline | Afișează mesajul principal de impact și suport (text scurt, lizibil peste overlay). |
| Landing (pagina principală) | Dual CTAs | Afișează 2 butoane (primar/secundar) cu stare normal/hover/focus; evidențiază prin glow auriu; navighează la URL-uri configurabile. |
| Landing (pagina principală) | Stats counters | Afișează 3–6 statistici cu numere care cresc animat la intrarea în viewport; suportă valori finale + sufix (%, +, k). |
| Landing (pagina principală) | Mobile simplified layout | Simplifică layout-ul pe ecrane mici: reduce efectele (video/glow/anim), reasamblează conținutul pe coloană, prioritizează CTA-ul primar. |
| Landing (pagina principală) | Accesibilitate & motion safety | Respectă `prefers-reduced-motion` (dezactivează animații/numărătoare); asigură focus vizibil și contrast suficient; CTA-urile sunt accesibile prin tastatură. |

## 3. Core Process
Flux vizitator:
1) Utilizatorul deschide landing-ul și vede hero-ul cu overlay întunecat.
2) Utilizatorul interacționează cu unul dintre cele 2 CTA-uri (primar sau secundar).
3) Utilizatorul observă statisticile care se animă la scroll/în viewport (dacă animațiile sunt permise).
4) Pe mobil, utilizatorul vede o variantă simplificată (performantă) și poate apăsa CTA-ul primar rapid.

```mermaid
graph TD
  A["Landing (Home)"] --> B["Click CTA primar"]
  A --> C["