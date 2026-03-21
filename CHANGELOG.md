# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- CodeQL SAST workflow (`.github/workflows/codeql.yml`) for automated static application security testing on every push and PR targeting `main`, and on a weekly schedule.
- Unit tests for `useMiningEfficiency` hook (battery API fallback, worker messaging).
- Unit tests for `useIntersectionObserver` hook (default option values, entry handling).
- Unit tests for `useLivePoolData` pure helpers (price/TVL/volume calculations, timeout signal).
- Roadmap phases for **Q1 2026 (Expand)** and **Q2 2026+ (Evolve)** reflecting the project's continued growth.

### Changed
- Roadmap: Q3 2025 marked as **Completed** (was In Progress).
- Roadmap: Q4 2025 marked as **Completed** (was Planned).
- Roadmap: Grid layout updated to 3-column (`lg:grid-cols-3`) to accommodate 6 phases cleanly.
- `sitemap.xml` `lastmod` updated to `2026-03-21`.

---

## [1.0.0] — 2025-06-01

### Added
- Initial public release of the Solaris CET landing page.
- React 19 + TypeScript + Vite stack with Tailwind CSS and GSAP animations.
- TON Connect wallet integration.
- Sections: Hero, Hybrid Engine, Intelligence Core, Nova App, Tokenomics, Compliance,
  Roadmap, How To Buy, Mining Calculator, Security, Whitepaper, High Intelligence,
  Ecosystem Index, Resources, Footer.
- i18n support for EN, ES, ZH, RU, RO.
- PWA service worker (Workbox) with offline support.
- GitHub Actions CI/CD pipeline (lint → unit test → build → E2E → deploy).
- Lighthouse CI quality gate (≥ 85 thresholds).
- Dependabot for automated npm and GitHub Actions version updates.
- Community automation workflow (first-time contributor welcome messages).
- TON Chain Indexer workflow (hourly on-chain state updates to `state.json`).
- Stale branch cleanup workflow.
- SECURITY.md, CONTRIBUTING.md, CMC_APPLICATION.md.

[Unreleased]: https://github.com/Solaris-CET/solaris-cet/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Solaris-CET/solaris-cet/releases/tag/v1.0.0
