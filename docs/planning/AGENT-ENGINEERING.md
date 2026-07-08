# SOLARIS CET — Agent Engineering Protocol (AEP v1)

**Purpose:** encode, as an explicit protocol, the working discipline of a frontier model (Fable 5)
so that ANY agent running on API tokens (Kimi, DeepSeek, Sonnet, Haiku, Grok…) reaches near-frontier
output quality. Intelligence you don't have must be replaced by process you follow.

**Who reads this:** every AI agent working on this repo. Loaded via the `engineering` skill
(`.agents/skills/engineering/`) and referenced from `AGENTS.md` and the `loops` skill.

**One-line summary:** *Plan explicitly → read before write → build small → verify in code →
attack your own work → escalate by gate, not by vibe → leave a handoff.*

---

## P0 — Context engineering (before any work)

Cheaper models degrade fastest when context is wrong or bloated. Control it deliberately:

1. **Fresh context per task.** One task = one session. Never carry a failed task's context into the next.
2. **Memory before motion.** `npm run stash:prime -- <topic>`, `stash search "<query>" --json`,
   read `docs/planning/global.md` + the feature's `design.md`. 5 minutes of recall saves an hour of rediscovery.
3. **Graphify before grep.** `npm run graphify:prime -- "<topic>"` or `python -m graphify query/path/explain`.
   The knowledge graph surfaces cross-file `INFERRED` edges that grep misses. After edits: `npm run graphify:update`.
4. **Targeted reads only.** Graphify orients; then read the functions you change and their callers — not whole directories.
   Every token you load is paid twice: in money and in attention.
5. **State lives in files, never in chat.** Progress → `tasks.md`. Decisions → `docs/planning/`.
   Lessons → `docs/planning/agent-memory.md`. Assume your context evaporates at any moment.

## P1 — Plan (before the first edit)

5. **Write the success criterion first.** One sentence: "Done means `<command>` passes / `<behavior>` observable."
   If you can't state it, you don't understand the task — go back to P0.
6. **Decompose to ≤5 steps.** Each step independently verifiable. A step you can't verify is two steps.
7. **State the plan in 2–4 lines** before editing. On nontrivial design choices, generate **2–3 candidate
   approaches, score them against the success criterion, pick one** (N-best compensates for weaker
   single-shot judgment — this is how smaller models buy frontier-level decisions).

## P2 — Build

8. **Read before write — always.** Never edit code you haven't read in this session, including its callers.
9. **Smallest correct diff.** Match the file's existing style. No drive-by refactors, no speculative abstractions.
10. **Tests in the same pass.** A change is incomplete until a test fails when it's reverted.
11. **Fail loud.** No `catch {}`, no silent fallback, no defaulting over errors.

## P3 — Verify (deterministic, self-sufficient)

12. **You run the gate — never the user.** `npm run verify` (app) + the domain gate
    (see `loops` skill table). Green gate or not done — no third state.
13. **Trace one concrete input** through the changed code path, end to end, on paper or with a curl/smoke run.
14. **Evidence, not confidence.** Every claim in your report must point to a command output from this session.

## P4 — Adversarial self-review (the frontier multiplier)

Big models self-correct implicitly; you must do it as an explicit second pass:

15. **Switch roles.** After building, become a hostile reviewer whose only job is to REFUTE the work.
    Run the six lenses of the `review` skill (correctness, fail-loud, tests, conventions, security/cost, Windows/CI).
16. **Default to "broken until proven".** For each lens, actively construct the input that breaks it.
    Only after honestly failing to break it may you report done.
17. **Fix P0/P1 findings immediately**, re-run P3, then report.

## P5 — Escalation & model routing (cost gate)

Never burn premium tokens by default. Climb the ladder only when a gate fires:

| Tier | Model (API) | $/1M in→out | Use for |
|---|---|---|---|
| 0 | Kimi k2.7-code (default) | cheapest | All coding, vision, bulk work |
| 1 | kimi-k2-thinking / DeepSeek | cheap | Hard debugging, multi-step reasoning |
| 2 | `claude-haiku-4-5` | $1 → $5 | Classification, extraction, cheap judges |
| 3 | `claude-sonnet-5` | $3 → $15 (intro $2/$10 până 2026-08-31) | Premium routine text, code-review judge |
| 4 | `claude-opus-4-8` | $5 → $25 | Hard architecture calls, final arbitration |
| 5 | `claude-fable-5` | $10 → $50 | ONLY via L-SUP-GATE: top-tier AHJ narrative, enterprise reports, ≤15–20% of cases |

**Escalation gates (any one fires → go up ONE tier, with a one-paragraph brief, not your whole context):**
- 3 failed attempts at the same problem with different strategies
- The decision is irreversible or customer-facing (permit text, enterprise deliverable)
- Two candidate approaches score equal and the choice is architectural

**Cost rules:** Batch API = **−50%** on any Claude call that isn't urgent — default for reports.
Prompt caching for any repeated prefix ≥1–4k tokens. Log every premium call's cost (survey-engine already does).

## P6 — Metacognition (anti-loop & budget)

18. **Loop detector.** Same command failing twice → STOP retrying verbatim; diagnose root cause or change strategy.
    Three distinct failed strategies → STOP entirely, write the checkpoint with BLOCKED, follow `HANDOFF.md`.
19. **Token budget.** Before a big read/generation ask: "does this change what I'll do next?" If no, skip it.
20. **Handoff always.** End every task with the checkpoint (`DONE / VERIFIED / LEFT / BLOCKED`) written so a
    fresh-context agent can resume without re-deriving anything. If you learned an anti-pattern, append it
    to `docs/planning/agent-memory.md`.

---

## The contract

An agent following P0–P6 honestly is allowed to say "done".
An agent skipping any phase must say which one and why — silently skipping a phase is the one
unforgivable failure mode, because it converts cheap tokens into expensive rework.
