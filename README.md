# Solaris CET

[![Deploy to GitHub Pages](https://github.com/aamclaudiu-hash/solaris-cet/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/aamclaudiu-hash/solaris-cet/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Solaris CET** is a decentralized token project built on the TON blockchain. This repository contains the official landing page — a high-performance static web application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **GSAP** animations, deployed automatically via **GitHub Actions** to **GitHub Pages**.

---

## 🚀 One-Click Deploy (Fork & Host Your Own Instance)

You can spin up your own hosted instance of Solaris CET in under 2 minutes — no server, no paid hosting, no configuration required.

### Step 1 — Fork this repository

Click the **Fork** button at the top-right of this page:

> **[https://github.com/aamclaudiu-hash/solaris-cet/fork](https://github.com/aamclaudiu-hash/solaris-cet/fork)**

### Step 2 — Enable GitHub Pages in your fork

1. Open your forked repository on GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Click **Save**.

### Step 3 — Trigger the deployment

The site is built and deployed automatically on every `git push` to the `main` branch.
To trigger an immediate deployment without pushing code:

1. Go to **Actions** → **Deploy Solaris CET to GitHub Pages**.
2. Click **Run workflow** → **Run workflow**.

### Step 4 — Access your live site

After the workflow completes (≈ 2 minutes), your site will be live at:

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
│   │   ├── deploy-pages.yml    # Build + deploy to GitHub Pages on every push to main
│   │   ├── codeql.yml          # CodeQL SAST security scanning
│   │   ├── lighthouse-ci.yml   # Lighthouse performance audit (≥ 85 required)
│   │   ├── multisig-ci.yml     # TON multi-sig contract build & test
│   │   └── ton-indexer.yml     # TON blockchain state indexing
│   ├── ISSUE_TEMPLATE/         # Bug report and feature request forms
│   └── PULL_REQUEST_TEMPLATE.md
├── api/                        # Edge API routes (Vercel)
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
│   ├── api/                    # App-level API routes (Node.js runtime)
│   │   └── chat/route.ts       # OpenAI-powered chat endpoint
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
├── README.md
├── SECURITY.md
└── WHITEPAPER.md
```

---

## ✨ UI Features

| Feature | Description |
|---------|-------------|
| **CursorGlow** | Fixed radial-gradient spotlight that follows the cursor with lerp(0.1) smoothing. Hidden on touch/mobile. |
| **GlowOrbs** | Ambient animated blobs per section (`gold \| cyan \| mixed` variants, `animate-orb-pulse` keyframe). |
| **AnimatedCounter** | GSAP counter from 0 → target, triggered by IntersectionObserver; supports prefix, suffix, and decimal places. |
| **Scroll progress bar** | Gold→cyan→gold gradient line in the navigation bar that fills as you scroll. |
| **Loading screen** | 1.8 s overlay with animated logo + progress bar, fades out with GSAP (`LOADING_DURATION_MS = 1800`). |
| **Hero parallax** | 3-D mouse-driven parallax on the coin and stat cards (`rotateX`/`rotateY` + lerp). |
| **HybridEngine nodes** | Click-to-expand PoW/DPoS node cards; animated SVG path (`strokeDashoffset` loop). |
| **Tokenomics ring** | GSAP-animated radial SVG ring showing mined supply (0 % → current %). |
| **Footer** | Real social links (Twitter, Discord, Telegram, GitHub, DeDust), copy-to-clipboard pool address, IPFS whitepaper link, live-status indicator. |

---

## 🛠️ Local Development

### Prerequisites

- **Node.js** ≥ 20 ([download](https://nodejs.org/))
- **npm** ≥ 10 (bundled with Node.js)

### Setup

```bash
# 1. Clone the repository (or your fork)
git clone https://github.com/aamclaudiu-hash/solaris-cet.git
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
| Hosting       | [GitHub Pages](https://pages.github.com/) / [Vercel](https://vercel.com/) |
| CI/CD         | [GitHub Actions](https://github.com/features/actions) |
| Security      | CodeQL SAST, Dependabot, npm audit              |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.
You are free to fork, modify, and host your own instance under the same license terms.

