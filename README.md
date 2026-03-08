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
│   │   └── deploy-pages.yml   # CI/CD: build + deploy to GitHub Pages
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                       # React + TypeScript + Vite source
│   ├── src/
│   │   ├── sections/          # Page sections (Hero, Tokenomics, etc.)
│   │   ├── components/        # Reusable UI components (shadcn/ui)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/                # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

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
| Bundler       | [Vite 7](https://vite.dev/)                     |
| Styling       | [Tailwind CSS 3](https://tailwindcss.com/)      |
| Components    | [shadcn/ui](https://ui.shadcn.com/)             |
| Animations    | [GSAP 3](https://gsap.com/)                     |
| Blockchain    | [TON Network](https://ton.org/)                 |
| Hosting       | [GitHub Pages](https://pages.github.com/)       |
| CI/CD         | [GitHub Actions](https://github.com/features/actions) |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.
You are free to fork, modify, and host your own instance under the same license terms.
