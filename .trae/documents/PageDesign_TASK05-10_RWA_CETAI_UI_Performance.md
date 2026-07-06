# Specificație design pagini (desktop-first)

## Global Styles (aplicabil peste tot)
### Design tokens (color system unificat)
- Brand:
  - `--brand-600` (primary), `--brand-700` (hover), `--brand-100` (tint)
- Neutrals:
  - `--neutral-0` (background), `--neutral-50/100` (surfaces), `--neutral-700/900` (text)
- Semantic:
  - `--success-600`, `--warning-600`, `--danger-600`, `--info-600`
- Status RWA (map + chips): mapare din `status` → semantic color (ex.: active=success, planned=info, risk=warning)

### Tipografie (sistem tipografic coerent)
- Font stack: brand/sans pentru UI; fallback sistem.
- Scală (desktop):
  - H1 40/48, H2 32/40, H3 24/32, H4 20/28
  - Body 16/24, Small 14/20, Caption 12/16
- Reguli:
  - Heading-uri cu tracking ușor negativ; body cu contrast ridicat; max-width text 68–78ch pentru lectură.

### Componente comune
- Butoane: Primary/Secondary/Ghost; stări hover/active/disabled; focus ring vizibil (`2px` cu `--brand-600`).
- Link-uri: underline la hover, contrast AA minim.
- Carduri: border subtil + shadow mic; padding 16–20; radius 12.
- Skeleton: shimmer subtil; înlocuiește layout-ul final 1:1 (nu „sare” conținutul).

### Responsive (desktop-first)
- Desktop (≥1200px): grid 12 coloane, max-width container 1200–1280.
- Tablet (768–1199): grid 8 coloane; sidebar devine drawer.
- Mobile (<768): stack vertical; harta devine modul full-width cu panel bottom-sheet.

---

## Pagina: Acasă

### Layout
- Hybrid: CSS Grid pentru structură (hero + secțiuni), Flexbox în componente (CTA row, chips, footer columns).
- Spacing: secțiuni la 64–96px vertical; padding container 24–32px.

### Meta Information
- Title: „CET — RWA & CET AI”
- Description: „Explorează proiecte RWA pe hartă și interacționează cu CET AI.”
- Open Graph: `og:title`, `og:description`, `og:type=website`.

### Page Structure
1. Header / Nav
2. Hero (headline + CTA către RWA)
3. CET AI Preview (mockup + quick prompts)
4. RWA Teaser (rezumat + CTA)
5. Footer (trust signals + lead capture)

### Sections & Components
#### 1) Header / Nav
- Bară top cu logo stânga, link-uri (Acasă, RWA) dreapta.
- CTA secundar opțional (ex.: „Explorează RWA”).

#### 2) Hero
- H1 + subheadline; un CTA principal către `/rwa`.
- Fundal: gradient subtil din `--brand-100` → `--neutral-0`.

#### 3) CET AI Preview (UI upgrade)
- Card „chat mockup”:
  - Header mic: „CET AI” + status (ex.: „preview”).
  - Fereastră conversație: 2–3 mesaje exemplu.
  - Efect typing: răspunsul demo se „scrie” incremental (cu cursor vizual discret).
  - Input bar mock: câmp text + buton send (disabled în demo sau declanșează aceeași animație).
- Quick prompts:
  - 3–6 chips/butoane sub mockup.
  - Click: pre-populează inputul și pornește răspuns demo aferent.
- Stări:
  - Loading skeleton pentru zona de răspuns când se pornește typing.
  - Accessibility: reduce motion respectă preferința (fără typing animat, afișare instant).

#### 4) RWA Teaser
- Grid 2 coloane:
  - Stânga: text + bullets (hartă, documente, timeline).
  - Dreapta: preview mini (imagine hartă / carduri proiecte) cu skeleton la încărcare.

#### 5) Footer: trust signals + lead capture
- Layout 3 coloane (desktop):
  - Col 1: brand + descriere scurtă.
  - Col 2: trust signals (insigne + link-uri).
  - Col 3: lead capture.
- Lead capture form:
  - Câmp email (required), nume (optional), checkbox/linie de consimțământ (dacă e necesar în copy).
  - Confirmare inline (success) + eroare validare.
- No-JS fallback:
  - `<noscript>`: afișează un link `mailto:` sau un link către un formular simplu extern/static (dacă există) + mesaj clar.

---

## Pagina: RWA

### Layout
- Desktop: layout 2 coloane (CSS Grid 12 col):
  - Col stânga (7–8): Hartă.
  - Col dreapta (4–5): Sidebar sticky cu filtre + listă + detalii proiect.
- Interacțiune: selectarea markerului actualizează sidebar; selectarea din listă centrează harta.

### Meta Information
- Title: „RWA — Hartă, Documente, Timeline”
- Description: „Explorează proiecte RWA pe hartă, consultă documente și urmărește timeline-ul.”
- Open Graph: `og:title`, `og:description`, `og:type=website`.

### Page Structure
1. Header / Breadcrumbs
2. Control bar (filtre + search simplu dacă există)
3. Main split: Hartă + Sidebar
4. Footer

### Sections & Components
#### 1) Header / Breadcrumbs
- Titlu pagină + scurtă descriere.
- Breadcrumb simplu: Acasă / RWA.

#### 2) Control bar
- Filtre minimale (chips/dropdown): status, regiune, tip.
- Indicator „N rezultate”.

#### 3) Hartă interactivă
- Container map cu height fix (desktop: 640–720px) + radius 16.
- Markere:
  - Culori după status (din token-urile semantice).
  - Cluster la zoom-out (dacă densitatea o cere).
- Skeleton:
  - Placeholder cu grilă + shimmer până la încărcarea datelor.
- Error state:
  - Mesaj + buton „Reîncearcă”.

#### 4) Sidebar (sticky)
- Secțiuni în tabs sau stacked (în funcție de conținut):
  - „Proiecte” (listă)
  - „Detalii” (panel proiect selectat)
- Listă proiecte:
  - Card compact: titlu, status chip, regiune, 1 linie rezumat.
- Panel detalii proiect:
  - Titlu + status + meta (locație).
  - KPI-uri (doar dacă există în date).
  - Documente (carduri): tip, dată, buton View/Download.
  - Timeline (vertical): puncte cu dată, titlu, status; highlight pentru milestone curent.

#### 5) No-JS fallback (obligatoriu)
- În `<noscript>`: afișează o pagină „statică” în HTML:
  - listă proiecte (titlu + rezumat + coordonate/locație textuală)
  - listă documente (link-uri directe)
  - timeline (listă ordonată cronologic)
- Mesaj clar: „Pentru hartă interactivă, activează JavaScript.”

#### 6) Performanță
- Loading:
  - Skeleton pentru listă și panel; lazy-load pentru documente (sub fold).
- Code-splitting:
  - Încarcă Leaflet doar pe `/rwa`.
- Imagini:
  - Thumbnails cu `loading="lazy"`.

---

## Note UI (consistență)
- Toate paginile folosesc aceeași scală tipografică și token-uri de culoare.
- Trust signals și status chips folosesc semantic colors (nu nuanțe arbitrare).
- Efectele de animație sunt discrete și respectă `prefers-reduced-motion`.
