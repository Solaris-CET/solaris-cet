# Solaris CET — TON contracts

Blueprint + Tact sources for the **MultiSig Wrapper** and related tooling.

## Prerequisites

- **Node.js ≥ 22** (aligned with repo CI)
- Dependencies: from repo root run `npm ci` (single lockfile at root)

## Commands

| Script | Description |
|--------|-------------|
| `npm run build` | Compile via [Blueprint](https://github.com/ton-org/blueprint) (`blueprint build`) |
| `npm run typecheck` | `blueprint build MultiSigWrapper` then `tsc --noEmit` (generates `build/` for wrappers) |
| `npm test` | Jest (`pretest` builds the contract first — for local runs) |
| `npm run test:ci` | Jest with `--ci --forceExit` after a separate build (used in CI) |
| `npm run deploy` | Run `scripts/deployMultiSigWrapper.ts` (requires network / wallet config) |

## Layout

| Path | Role |
|------|------|
| `contracts/MultiSigWrapper.tact` | Tact contract source |
| `wrappers/` | TypeScript wrappers + compile entry |
| `scripts/deployMultiSigWrapper.ts` | Deployment script |
| `tests/` | Jest specs |

CET Jetton Master reference (mainnet) is documented in the Tact header and across `app/`; this package focuses on the multisig wrapper workflow.
