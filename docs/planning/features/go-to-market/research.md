# Research — go-to-market

**Date:** 2026-07-06  
**Loop 0 sources:** `STRATEGIE_DIGITALA_VIBE_FOUNDER.md`, `CONSULTING-SOLUTIONS.md`, `global.md`, `PLAN_SOLARIS_CET_FINAL.md`

## Dual revenue engine

| Stream | ICP | Offer | Proof in product |
|---|---|---|---|
| **B2C** | Proprietari case/cabane RO, autonomie energetică | Kituri Solaris Go, calculator ROI, consultanță | `/calculator`, `/contact`, Instagram funnel |
| **B2B** | Instalatori PV 3–50 tehnicieni, EPC-uri locale | Survey AI șantier, PDF permit-ready, CRM, twin | `/survey`, API keys, offline PWA, batch |

## Market timing (hard data)

- Soft costs = până la **65%** din cost residential PV (SEIA/Aurora)
- România = **greenfield** pentru standardizare soft costs (MIT export gap)
- BCG Field Service 2025: **+10–15% productivitate** cu AI field tools
- Competitori indirecti: Aurora (design remote), SiteCapture (documentare) — diferențiator SOLARIS = **șantier real + offline + AHJ RO**

## GTM constraint

- Prod API `solaris-cet.com/api/survey/*` → **404** până Coolify redeploy (BLOCKED Hetzner ticket)
- B2B pitch trebuie **demo self-host** sau staging până prod live

## Rule of 3 methodology (this epic)

```
Pass 1 (Foundation)  → Loop×3 improve → v1.3
Pass 2 (Integration) → Loop×3 improve → v2.3
Pass 3 (Execution)   → Loop×3 improve → v3.3 FINAL
```

Each loop cycle: **Memory → Research delta → Build doc → Verify checklist → Retro**