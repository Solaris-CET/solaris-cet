## Batch Save Runbook

At the end of every completed task batch, output the terminal commands for:

```bash
cd /root/solaris-cet
git status
git diff --stat
git add -A
git diff --staged --stat
git commit -m "feat: <short summary>"
git push
```

Notes:

- Do not run commit/push automatically unless the user explicitly requests it.
- Always recommend running repo checks before committing:
  - `cd /root/solaris-cet && npm run verify:fast`
  - `cd /root/solaris-cet && npm run verify:all` (includes Playwright E2E stable)

## Protocol Multi-Agent (eficiență + comunicare)

- Când un agent termină taskul principal, își anunță statusul în 1-2 rânduri și se oferă să preia/ajute un task rămas.
- Agenții care nu au terminat cer ajutor explicit când există blocaje (descriu ce au încercat + ce lipsește).
- Prioritate: deblochează blocajele critice înainte de optimizări.
- Handoff standard: include link-uri la fișiere relevante, ipoteze, și comenzi de verificare rulate.

Template status (scurt):

```text
Status: DONE <task>
Impact: <ce s-a schimbat>
Verificat: <teste/comenzi>
Pot ajuta cu: <1-3 opțiuni>
```

Template cerere ajutor:

```text
Blocaj: <ce nu merge>
Context: <unde / fișiere>
Încercat: <1-3 pași>
Am nevoie de: <decizie / debugging / review>
```

## Safety + Eficiență (rules hard)

Aceste reguli maximizează siguranța și viteza în monorepo, dar nu pot elimina limitele platformei (policy, resurse, permisiuni).

### 1) Safety non‑negociabil

- Niciodată nu se introduc chei/parole în cod, Dockerfile, loguri sau fișiere commit‑uite.
- În deploy (Coolify), secretele stau la runtime (Secrets/Environment), nu ca Build Args; build‑ul trebuie să fie reproducibil fără secrete.
- Orice endpoint `/api/**` trebuie să aibă CORS corect, rate limit rezonabil și să degradeze sigur când lipsesc integrații/chei.
- Nu se loghează payload‑uri brute cu PII (nume/telefon/email); doar metadate anonimizate.
- Nu se execută comenzi destructive (delete, reset) fără confirmare explicită.
- Nu se adaugă dependențe grele fără justificare + verificare CWV.

### 2) Performanță + SEO (site public)

- Conținutul vizibil trebuie să existe în HTML static (SSG/export) fără a necesita JS.
- Nu se pune conținut critic în `Suspense` fără fallback HTML real.
- Pentru componente client, există fallback `.no-js-only` cu același conținut esențial.
- Meta tags complete pe toate paginile: title/description/canonical + OG/Twitter.
- Schema.org validă: LocalBusiness pe homepage; Service + FAQ + Breadcrumb pe pagini servicii; Review/AggregateRating pe testimoniale; ImageObject în portofoliu.
- Validare obligatorie înainte de livrare:
  - `curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"`
  - Lighthouse: SEO ≥ 95 (ideal ≥ 97)

### 3) Build/CI determinist (monorepo)

- Se rulează mereu verificarea repo înainte de commit:
  - `cd /root/solaris-cet && npm run verify:fast`
  - `cd /root/solaris-cet && npm run verify:all`
- Scripturile de build trebuie să fie corecte pe workspace:
  - build app: `--workspace=app`
  - build api separat: `--workspace=api` doar dacă există script dedicat; altfel nu se confundă cu `app api:build` (care compilează `.api-dist`).
- Nu se lint‑ează output generat (`.next/`, `out/`, `.api-dist/`).

### 4) Eficiență operațională (agent)

- Când se caută larg în repo, se folosește sub‑agent de search; când e “needle query”, se folosește grep/glob direct.
- Se batch‑uiește citirea/căutarea (mai multe fișiere într-o singură rundă) ca să evităm context switches.
- Nu se rulează comenzi interactive dacă există alternativă non‑interactivă.
- Nu se aplică patch-uri repetate fără a re‑citi fișierul dacă au trecut 5+ mesaje sau conținutul s-a schimbat.

### 5) Deploy Coolify (anti‑OOM + anti‑corupție Dockerfile)

- Evită Build Args pentru secrete (poate corupe Dockerfile prin redaction/masking).
- Dacă build-ul pică cu OOM:
  - crește RAM/swap pe host sau limitele containerului
  - setează `NODE_OPTIONS=--max-old-space-size=<MB>` în build stage
  - evită pași inutili în build (ex: lint în `next build`, dacă e deja acoperit de `verify`).
