---
name: solaris-perfect-loops
description: Use this skill when working on SOLARIS CET to enforce perfect Grok working loops, avoid previous mistakes like missing docs, half-solutions, unclear API routing, dangling threads, and poor cost control. Integrates Fergana Stash memory patterns. Trigger words include perfect loops, boil the ocean, agent loop, research loop, build loop, stash.
---

# SOLARIS CET - Perfect Grok Loops & Rules

## Core Philosophy (NEVER BREAK)
"Boil the ocean. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Search before building. Test before shipping. Ship the complete thing. Never leave a dangling thread. Never present a workaround when the real fix exists."

Inspired by [Fergana Stash](https://github.com/fergana-labs/stash): **persistent memory beats per-session amnesia** — agents that search past sessions work ~49% faster on long tasks.

---

## The 8 Mandatory Loops (0–7, strict order)

### 0. Memory Loop (FIRST — every session, every task)
**Goal:** Don't repeat mistakes other agents already paid for.

**One command (preferred):**
```bash
npm run stash:prime -- <topic>    # e.g. survey deploy hetzner
```

**Manual checklist:**
1. `stash whoami` — must show profile (else `stash signin`)
2. `stash search "SOLARIS <topic>" --json` + `stash vfs 'rg "<keyword>" /files'`
3. Read `docs/planning/agent-memory.md` + latest `docs/planning/grok.md`
4. State: *"Prior context: …"* or *"Fresh — no hits."*
5. → Research Loop

**After Retrospective (Loop 7):** `npm run stash:sync` — updates Stash pages via `edit-page`.

**Full health check:** `npm run stash:verify` — Loop 0 + smoke + local/prod API status.

### 1. Research Loop
- User pain: installer workflow (photos, checklists, PDF, CRM)
- Read existing code paths before writing (`Read` callers, not just new file)
- Check `global.md` for model routing and deploy truth
- If ambiguous → ask user once, precisely

### 2. Build Loop
1. Plan complete solution (files, env, tests)
2. Surgical changes only — match codebase style
3. Implement + tests in same pass (pytest / Vitest / smoke)
4. **Checkpoint** after each significant step (Stash Rule 10):
   ```
   DONE / VERIFIED / LEFT / BLOCKED
   ```
5. Update `global.md` if architecture/deploy changed
6. Mark done only when verify commands pass

### 3. Verify Loop (self-sufficient — Stash "Be self-sufficient")
- **You** run: `npm run survey:smoke`, `npm run dev:local`, `curl`/Invoke-WebRequest, `grok mcp doctor`
- **Never** ask user to check logs, test UI, or run commands you can run
- **Fail loud:** if verify skipped, task is NOT done (Stash Rule 12)
- Survey features: pytest + Vitest route + doc line in `global.md`

### 4. Optimization Loop
- DeepSeek for volume; Claude Fable 5 only top-tier text; Kimi for 10+ photos
- Grok = plan + review + memory updates, not cheap bulk coding
- Log cost-relevant decisions in `grok.md`

### 5. Agent Loop (multi-model)
| Role | Model |
|---|---|
| Orchestrator, review, memory | Grok |
| Heavy code, vision, extraction | DeepSeek V4 Pro |
| Premium writing | Claude Fable 5 |
| Long context / many photos | Kimi |

### 6. Feedback Loop
- User feedback → same-session fix when possible
- Update `grok.md` immediately with new rule

### 7. Retrospective Loop (END — mandatory)
1. Mistake / time wasted?
2. Permanent fix (code, script, rule)?
3. Append to `grok.md` + `agent-memory.md` if recurring anti-pattern
4. Add guard (CI, script check, `dev:local` port check) if repeated twice
5. Re-run smallest verify command

Template:
```
## Retrospective YYYY-MM-DD — [task]
- Mistake / Root cause / Permanent fix / Rule / Verify
```

Optional: `stash upload docs/planning/grok.md` or share session after major milestone.

---

## Stash-aligned Agent Conduct (12 rules, condensed)

| # | Rule | SOLARIS CET application |
|---|---|---|
| 1 | Think before coding | State assumptions; read `agent-memory.md` |
| 2 | Simplicity first | No speculative abstractions |
| 3 | Surgical changes | No drive-by refactors |
| 4 | Goal-driven | Define success = smoke/post-deploy green |
| 5 | Code for deterministic work | Routing/retries in code, not LLM |
| 6 | Token budget | Summarize; don't re-read huge logs |
| 7 | Surface conflicts | One pattern wins — document in grok.md |
| 8 | Read before write | Read proxy, server, vite config before survey API change |
| 9 | Tests encode intent | Survey tests assert CRM link, not just 200 |
| 10 | Checkpoint | DONE/VERIFIED/LEFT after each step |
| 11 | Match conventions | Tailwind v4, React 19, functional components |
| 12 | Fail loud | No silent 503/HTML-as-JSON; report blocked external deps |

---

## Imprinted facts (do not re-discover)

### Windows local dev
- `npm run dev:local` — survey :8000 + Node API :3000 + Vite :5173
- Vite proxies `/api` → `http://127.0.0.1:3000`
- npm scripts: `vite` / `tsc` (not `../node_modules/.bin/*`)
- `@tailwindcss/oxide-win32-x64-msvc` in `optionalDependencies`

### Deploy
- **Gitea:** `Solaris-Cet/solaris-clean` (not GitHub `solaris-cet`)
- Prod check: `SITE_URL=https://solaris-cet.com npm run survey:post-deploy`
- Hetzner billing lock ≠ code bug — wait for support

### Stash CLI (Windows)
```powershell
pip install stashai
# PATH: %LOCALAPPDATA%\Packages\PythonSoftwareFoundation.Python.3.12_...\Python312\Scripts
stash signin
stash connect   # in repo root → .stash + cursor rules
```

---

## How to Use
Activate on: "perfect loops", "follow loops", "stash", "agent memory".
Run loops **0 → 7** every task. Loop **0** (Memory) and **7** (Retrospective) are non-negotiable.