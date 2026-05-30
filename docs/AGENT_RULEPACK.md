# Agent Rulepack (high-signal)

Acesta este “rulepack-ul” compact care înlocuiește ideea de “5000 reguli”: e mai rapid, mai ușor de urmat și produce rezultate mai bune decât o listă gigantică.

## A) Security

- Nu loga secrete/PII; nu include env values în commit-uri.
- Secrete doar la runtime (Coolify Secrets/Environment), niciodată Build Args.
- `/api/**`: CORS + rate limit + validation + safe degrade.

## B) Build determinist (monorepo)

- Folosește scripts existente; nu dubla pipeline fără motiv.
- Target workspace explicit: `--workspace=app` vs `--workspace=api`.
- Nu lint-ezi output generat: `.next/`, `out/`, `.api-dist/`.

## C) SEO HTML-first

- Conținut vizibil prezent în HTML static, fără JS.
- Meta tags complete per pagină: title/description/canonical + OG/Twitter.
- Schema.org valid (LocalBusiness/Service/FAQ/Breadcrumb/Review/ImageObject).

## D) Performance (CWV)

- LCP: hero light + preload dacă există imagine critică.
- CLS: dimensiuni/aspect-ratio pe imagini; fără injectări târzii.
- INP: handler-e scurte; dynamic import pentru widget-uri grele.

## E) Verification gates (obligatorii)

```bash
cd /root/solaris-cet && npm run verify:fast
cd /root/solaris-cet && npm run verify:all
cd /root/solaris-cet && npm run lighthouse:audit
curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"
```
