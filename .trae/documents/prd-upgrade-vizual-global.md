## 1. Product Overview
Upgrade vizual global pentru interfață: eliminarea „spațiilor moarte” și introducerea unui limbaj vizual coerent cu holograme/efecte cosmice.
Obiectiv: aspect premium + consistență, fără compromisuri la a11y, cu respectarea `prefers-reduced-motion` și fallback performant pe mobile.

## 2. Core Features

### 2.1 User Roles
Nu este necesară diferențierea pe roluri (impact exclusiv vizual/UX).

### 2.2 Feature Module
Upgrade-ul necesită următoarele pagini/zone (minim, pentru aplicare end-to-end):
1. **Layout global (aplicat pe toate paginile)**: grid/spacing unificat, fundal cosmic stratificat, sistem de efecte holografice, focus/contrast a11y.
2. **Home**: secțiuni re-așezate pentru densitate vizuală echilibrată, hero cu efecte controlate, carduri/CTA consistente.
3. **Pagină de conținut (template generic)**: tipografie optimizată, componente de conținut (card, tabel, listă) cu noul stil, efecte discrete pe interacțiune.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Layout global (aplicat pe toate paginile) | Sistem spacing & grid | Elimină spații moarte prin: ritm vertical consistent, max-width coerent, breakpoints clare, densitate ajustată pentru ecrane mari fără „goluri”. |
| Layout global (aplicat pe toate paginile) | Fundal cosmic stratificat | Randă 2–4 straturi (nebuloasă/gradient, „noise” fin, grid holografic, particule opționale) cu intensitate controlată; păstrează contrastul textului. |
| Layout global (aplicat pe toate paginile) | Efecte holografice coerente | Aplică același set de efecte pe: carduri, butoane, header; folosește doar 1–2 accente cromatice + highlight pentru coerență. |
| Layout global (aplicat pe toate paginile) | A11y & motion policy | Respectă `prefers-reduced-motion`; dezactivează animații non-esențiale; păstrează focus ring vizibil; asigură contrast minim pentru text și stări (hover/focus/disabled). |
| Layout global (aplicat pe toate paginile) | Fallback performant (mobile) | Detectează ecran mic/low-power și trece pe fundal static (imagine/gradient) + efecte fără blur mare; limitează repaints și numărul de straturi. |
| Home | Densitate + ierarhie vizuală | Reordonează secțiuni pentru flux: hero → dovezi/beneficii → listă carduri → CTA; reduce zonele goale prin grile și carduri cu înălțimi consistente. |
| Home | Hero cosmic controlat | Adaugă accent holografic discret (ex: border iridescent) + un singur element animat (opțional), cu oprire automată la `reduced-motion`. |
| Pagină de conținut (template generic) | Tipografie & lizibilitate | Optimizează lățime coloană, spacing între paragrafe, heading scale; evită fundaluri „zgomotoase” în spatele textului lung. |
| Pagină de conținut (template generic) | Componente de conținut | Standardizează: carduri, callout-uri, tabele și liste cu aceleași tokens; aplică hover/focus subtil, fără efecte care reduc citibilitatea. |

## 3. Core Process
1) Când intri în aplicație, sistemul aplică layout-ul global și tokens (spacing, culori, tipografie).
2) La încărcare, se selectează un „profil de efecte” în funcție de: `prefers-reduced-motion`, dimensiune ecran și capabilități (mobile/low-power) — profilul reduce animațiile, straturile și blur-ul.
3) Pe interacțiune (hover/focus), efectele holografice sunt discrete, iar stările a11y (focus ring, contrast) rămân prioritare.

```mermaid
graph TD
  A["Home"] --> B["Pagină de conținut (template generic)"]
  A --> C["Layout global (aplicat pe toate paginile)"]