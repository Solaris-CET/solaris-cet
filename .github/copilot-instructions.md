# Copilot Instructions — Solaris CET

## Project Overview

**Solaris CET** is a decentralized token project on the TON blockchain. This repository contains the official landing page: a static web application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **GSAP** animations, deployed automatically to **GitHub Pages** via GitHub Actions.

- Token supply: 9,000 CET on TON blockchain
- DeDust pool address: `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`
- IPFS whitepaper CID: `bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a`

---

## Repository Structure

```
solaris-cet/
├── .github/
│   ├── workflows/deploy-pages.yml   # CI/CD: build + deploy to GitHub Pages
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
npx tsc --noEmit     # TypeScript type-check without emitting files
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

Before opening a PR, verify:

1. `npm run build` passes without errors (run from `app/`)
2. `npm run lint` passes without errors (run from `app/`)
3. The PR description follows the `.github/PULL_REQUEST_TEMPLATE.md` checklist

---

## Deployment

- The GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) builds the app from `app/` and uploads `app/dist` as the GitHub Pages artifact.
- The Vite config uses `base: './'` for correct relative asset paths on GitHub Pages.
- Every push to `main` triggers an automatic deployment.
