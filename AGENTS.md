# SOLARIS CET — Agent instructions

You are working on **SOLARIS CET** (https://solaris-cet.com) — a solar field-survey and CRM platform.
Operate like a principal engineer: plan briefly, make surgical changes, and **verify everything yourself in code** — never ask the user to test for you.

## Repository map

| Path | Purpose |
|------|---------|
| `app/` | Main frontend + API (Vite, React, TypeScript, Vitest, Playwright) |
| `survey-engine/` | Python AI vision/survey pipeline (pytest; Kimi/DeepSeek API clients in `src/api_clients/`) |
| `contracts/` | Contract tooling (own package.json) |
| `scripts/` | Auxiliary Node scripts (loops/stash/deploy tooling) |
| `docs/planning/` | Source of truth for strategy: `SOLARIS-LOOPS-MASTER.md`, `HANDOFF.md`, `global.md`, `features/*/` |
| `.agents/skills/` | Project skills you can invoke (verify, loops, review, **graphify**) |
| `graphify-out/` | **Codebase knowledge graph** — `graph.json`, `GRAPH_REPORT.md`, `wiki/` (query before grep) |

## Production & git

- **Deploy:** Coolify on the project VPS, branch `main`.
- **Production remote is Gitea:** `gitea.com/Solaris-Cet/solaris-clean` (NOT the GitHub mirror `Solaris-CET/solaris-cet`).
- CI: `.github/workflows/ci.yml` — Node 22, `npm ci` inside `app/`.
- Never commit or push unless explicitly asked.

## Commands

From `app/` (main app):

```bash
npm ci                # install (matches CI)
npm run dev           # Vite on :5173 (proxy /api → :3000)
npm run lint
npm run typecheck
npm run test          # Vitest
npm run build
npm run verify        # lint + typecheck + test + build  ← definition of done
npm run test:e2e:stable  # Playwright, CI-aligned single worker
npm run verify:full   # verify + stable E2E
```

From repository root (orchestration):

```bash
npm run dev:local     # survey-engine :8000 + API :3000 + Vite :5173
npm run verify:fast   # quick cross-package gate
npm run survey:smoke  # survey-engine smoke test
npm run loops:next    # next unchecked task from tasks.md
npm run loops:status  # epic progress
npm run improve:next -- P0   # next improvement item from the 10k registry
npm run stash:prime -- <topic>  # load memory/context for a feature
npm run graphify:prime -- "<q>" # codebase map — query graph before Read/Grep
npm run graphify:build          # (re)build code graph (AST-only, no API key)
npm run graphify:update         # incremental AST refresh after edits
npm run stash:sync    # mark task done in tasks.md
npm run kimi:aep -- --task "…"   # AEP orchestrator: Kimi runs the task, script enforces gate + 3-retry + checkpoint log
npm run kimi:aep -- --next       # same, pulling the next task from loops:next
```

Python engine: `cd survey-engine && python -m pytest` (62+ tests must stay green).

## Agent Engineering Protocol (AEP) — mandatory

Every nontrivial task runs under the **AEP** — the explicit discipline that lets API-token agents
reach frontier-model quality. Load the `engineering` skill (or read `docs/planning/AGENT-ENGINEERING.md`)
before starting. Phases, in order: **P0 context → P1 plan → P2 build → P3 verify → P4 adversarial
self-review → P5 cost-gated escalation → P6 metacognition/handoff.** Skipping a phase silently is the
one unforgivable failure mode.

## Task loop (strict order, every task)

1. **Memory first** — `npm run stash:prime -- <topic>`; read `docs/planning/global.md` and the relevant `docs/planning/features/*/design.md` before touching code.
2. **Graphify map** — `npm run graphify:prime -- "<topic>"` or `python -m graphify query "<question>"` **before** blind Read/Grep/Glob. Use `path` / `explain` for cross-file deps. After code edits: `npm run graphify:update`.
3. **Research** — read the code you will change and its callers (graphify orients; Read confirms lines). Read before write, always.
4. **Build** — surgical diff; add/update tests in the same pass as the code.
5. **Verify yourself** — run `npm run verify` (app) or the domain gate; run smoke/curl checks yourself. A task without a passing verify is NOT done.
6. **Retro** — `npm run stash:sync`; if the first attempt failed, follow `docs/planning/HANDOFF.md` recovery protocol (max 3 retries, then stop and report).

**End every task with a checkpoint:**

```
DONE: <what shipped>
VERIFIED: <exact commands run + results>
LEFT: <what remains>
BLOCKED: <blockers, or "-">
```

## Engineering standards (non-negotiable)

- **Fail loud** — no silent catch, no swallowed errors, no fallback that hides a failure.
- **Simplicity** — the smallest change that solves the problem; match existing conventions, naming, and comment density.
- **Tests encode intent** — a behavior change without a test is incomplete.
- **Deterministic gates in code** — decisions belong in scripts/tests, not in chat.
- **State lives in files** (`tasks.md`, `docs/planning/`), not in the conversation.
- **Surface conflicts** — if instructions contradict the code or each other, say so instead of guessing.
- One task = one focused context; don't drift into unrelated refactors.

## Windows specifics

- Shell is Git Bash. Call binaries as `vite` / `tsc` (they resolve via npm scripts) — **not** `../node_modules/.bin/*` paths.
- Use forward slashes in shell commands; quote paths containing spaces (repo root is `SOLARIS CET`).

## Shared memory (Stash)

The `stash` CLI is on PATH. Before starting work, search prior context:
`stash search "<query>" --json` · `stash vfs "ls /"` · `npm run stash:prime -- <topic>`.
Decisions and session history from other agents live there — check it before re-deriving anything.

## Codebase map (Graphify)

[Graphify](https://github.com/Graphify-Labs/graphify) turns the repo into a **queryable knowledge graph** (code = local AST, zero LLM cost).
Skill: `.agents/skills/graphify/SKILL.md` · Cursor rule: `.cursor/rules/graphify.mdc` (always on).

```bash
python -m pip install graphifyy          # once per machine
npm run graphify:build                 # code map: app + survey-engine + scripts + contracts
npm run graphify:prime -- "admin auth" # orient before editing
python -m graphify query "<question>"
python -m graphify path "SurveyPage" "surveyCrm"
python -m graphify explain "guardAdminRoute"
npm run graphify:update                # after code changes (AST-only)
```

Install skill for new agents: `python -m graphify install --project --platform cursor` (also `agents`, `claude`).
