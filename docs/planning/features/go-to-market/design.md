# Design — go-to-market epic

**Deliverable:** `docs/planning/GO-TO-MARKET-STRATEGY.md` (canonical, v3.3)  
**Supporting:** `scripts/deepseek-refine.mjs`, `scripts/loops-status.mjs`, `scripts/aider-run.mjs`

## Pass structure

| Pass | Focus | Loop 1 | Loop 2 | Loop 3 |
|---|---|---|---|---|
| **1 Foundation** | ICP, positioning, messaging | Personas + pain | Value props + proof | Competitive map |
| **2 Integration** | Channels, funnel, pricing | B2C+B2B synergy | Pricing tiers + packaging | Partner motion |
| **3 Execution** | 90/180/365d, KPIs, ops | Week-by-week plan | Budget + team | Risk + contingencies |

## Model routing (Loop 4)

| Step | Model |
|---|---|
| Draft structure | Grok Heavy |
| Market/competitive enrichment | DeepSeek V4 Pro (`npm run loops:refine`) |
| Premium narrative (pitch deck text) | Claude Sonnet 5 / Fable 5 gate |
| Code/tooling | DeepSeek via `aider-run.mjs` |

## VERIFY gates

- [x] GTM doc ≥ 9 sections per pass with measurable KPIs
- [x] `npm run loops:status` lists go-to-market epic
- [x] `run-e2e-batched.mjs` Windows path fixed
- [x] `deepseek-refine.mjs` degrades gracefully without API key