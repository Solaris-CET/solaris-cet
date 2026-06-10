# Handoff Deploy Live Solaris CET

## Situație confirmată public

Verificarea directă pe `https://solaris-cet.com` a arătat că domeniul public încă servește un build mai vechi decât codul local:

- homepage live încă afișează:
  - `0+ proiecte finalizate`
  - `0 ani pe piață`
  - `0% garanție lucrări`
- homepage live încă include blocul vechi cu termeni din alt proiect (`Wallet connected`, `CET balance`, `staking`)
- `https://solaris-cet.com/calculator/` încă servește un shell vechi cu textul:
  - `Calculatorul complet este disponibil în aplicație.`
- `https://solaris-cet.com/servicii/` și `https://solaris-cet.com/blog/` încă servesc pagini statice foarte subțiri

## Concluzie

Codul și fișierele locale sunt pregătite pentru remediere, dar domeniul public nu reflectă încă această versiune deoarece nu există acces direct, din agent, la infrastructura de deploy / publish live.

## Fișiere critice gata de deploy

### React / aplicație

- `app/src/sections/TrustSignalsStrip.tsx`
- `app/src/components/HierarchyGraph.tsx`
- `app/src/i18n/translations.ts`
- `app/src/sections/SolarIntelligenceSection.tsx`
- `app/src/sections/SolarCompetitionSection.tsx`
- `app/src/pages_legacy/SolarCalculatorPage.tsx`
- `app/src/pages_legacy/ServicesPage.tsx`
- `app/src/pages_legacy/ArticlePage.tsx`
- `app/src/pages_legacy/ArticlesPage.tsx`
- `app/src/pages_legacy/AboutPage.tsx`
- `app/src/pages_legacy/ProjectsPage.tsx`
- `app/src/pages_legacy/ServiceDetailPage.tsx`
- `app/src/lib/serviceDetails.ts`
- `app/src/components/company/SolarisFooter.tsx`
- `app/src/pages_legacy/ThankYouPage.tsx`

### Static / fallback public

- `app/public/calculator/index.html`
- `app/public/servicii/index.html`
- `app/public/blog/index.html`
- `app/public/portofoliu/index.html`

### Generator static SEO

- `app/scripts/generate-seo-files.mjs`

## Ce se obține imediat după deploy

- homepage fără zero-uri false și fără blocuri crypto / wallet / staking
- calculator util direct în browser
- servicii și blog cu conținut comercial real în fallback/static
- portofoliu unificat logic spre `Proiecte`
- limbaj și CTA-uri mai coerente

## Verificare minimă după deploy

1. `https://solaris-cet.com/`
   - nu mai apar `0+`, `0 ani`, `0%`
   - nu mai apar `Wallet connected`, `CET balance`, `staking`
2. `https://solaris-cet.com/calculator/`
   - se vede formularul cu inputuri și rezultate, nu text despre aplicație
3. `https://solaris-cet.com/servicii/`
   - se văd carduri reale de servicii și CTA-uri utile
4. `https://solaris-cet.com/blog/`
   - se văd preview-uri reale spre articole

## Comenzi recomandate înainte de publicare

```bash
cd /root/solaris-cet && npm run verify:fast
cd /root/solaris-cet && npm run verify:all
cd /root/solaris-cet/app && node scripts/generate-seo-files.mjs
```

## Observație importantă

Fără acces la Coolify / Vercel / Netlify / hostingul care servește `solaris-cet.com`, agentul nu poate publica direct domeniul live. Poate doar pregăti exact fișierele finale și valida local că trec gate-urile repo.
