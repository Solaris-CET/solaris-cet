# Solaris CET — production layout (skeleton)

This map is the **single orientation** for where code lives before shipping to **Coolify → `main` → VPS** (`solaris-cet.com`).

| Area | Path | Role |
|------|------|------|
| **Web app (canonical)** | `app/` | Vite + React + TypeScript; `npm run build` → `app/dist/` |
| **CET AI (UI + telemetry)** | `app/src/components/CetAiSearch.tsx`; `cetAiConstants.ts`, `cetAiConversation.ts`, `cetAiQueryUi.ts`, `cetAiTelemetry.ts`, … | Dual-model chat (Grok × Gemini); headers `X-Cet-Ai-Source`; query caps in `cetAiConstants.ts` |
| **Edge API** | `app/api/chat/route.ts` | POST `/api/chat` — deploy with the app build root |
| **Root API fallback** | `api/chat/route.ts` | OpenAI-only path if deploy root is repo root (see `api/README.md`) |
| **Static OMEGA surface** | `static/sovereign/index.html` → `app/public/sovereign/` (`prebuild` / `predev`) | Zero-JS page at **`/sovereign/`** in the same Vite `dist/` as the SPA; listed in `app/public/sitemap.xml` |
| **Contracts** | `contracts/` | TON / multisig tooling |
| **CI** | `.github/workflows/` | `ci.yml` gates `main` |
| **Agent rules** | `.cursor/rules/` | OMEGA directive + git deploy block |

**Naming:** prefer **`cetAi` / `CET_AI_*`** for Solaris-owned AI surfaces so identifiers stay distinct from generic “oracle” library names.
