# Solaris CET

[![CI](https://github.com/Solaris-CET/solaris-cet/actions/workflows/ci.yml/badge.svg)](https://github.com/Solaris-CET/solaris-cet/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/Solaris-CET/solaris-cet/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Solaris-CET/solaris-cet/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Patents](https://img.shields.io/badge/Patents-None%20Reserved-blue.svg)](./PATENTS)

**Solaris CET** is a Real-World Asset (RWA) token on **TON** with a fixed supply of **9,000 CET**, anchored in **Cetățuia, Romania**. This repository contains the official landing — a **Vite** + **React 19** + **TypeScript** app styled with **Tailwind CSS** and **GSAP**.

### Production (single source of truth)

| | |
|--:|--|
| **URL** | [https://solaris-cet.com](https://solaris-cet.com) |
| **Repo** | [github.com/Solaris-CET/solaris-cet](https://github.com/Solaris-CET/solaris-cet) · branch **`main`** |
| **Server** | Project **VPS** (Debian/Ubuntu) |
| **Deploy** | **Coolify** (self-hosted) — build `app/` → serve `dist/`; push to **`main`** triggers deploy |

Treat **`main` as production**: a broken build breaks the live site. Optional **GitHub Pages** (`deploy-pages.yml`) is only for **forks** / mirrors — not the canonical host.

---

## 🚀 Fork mirror (optional — GitHub Pages)

You can host a read-only mirror from a fork using **GitHub Actions** → **GitHub Pages** (no Coolify required).

### Step 1 — Fork this repository

Click **Fork** (top-right): **[https://github.com/Solaris-CET/solaris-cet/fork](https://github.com/Solaris-CET/solaris-cet/fork)**

### Step 2 — Enable GitHub Pages in your fork

1. **Settings** → **Pages** → **Source** → **GitHub Actions** → **Save**.

### Step 3 — Deploy

On every `git push` to `main`, or manually: **Actions** → **Deploy Solaris CET to GitHub Pages** → **Run workflow**.

### Step 4 — URL

```
https://<your-github-username>.github.io/solaris-cet/
```

---

## 🏗️ Project Structure

```text
solaris-cet/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Quality gate: lint, typecheck, unit tests, E2E
│   │   ├── deploy-pages.yml    # Optional: GitHub Pages (forks); production uses Coolify
│   │   ├── codeql.yml          # CodeQL SAST security scanning
│   │   ├── lighthouse-ci.yml   # Lighthouse performance audit (≥ 85 required)
│   │   ├── multisig-ci.yml     # TON multi-sig contract build & test
│   │   └── ton-indexer.yml     # TON blockchain state indexing
│   ├── ISSUE_TEMPLATE/         # Bug report and feature request forms
│   └── PULL_REQUEST_TEMPLATE.md
├── api/                        # Optional root-level serverless chat (same handlers as app/api)
│   └── chat/route.ts           # AI chat proxy (edge runtime)
├── app/                        # React + TypeScript + Vite source
│   ├── src/
│   │   ├── sections/           # Page sections (Hero, Tokenomics, etc.)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui primitives (Radix-based)
│   │   │   ├── AnimatedCounter.tsx   # GSAP counter triggered by IntersectionObserver
│   │   │   ├── CursorGlow.tsx        # Mouse-following radial-gradient spotlight
│   │   │   ├── GlowOrbs.tsx          # Ambient animated glow blobs (gold / cyan / mixed)
│   │   │   ├── Navigation.tsx        # Fixed nav with scroll-progress bar
│   │   │   ├── ReActTerminal.tsx     # AI reasoning terminal (ReAct protocol)
│   │   │   └── ParticleCanvas.tsx    # Interactive particle field (canvas)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── i18n/               # Internationalization (multi-language support)
│   │   ├── lib/                # Utility functions & chain-state helpers
│   │   ├── workers/            # Web Workers (AI inference, mining)
│   │   ├── App.tsx             # Root component; GSAP ScrollTrigger registration
│   │   └── main.tsx            # Entry point
│   ├── api/                    # CET AI chat (Edge) + auth (Node); deploy with app on Coolify or similar
│   │   ├── chat/route.ts       # CET AI (Grok × Gemini) + DeDust context
│   │   └── auth/route.ts       # Wallet sync (Postgres)
│   ├── public/                 # Static assets (icons, images, state JSON)
│   ├── tests/                  # Playwright E2E tests
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── contracts/                  # TON smart contracts (Tact language)
├── docs/                       # Additional documentation
├── scripts/                    # Automation scripts (state updates, etc.)
├── simulations/                # Financial / tokenomics simulations
├── CMC_APPLICATION.md          # CoinMarketCap listing application
├── CONTRIBUTING.md
├── LICENSE
├── NOTICE
├── PATENTS
├── README.md
├── SECURITY.md
└── WHITEPAPER.md
```

### Package / folder guides

| Path | Quick link |
|------|------------|
| `app/` | [app/README.md](./app/README.md) |
| `api/` | [api/README.md](./api/README.md) |
| `contracts/` | [contracts/README.md](./contracts/README.md) |
| `docs/` | [docs/README.md](./docs/README.md) |
| `docker/` | [docker/README.md](./docker/README.md) |
| `scripts/` | [scripts/README.md](./scripts/README.md) |
| `simulations/` | [simulations/README.md](./simulations/README.md) |

---

## ✨ UI Features

| Feature | Description |
|---------|-------------|
| **CursorGlow** | Fixed radial-gradient spotlight that follows the cursor with lerp(0.1) smoothing. Hidden on touch/mobile. |
| **GlowOrbs** | Ambient animated blobs per section (`gold \| cyan \| mixed` variants, `animate-orb-pulse` keyframe). |
| **AnimatedCounter** | GSAP counter from 0 → target, triggered by IntersectionObserver; supports prefix, suffix, and decimal places. |
| **Scroll progress bar** | Gold→cyan→gold gradient line in the navigation bar that fills as you scroll. |
| **Loading screen** | Short overlay (~650 ms, 0 with reduced motion) with logo + progress bar, fades out with GSAP (`LOADING_DURATION_MS` in `App.tsx`). |
| **Hero parallax** | 3-D mouse-driven parallax on the coin and stat cards (`rotateX`/`rotateY` + lerp). |
| **HybridEngine nodes** | Click-to-expand PoW/DPoS node cards; animated SVG path (`strokeDashoffset` loop). |
| **Tokenomics ring** | GSAP-animated radial SVG ring showing mined supply (0 % → current %). |
| **Footer** | Real social links (Twitter, Discord, Telegram, GitHub, DeDust), copy-to-clipboard pool address, IPFS whitepaper link, live-status indicator. |

---

## 🛠️ Local Development

### Prerequisites

- **Node.js** ≥ 22 ([download](https://nodejs.org/)) — matches CI
- **npm** ≥ 10 (bundled with Node.js)

### Setup

```bash
# 1. Clone the repository (or your fork)
git clone https://github.com/Solaris-CET/solaris-cet.git
cd solaris-cet/app

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
# → Available at http://localhost:5173
```

### Build for production

```bash
cd app
npm run build
# Output is generated in app/dist/
```

Optional **deployment artifact seal** (footer hash + date in the React app, static seal on `/sovereign/`): set `VITE_GIT_COMMIT_HASH` and `VITE_BUILD_TIMESTAMP` in Coolify so the UI matches the deployed commit. See `app/.env.example` and `docs/CONTINUITY.md`.

### Preview production build locally

```bash
cd app
npm run preview
```

---

## ⚙️ Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| UI Framework  | [React 19](https://react.dev/)                  |
| Language      | [TypeScript 5](https://www.typescriptlang.org/) |
| Bundler       | [Vite 8](https://vite.dev/) + Rolldown          |
| Styling       | [Tailwind CSS 4](https://tailwindcss.com/)      |
| Components    | [shadcn/ui](https://ui.shadcn.com/) (Radix)     |
| Animations    | [GSAP 3](https://gsap.com/)                     |
| AI/ML         | [ONNX Runtime Web](https://onnxruntime.ai/) + [OpenAI](https://openai.com/) |
| Blockchain    | [TON Network](https://ton.org/) via TonConnect  |
| Hosting       | **Production:** VPS + [Coolify](https://coolify.io/) → **solaris-cet.com** · optional [GitHub Pages](https://pages.github.com/) forks |
| CI/CD         | Coolify (deploy) + [GitHub Actions](https://github.com/features/actions) (quality gates, optional Pages) |
| Security      | CodeQL SAST, Dependabot, npm audit              |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.
You are free to fork, modify, and host your own instance under the same license terms.

The **"Solaris CET"** name, logo, and CET token brand are proprietary trademarks
of the Solaris CET Team and are not covered by the MIT License.
See [NOTICE](./NOTICE) for third-party attributions and [PATENTS](./PATENTS) for the patent grant.

