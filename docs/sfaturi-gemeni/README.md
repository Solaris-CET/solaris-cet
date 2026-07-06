# Sfaturi Gemini — import în repo

**Tot ce e aici sunt doar sfaturi și referință** (inspirație, audit, scaffold de laborator). Nu sunt specificații obligatorii și **nu** înlocuiesc arhitectura sau codul canonic din `app/` decât după review conștient și verificări (`lint`, `typecheck`, `test`, `build`).

Acest folder este **locul din repository** unde pui output-ul din Google AI Studio (Gemini), ca echipa și agenții Cursor să îl poată citi ca material consultativ.

## De ce nu „vede” agentul fișierele de pe Desktop

Workspace-ul de dezvoltare (inclusiv Cursor pe server / container) este copia **git** a proiectului. Calea ta locală:

`C:\Users\CCons\Desktop\Anonim\solaris-cet\sfaturi gemeni`

**nu** este în acel workspace până nu o copiezi aici.

## Ce să faci pe Windows

1. Deschide în Explorer: `...\Anonim\solaris-cet\sfaturi gemeni`
2. Selectează fișierele (`.md`, `.txt`, etc.)
3. Copiază-le în acest folder din repo: **`docs/sfaturi-gemeni/`**  
   (în clone-ul tău: `solaris-cet\docs\sfaturi-gemeni\`)
4. `git add docs/sfaturi-gemeni/` → commit → push (sau lasă agentul să le integreze după ce apar în workspace)

## Convenții utile

- `AUDIT_GEMINI_YYYY-MM-DD.md` — analiză / audit complet
- `ROADMAP_GEMINI.md` — doar priorități P0/P1/P2
- Păstrează nume **fără spații** în fișiere noi (ex. `sfaturi-gemeni.md`) ca să eviți probleme la unelte CLI.

După ce fișierele sunt aici, poți cere explicit: „citește `docs/sfaturi-gemeni/` și aplică itemii P0”.

## Conținut din PR #381 (upload GitHub)

În **`gemini-scaffold-pr381/`** este extrasă arhiva din [PR #381](https://github.com/Solaris-CET/solaris-cet/pull/381): un **scaffold** generat (componente React, `static/sovereign` minimal, `package.json`, etc.) — **tot sfaturi / exemplu**, nu cod de lipit peste producție. Vezi [`ORIGIN_PR381.md`](./ORIGIN_PR381.md) pentru sursă și limite.

Pentru **prompt reutilizabil** de audit (Markdown din Gemini), folosește [`PROMPT_ANALIZA_REPO_GEMINI.md`](./PROMPT_ANALIZA_REPO_GEMINI.md).
