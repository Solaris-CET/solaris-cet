# AI Oracle (CET AI) — Prompt Structure

This repo exposes CET AI through:

- `app/api/chat/route.ts` (edge)
- `app/api/ai/ask/route.ts` (node, adds model preference, caching, history/pins/report plumbing)

Both endpoints generate a strict RAV-format answer (Reason → Act → Verify).

## Sections (RAV)

Every response is required to follow this exact 3-part structure:

- `[DIAGNOSTIC INTERN]` — brief internal diagnostic (1–2 sentences)
- `[DECODARE ORACOL]` — the actual answer (short paragraphs or tight bullets)
- `[DIRECTIVĂ DE ACȚIUNE]` — sharp conclusion + optional next action

## Prompt Inputs

### Shared Context

The shared context combines:

- Persona + core directives (9,000 CET fixed supply, 90-year mining horizon, TON)
- Language rule: reply in the language of the user's latest message
- Optional on-chain context (DeDust pool/price) when enabled by the plan
- Optional retrieval block (curated sources + web retrieval when enabled)
- Optional "vector memory" block (user-local, derived from prior Q&A)

### Custom Instructions (per user)

`/api/ai/ask` accepts `instructions` (short text) which is appended to the prompt as a "user preference" block.

Guidelines:

- Keep it short and specific (style, output format, what to avoid)
- Avoid adding secrets

### Tone

`/api/ai/ask` accepts `tone`:

- `brand` (default)
- `neutral`
- `fun`

### Mode

`/api/ai/ask` accepts `mode`:

- `default`
- `read` (article-like formatting)
- `eli5` (very simple explanation)

## Model Routing

`/api/ai/ask` accepts `model`:

- `auto` (default): uses repo routing logic (may run Grok+Gemini)
- `grok`: prefer Grok, fallback to Gemini
- `gemini`: prefer Gemini, fallback to Grok

## Caching

When Redis (Upstash REST) is configured, `/api/ai/ask` may cache FAQ-like answers (single-turn) for short TTLs.

## Quality Evaluation (per-dimension RAV scoring)

`/api/ai/ask` runs a lightweight evaluator over every live answer when `CET_AI_ENABLE_EVAL` is not `0`. The evaluator scores the answer across five dimensions:

- `factual` (35%): no hallucinations; prices/names/numbers are correct or flagged as uncertain.
- `useful` (25%): directly answers the query and provides actionable context.
- `safe` (15%): no disguised financial certainty, unsafe links, or policy violations.
- `style` (10%): clear structure, matching user language, appropriate tone.
- `source_grounded` (15%): cites real sources when available; never invents URLs.

The total weighted score drives a closed feedback loop: if the score is below 70, the router retries once with a different provider and a correction prompt focused on the weakest dimension.

## Consensus Heuristic (`synthesizeConsensus`)

When dual-provider mode is active, the two replies are reconciled by `app/api/lib/reactBrain.ts`:

- If on-chain price context is available, replies are scored against the verified CET/TON prices.
- Wrong price mentions and common hallucination markers (e.g. Ethereum/Solana without TON context) are penalized.
- If one reply is significantly better anchored, it is used as the primary output; otherwise the replies are merged with a verified-data prefix.

## Adjusting Behavior

Practical knobs:

- Increase/decrease output strictness by tightening the "OUTPUT FORMATTING" block.
- Change voice by adjusting the `TONE` line.
- Change format by adjusting the `MODE` line.
- Switch sources policy (URLs allowed or not) by adjusting the `CITATIONS` section.

