# SOLARIS CET — Agent Memory (local Stash)

Persistent memory for coding agents. **Search this file + `grok.md` + `HANDOFF.md` before building.**
When the first fix fails, read **`HANDOFF.md` §5 Failed attempts** before retry #2.
When [Fergana Stash](https://github.com/fergana-labs/stash) is connected, also run:
`stash search "SOLARIS <topic>" --json` and `stash vfs "rg \"<topic>\" /me"`.

Last consolidated: **2026-07-08** · Stash: **balabanc053** connected · `stash:prime` / `stash:sync` / `stash:verify`

---

## What past agents did WELL

| Area | Pattern | Evidence |
|---|---|---|
| Survey pipeline | End-to-end: Python engine + Node proxy + React UI + tests | Faza 5–10, pytest 62+, Vitest routes |
| Perfect Loops | Research → Build → docs in same pass | `grok.md` updates per fază |
| CI alignment | `verify:fast`, survey job in CI, smoke scripts | `ci.yml`, `survey-smoke.mjs` |
| Offline șantier | IndexedDB draft + sync queue | `SurveyPage.tsx` |
| Deploy artifacts | `coolify.yml`, `post-deploy-survey.mjs`, env examples | Ready for VPS |
| Windows hardening | `run-bin.mjs`, `ci:install`, `prepare-husky.mjs` | Cross-platform npm |
| Local dev (final) | `dev:local` one command + `/api` proxy | 2026-07-06 session |
| Fable 5 agent patterns | effort + verifier + evidence packets | `agent_harness.py` · `FABLE5-LEAK-REFERENCE.md` |
| Admin test mocks | Mock `guardAdminRoute` directly, not `importOriginal` | 2026-07-08 Kimi/Grok handoff |
| Graphify map | Query before grep; all agents have skill + Cursor rule | `npm run graphify:prime` · `.agents/skills/graphify/` |

---

## What past agents did BADLY (never repeat)

| Anti-pattern | Symptom | Permanent fix |
|---|---|---|
| Wrong git remote | Push to GitHub `solaris-cet` instead of Gitea `solaris-clean` | `git remote -v`; deploy from **solaris-clean** only |
| Half deploy | Code pushed but Coolify not redeployed / no `survey-engine` | `survey:post-deploy` after VPS unblock |
| Dev without API layer | `/api/survey/*` returns HTML in Vite | Proxy `/api` → `:3000`; run `api:dev` or `dev:local` |
| Unix npm scripts on Windows | `../node_modules/.bin/vite` → cmd error | Use `vite`, `tsc`, `run-bin.mjs` |
| Missing Tailwind oxide | PostCSS 500 on Windows | `optionalDependencies` `@tailwindcss/oxide-win32-x64-msvc` |
| 3 terminals + zombies | Port conflicts, exit 1 noise | `npm run dev:local`; Ctrl+C stops all |
| Told user to run commands | "Rulează tu X" without executing | **Self-sufficient** — run it yourself (Stash rule) |
| Gmail MCP without OAuth | Doctor fails forever | User must place `gcp-oauth.keys.json`; don't pretend it works |
| Auto-reply as resolution | Hetzner auto-email ≠ unblock | Wait for human reply on `L002DD869` |
| Starting point delivery | "TODO deploy" without smoke | Smoke + doc + retrospective before done |
| Parallel npm install | Lock corruption on Windows | `npm run ci:install` sequential |
| Credentials in terminal | Gitea password in log | Rotate; use PAT; never `git credential fill` in shared logs |
| Stash sync 409 | `upload` refuză — pagina există | `stash files edit-page <id>` (vezi `stash-sync.mjs`) |

---

## Architecture decisions (do not re-litigate)

- **Prod:** Coolify on Hetzner VPS → `solaris-cet.com`, repo **Gitea `Solaris-Cet/solaris-clean`**, branch `main`
- **Survey bridge:** Browser → Vite/Node `:3000` `/api/survey/*` → Python `:8000`
- **Model routing:** DeepSeek default · Claude Fable 5 premium text · Kimi 10+ poze · Grok orchestration
- **Secrets:** Coolify env only — never in repo

---

## Checkpoint template (after each significant step — Stash Rule 10)

```
DONE: [what changed]
VERIFIED: [command + result]
LEFT: [next step or none]
BLOCKED: [external dependency, if any]
```

---

## Stash setup (team — one-time per machine)

```powershell
pip install stashai
# Add to PATH: ...\Python312\Scripts
stash signin          # browser auth
cd "C:\Users\CCons\Desktop\SOLARIS CET"
stash connect         # bind repo; creates .stash + .cursor/rules/stash.mdc
```

After connect, sessions stream to Stash; next agent queries:
`stash search "survey deploy coolify" --json`

---

## Quick search index (grep this file)

- deploy, coolify, gitea, solaris-clean, hetzner, unblock
- survey, dev:local, vite, proxy, api:build
- windows, postcss, oxide, npm ci
- gmail mcp, oauth
- deepseek, claude fable, kimi, model routing