# SOLARIS CET — Planificare Buget API Claude Fable 5 ($20.41)

**Data:** 5 iulie 2026
**Credite disponibile:** $20.41 (Claude Console)
**Model:** `claude-fable-5` — cel mai capabil model Anthropic
**Sursă prețuri:** documentație oficială Anthropic API (verificată 2026-07-05)

---

## 1. PREȚURI REALE (per 1 milion tokeni)

| Model | Input | Output | Observații |
|---|---|---|---|
| **Claude Fable 5** | **$10.00** | **$50.00** | Gândirea internă (thinking) e mereu activă și se taxează ca OUTPUT |
| Claude Opus 4.8 | $5.00 | $25.00 | Jumătate din prețul Fable, foarte capabil |
| **Claude Sonnet 5** | **$2.00** | **$10.00** | Preț introductiv până la 31 aug 2026 (apoi $3/$15) |
| Claude Haiku 4.5 | $1.00 | $5.00 | Pentru clasificări simple |

**Reduceri disponibile:**
- **Batch API: -50%** pe tot (input + output) — pentru joburi care nu sunt urgente (majoritatea se termină sub 1 oră)
- **Prompt caching: -90%** pe partea cache-uită la citire (system prompt + template-uri repetate)
- **Imagini:** până la ~4.784 tokeni/imagine la rezoluție mare (~$0.05/poză pe Fable) — **NU trimite poze la Fable 5**, vision-ul rămâne pe DeepSeek/Kimi conform rutării existente

---

## 2. COST REAL PER RAPORT (calculat)

Job tipic Fable 5 în SOLARIS CET: primește datele extrase de DeepSeek (text, nu poze) și scrie executive summary + recommendations premium.

| Componentă | Tokeni | Cost |
|---|---|---|
| Input: system prompt + date extrase + instrucțiuni | ~5.000 | $0.05 |
| Output: thinking (~1.500) + text final (~2.000) | ~3.500 | $0.175 |
| **TOTAL per raport (apel direct)** | | **~$0.22** |
| **TOTAL per raport (Batch API, -50%)** | | **~$0.11** |
| **TOTAL cu caching pe system prompt (apeluri în serie)** | | **~$0.19** |

### Ce cumperi cu $20.41:

| Strategie | Rapoarte premium / lună |
|---|---|
| Toate direct, fără optimizări | ~90 |
| Cu Batch API (rapoarte care pot aștepta <1h) | ~180 |
| **Hibrid recomandat (vezi §3)** | **100+ rapoarte, folosind doar ~$8-10** |

Concluzie: bugetul de $20/lună e **suficient și rămâne rezervă**, dacă respecți regulile de mai jos.

---

## 3. STRATEGIA DE EFICIENȚĂ MAXIMĂ (regulile de aur)

### Regula 1 — Fable 5 primește DOAR text, niciodată poze
Vision = DeepSeek (default) sau Kimi (10+ poze). Fable primește rezultatul extras ca text.
O poză pe Fable costă cât 5 pagini de text scris.

### Regula 2 — Rutare pe două niveluri de "premium"
- **Sonnet 5 ($2/$10 intro)** → texte premium standard: ~$0.045/raport, de 5× mai ieftin, calitate aproape de Opus la scriere. Folosește-l pentru majoritatea rapoartelor "premium".
- **Fable 5** → doar top-tier: clienți mari, AHJ-uri pretențioase, analize complexe, situații ambigue. Estimat 15-20% din volum.

Exemplu la 100 rapoarte/lună: 80 × Sonnet 5 ($3.60) + 20 × Fable 5 ($4.40) = **~$8/lună total**.

### Regula 3 — Controlează `effort` (cel mai mare levier de cost pe Fable)
Thinking-ul e mereu activ pe Fable 5 și se plătește la $50/1M ca output:
- `output_config: {effort: "low"}` sau `"medium"` → pentru summary-uri și recommendations standard
- `"high"` → doar pentru analize complexe / research
- Nu folosi `"xhigh"`/`"max"` pentru scriere de rapoarte — arde tokeni fără câștig vizibil

