# Copilot Instructions — Solaris CET

## Project Overview

**Solaris CET** is a decentralized RWA token project on the TON blockchain. This repository contains the official landing page: **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **GSAP**. **Production:** [https://solaris-cet.com](https://solaris-cet.com) via **Coolify** on the project VPS (pushes to `main`); optional **GitHub Pages** mirrors use `.github/workflows/deploy-pages.yml`.

- Token supply: 9,000 CET on TON blockchain
- DeDust pool address: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`
- IPFS whitepaper CID: `bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a`

---

## Repository Structure

```
solaris-cet/
├── .github/
│   ├── workflows/deploy-pages.yml   # Optional: build + deploy to GitHub Pages (forks)
│   ├── ISSUE_TEMPLATE/              # Bug report and feature request forms
│   ├── PULL_REQUEST_TEMPLATE.md     # PR checklist template
│   └── copilot-instructions.md      # This file
├── app/                             # ← ALL source code lives here
│   ├── src/
│   │   ├── sections/                # Page sections (HeroSection, TokenomicsSection, …)
│   │   ├── components/              # Reusable UI components
│   │   │   └── ui/                  # shadcn/ui primitives
│   │   ├── App.tsx                  # Root component; GSAP plugin registration
│   │   ├── main.tsx                 # Entry point
│   │   ├── index.css                # Global styles
│   │   └── App.css                  # App-level styles
│   ├── public/                      # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Development Commands

**All commands must be run from the `app/` subdirectory**, not the repository root.

```bash
cd app

npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build → app/dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run typecheck    # TypeScript (app + vite/api configs), same as CI
```

---

## Coding Conventions

### GSAP (critical)

- **Register GSAP plugins exactly once**, in `app/src/App.tsx`, at module level:
  ```ts
  gsap.registerPlugin(ScrollTrigger);
  ```
- **Never** call `gsap.registerPlugin(...)` inside section files under `app/src/sections/` or any other component.

### TypeScript

- TypeScript is configured in **strict mode** with `noUnusedLocals` and `noUnusedParameters` enabled.
- Use explicit types; avoid `any`.
- Use `interface` for object shapes; use `type` for unions and intersections.
- All React component props must be typed.

### React

- Use **functional components** with hooks only — no class components.
- Follow the section architecture: each page section is a separate file in `app/src/sections/`.
- Reusable UI primitives belong in `app/src/components/ui/` (shadcn/ui pattern).

### CSS / Styling

- Prefer **Tailwind CSS utility classes** over inline styles or custom CSS.
- Global styles → `app/src/index.css`
- App-level styles → `app/src/App.css`
- Do not add component-scoped CSS files.

### Git

Use **Conventional Commits** for all commit messages:

```
<type>(<scope>): <short description>
```

Accepted types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

Branch naming: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.

---

## Pull Requests

Before opening a PR, verify (from `app/`):

1. `npm run verify` passes (lint, typecheck, Vitest, production build) — same surface as local quality gate before CI
2. For UI, navigation, or CET AI widget changes, also run `npm run test:e2e` or `npm run verify:full` (Playwright + preview)
3. The PR description follows the `.github/PULL_REQUEST_TEMPLATE.md` checklist

---

## Deployment

- **Coolify (production):** build `app/` → `app/dist`; deploy to VPS; domain **solaris-cet.com**.
- **GitHub Pages (optional):** `.github/workflows/deploy-pages.yml` uploads `app/dist` as a Pages artifact for forks.
- The Vite config uses `base: './'` for correct relative asset paths on static hosts.
