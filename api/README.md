# Root `api/` (Vercel serverless)

## Canonical routes

The app’s real serverless API lives under **`app/api/`**:

| Route | Runtime | Role |
|-------|---------|------|
| `app/api/chat/route.ts` | Edge | Oracle (Grok × Gemini, RAV, DeDust context) |
| `app/api/auth/route.ts` | Node | TON wallet → Postgres |
| `app/api/lib/crypto.ts` | — | AES-GCM key resolution for Edge |

`app/vercel.json` rewrites `/api/chat` and `/api/auth` to those handlers when the Vercel **Root Directory** is **`app`** (recommended).

## This folder

`api/chat/route.ts` is a **smaller OpenAI-only** handler for setups where the Vercel project root is the **repository root** (not `app/`). It uses the same CORS allowlist as `app/api/*` via `api/lib/cors.ts`.

- **Env:** `OPENAI_API_KEY`
- **Do not** rely on both trees at once: pick one root in Vercel to avoid duplicate or stale behaviour.

## Security notes

- CORS is **not** `*`: only known production origins, `*.vercel.app` previews, and `http://localhost*` are reflected.
- Long prompts are capped (`MAX_QUERY_LENGTH` in `chat/route.ts`).
