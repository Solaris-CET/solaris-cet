# Improvement Registry Summary

**Generated:** 2026-07-06  
**Total items:** 10000  
**Registry:** `registry.jsonl`

## Rule of 3 workflow

| Pass | Action | Command |
|---:|---|---|
| 1 | Discover | `npm run improve:audit` |
| 2 | Prioritize + fix batch | `npm run improve:next` × N |
| 3 | Verify + mark done | `npm run improve:verify` |

## By category

- **frontend:** 4095
- **tsc-cleanup:** 3334
- **api:** 1656
- **survey-engine:** 380
- **tooling:** 330
- **e2e:** 110
- **gtm:** 65
- **ops:** 30

## By priority

- **P1:** 1027
- **P2:** 7534
- **P3:** 1439

## Next

```bash
npm run improve:status
npm run improve:next -- P0
```
