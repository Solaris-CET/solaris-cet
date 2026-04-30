## Politica de colectare a datelor (draft)

### Scop

Datele sunt colectate pentru:
- măsurarea conversiei (landing → conectare → stake);
- îmbunătățirea experienței CET AI (activare, retenție, copy implicit);
- diagnosticare performanță (Core Web Vitals, erori operaționale);
- raportare internă (dashboard admin) și decizii de produs.

### Consimțământ (cookie consent)

Colectarea de analiză comportamentală este condiționată de consimțământul utilizatorului pentru categoria analytics.

### Ce colectăm

**Evenimente de produs (analytics_events)**
- nume eveniment (ex: page_view, wallet_connect, ai_query, ai_activation, stake_start);
- identificatori tehnici: anonId (random), sessionId (rotit la inactivitate);
- context: pagePath, referrer;
- proprietăți eveniment (JSON minimal, fără PII intenționat);
- ipHash (doar dacă există salt de hashing configurat), uaHash (hash user-agent).

**Date de cont (dacă utilizatorul se autentifică)**
- walletAddress (în tabelul users) și setări opționale (displayName/email dacă sunt setate);
- acțiuni web3 (web3_intents) și tranzacții (transactions) dacă există.

**Telemetrie CET AI**
- loguri de query (ai_query_logs) pentru analiză de performanță și utilizare.

### Ce NU colectăm intenționat

- parole;
- chei private / seed phrases;
- date sensibile în proprietățile evenimentelor.

### Retenție

Datele pot fi folosite agregat (KPI) și pot fi șterse/anonymizate la cerere conform GDPR.

### Drepturile utilizatorului (GDPR)

- export date: endpoint dedicat (download JSON);
- ștergere cont: endpoint dedicat; înainte de ștergere se face scrub/anonymizare pentru loguri sensibile unde este posibil.

### Integrări terțe (opțional)

Platforme de analytics/recording pot fi încărcate doar cu consimțământ analytics și doar dacă sunt configurate prin variabile de mediu (ex: Mixpanel, Amplitude, Hotjar).

