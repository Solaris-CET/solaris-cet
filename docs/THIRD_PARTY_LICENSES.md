# Third-Party Licenses (Compliance)

This repository depends on third-party packages (npm workspaces). Their licenses are defined by their authors and must be respected. This project does not and cannot “re-license” third-party dependencies.

## Generate Reports

From the repo root:

```bash
npm run licenses:prod
```

Generates:

- `artifacts/licenses/THIRD_PARTY_LICENSES.production.json`
- `artifacts/licenses/THIRD_PARTY_LICENSES.production.csv`

To include dev dependencies as well:

```bash
npm run licenses:all
```

Generates:

- `artifacts/licenses/THIRD_PARTY_LICENSES.all.json`
- `artifacts/licenses/THIRD_PARTY_LICENSES.all.csv`

## Notes

- The generated files are intentionally ignored by git (`/artifacts/`).
- If a vendor requires a NOTICE bundle, use the generated reports to assemble it with the license texts/URLs required by each dependency.

