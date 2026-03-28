---
paths:
  - "app/**/*.{ts,tsx}"
---

# Frontend (`app/`)

- Prefer **functional components** and hooks; align with existing **React 19** + **Vite** patterns.
- **Styling**: Tailwind v4 conventions already in the project; reuse `cn()` / design tokens from the codebase before adding one-off classes.
- **Quality**: before finishing a change, run `npm run lint` and `npm run typecheck` from `app/` when you touched TypeScript.
- **Tests**: Vitest for units; Playwright for E2E — follow existing specs under `app/`.
- **Scope**: avoid drive-by refactors outside the files needed for the task.
