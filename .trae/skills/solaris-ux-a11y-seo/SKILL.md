---
name: "solaris-ux-a11y-seo"
description: "Applies UX hierarchy, spacing, a11y, and SEO fixes aligned with this repo’s Vite/React patterns. Invoke when changing UI text/layout, images, or navigation."
---

# Solaris UX + A11y + SEO

## Use When

- Adding sections/components, CTAs, nav, or dense copy that needs hierarchy.
- Touching images, headings, contrast, keyboard focus, or aria labels.
- Shipping SEO basics (sitemap/robots/meta/alt, structured content).

## Rules (Repo-specific)

- No Next.js-only patterns (no `app/layout.tsx`, no Next middleware).
- Prefer Tailwind + existing tokens (`solar*` classes) over new global CSS.
- Prefer `AppImage` wrapper for `<img>` to keep defaults consistent.
- Keep a11y: semantic headings, `aria-label`, and keyboard reachability.

## Checklist

- Headings: one `<h1>` in Hero, section headings as `<h2>`.
- CTAs: at least one primary action and one secondary action in Hero.
- Images: `alt`, `width/height`, `loading="lazy"` unless critical.
- Contrast: avoid low-contrast text on glass surfaces.
- Focus: interactive elements visible focus state and correct `type="button"`.

## Quick Verifications

```bash
cd /root/solaris-cet/app
npm run verify
PW_WORKERS=1 npm run test:e2e
```

