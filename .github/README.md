# GitHub automation

| Area | Files |
|------|--------|
| **CI** | [`workflows/ci.yml`](workflows/ci.yml) — lint, typecheck, unit tests, E2E, build |
| **Deploy** | [`workflows/deploy-pages.yml`](workflows/deploy-pages.yml), [`release.yml`](workflows/release.yml) |
| **Quality** | [`workflows/codeql.yml`](workflows/codeql.yml), [`workflows/lighthouse-ci.yml`](workflows/lighthouse-ci.yml), [`workflows/dependency-review.yml`](workflows/dependency-review.yml) |
| **Housekeeping** | [`workflows/stale.yml`](workflows/stale.yml), [`workflows/cleanup-stale-branches.yml`](workflows/cleanup-stale-branches.yml) |
| **PR labels** | [`labeler.yml`](labeler.yml) + [`workflows/labeler.yml`](workflows/labeler.yml) |
| **Dependencies** | [`dependabot.yml`](dependabot.yml) |
| **Reviews** | [`CODEOWNERS`](CODEOWNERS) |
| **Templates** | [`ISSUE_TEMPLATE/`](ISSUE_TEMPLATE/), [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) |

Dependency updates run weekly (Monday 09:00 Europe/Bucharest). Ensure label names used in `labeler.yml` exist in the repo **Settings → Labels**.
