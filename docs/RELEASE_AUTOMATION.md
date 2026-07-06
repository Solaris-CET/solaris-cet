# Release automation

Repo-ul folosește **commit-uri convenționale** + **release-please** pentru:

- versionare automată
- PR de release
- generare/actualizare `CHANGELOG.md`

Fișiere relevante:

- `.github/workflows/release-please.yml`
- `.release-please-config.json`
- `.release-please-manifest.json`
- `CHANGELOG.md`

## Reguli (convențional)

Folosește prefixe de tip:

- `feat:`
- `fix:`
- `chore:`
- `docs:`
- `refactor:`
- `test:`

## Impunere

- Pentru semnături: pipeline-ul CI are un gate care verifică statusul de semnătură (GitHub “verified”).
- Pentru release-uri: doar branch-ul protejat ar trebui să poată ajunge în `main`.

