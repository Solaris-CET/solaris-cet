# BUGS-FIXED.md

## Fix-uri livrate (2026-04-16)

- Deploy Coolify: `npm ci` eșua din cauza lockfile drift (workspaces) → lockfile sincronizat și PR merged în `main`.
- i18n: blocuri UI lipsă în `Translations` (rwa/eco/ui) → tipuri + fallback-uri adăugate, `verify:all` ok.
- Rute: `/rwa` + `/cet-ai` suportate ca “direct load” (SPA fallback) + route-level pages.
- Nav: linkurile primare duc la `/rwa` și `/cet-ai` + păstrează `?lang=`.
- SEO: sitemap include `/rwa` și `/cet-ai`.
- VS Code/TS: editorul folosește TypeScript din workspace (reduce false-positive “Cannot find module”).
