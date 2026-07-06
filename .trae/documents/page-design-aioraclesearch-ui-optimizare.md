# Specificație design UI (desktop-first) — AiOracleSearch

## Global Styles (tokens)
- Culori (prin CSS variables):
  - `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent`, `--accent-contrast`, `--focus`
  - Light/Dark: mapare separată pe `[data-theme="light"]` și `[data-theme="dark"]`.
- Tipografie: scală cu `clamp()` (ex. body 14–16px, H1 24–32px), line-height 1.4–1.6.
- Interacțiuni:
  - Butoane: stări hover/active/disabled, `:focus-visible` cu ring 2–3px `--focus`.
  - Link-uri: subliniere la hover + focus.
- Motion: tranziții scurte (150–250ms), dezactivate la `prefers-reduced-motion`.

## Breakpoint-uri & layout responsive
- Desktop-first: layout complet la ≥1280px, apoi simplificare graduală.
- Recomandat: 360 / 480 / 768 / 1024 / 1280 / 1536.
- Sistem:
  - Pagini: container max-width + padding lateral fluid.
  - Zone principale: CSS Grid (2 coloane pe desktop: sidebar + rezultate), trecere la 1 coloană pe tabletă/mobil.

---

## Pagina: Căutare & Rezultate
### Meta Information
- Title: „AiOracleSearch — Căutare”
- Description: „Caută rapid și explorează rezultate relevante.”
- Open Graph: `og:title`, `og:description`, `og:type=website`.

### Page Structure
- Header sticky (branding + acțiuni)
- Secțiune căutare (input + acțiuni)
- Conținut principal (sidebar filtre + listă rezultate)
- Back to Top (floating)

### Sections & Components
1. Header (sticky)
   - Stânga: logo + nume produs (click → home).
   - Dreapta: toggle Dark Mode, (opțional) buton Ajutor.
   - Accesibilitate: „Skip to content” la începutul paginii.
2. Search Bar
   - Input cu label vizibil („Caută”), placeholder secundar.
   - Buton „Caută” + stare loading.
   - Mesaje: eroare/empty state sub input (cu `aria-live="polite"`).
3. Layout rezultate
   - Desktop: grid 12 coloane (ex. sidebar 3–4, rezultate 8–9).
   - Tabletă/mobil: sidebar colapsabil într-un drawer (lazy loaded).
4. Sidebar Filtre (non-critic → lazy)
   - Grupuri cu headings, checkbox/radio, buton „Resetează”.
   - Stare loading: `SidebarSkeleton`.
5. Listă rezultate
   - Carduri cu titlu, rezumat, metadate; zonă clickable clară.
   - Stări:
     - Loading: `ResultCardSkeleton` list.
     - Empty: mesaj + sugestii.
     - Error: mesaj + retry.
   - Scroll reveal: cardurile apar discret (opacity/translate) când intră în viewport.
6. Back to Top (floating)
   - Apare după scroll; poziție bottom-right; nu acoperă CTA-uri.
   - `aria-label="Înapoi sus"`, focus vizibil, dimensiune minimă 44x44.

---

## Pagina: Detalii Rezultat
### Meta Information
- Title: „AiOracleSearch — Detalii”
- Description: „Detalii complete pentru rezultatul selectat.”
- Open Graph: `og:title`, `og:description`.

### Page Structure
- Header sticky (aceleași controale)
- Breadcrumb / Înapoi la rezultate
- Conținut detalii (coloană principală) + (opțional) sidebar context

### Sections & Components
1. Navigare înapoi
   - Link/buton „Înapoi la rezultate” (focus vizibil; target mare).
2. Zona detalii
   - H1 titlu, metadate, conținut principal.
   - Loading: `DetailSkeleton` (header + paragrafe placeholder).
3. Accesibilitate
   - Headings ierarhice, link-uri descriptive, tabele/listări cu semantică.
   - Focus management: la intrare pe pagină focus pe H1 sau zona conținutului.

---

## Note generale de accesibilitate & cross-browser (design)
- Contrast AA pentru text și elemente interactive; verificare pe ambele teme.
- `:focus-visible` + fallback `:focus` pentru Safari.
- Evită hover-only interactions; toate acțiunile trebuie să funcționeze cu tastatura.
- Verifică sticky header + iOS Safari (scroll + address bar collapse