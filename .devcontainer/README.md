# Dev container

This folder defines a **VS Code Dev Containers** / **GitHub Codespaces** environment aligned with [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): Node **22**, `npm ci` in `app/`, and Chromium for Playwright.

## What runs on create

1. `npm ci` in `app/` (reproducible install from `app/package-lock.json`).
2. `npx playwright install --with-deps chromium` so E2E tests can run locally.

First build can take several minutes while Playwright downloads the browser.

## Typical commands (inside the container)

```bash
cd app
npm run dev      # Vite — port 5173
npm run lint
npm run test
npm run build
npm run verify        # lint + typecheck + test + build (pre-push gate)
npm run test:e2e      # Playwright (`pretest:e2e` ensures dist/; preview on 4173 via playwright.config)
npm run verify:full   # verify + E2E
```

Preview (`vite preview`) uses port **4173** by default; both **5173** and **4173** are forwarded with labels in `devcontainer.json`.

## Optional: GitHub CLI

The `github-cli` feature is included; authenticate with `gh auth login` when you need it.
