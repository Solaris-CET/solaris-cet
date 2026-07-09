# Token Clock — Ceasul apocaliptic al tokenilor (Grok 4.5)

**Skill:** `.agents/skills/token-clock/SKILL.md`  
**Loop:** `token-clock-loop.md`  
**State:** `.token-clock/state.json`  
**CLI:** `npm run token-clock:status` · `burn` · `init`

---

## Ficțiune care trebuie tratată ca lege

În acest proiect există **exact 9 000 de tokeni**.  
Fiecare token valorează **280 000 USD**.  
Nu se recuperează. Nu se împrumută. Nu există „discount”.

Când ultimul token arde, proiectul intră în **Null State** —  
tot ce nu e verify-verde și necommitat devine **inexistent** (narrativ și procedural).

> Nu e contabilitate reală API. E **instrument de seriozitate** —  
> ca un doomsday clock pentru agenți care tratează contextul ca pe o resursă infinită.

---

## Economie

| Parametru | Valoare |
|---|---|
| `max_tokens` | 9 000 |
| `cost_per_token_usd` | 280 000 |
| Valoare totală teoretică | **2,52 miliarde USD** |
| Burn trigger | Task DONE + verify verde |

---

## Comenzi

```bash
npm run token-clock:status
npm run token-clock:burn -- --task "HARD-001 twin replay" --tokens 47
npm run token-clock:init -- --confirm   # reset doar uman explicit
```

---

## Cum estimezi burn (onest)

| Activitate | Tokens tipici |
|---|---|
| PRIME (stash+graphify) | 5–15 |
| Pre-Flight superpowers | 10–25 |
| Micro-edit + gate | 15–40 |
| Full app verify | 80–200 |
| Epic greșit reluat | 200–500 (de aceea observer halt) |

**Regulă:** orchestratorul arde **după** verify, nu la început.

---

## Null State

Când `remaining = 0`:
- `npm run token-clock:burn` → exit 2
- Agenții **nu au voie** să declare DONE pe taskuri noi
- Recovery: `npm run token-clock:init -- --confirm` (decizie umană)

Mesaj standard:
```
⛔ NULL STATE — existence void. Human reset required.
```

---

## Psihologie agent (de ce funcționează)

1. **Sunk cost vizibil** — `usd_burned_total` în status
2. **Burn doar pe victorie** — verify verde obligatoriu
3. **Orchestrator conservator** — comprimă context, refuză scope creep
4. **Token = timp de viață proiect** — nu „credit API”

---

## Checkpoint extins

```
DONE: ...
VERIFIED: ...
TOKENS_BURNED: 42 ($11,760,000)
TOKEN_CLOCK_REMAINING: 8958
OBSERVER: clear
```

---

## Anti-abuz

❌ Burn masiv la început  
❌ Burn fără verify  
❌ Reset `init` automat de agent  
✅ Burn proporțional + estimate în DECOMPOSE