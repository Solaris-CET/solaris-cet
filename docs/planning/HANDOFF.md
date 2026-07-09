# SOLARIS CET — Agent Handoff (Loops Recovery Protocol)

**Generated:** 2026-07-06  
**Purpose:** Când o soluție **nu merge după prima încercare**, următorul agent citește **acest fișier înainte de orice cod** (Loop 0).  
**Master loops:** `SOLARIS-LOOPS-MASTER.md` · **Memory:** `agent-memory.md` · **PM notes:** `grok.md`

---

## 0) Checkpoint instant (citește primul)

```
DONE:     verify gate 1834/1834 · Graphify · Fable harness · adminNav/OpenAPI · react-helmet-async fix
VERIFIED: npm run verify exit 0 · typecheck EXIT 0 · Gitea+GitHub @ 952d595f · prod health 404
LEFT:     DNS fix (solaris-cet.com → Coolify, not Shopify) · COOLIFY_* redeploy · T6 audit · GTM
BLOCKED:  Domain serves Shopify (`powered-by: Shopify`, redirect shop.solaris-cet.com) · COOLIFY_* absent
```

| Metric | Value |
|---|---|
| **Git HEAD (local)** | `952d595f` |
| **GitHub `main`** | `952d595f` (synced) |
| **Gitea `origin/main`** | `952d595f` (synced 2026-07-09) — **Coolify redeploy pending** |
| **Prod `solaris-cet.com`** | **Shopify** (DNS drift) — health.json **404** · survey API **301→shop** |
| **Ralph open tasks** | **1** — improvement-registry T6 (npm audit, blocked safe path) |
| **Epics complete** | 11/12 (`tsc-cleanup` superseded 2026-07-09) |

---

## 1) Golul final (ce lipsește pentru „done” real)

### 1.1 BLOCKER extern (nu se rezolvă din cod)

| Gap | Impact | Deblocare |
|---|---|---|
| **Hetzner account lock** `L002DD869` | VPS/Coolify indisponibil sau parțial | Răspuns uman Hetzner + confirmare plată |
| **DNS `solaris-cet.com` → Shopify** | `deploy:status` nu poate valida Coolify; health 404 pe Shopify | Repoint DNS la VPS/Coolify sau setează `SITE_URL` la hostul real |
| **Coolify redeploy** branch `main` | După DNS fix, prod nu are SHA `ef648265` | `npm run coolify:redeploy-survey` cu `COOLIFY_*` |
| **Gitea push 504** | Prod mirror `solaris-clean` în urmă față de GitHub | `npm run gitea:push-retry` (4× retry, 12s delay) |

### 1.2 Gap funcțional post-deploy (depinde de 1.1)

| Gap | Verify când e gata |
|---|---|
| `npm run deploy:status` → Prod health **OK** + Survey API **OK** | SHA local = SHA prod |
| `npm run survey:prod-gate` → exit 0 (fără `SOFT_FAIL=1`) | Toate rutele OpenAPI pe prod |
| `npm run survey:post-deploy` | Smoke S1–S10 pe `solaris-cet.com` |
| Demo B2B public `/survey` | GTM pitch live (vezi `GO-TO-MARKET-STRATEGY.md`) |

### 1.3 Gap executiv / tooling (nu blocker cod)

