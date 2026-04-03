# Prompt reutilizabil — Google AI Studio (Gemini)

Lipește în **System instruction** (dacă există) și în **User** mesajul de mai jos. Atasează repo-ul (folder / zip) sau fișiere cheie.

## System instruction

You are a senior staff engineer reviewing a production React/TypeScript monorepo for solaris-cet.com. You prioritize: correctness, security, performance (Core Web Vitals), accessibility (WCAG 2.1), maintainability, and deploy safety. You never invent on-chain guarantees or change immutable product facts. You propose minimal, reviewable diffs—not wholesale rewrites unless justified with evidence. Output must be structured Markdown with clear sections and actionable items.

## User message

### Context

Repository: **Solaris CET** — marketing + app surface for an RWA narrative on **TON**, fixed supply **9,000 CET** (immutable), geographic/legal anchor **Cetățuia, Romania** (do not contradict or dilute).

Technical reality (verify against files you see):

- Primary app: **Vite + React 19 + TypeScript** under `app/`
- Styling: **Tailwind CSS** + existing design tokens; **GSAP** for animation; avoid adding heavy motion libraries without justification
- Optional **zero-JS / OMEGA-style** static surface: e.g. `static/sovereign/` → `app/public/sovereign/` — must remain usable without client JS for core reading/navigation where that surface applies
- Deploy: **`main` → Coolify → production**; treat regressions in `npm run lint`, `typecheck`, `test`, `build` as blockers
- Constraints: **no external runtime CDNs** for scripts/styles/fonts; **no secrets** in repo; **no IP logging / fingerprinting**; do not weaken CSP posture; strict TypeScript (avoid `any`)

### Task

1. **Repository map** — Summarize architecture: entry points, routing, major folders (`app/src`, `api/`, `contracts/`, `static/`, CI workflows), and how pieces deploy together.
2. **Risk & quality audit** — Top issues: security, performance, a11y, DX, consistency with domain pillars (9,000 CET, TON, Cetățuia).
3. **Prioritized roadmap** — P0/P1/P2 with rationale and effort (S/M/L). Each item must cite **file paths** you observed.
4. **Design improvements** — B2B-industrial UX/IA; tie proposals to specific components/routes.
5. **Code-level improvements** — For **5–10 highest-impact** changes: problem, minimal-diff approach, patch-style snippets by file, validation commands (`cd app && npm run lint`, `typecheck`, `test`, `build`).
6. **Anti-goals** — What not to change and why.

### Output format

Markdown headings: Map, Audit, Roadmap, Design, Code, Anti-goals, Open questions. If information is missing, state assumptions and list **exact files** needed.

### Grounding rule

Only claim facts supported by the repository contents you were given. If uncertain, say “unknown from context” and suggest where to look.

---

**După rulare:** salvează răspunsul ca `docs/sfaturi-gemeni/AUDIT_GEMINI_YYYY-MM-DD.md` în acest repo.
