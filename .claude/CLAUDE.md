# Solaris CET — project context

Concise instructions for this repository. The main application lives in **`app/`** (Vite, React, TypeScript). CI is defined in `.github/workflows/ci.yml` (Node 22, `npm ci` in `app/`).

**Production:** [https://solaris-cet.com](https://solaris-cet.com) — **Coolify** on the project VPS, branch **`main`**. Repo: [Solaris-CET/solaris-cet](https://github.com/Solaris-CET/solaris-cet).

## Commands (from repository root)

```bash
cd app
npm ci              # install (matches CI)
npm run dev         # Vite — port 5173
npm run lint
npm run typecheck
npm run test        # Vitest
npm run build
npm run verify      # lint + typecheck + test + build
npm run test:e2e    # Playwright (same as CI; browsers — see .devcontainer)
npm run verify:full # verify + E2E
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