### Regula 4 — Batch API pentru tot ce nu e live
KPI-ul de <20 min per vizită cere apel direct (streaming) pentru raportul din teren.
Dar: regenerări, traduceri, rapoarte de a doua zi, procesare în lot seara → **Batch API, -50%**.

### Regula 5 — Prompt caching pe system prompt
- System prompt-ul SOLARIS (instrucțiuni de stil, structura raportului, exemple) trebuie să fie **static, ≥2.048 tokeni** (minimul cache-abil pe Fable 5) cu `cache_control: {type: "ephemeral"}`
- NU pune data/ora sau ID-uri variabile în system prompt — invalidează cache-ul la fiecare apel
- Datele variabile (site-ul curent) merg în mesajul user, după breakpoint-ul de cache

### Regula 6 — Limitează output-ul
`max_tokens: 4000` pentru summary + recommendations e suficient. Output-ul e partea scumpă ($50/1M) — nu lăsa modelul să scrie 10 pagini când clientul citește 2.

---

## 4. PARAMETRI API CORECȚI PENTRU FABLE 5 (important — diferă de alte modele!)

```python
response = client.beta.messages.create(
    model="claude-fable-5",
    max_tokens=4000,
    betas=["server-side-fallback-2026-06-01"],
    fallbacks=[{"model": "claude-opus-4-8"}],   # dacă Fable refuză, Opus preia automat
    output_config={"effort": "medium"},          # levierul principal de cost
    system=[{
        "type": "text",
        "text": SOLARIS_SYSTEM_PROMPT,           # static, ≥2048 tokeni
        "cache_control": {"type": "ephemeral"},
    }],
    messages=[{"role": "user", "content": date_extrase_de_deepseek}],
)
# Verifică ÎNTOTDEAUNA înainte de a citi conținutul:
if response.stop_reason == "refusal":
    ...  # fallback-ul server-side rezolvă majoritatea cazurilor
```

**Atenție — Fable 5 respinge cu eroare 400:**
- orice parametru `thinking` explicit în afară de `{type: "adaptive"}` (omite-l complet — thinking e mereu activ)
- `temperature`, `top_p`, `top_k` (eliminate; stilul se controlează din prompt)
- prefill de mesaj assistant (folosește `output_config.format` pentru JSON structurat)
- **cerință de cont:** organizația trebuie să aibă retenție de date de 30 zile (nu merge cu Zero Data Retention) — altfel TOATE cererile dau 400

---

## 5. BUGET LUNAR PROPUS ($20.41)

| Alocare | Sumă | Acoperă |
|---|---|---|
| Fable 5 — rapoarte top-tier (~20/lună, effort medium) | $4.50 | Clienți mari, AHJ, analize complexe |
| Fable 5 — research & prompt tuning | $2.00 | Îmbunătățirea continuă a prompturilor |
| Sonnet 5 — rapoarte premium standard (~80/lună) | $3.60 | Majoritatea textelor premium |
| Batch — regenerări / procesare în lot | $2.00 | Joburi non-urgente la -50% |
| **Rezervă / creștere volum** | **$8.31** | Buffer pentru luni aglomerate |

**Monitorizare:** loghează `response.usage` (input_tokens, output_tokens, cache_read_input_tokens) la fiecare apel — e deja în roadmap v0.2 ("Logging de cost per raport"). Prag de alertă: $15 consumați → treci temporar totul pe Sonnet 5.

---

## 6. CE NU FACI (anti-pattern-uri care ard bugetul)

1. ❌ Poze trimise la Fable 5 (vision = DeepSeek/Kimi)
2. ❌ `effort: "xhigh"` / `"max"` pentru scriere de rapoarte
3. ❌ Conversații lungi multi-turn cu Fable (fiecare tur retrimite tot istoricul ca input) — trimite un singur apel bine specificat, cu tot contextul din prima
4. ❌ System prompt cu timestamp / ID-uri variabile (ucide prompt caching-ul)
5. ❌ `max_tokens` nelimitat la joburi de scriere
6. ❌ Fable 5 pentru clasificări, extrageri simple, checklist processing — acolo e DeepSeek/Haiku

---

*Planificare generată pe baza prețurilor oficiale Anthropic API, 5 iulie 2026.*
