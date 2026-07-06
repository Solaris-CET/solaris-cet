# API Route Coverage Matrix

**Generated:** 2026-07-06 · **Total routes:** 207

| Coverage | Count | Notes |
|---|---:|---|
| Vitest integration | ~14 | `surveyRoutes.integration.test.ts` |
| E2E live/mock | ~13 | `survey.spec.ts`, `pwa-offline.spec.ts` |
| OpenAPI documented | 14+ | `/api/openapi/survey` |
| **Uncovered** | **~194** | See `npm run improve:next -- api` |

## Survey routes (priority P0)

| Route | Unit | E2E | Prod gate |
|---|---|---|---|
| `/api/survey/health` | ✓ | ✓ | ✗ prod 404 |
| `/api/survey/generate` | partial | mock | ✗ |
| `/api/survey/batch` | ✓ | ✓ | ✗ |
| `/api/survey/crm` | ✓ | ✓ | ✗ |
| `/api/survey/offline-manifest` | ✓ | ✓ | ✗ |

## Next

```bash
npm run improve:next -- "api/survey/generate"
```