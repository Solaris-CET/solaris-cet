# Status implementare (TASK 05–10) + verificări curente

Acest document completează PRD/Tech/Page Design pentru TASK 05–10 cu **ce există efectiv în repo** și cu **verificările actuale**.

## 1) Rezumat rapid (ce este implementat acum)
- **Rute SPA (Vite/React)**: `/` (home), `/rwa`, `/cet-ai`, `/mining`, `/demo`, `/accessibility` + rute interne `/login`, `/app`, `/admin`.
- **RWA**: hartă interactivă (pan/zoom + select marker), panel proiect, timeline cu deep-link, documente cu căutare/filtru.
- **CET AI UI**: widget pe pagină + dialog fullscreen, conversație multi-turn (ultimele 24 mesaje), Stop/Abort, Regenerate, copy, surse.
- **Endpoint AI securizat**: `POST /api/chat` (edge) cu CORS + rate limit (Upstash opțional), context live DeDust (best-effort), fallback între provider-e (Grok/Gemini).
- **SEO & assets**: `robots.txt`, `sitemap.xml`, JSON-LD în `index.html`, SEO dinamic (SPA) prin `applySpaSeo`.
- **Performanță**: code-splitting (React.lazy), compresie Brotli la build, PWA (Workbox runtime caching), respectare `prefers-reduced-motion`.

## 2) Status pe TASK-uri (05–10)
| TASK | Status | Ce s-a implementat (pe scurt) | Gap-uri / note relevante |
|------|--------|-------------------------------|--------------------------|
| 05 — Sistem vizual unitar (UI) | ✅ Implementat | Design tokens/culori în clase `text-solaris-*`, `bg-*`, componente UI (Sheet/Dialog), focus vizibil și stări hover/disabled în controale cheie. | Documentele de design pot avea exemple nealiniate (ex. Blog/Legal) — vezi TASK09 note. |
| 06 — RWA (hartă + timeline + documente) | ✅ Implementat | `/rwa` cu `RwaPortfolioMap`, `RwaTimelinePanel`, `RwaDocumentsPanel` + dataset local `rwaPortfolio.ts`. Timeline are deep-link `#milestone-*`. | „Fallback fără JS per /rwa” nu e posibil într-un SPA pur; există fallback global în `<noscript>` (trimite către `/sovereign/`). |
| 07 — CET AI (endpoint securizat + UI demo) | ✅ Implementat | UI folosește doar `POST /api/chat`. Are stări loading/success/error, stop/cancel (AbortController), retry/regenerate, copy, transcript. | Modul „offline/local knowledge” este intenționat (fallback) când endpoint-ul nu răspunde sau nu e configurat. |
| 08 — Rate limit, robustețe, privacy | ✅ Implementat | Rate limit IP-based (Upstash) în handler, preflight `OPTIONS`, mesaje explicite în UI când live API cade/returnează `429`. Privacy notice vizibil în `/cet-ai`. | Dacă Upstash nu e configurat, rate limit poate fi inactiv (comportament acceptat). |
| 09 — SEO (on-page) | ◑ Parțial | `robots.txt` + `sitemap.xml`, canonical + OG/Twitter + JSON-LD în `index.html`. `applySpaSeo` schimbă title/description/OG/Twitter/canonical per rută și pune `noindex` pe rute necunoscute. | `hreflang` în `applySpaSeo` cere link-uri `#hreflang-*` care nu există în `index.html` (deci nu se setează). `sitemap.xml` nu include rute locale (`/ro/*`, `/en/*` etc.). |
| 10 — Performanță | ✅ Implementat | React.lazy pe pagini/sectoare, PWA caching (assets + navigations + DeDust), Brotli build, workbox ignore pentru bundle-uri grele, reduce-motion pentru intro/parallax. | Optimizările sunt orientate „shipping-ready”; revizuiește periodic dimensiunea chunk-urilor (mai ales deps 3D/mermaid dacă sunt activate). |

## 3) Fișiere cheie (surse de adevăr)
- Rute + SEO dinamic: `app/src/App.tsx`, `app/src/lib/spaSeo.ts`
- RWA: `app/src/pages/RwaPage.tsx`, `app/src/sections/RwaSection.tsx`, `app/src/components/rwa/*`, `app/src/lib/rwaPortfolio.ts`
- CET AI UI: `app/src/pages/CetAiPage.tsx`, `app/src/components/CetAiSearch.tsx`
- Endpoint AI: `app/api/chat/route.ts` (canonical) + `api/chat/route.ts` (variantă standalone)
- SEO assets: `app/public/sitemap.xml`, `app/public/robots.txt`, `app/index.html`
- Perf/PWA: `app/vite.config.ts`

## 4) Verificări curente (repo checks)
Recomand să rulezi întâi rapid, apoi complet (include E2E stabil):

```bash
cd /root/solaris-cet
npm run verify:fast
npm run verify:all
```

## 5) Note de configurare (pentru live CET AI)
- Pentru `POST /api/chat` (live): setează **cel puțin una** dintre chei:
  - `GROK_API_KEY` sau `GROK_API_KEY_ENC`
  - `GEMINI_API_KEY` sau `GEMINI_API_KEY_ENC`
- Pentru chei criptate: setează `ENCRYPTION_SECRET` (AES-256-GCM).
- Pentru rate limit: configurează variabilele Upstash folosite