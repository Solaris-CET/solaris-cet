# pnpm (corepack)

Repo-ul este compatibil cu npm workspaces, dar este pregătit pentru `pnpm` ca manager implicit (via `packageManager`).

## Setup

```bash
corepack enable
pnpm -v
pnpm install
```

## Constrângeri

- `package.json` definește `packageManager` și `engines.pnpm` pentru a evita versiuni vechi.

