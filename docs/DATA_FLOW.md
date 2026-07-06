# Solaris CET — Fluxul Datelor

Diagrama de mai jos surprinde fluxurile principale (UI → API → integrări externe) într-un singur container (Coolify).

```mermaid
flowchart TD
  U[User Browser] -->|GET /, assets| S[app/server/index.cjs]
  S -->|serves| SPA[Static SPA: app/dist]

  U -->|/api/*| S
  S -->|dispatch| API[Compiled handlers: app/.api-dist]

  API -->|reads/writes| DB[(Postgres via Drizzle)]
  API -->|RPC| TON[TON RPC / TON SDK]
  API -->|LLM calls| AI[AI Providers]
  API -->|read| STATE[/Static state.json + assets/]

  AI -->|fallback| AI2[Secondary provider]
  API -->|metrics| METRICS[/api/metrics (Prometheus)]
  API -->|health| HEALTH[/api/health /api/status]

  SPA -->|fetch state| API
  SPA -->|TonConnect| TON
```

## Note

- Serverul servește și rutele SPA (ex. `/rwa`, `/cet-ai`) și rutele API (`/api/*`).
- Cheile și secretele nu sunt expuse în UI; endpoint-urile de health/status raportează doar prezența (boolean), nu valorile.
