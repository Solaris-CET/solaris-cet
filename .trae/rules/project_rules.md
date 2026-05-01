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
