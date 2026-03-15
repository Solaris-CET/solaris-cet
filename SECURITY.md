# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public GitHub issue. Instead:

1. Open a [GitHub Security Advisory](https://github.com/aamclaudiu-hash/solaris-cet/security/advisories/new) directly in this repository.
2. Provide a clear description of the vulnerability, including steps to reproduce, potential impact, and any suggested fixes.

We will acknowledge your report within **72 hours** and aim to release a fix within **7 days** for critical issues.

## Security Best Practices

This project is a static frontend application. The following measures are in place:

- **Content Security Policy (CSP)** — restricts the sources from which scripts, styles, and other resources can be loaded.
- **No server-side secrets** — all blockchain interactions are read-only via public TON APIs.
- **Dependabot** — automated dependency vulnerability scanning and version-update pull requests are configured via `.github/dependabot.yml` for both npm (`app/`) and GitHub Actions ecosystems.
- **CodeQL SAST** — static application security testing via the CodeQL workflow (`.github/workflows/codeql.yml`) runs on every push and pull request targeting `main`, as well as on a weekly schedule, scanning for data-flow vulnerabilities, XSS patterns, and other insecure code patterns.
- **Native platform APIs** — cryptographically secure randomness is sourced from the Web Crypto API (`crypto.getRandomValues()`) wherever unique values are generated, avoiding non-cryptographic `Math.random()` for such purposes.

## Scope

The following are **in scope** for security reports:

- Cross-Site Scripting (XSS)
- Malicious dependency injection
- Insecure external resource loading
- Data leakage through the frontend

The following are **out of scope**:

- Smart contract vulnerabilities (reported separately to the TON ecosystem)
- Issues in third-party libraries that have already been disclosed upstream