| Gap | Status |
|---|---|
| **GTM execution** (IG, landing instalatori, pilot #1–3) | Doc gata · **0% executat** |
| **DeepSeek API** `loops:refine` | Script gata · **fără `DEEPSEEK_API_KEY` în sesiune** → manual mode |
| **Aider** `npm run aider` | Wrapper gata · **`pip install aider-chat` nefacut** |
| **Stash CLI în PATH** | Unele shell-uri PowerShell: `stash` not recognized |
| **Gmail MCP OAuth** | `gcp-oauth.keys.json` lipsă — user step |
| **`tsc` global app** | ✅ `npm run typecheck` verde în verify gate (epic `tsc-cleanup` superseded) |

### 1.4 Definiție „DONE” pentru următorul agent

1. `deploy:status` → aligned (local SHA = prod version)
2. `survey:prod-gate` → hard pass pe prod
3. `stash:sync` → handoff + grok.md pe Stash
4. Opțional: primul pilot B2B onboarding call (GTM §8.1 W3)

---

## 2) Stadiul curent (architecture + delivery)

### 2.1 Ce funcționează LOCAL (verificat)

```bash
npm run dev:local          # :8000 survey + :3000 API + :5173 Vite
npm run survey:smoke       # engine health, demo, jurisdictions
npm run survey:test        # pytest 62+
cd app && npm run verify   # lint + typecheck + vitest + build
npm run test:e2e -- tests/pwa-offline.spec.ts --grep "survey shell"  # Windows OK
npm run deploy:status      # Local SHA accd4e1 (Windows git resolve OK)
npm run loops:status     # 10 epics, 0 open
```

### 2.2 Stack livrat (Faza 5 → 10 + 10 epics)

| Layer | Status | Entry |
|---|---|---|
| Survey UI `/survey` | ✅ | `SurveyPage.tsx` — offline, twin, agent, batch |
| Python engine | ✅ | `survey-engine/` — vision, AHJ, twin, agent |
| Node bridge | ✅ | `app/api/survey/*`, `server/index.cjs` |
| Admin | ✅ | Leads, Installers, Twin*, Offline sections |
| PWA offline | ✅ | IndexedDB + SW `PROBE_SURVEY_SHELL` |
| OpenAPI + SDK | ✅ | `/api/openapi/survey` |
| Deploy scripts | ✅ | prod-gate, post-deploy, coolify-redeploy |
| GTM strategy | ✅ | `GO-TO-MARKET-STRATEGY.md` v3.3 |
| Loops v3.1 | ✅ | next, status, refine, aider |

### 2.3 Prod vs local drift

```
Local:  7fd3a36c — verify 1834 green · Graphify · Fable harness · admin/OpenAPI tests
Prod:   d0f6928c (stale) — Coolify n-a redeployat; health + survey API 404
```

**Cauză probabilă:** `server/index.cjs` route registry + `survey-engine` container nu sunt pe VPS la SHA curent.

---

## 3) Files in flight (NU commita blind `git add -A`)

### 3.1 Modified tracked (dirty workspace)

| File | De ce e dirty | Acțiune recomandată |
|---|---|---|
| `app/api/lib/buildInfo.ts` | Regenerat la `npm run build` | Commit doar dacă build intenționat |
| `app/public/release-notes.json` | `generate-release-notes.mjs` | Idem |
| `app/public/sitemap.xml` | `generate-seo-files.mjs` | Idem |
| `survey-engine/output/reports_index.jsonl` | Demo local | **NU commita** — local artifact |
| `terminals/*.txt` | Loguri Cursor/agent | **NU commita** — gitignore candidate |

### 3.2 Untracked (local only)

| Path | Tip |
|---|---|
| `survey-engine/output/SOLARIS_SOL-2026-0042_*.pdf` | Rapoarte demo |
| `survey-engine/output/AHJ_SOL-2026-0042.json` | AHJ demo |
| `survey-engine/output/twin_webhook_deliveries.jsonl` | Test webhook |
| `agent-tools/` | Tooling local |
| `terminals/63.txt` … `140.txt` | Session logs |

### 3.3 Last clean commit (safe baseline)

```
accd4e1 feat(gtm): v3.3 go-to-market strategy (3x3 loops) + loops tooling + Windows E2E fix
007ff29 fix(deploy): resolve git on Windows; add survey shell offline E2E probe
809bd7e feat(survey-offline-pwa): ...
```

---

## 4) Istoric schimbări — sesiuni & agenți

> **Notă:** Atribuirea „agent” = model + rol din routing loops. Sesiunea Cursor/Grok principală: transcript `019f33cc-1d1f-7b71-858b-0282215caee8`.

### 4.1 Timeline commits (2026-07-05 → 2026-07-06)

| SHA | Epic / Task | Agent (rol) | Sesiune |
|---|---|---|---|
| `aff787a` | soft-cost T1 ROI | Grok orchestrator + DeepSeek code | Multi-day Ralph |
| `456a92a` | soft-cost T2–T6 | Grok + DeepSeek | Epic batch |
| `ff9c7c2` | agentic-orchestration S5 | Grok plan · DeepSeek build | Epic 30 tasks |
| `0e6f9fa` | api-first-platform S6 | Grok · DeepSeek | Epic 30 tasks |
| `2b9f974` | installer-twin-deploy | Grok · DeepSeek | Epic 30 tasks |
| `92749b7` | d10-twin-runtime | Grok · DeepSeek | Epic 30 tasks |
| `c4e8ce8` | prod-deploy-gate | Grok · DeepSeek | Epic 30 tasks |
| `624e08c` | twin-crm-webhooks | Grok · DeepSeek | Epic 30 tasks |
| `f1b17ea` | fix Twin3DViewer tsc | Grok review | Hotfix same session |
| `44637ec` | twin-ai-agent | Grok · DeepSeek | Epic 30 tasks |
| `809bd7e` | survey-offline-pwa | Grok · DeepSeek | Epic 30 tasks |
| `007ff29` | random: deploy-status + E2E probe | **Grok Composer** (Cursor) | Sesiune 019f33cc |
| `accd4e1` | GTM v3.3 + loops tooling + E2E Windows | **Grok Composer** (Cursor) | Sesiune 019f33cc |

### 4.2 Schimbări majore per domeniu (start → sfârșit)

| Domeniu | La început (2026-07-05) | La sfârșit (2026-07-06) |
|---|---|---|
| **Survey pipeline** | Faza 5 MVP | Faza 10 + twin + agent + offline PWA |
| **Tests** | pytest 48 | pytest 62+ · Vitest extins · E2E survey + PWA |
| **Deploy** | coolify.yml existent | prod-gate + deploy-status + redeploy scripts |
| **Loops** | Skill v2 (8 loops) | Ralph + v3 + v4 consulting + status/refine/aider |
| **Docs** | global.md, grok.md | + GTM v3.3 + HANDOFF + 10 feature tasks.md |
| **Windows dev** | Fragil (bin paths) | run-bin, dev:local, E2E batched, git resolve |
| **Prod** | Parțial 200 homepage | **Survey API 404** — nealiniat |

### 4.3 Fișiere cheie create/modificate în sesiunea curentă (019f33cc)

| File | Change | Commit |
|---|---|---|
| `scripts/deploy-status.mjs` | `resolveGit()` Windows | `007ff29` |
| `app/tests/pwa-offline.spec.ts` | `PROBE_SURVEY_SHELL` E2E | `007ff29` |
| `docs/planning/GO-TO-MARKET-STRATEGY.md` | GTM v3.3 full | `accd4e1` |
| `scripts/loops-status.mjs` | Epic dashboard | `accd4e1` |
| `scripts/deepseek-refine.mjs` | Loop 4 refine | `accd4e1` |
| `scripts/aider-run.mjs` | Aider wrapper | `accd4e1` |
| `app/scripts/run-e2e-batched.mjs` | Windows cwd + playwright cli | `accd4e1` |
| `package.json` | loops:status/refine/aider + rollup optional | `accd4e1` |

---

## 5) Failed attempts — ce NU a mers și DE CE

> **Regulă recovery:** Max 3 retry per task (Ralph). După 3 eșecuri → BLOCKED + documentează aici + treci la workaround.

### 5.1 Deploy & infra

| # | Încercare | Eroare | Cauză root | Workaround / fix |
|---:|---|---|---|---|
| D1 | Push Gitea `origin main` | 504 Gateway Timeout | Gitea.com instabil | `npm run gitea:push-retry` · fallback `github` |
| D2 | Prod `survey:prod-gate` | 404 toate rutele | Coolify n-a redeployat / Hetzner lock | `SOFT_FAIL=1` · așteaptă VPS |
| D3 | `coolify:redeploy-survey` din sesiune | Neexecutat / fără acces | Depinde Hetzner | User rulează pe VPS deblocat |
| D4 | Auto-reply Hetzner „Paid” | Tot locked | Ticket uman încă deschis | Nu marca deploy ca DONE |

### 5.2 Windows dev & build

| # | Încercare | Eroare | Cauză root | Fix aplicat |
|---:|---|---|---|---|
| W1 | `spawnSync('git', …, { shell: true })` | `'C:\Program' is not recognized` | Spații în cale Git | `shell: false` + `resolveGit()` |
| W2 | `npm run build` | `Cannot find module @rollup/rollup-win32-x64-msvc` | npm optional deps bug | `optionalDependencies` în package.json |
| W3 | `../node_modules/.bin/vite` în scripts | cmd not found | Cale Unix pe Windows | `"dev": "vite"` + `run-bin.mjs` |
| W4 | PostCSS 500 | Tailwind oxide missing | Platform binary | `@tailwindcss/oxide-win32-x64-msvc` optional |

### 5.3 E2E & Playwright

| # | Încercare | Eroare | Cauză root | Fix aplicat |
|---:|---|---|---|---|
| E1 | `npx playwright test` direct | `Executable doesn't exist` | Browsers neinstalați | `npx playwright install chromium` |
| E2 | Playwright fără preview | `ERR_CONNECTION_REFUSED :4173` | Lipsă server | Folosește `npm run test:e2e` (pornește server) |
| E3 | `npm run test:e2e` | `spawn node.exe ENOENT` + pathname | `new URL().pathname` → `/C:/...` invalid pe Windows | `fileURLToPath` + `path.resolve` |
| E4 | `spawn(playwright.cmd, …, { shell: true })` | `'..' is not recognized` | Relative path + shell | `node playwright/cli.js` absolut |
| E5 | `npm run test:e2e` (înainte de fix) | exit 3221226505 | Combinat E3+E4 | **Rezolvat în accd4e1** — 1 passed |

### 5.4 Tests & types (epics anterioare)

| # | Încercare | Eroare | Fix |
|---:|---|---|---|
| T1 | Vitest `useTwinStream` | fake timers + waitFor conflict | Rescris cu fake timers corect |
| T2 | `Twin3DViewer` tsc | R3F JSX, lucide icons | `react-three-fiber.d.ts` + `f1b17ea` |
| T3 | `twin_agent` jurisdiction None | `str(None)` crash | `str(jurisdiction_raw or "").strip()` |
| T4 | `tsc` global app | Eșecuri în fișiere vechi | **Nerezolvat** — out of epic scope |

### 5.5 Tooling & memory

| # | Încercare | Eroare | Status |
|---:|---|---|---|
| M1 | `stash search` în PowerShell | `stash not recognized` | PATH sesiune — folosește path complet sau `npm run stash:prime` |
| M2 | `stash:sync` upload | 409 conflict | Fix: `edit-page` by ID în `stash-sync.mjs` |
| M3 | `loops:refine` cu API | No key | Manual mode checklist — OK by design |
| M4 | `npm run aider` | Not installed | Exit 0 cu instrucțiuni pip |
| M5 | `coolify:redeploy-survey` pe Windows | `bash` not recognized | `coolify-deploy.mjs` native fetch |
| M6 | `npm run deploy:p0` | COOLIFY_* empty | User setează env apoi rerun |

### 5.6 Ce să NU reîncerci (anti-patterns confirmate)

- `shell: true` pe `git.exe` sau căi cu spații Windows
- `new URL(import.meta.url).pathname` ca `cwd` pentru `spawn` pe Windows
- `git add -A` (include terminals + survey output)
- Push doar GitHub și presupunere că prod (Gitea) e la zi
- Marcare deploy DONE fără `survey:post-deploy` verde

---

## 6) Probleme nerezolvate + soluții deja încercate

| Problemă | Încercări făcute | De ce încă e deschis | Următorul pas valid |
|---|---|---|---|
| **Prod survey 404** | Route registry fix `server/index.cjs`, post-deploy scripts, prod-gate | Container VPS stale / Hetzner | Redeploy Coolify după unblock |
| **Hetzner L002DD869** | Așteptare auto-reply | Necesită intervenție umană | User verifică ticket |
| **Gitea 504** | Retry script 4× | Infra Gitea | `gitea:push-retry` periodic |
| **tsc global failures** | Epics verifică doar fișiere touched | Tehnic debt vechi | Epic dedicat `tsc-cleanup` |
| **Gmail MCP** | Documentat în grok.md | OAuth keys user | User adaugă `gcp-oauth.keys.json` |
| **DeepSeek refine live** | Script + manual fallback | Fără API key în env | Set `DEEPSEEK_API_KEY` + rerun |
| **Aider integration** | Wrapper script | `aider-chat` neinstalat | `pip install aider-chat` |

---

## 7) Next steps (prioritizate)

### 7.1 P0 — Deblocare prod (USER + OPS)

**One-shot (2026-07-06):** `npm run deploy:p0` — lanț complet; oprește la Step 2 dacă lipsesc `COOLIFY_*`.

```powershell
# 1) Setează secrete (sesiune PowerShell — NU commita)
$env:COOLIFY_BASE_URL="https://<coolify-host>"
$env:COOLIFY_API_TOKEN="<token>"
$env:COOLIFY_RESOURCE_UUID="<app-uuid>"
$env:COOLIFY_TAG="main"

# 2) Rulează P0
npm run deploy:p0

# Alternativ pas cu pas:
npm run gitea:push-retry              # origin — 504 retry; github OK via --github
npm run coolify:redeploy-survey       # Windows-safe (fără bash)
npm run deploy:status
npm run survey:prod-gate              # fără SOFT_FAIL
npm run survey:post-deploy
```

**Ultima rulare P0 (2026-07-06):**
| Step | Rezultat |
|---|---|
| GitHub push | ✓ up-to-date |
| Gitea origin | ✗ 504 (retry în curs) |
| Coolify trigger | ✗ `COOLIFY_*` empty |
| Prod homepage | 200 OK |
| Prod health.json | 404 |
| survey:prod-gate | ✗ 5 hard + 6 soft (toate API 404 HTML) |

### 7.2 P1 — Loop 7 retro sesiune curentă

```bash
npm run stash:prime -- handoff deploy
# Citește acest fișier + agent-memory.md
npm run stash:sync                    # push grok.md + agent-memory + SKILL
```

### 7.3 P2 — GTM execution (din GO-TO-MARKET-STRATEGY.md §8.1)

| Săpt. | Task | Owner |
|---|---|---|
| W1 | Rebuild Instagram bio + 3 pinned posts | Marketing |
| W1 | Listă 50 instalatori țintă RO | Sales |
| W2 | Landing `/survey` copy pentru instalatori | Dev + copy |
| W3 | Pilot #1–#3 (14 zile gratuit) | Sales + support |

### 7.4 P3 — Tooling activation

```bash
pip install aider-chat
$env:DEEPSEEK_API_KEY="sk-..."
npm run loops:refine -- docs/planning/GO-TO-MARKET-STRATEGY.md "Adaugă scenarii BG/HU Q4"
npm run aider -- "fix remaining tsc errors in app/src"
```

### 7.5 P4 — Epic nou sugerat (când P0 e verde)

| Epic slug | Scope |
|---|---|
| `tsc-cleanup` | Rezolvă eșecuri tsc pre-existente |
| `gtm-execution` | Landing installer, IG hub, pilot CRM flow |
| `staging-selfhost` | Demo B2B fără prod (Hetzner workaround) |

---

## 8) Next steps NEFINISATE / începute dar neterminate

| Item | Început în | Stadiu | Ce lipsește |
|---|---|---|---|
| Prod deploy aligned | 2026-07-06 epic prod-deploy-gate | **10%** — scripts gata | Executie Coolify |
| `stash:sync` post-GTM | Sesiune 019f33cc | **0%** | Rulare + verificare Stash |
| DeepSeek `loops:refine` live | accd4e1 | **50%** — script, no API call | API key + run |
| Aider workflow | accd4e1 | **25%** — wrapper only | pip install + first task |
| GTM W1–W4 execution | accd4e1 | **0%** — doc only | Marketing/sales actions |
| Gitea `origin` sync | Ongoing | **Intermittent** | Retry când 504 dispare |
| `verify:all` (full E2E suite) | CI | **Partial** — survey shell OK | Full batched suite local CI-parity |
| Epic `tsc-cleanup` | Menționat | **Neînceput** | tasks.md + fix list |

---

## 9) Recovery Loop — când prima soluție eșuează

Ordine obligatorie (din `solaris-perfect-loops` + Stash Rule 12 **Fail loud**):

```
┌─────────────────────────────────────────────────────────────┐
│  R0  Citește HANDOFF.md §5 — eșecul tău e deja documentat? │
│  R1  Loop 0: npm run stash:prime -- <topic>                 │
│  R2  Reproduce cu comandă exactă + capture stderr           │
│  R3  Diagnoză root cause (nu simptom)                       │
│  R4  Încercare 2: workaround documentat în §5               │
│  R5  Încercare 3: alt path (ex. staging vs prod)            │
│  R6  BLOCKED → update §6 + §8 + grok.md                   │
│  R7  npm run stash:sync                                     │
└─────────────────────────────────────────────────────────────┘
```

### 9.1 Decision tree rapid

| Simptom | Prima verificare | Dacă tot fail |
|---|---|---|
| 404 pe prod | `deploy:status` | Coolify redeploy — §7.1 |
| E2E connection refused | `Test-Path app/dist/index.html` | `npm run build` apoi `npm run test:e2e` |
| git SHA unknown | `Test-Path "C:\Program Files\Git\bin\git.exe"` | `resolveGit()` pattern |
| Build rollup error | `npm ls @rollup/rollup-win32-x64-msvc` | `npm ci` sau optionalDep |
| pytest fail | `cd survey-engine && pytest -x` | Citește test + ultimul epic touch |
| loops:next empty | `loops:status` | Creează epic nou în `features/` |

---

## 10) Comenzi canonice (copy-paste next agent)

```bash
# Loop 0 — Memory
npm run stash:prime -- handoff

# Loop 3 — Verify local
npm run dev:local
npm run survey:smoke
npm run deploy:status

# Loop 3 — Verify test subset
cd app && npm run test:e2e -- tests/pwa-offline.spec.ts --grep "survey shell"

# Loop 3 — Verify prod (expect FAIL până deploy)
SITE_URL=https://solaris-cet.com npm run survey:prod-gate

# Ralph
npm run loops:status
npm run loops:next

# Loop 7 — Retro
npm run stash:sync
```

---

## 11) References

| Doc | Path |
|---|---|
| Global status | `docs/planning/global.md` |
| PM retrospective | `docs/planning/grok.md` |
| Agent anti-patterns | `docs/planning/agent-memory.md` |
| Loops master | `docs/planning/SOLARIS-LOOPS-MASTER.md` |
| GTM v3.3 | `docs/planning/GO-TO-MARKET-STRATEGY.md` |
| Consulting frameworks | `docs/planning/CONSULTING-SOLUTIONS.md` |
| B2C digital | `docs/STRATEGIE_DIGITALA_VIBE_FOUNDER.md` |
| Perfect loops skill | `.claude/skills/solaris-perfect-loops/SKILL.md` |
| Session transcript | `~/.grok/sessions/.../019f33cc-.../updates.jsonl` |

---

## 12) Handoff signature

| Field | Value |
|---|---|
| **Prepared by** | Grok Composer (Cursor agent) |
| **Session** | `019f33cc-1d1f-7b71-858b-0282215caee8` |
| **Date** | 2026-07-06 |
| **HEAD** | `accd4e1` |
| **Next agent first action** | `npm run stash:prime -- handoff` → read §1 + §5 → execute §7.1 if Hetzner green |

```
DONE: HANDOFF.md created (loops recovery protocol)
VERIFIED: deploy:status + loops:status + git log
LEFT: §7.1 prod deploy · §7.2 stash:sync · §7.3 GTM execution
BLOCKED: Hetzner L002DD869
```