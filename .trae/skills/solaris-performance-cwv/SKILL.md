---
name: "solaris-performance-cwv"
description: "Optimizes Core Web Vitals (LCP/CLS/INP) and bundle size for this Vite/React site. Invoke when adding heavy libs, animations, or new media."
---

# Solaris Performance (CWV)

## Use When

- Adding libraries that may inflate bundles (charts, renderers, mermaid).
- Adding animations/WebGL/scroll pinning or large images.
- Fixing slow loads, CLS, jank, or hydration-like flicker.

## Repo Rules

- Prefer dynamic imports for heavy features.
- Respect `prefers-reduced-motion`.
- Avoid unnecessary re-renders in pinned sections.

## Quick Checks

```bash
cd /root/solaris-cet/app
npm run build
npm run preview
```

CI:

- Lighthouse CI runs in `.github/workflows/lighthouse-ci.yml`.

