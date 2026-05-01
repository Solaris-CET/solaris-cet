# Protocol de colaborare multi-agent (Solaris CET)

## Scop

- Finalizare rapidă a taskurilor fără blocaje ascunse
- Comunicare scurtă, standardizată, ușor de urmărit
- Redistribuire imediată a muncii când un agent termină

## Reguli operaționale

- Un agent are mereu un singur task activ; când termină, își schimbă rolul în „support” până se descarcă backlog-ul critic.
- Când apare un blocaj, agentul afectat cere ajutor imediat (nu continuă în cerc).
- Ajutorul se acordă pe criteriul „maxim impact / minim timp”:
  - Fixuri care reduc 500/404/redirect-uri inutile
  - Fixuri care deblochează build/test/deploy
  - Optimizări doar după ce fluxul principal e stabil

## Regula de redistribuire (cum ajungem la „done”)

- Când un agent finalizează: postează „DONE” + 1–3 opțiuni de ajutor și începe imediat un micro-task de support (review/diagnostic/test) fără a atinge fișierele owner-ului.
- Când un agent e blocat: cere ajutor cu template; dacă nu există răspuns rapid, owner-ul reasignează.

## Status update (ritm)

- La final de task: status + verificare + ce poate prelua agentul.
- La blocaj: cerere ajutor cu context și pași încercați.
- La preluare: confirmare scurtă a ceea ce preiei și ce livrezi.

## Template-uri

### Status finalizat

```text
Status: DONE <task>
Impact: <ce s-a schimbat>
Verificat: <teste/comenzi>
Risc: <0-1 riscuri, dacă există>
Pot ajuta cu: <1-3 opțiuni>
```

### Ofer ajutor

```text
Status: AVAILABLE
Pot ajuta cu:
- <micro-task 1>
- <micro-task 2>
- <micro-task 3>
Nu ating: <folder/fișier> fără acord
```

### Cerere ajutor

```text
Blocaj: <ce nu merge>
Context: <unde / fișiere>
Încercat: <1-3 pași>
Observații: <loguri/erori relevante>
Am nevoie de: <decizie / debugging / review>
```

### Handoff către alt agent

```text
Handoff: <task>
Stare curentă: <ce e gata>
Fișiere: <1-5 fișiere>
Ipoteze: <1-3>
De rulat: <comenzi de verify>
```

## Checklist de eficiență

- Preferă o singură sursă de adevăr pentru status (task list) și update-uri scurte.
- Orice schimbare trebuie verificată local (măcar `verify:fast`) înainte de handoff.
- Nu lăsa taskuri „aproape gata”: fie finalizezi, fie faci handoff complet.
