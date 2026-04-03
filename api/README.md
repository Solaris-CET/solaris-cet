# Root `api/` (optional serverless / edge)

## Canonical routes

The app’s API lives under **`app/api/`**:

| Route | Runtime | Role |
|-------|---------|------|
| `app/api/chat/route.ts` | Edge | CET AI (Grok × Gemini, RAV, DeDust context) |
| `app/api/auth/route.ts` | Node | TON wallet → Postgres |
| `app/api/lib/crypto.ts` | — | AES-GCM key resolution for Edge |

**Production:** [https://solaris-cet.com](https://solaris-cet.com) is deployed via **Coolify** on the project VPS; run the same handlers beside the static `app/dist` build (or use a compatible edge/Node adapter).

`app/vercel.json` rewrites `/api/chat` and `/api/auth` when the deploy root is **`app`** (e.g. Vercel).

## This folder

`api/chat/route.ts` is a **smaller OpenAI-only** handler for setups where the project root is the **repository root** (not `app/`). It uses the same CORS allowlist as `app/api/*` via `api/lib/cors.ts`.

- **Env:** `OPENAI_API_KEY`
- **Do not** rely on both trees at once: pick one deploy layout to avoid duplicate or stale behaviour.

## Security notes

- CORS is **not** `*`: only known production origins (`solaris-cet.com`, mirrors), `*.vercel.app` previews, and `http://localhost*` are reflected.
- Long prompts are capped (`MAX_QUERY_LENGTH` in `chat/route.ts`; keep the value aligned with `app/src/lib/cetAiConstants.ts`).
