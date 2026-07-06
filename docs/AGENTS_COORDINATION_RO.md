# Coordonare agenți (Trae)

Acest repo folosește un „owner agent” care coordonează execuția în paralel astfel încât modificările să nu se calce și verificările să fie coerente.

## Reguli rapide

- Un singur responsabil pe fișiere: evită editarea simultană a acelorași fișiere/directoare.
- Separă pe ownership: `app/` (UI), `app/api/` (API), `app/db/` (schema), `scripts/` (tooling), `docs/` (documentație).
- Nu introduce schimbări „latente” (fișiere noi, endpoints, pagini) dacă nu rezolvă un blocant concret.
- Orice modificare trebuie închisă cu verificare: `npm run build --workspace=app` și `npm run test --workspace=app`.

## Roluri (pentru comunicare + eficiență)

- **Owner (execuție)**: editează fișierele pentru taskul curent, conduce integrarea și verificarea.
- **Support (ajutor)**: nu începe schimbări paralele pe aceleași fișiere; face debugging, code review, teste, sau patch-uri izolate cerute de owner.

Regulă simplă: când termini taskul principal, treci în **support** până se descarcă backlog-ul critic.

## Contract de ajutor (cerut + oferit)

- Dacă ești blocat: cere ajutor imediat, cu context minim (nu continua în cerc).
- Dacă ai terminat: oferă ajutor activ, cu 1–3 opțiuni concrete și timp estimat.
- Dacă preiei ajutorul: confirmă ce preiei și ce livrezi.

## Handoff minim între agenți

- Ce fișiere au fost atinse.
- Ce erori au fost observate (1–3 linii relevante).
- Fix propus (1–2 propoziții) + cum se verifică.

## Template-uri scurte (copy/paste)

### Ofer ajutor

```text
Status: AVAILABLE
Pot ajuta cu:
- <opțiune 1, 10–20 min>
- <opțiune 2, 10–20 min>
- <opțiune 3, 20–40 min>
Constrângeri: nu editez <folder/fișier> fără acord
```

### Cer ajutor

```text
Blocaj: <1 propoziție>
Unde: <fișier/rută>
Încercat: <1-3 pași>
Eroare: <1-3 linii>
Cer: <debug/decizie/review>
```

## Convenție pentru patch-uri

- Preferă patch-uri mici, localizate.
- Evită modificări în masă fără motiv (de ex. schimbări de stil/format necerute).
- Dacă un test e fragil, fixează testul (mock/async) sau comportamentul observabil, nu ambele simultan.
