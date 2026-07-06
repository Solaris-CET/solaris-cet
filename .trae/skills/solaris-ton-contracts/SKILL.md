---
name: "solaris-ton-contracts"
description: "Implements and tests Tact contracts using blueprint, wrappers, and sandbox tests. Invoke when adding contracts, wrappers, or build/test pipeline."
---

# Solaris TON Contracts (Tact)

## Use When

- Adding new `.tact` contracts or updating existing ones.
- Creating wrappers under `contracts/wrappers/**`.
- Writing sandbox tests under `contracts/tests/**`.

## Rules (Repo-specific)

- Contracts must compile with `blueprint build --all`.
- Wrappers should re-export from `build/<Contract>/tact_<Contract>` using the repo’s import style.
- Keep `contracts/tsconfig.json` including `build/**/*.ts` so TS server resolves generated bindings.

## Verification

```bash
cd /root/solaris-cet/contracts
npm ci
npm test
npx tsc --noEmit
```

