## 1. Product Overview
Optimizarea UI pentru AiOracleSearch astfel încât să respecte branding-ul, să fie rapid și accesibil.
Focalizare: responsive complet, încărcare percepută mai bună, dark mode persistent, animații subtile, WCAG 2.2 AA și cross-browser.

## 2. Core Features

### 2.1 Feature Module
Cerințele AiOracleSearch constau din următoarele pagini principale:
1. **Pagina de Căutare & Rezultate**: header conform branding, zonă căutare, listă rezultate, stări de încărcare (skeleton), dark mode, back-to-top accesibil.
2. **Pagina Detalii Rezultat**: conținut rezultat, navigare înapoi, skeleton la încărcare, layout responsive, compatibilitate accesibilitate.

### 2.2 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Pagina de Căutare & Rezultate | Branding & layout | Aplică identitate vizuală (culori, tipografie, spațiere) și structură desktop-first, cu adaptare fluidă pe toate breakpoint-urile. |
| Pagina de Căutare & Rezultate | Responsive pe breakpoint-uri | Re-aranjează grila (filtre/rezultate), dimensiuni de text și spațiere pentru mobil/tabletă/desktop/large desktop fără overflow sau zoom lateral. |
| Pagina de Căutare & Rezultate | Performanță percepută (Skeleton) | Afișează skeleton loaders pentru rezultate, carduri, sidebar/filtre și zone media până la finalizarea fetch-ului; păstrează layout-ul stabil (fără CLS). |
| Pagina de Căutare & Rezultate | Lazy loading non-critic | Încarcă la cerere componente non-critice (panou filtre avansate, secțiuni explicative, componente rare) fără a bloca primul render. |
| Pagina de Căutare & Rezultate | Dark mode persistent | Oferă comutator light/dark; salvează preferința local și o restaurează la fiecare accesare; respectă și preferința OS ca valoare inițială. |
| Pagina de Căutare & Rezultate | Back to Top accesibil | Afișează un buton „Înapoi sus” când utilizatorul a scrollat; permite activare cu tastatura, are etichetă accesibilă și focus vizibil. |
| Pagina de Căutare & Rezultate | Animații subtile la scroll | Animează discret apariția cardurilor/sectoarelor la intrare în viewport; dezactivează/limitează animațiile când utilizatorul are „prefers-reduced-motion”. |
| Pagina de Căutare & Rezultate | WCAG AA | Asigură contrast, focus states, navigare completă din tastatură, semantic HTML/ARIA minim necesar, mesaje de eroare clare și etichete pentru controale. |
| Pagina de Căutare & Rezultate | Cross-browser | Funcționează consistent pe Chrome/Edge/Firefox/Safari (desktop + mobil), inclusiv la scroll, sticky header și lazy loading. |
| Pagina Detalii Rezultat | Layout & conținut | Afișează detalii într-un layout lizibil (titlu, metadate, conținut principal), cu navigare clară înapoi la rezultate. |
| Pagina Detalii Rezultat | Skeleton & stabilitate | Folosește skeleton pentru header/conținut până la încărcare; evită sărituri de layout. |
| Pagina Detalii Rezultat | Accesibilitate & cross-browser | Respectă WCAG AA, suport complet tastatură și comportament identic pe browserele țintă. |

## 3. Core Process
- Flux utilizator: deschizi pagina de căutare, introduci interogarea, vezi starea de încărcare (skeleton), apoi rezultatele; poți comuta dark mode; poți deschide un rezultat pentru detalii; revii la rezultate; folosești „Înapoi sus” pentru navigare rapidă.
- Flux accesibilitate: navighezi cu Tab/Shift+Tab prin controale; focus vizibil; activezi butoane cu Enter/Space; primești anunțuri non-intruzive pentru stările de încărcare/erori.

```mermaid
graph TD
  A["Pagina de Căutare & Rezultate"] -->|"Selectezi un rezultat"| B[