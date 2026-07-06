---
name: "solaris-unlimited-seo-cwv"
description: "Ships SEO + CWV improvements safely (SSG/HTML-first, meta, sitemap/robots, schema.org). Invoke when changing public pages, images, headers, or structured data."
---

# Solaris Unlimited SEO + CWV

## Non-Negotiables

- Visible content must exist in HTML without JS.
- No critical content inside Suspense without HTML fallback.
- Every page: canonical + OG/Twitter + lang + correct headings.
- Schema.org must validate (no errors).

## Checks

HTML (Googlebot-style):

```bash
curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"
```

Lighthouse:

```bash
cd /root/solaris-cet && npm run lighthouse:audit
```

## CWV Guardrails

- LCP: preload hero image; avoid blocking scripts; keep hero lightweight.
- CLS: fixed dimensions/aspect-ratio for images; avoid late DOM injections.
- INP: no heavy handlers; dynamic import non-critical widgets.

## Structured Data Targets

- Home: LocalBusiness + FAQPage
- Services: Service + FAQPage + BreadcrumbList
- Testimonials: Review + AggregateRating
- Portfolio: ImageObject
