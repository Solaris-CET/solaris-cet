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

## Adjusting Behavior

Practical knobs:

- Increase/decrease output strictness by tightening the "OUTPUT FORMATTING" block.
- Change voice by adjusting the `TONE` line.
- Change format by adjusting the `MODE` line.
- Switch sources policy (URLs allowed or not) by adjusting the `CITATIONS` section.

