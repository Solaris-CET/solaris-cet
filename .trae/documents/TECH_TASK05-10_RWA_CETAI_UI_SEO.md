## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["React + Vite Frontend (SPA)"]
  B --> E["RWA portfolio UI (map + timeline + documents)"]
  B --> F["AI Endpoint securizat: POST /api/chat (Serverless/Edge)"]
  F --> G["Rate limit (Upstash Redis) - opțional"]
  F --> H["DeDust V2 API (pools + prices)"]
  F --> I["AI Provider: Google Gemini (OpenAI SDK compat)"]
  F --> J["AI Provider: xAI Grok (OpenAI SDK)"]

  subgraph "Frontend Layer"
    B
    E
  end

  subgraph "Backend Layer (Serverless)"
    F
  end

  subgraph "External Services"
    G
    H
    I
    J
  end
```

## 2.Technology Description
- Frontend: React@18+ (sau 19) + TypeScript + vite
- Styling/UI: tailwindcss@3 + Radix UI (Dialog/Popover/Accordion) pentru componente accesibile
- RWA: dataset local (static) în `app/src/lib/rwaPortfolio.ts` + componente UI (map/timeline/docs)
- Backend (doar pentru AI): route handler serverless/edge `POST /api/chat` (OpenAI SDK), cu:
  - chei API doar pe server (env), fără expunere în client
  - validare input + normalizare context multi-turn (max 24 mesaje)
  - CORS allowlist + răspuns corect la preflight `OPTIONS`
  - timeout + abort, fallback single-provider dacă unul pică
  - fetch context on-chain (DeDust) cu timeout și degradare graceful
  - rate limit IP-based (ex. 10 req / 10s) dacă este configurat Upstash
- PWA: `vite-plugin-pwa` cu `generateSW`; precache limitat + runtime caching pentru chunks (assets) și endpoint-uri publice

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| / | Pagina principală: hero/preview RWA, teaser CET AI, trust + lead capture |
| /rwa | Pagina RWA: hartă interactivă + timeline + documente + fallback fără JS |
| /cet-ai | Pagina CET AI: demo live + explicații/limitări + privacy notice |
| /api/chat | Endpoint AI securizat (server-side), folosit doar de UI-ul CET AI |

## 4.API definitions
### 4.1 POST /api/chat
Scop: rulează CET AI (format RAV) folosind Grok × Gemini, cu context on-chain (DeDust) când e disponibil.

Request (JSON)
| Param | Type | Required | Descriere |
|------|------|----------|----------|
| query | string | da | Întrebarea utilizatorului (trim; limită prin config, ex. `CET_AI_MAX_QUERY_CHARS`). |
| conversation | {role:'user'\|'assistant', content:string}[] | nu | Context multi-turn (max 24; fiecare `content` poate fi trunchiat la limită). |

Response (JSON)
| Param | Type | Descriere |
|------|------|----------|
| response | string | Răspunsul modelului (format RAV). |

Erori (JSON)
- `400` `{ "message": "..." }` (validare)
- `429` `{ "error": "Rate limited" }` (când rate limit este activ)
- `500` `{ "message": "..." }` (providers indisponibili / config lipsă)

TypeScript (shared)
```ts
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ChatRequest = {
  query: string;
  conversation?: ChatMessage[];
};

type ChatResponse = {
  response: string;
};
```

## 5.Server architecture diagram
```mermaid
graph TD
  A["Client (CET AI UI)"] --> B["Route Handler: POST /api/chat"]
  B --> C["CORS allowlist + preflight"]
  B --> D["Rate limit (opțional)"]
  B --> E["Validare input + normalizare conversation"]
  B --> F["Fetch context on-chain (DeDust)"]
  B --> G["Call Gemini (REASON)"]
  B --> H["Call Grok (ACT+VERIFY)"]
  B --> I["Fallback single-provider dacă unul pică"]
  B --> J["Asamblare răspuns + JSON response"]

  subgraph "Serverless / Edge"
    B
    C
    D
    E
    F
    G
    H
    I
    J
  end
```

## 6.Data model(if applicable)
### 6.1 Data model definition
Modelul de mai jos este opțional (pentru când RWA este migrat din dataset local către o bază de date). În implementarea actuală, portofoliul RWA este servit din fișiere TS statice.
```mermaid
erDiagram
  RWA_PROJECT ||--o{ RWA_DOCUMENT : has
  RWA_PROJECT ||--o{ RWA_TIMELINE_EVENT : has

  RWA_PROJECT {
    uuid id
    string slug
    string title
    string summary
    string status
    float lat
    float lng
    string region
    string project_type
    string cover_image_url
    datetime updated_at
    datetime created_at
  }

  RWA_DOCUMENT {
    uuid id
    uuid project_id
    string title
    string doc_type
    string file_url
    datetime published_at
    datetime created_at
  }

  RWA_TIMELINE_EVENT {
    uuid id
    uuid project_id
    string title
    string description
    string status
    date event_date
    int sort_order
    datetime created_at
  }

  NEWSLETTER_LEAD {
    uuid id
    string email
    string name
    string source
    string consent_version
    datetime created_at
  }
```

### 6.2 Data Definition Language
RWA Projects (rwa_projects)
```sql
CREATE TABLE rwa_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  region TEXT,
  project_type TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON rwa_projects TO anon;
GRANT ALL PRIVILEGES ON rwa_projects TO authenticated;
```

RWA Documents (rwa_documents)
```sql
CREATE TABLE rwa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rwa_documents_project_id ON rwa_documents(project_id);

GRANT SELECT ON rwa_documents TO anon;
GRANT ALL PRIVILEGES ON rwa_documents TO authenticated;
```

RWA Timeline Events (rwa_timeline_events)
```sql
CREATE TABLE rwa_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  event_date DATE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rwa_timeline_events_project_id ON rwa_timeline_events(project_id);
CREATE INDEX idx_rwa_timeline_events_event_date ON rwa_timeline_events(event_date);

GRANT SELECT ON rwa_timeline_events TO anon;
GRANT ALL PRIVILEGES ON rwa_timeline_events TO authenticated;
```

Newsletter Leads (newsletter_leads)
```sql
CREATE TABLE newsletter_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'footer',
  consent_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_newsletter_leads_email ON newsletter_leads(lower(email));

GRANT INSERT ON newsletter_leads TO anon;
GRANT ALL PRIVILEGES ON newsletter_leads TO authenticated;
```

Storage (recomandare)
- Bucket: `rwa-documents` (public read) pentru PDF-uri/fișiere; `file_url` poate fi URL public sau path către fișier în bucket.
