# Root `api/` (optional serverless / edge)

## Canonical routes

The app’s API lives under **`app/api/`**:

| Route | Runtime | Role |
|-------|---------|------|
| `app/api/chat/route.ts` | Edge | CET AI (Grok × Gemini, RAV, DeDust context) |
| `app/api/auth/route.ts` | Node | TON wallet → Postgres |
| `app/api/lib/crypto.ts` | — | AES-GCM key resolution for Edge |

**Production:** [https://solaris-cet.com](https://solaris-cet.com) is deployed via **Coolify** on the project VPS; run the same handlers beside the static `app/dist` build (or use a compatible edge/Node adapter).

This repository is designed to deploy on **Coolify + VPS** (production). Keep `/api/*` served by the same container as `app/dist` via `server/index.cjs`.

## This folder

`api/chat/route.ts` is a **smaller OpenAI-only** handler for setups where the project root is the **repository root** (not `app/`). It uses the same CORS allowlist as `app/api/*` via `api/lib/cors.ts`.

- **Env:** `OPENAI_API_KEY`
- **Do not** rely on both trees at once: pick one deploy layout to avoid duplicate or stale behaviour.

## Security notes

- CORS is **not** `*`: only known production origins (`solaris-cet.com`, mirrors) and `http://localhost*` (local dev) are reflected.
- Long prompts are capped (`MAX_QUERY_LENGTH` in `chat/route.ts`; keep the value aligned with `app/src/lib/cetAiConstants.ts`).
