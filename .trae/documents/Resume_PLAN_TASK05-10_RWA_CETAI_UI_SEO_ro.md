# Resume plan (TASK 05–10) — RWA + CET AI + UI/SEO/Performance

## 1) Context (de unde reiei)
În workspace există deja documentația completă pentru TASK 05–10:
- PRD: `PRD_TASK05-10_RWA_CETAI_UI_SEO.md`
- Arhitectură: `TECH_TASK05-10_RWA_CETAI_UI_SEO.md`
- Design pagini: `PAGE_DESIGN_TASK05-10_RWA_CETAI_UI_SEO.md`

Mai jos este planul de execuție „resume” (următorii pași logici), în ordinea recomandată pentru implementare și verificare.

## 2) Plan de execuție (resume) — pași concreți

### TASK 05 — Sistem vizual unitar (UI)
1. Definești token-urile (culori/typografie/spacing/radius/shadows) și le consumi în componentele de bază: Header, Button, Link, Card, Chip/Badge, Input, Modal/Drawer, Accordion.
2. Aplici stările interactive obligatorii: hover, focus-visible (focus ring), disabled.
3. Blochezi regresiile de stil: verifici că există un singur H1/pagină și că spacing-ul e consistent pe secțiuni.

**Output așteptat:** UI coerent pe `/`, `/rwa`, `/cet-ai`, fără stiluri „ad-hoc”.

### TASK 06 — RWA (hartă + timeline + documente)
1. Construiești pagina `/rwa` cu structura: Summary → Hartă → Timeline → Documente → Media.
2. Integrezi harta (încărcată doar pe `/rwa`): pan/zoom, selectare marker/zonă, detalii în drawer/panel, filtre minime + reset.
3. Timeline: expand/collapse, deep-link (#ancore), evidențiere „astăzi”.
4. Documente: listare + căutare simplă, preview când se poate, download, „last updated”.
5. Adaugi fallback fără JS (bloc `<noscript>` cu listă proiecte/documente/timeline + mesaj clar).

**Output așteptat:** `/rwa` rămâne utilă și fără JS; cu JS oferă explorare completă.

### TASK 07 — CET AI (endpoint securizat + UI demo)
1. Construiești UI-ul `/cet-ai`: input (textarea), quick prompts, panel rezultat (format RAV), acțiuni: Stop/Abort, Retry, Reset, Copy.
2. Integrezi exclusiv `POST /api/chat` (fără chei în frontend), cu stări: idle/loading/success/error.
3. În backend: validare input, normalizare conversation (max 24), timeout/abort, fallback dacă un provider e indisponibil.
4. Integrezi context on-chain (DeDust) cu timeout și degradare controlată (mesaj, fără crash).

**Output așteptat:** demo utilizabil end-to-end, cu erori tratate corect.

### TASK 08 — Rate limit, robustețe, privacy
1. Tratezi `429` în UI: mesaj explicit + buton „Încearcă din nou” (opțional countdown).
2. Adaugi privacy notice vizibil pe `/cet-ai`: „Nu introduce date personale; conversația nu este salvată server-side.”
3. Verifici că toate erorile (network/5xx/config lipsă) au mesaje clare + retry.

### TASK 09 — SEO (on-page)
1. Setezi per pagină: `title`, `description`, Open Graph, canonical.
2. Verifici ierarhia headings (H1 unic), alt text pe imagini, internal linking între `/`, `/rwa`, `/cet-ai`.

### TASK 10 — Performanță (percepută + încărcare)
1. Code-splitting pe rute; librăria de hartă se încarcă doar pe `/rwa`.
2. Lazy-load imagini sub fold + placeholder (blur/skeleton/inline SVG).
3. Skeleton pentru conținut asincron (fără layout shift).
4. Respecți `prefers-reduced-motion` pentru parallax/typing.

## 3) Definition of Done (DoD) — checklist final
- Cerințele și criteriile din PRD (secțiunea „Criterii de acceptanță”) sunt îndeplinite.
- `/rwa` funcționează cu și fără JS (fallback util).
- `/cet-ai` nu expune chei; folosește doar `/api/chat`.
- SEO minim: title/description/OG/canonical + H1 unic + `alt`.
- Performanță: harta nu încarcă pe homepage; imaginile sub fold sunt lazy.

## 4) Comenzi recomandate înainte de commit (repo checks)
```bash
cd /root/solaris-cet
cd app && npm run verify && PW_WORKERS=1 npm run test:e2e
cd ../contracts && npm test && npx tsc --noEmit
```

## 5) Comenzi pentru finalizarea batch-ului (manual)
```bash
cd /root/solaris-cet
git status
git diff --stat
git add -A
git diff --staged --stat
git commit -m "feat: task05-10 ui rwa cet-ai seo perf"
git push
```
