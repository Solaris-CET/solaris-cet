# Solaris CET — project context

Concise instructions for this repository. The main application lives in **`app/`** (Vite, React, TypeScript). CI is defined in `.github/workflows/ci.yml` (Node 22, `npm ci` in `app/`).

## Commands (from repository root)

```bash
cd app
npm ci              # install (matches CI)
npm run dev         # Vite — port 5173
npm run lint
npx tsc --noEmit
npm run test        # Vitest
npx playwright test # E2E (requires browsers; see .devcontainer)
npm run build
```

## Layout

| Path | Purpose |
|------|---------|
| `app/` | Frontend app, tests, Playwright |
| `contracts/` | Contract tooling (see package.json there) |
| `scripts/` | Auxiliary Node scripts |
| `.devcontainer/` | Dev container for VS Code / Codespaces |
| `.claude/skills/` | Optional cognitive-style agent modules |

## Cognitive modules (optional)

Skills under `.claude/skills/` describe metacognition, active inference, tree search, and memory patterns. To load them in one go, run the **`/prime`** command or open `.claude/commands/prime.md`.
