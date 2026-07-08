---
name: solaris-perfect-loops
description: SOLARIS CET master agent loops v3 — Ralph outer loop + 8 inner loops (0-7) + 12 domain loops + Fable 5 cost gate. Stash memory, self-sufficient verify, multi-model routing. Trigger: perfect loops, ralph, stash, fable 5, agent loop.
---

# SOLARIS CET — Perfect Loops v3 (Ralph × Stash × Fable 5)

**Master doc:** `docs/planning/SOLARIS-LOOPS-MASTER.md`  
**Agent Engineering Protocol (AEP):** `docs/planning/AGENT-ENGINEERING.md` — disciplina P0–P6 sub care rulează toate loop-urile (orice agent, orice model)  
**Handoff (recovery):** `docs/planning/HANDOFF.md` — când soluția nu merge după prima încercare  
**Philosophy:** Boil the ocean · Fresh context per task · Memory before motion · Verify in code.

Synthesized from: [Stash](https://github.com/Fergana-Labs/stash), [superpowers](https://github.com/obra/superpowers), [spec-kit](https://github.com/github/spec-kit), [ralphy](https://github.com/michaelshimeles/ralphy), [smart-ralph](https://github.com/tzachbon/smart-ralph), [claude-code](https://github.com/anthropics/claude-code), [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent).

---

## Outer Loop — Ralph (multi-day epics)

```bash
npm run loops:next                    # next unchecked task
npm run loops:status                  # all epics done/open
npm run improve:audit                 # 10k improvement registry
npm run improve:next -- P0            # next improvement item
npm run loops:refine -- <file> "…"    # DeepSeek doc refine (Loop 4)
npm run aider -- "…"                  # Aider surgical edits
npm run stash:prime -- <slug>         # Loop 0 for that feature
# … inner 0→7 …
npm run stash:sync                    # mark done in tasks.md
```

**Rules:** 1 task = fresh context · max 3 retries · state in `tasks.md` not chat.

Feature template: `docs/planning/features/_template/`

---

## Inner Loops 0–7 (every task, strict order)

| # | Loop | Command / action |
|---:|---|---|
| 0 | **Memory** | `npm run stash:prime -- <topic>` |
| 1 | **Research** | Read callers, `global.md`, `features/*/design.md` |
| 2 | **Build** | Surgical code + tests same pass |
| 3 | **Verify** | YOU run smoke/curl — never ask user |
| 4 | **Optimize** | Model routing table below |
| 5 | **Agent** | Subagent per role |
| 6 | **Feedback** | Same-session fix → `grok.md` |
| 7 | **Retro** | `stash:sync` + `agent-memory.md` if anti-pattern |

**Audit:** `npm run stash:verify`

**Checkpoint (mandatory):**
```
DONE / VERIFIED / LEFT / BLOCKED
```

---

## Fable 5 Gate (Claude premium text)

| Use Fable 5 | Never Fable 5 |
|---|---|
| Top-tier AHJ narrative | Bulk coding |
| Ambiguous research | Vision / photos |
| Enterprise client reports | Default path |
| ≤15–20% of reports | "Just in case" |

**Flow:** DeepSeek/Kimi extracts JSON → gate `premium_flag` → Fable writes text → log cost → Batch API if not urgent.

**Routine premium text:** Claude Sonnet 5 ($2/$10 intro).

---

## Model routing (Loop 4 + 5)

| Role | Model |
|---|---|
| Orchestrator, review, memory | Grok Heavy |
| Code, vision ≤6 photos | DeepSeek V4 Pro |
| Premium routine text | Claude Sonnet 5 |
| Top-tier + research | Claude Fable 5 |
| 10+ photos | Kimi |
| Implementation subagent | DeepSeek |
| Code review subagent | Grok or Sonnet 5 |

---

## Domain Loops (pick one per task)

| ID | Domain | Key verify |
|---|---|---|
| D1 | Field `/survey` | E2E `survey.spec.ts` |
| D2 | AI vision pipeline | pytest 62+ |
| D3 | PDF + AHJ + Fable | PDF sample + cost |
| D4 | CRM / webhooks | Vitest CRM |
| D5 | Frontend + SEO | `lighthouse:audit` |
| D6 | Deploy Coolify/Gitea | `survey:post-deploy` |
| D7 | PWA offline | draft sync Vitest |
| D8 | Batch SaaS | E2E batch tab |
| D9 | Security + cost | `audit:prod` |
| D10 | Enterprise 3D/twin | feature flag, no regress |
| D11 | Calculator→survey→offer | prefill Vitest |
| D12 | Multi-agent orchestra | Grok plans, DeepSeek builds |

Details: `SOLARIS-LOOPS-MASTER.md` § Domain Loops.

---

## 12 Stash rules (condensed)

Think first · Simplicity · Surgical · Goal-driven · Deterministic gates in code · Token budget · Surface conflicts · Read before write · Tests encode intent · Checkpoint · Match conventions · **Fail loud**

---

## Imprinted facts

```bash
npm run dev:local          # survey :8000 + API :3000 + Vite :5173
npm run survey:smoke
npm run verify:fast
npm run stash:prime -- <topic>
npm run stash:sync
npm run stash:verify
npm run loops:next
```

- **Gitea prod:** `Solaris-Cet/solaris-clean` (not GitHub `solaris-cet`)
- **Vite proxy:** `/api` → `:3000`
- **Windows:** `vite`/`tsc` not `../node_modules/.bin/*`

---

## Consulting Loops v4 (BCG / Sogeti / DOE — white papers)

**Master:** `docs/planning/CONSULTING-SOLUTIONS.md` · **Epic:** `features/soft-cost-platform/tasks.md`

| Loop | Source | When |
|---|---|---|
| **L-BCG-DRS** | Deploy → Reshape → Invent | Classify every epic before build |
| **L-FS-6** | BCG Field Service 6 factors | Any `/survey` or field feature |
| **L-OODA-ITE** | Sogeti OODA + Intent/Interpret/Execute | Agentic multi-step flows |
| **L-SUP-GATE** | BCG Henderson supervision | Before Fable 5 or permit/AHJ ship |
| **L-SOFT-ROI** | NREL/SEIA soft cost | End of release — log € saved |
| **L-AGILITY-70** | BCG 10/20/70 | 70% = UX/training/adoption, not models |

**L-FS-6 checklist:** 1 data layer · 2 edge UX · 3 adaptive feedback · 4 explainability · 5 agent safe · 6 API modular

---

## Activation

Triggers: `perfect loops`, `ralph`, `stash`, `fable 5`, `soft cost`, `consulting`, `field service`.

**Non-negotiable:** Loop 0 before · Loop 7 after · Loop 3 self-sufficient · **L-SUP-GATE** before premium permit text.