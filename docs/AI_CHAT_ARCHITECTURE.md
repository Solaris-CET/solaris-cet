# /api/chat (CET AI) — Architecture

## Overview

`POST /api/chat` is the main CET AI endpoint. It composes a single answer from two external LLM calls:

- **Gemini**: REASON step
- **Grok (xAI)**: ACT + VERIFY step

The handler is implemented in [route.ts](file:///root/solaris-cet/app/api/chat/route.ts) and runs on **Edge** runtime.

## Request / Response

Request body:

```json
{ "query": "string", "conversation": [{"role":"user|assistant","content":"string"}] }
```

Response body:

```json
{
  "response": "string",
  "sources": [],
  "usage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0,
    "costUsd": 0,
    "providers": [{"provider":"gemini|grok","model":"...","totalTokens":0,"costUsd":0}]
  }
}
```

Headers:

- `X-Cet-Ai-Source`: `live` | `cache`
- `X-Cet-Ai-Cache`: `miss` | `hit`
- `X-Request-Id`: correlation id
- `X-Cet-Ai-Duration-Ms`: end-to-end provider time (non-cached)
- `X-Cet-Ai-Total-Tokens`: summed tokens (when available)
- `X-Cet-Ai-Cost-Usd`: summed cost (when configured)

## Data Flow

1) **CORS + validation**
- CORS uses `getAllowedOrigin(origin)` and includes `Vary: Origin`.

2) **Rate limit**
- Implemented in [rateLimit.ts](file:///root/solaris-cet/app/api/lib/rateLimit.ts) via `withRateLimit()`.
- Strategy: Upstash when configured, otherwise local in-memory window.

3) **Cache**
- Short-lived in-memory cache in [aiCache.ts](file:///root/solaris-cet/app/api/lib/aiCache.ts).
- Keyed by hash of `{ ip, query, conversation, origin }`.
- Env:
  - `CET_AI_CACHE_TTL_SECONDS` (default `20`)
  - `CET_AI_CACHE_MAX_ENTRIES` (default `300`)

4) **Context**
- Best-effort on-chain context from DeDust pools/prices.
- Retrieval block from curated docs + optional Tavily (allowlisted).

5) **Providers + fallback**
- Providers called in parallel.
- If one fails, CET AI tries to synthesize missing sections with the remaining provider; otherwise falls back to a single-provider full response.

6) **Usage + metrics**
- Token usage is extracted (when providers return it) and added to the JSON response.
- Optional cost estimation via:
  - `CET_AI_PRICE_GEMINI_PROMPT_PER_1K_USD`
  - `CET_AI_PRICE_GEMINI_COMPLETION_PER_1K_USD`
  - `CET_AI_PRICE_GROK_PROMPT_PER_1K_USD`
  - `CET_AI_PRICE_GROK_COMPLETION_PER_1K_USD`
- Prometheus metrics are appended to `GET /api/metrics`.

