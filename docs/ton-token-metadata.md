# TON Token Metadata — Solaris CET

This document contains the ready-to-copy JSON entry for the
[`ton-blockchain/token-metadata`](https://github.com/ton-blockchain/token-metadata) repository,
along with step-by-step instructions for submitting the verification pull request.

---

## JSON Entry for `jettons.json`

Add the following block inside the top-level array in `jettons.json`:

```json
{
  "address": "EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX",
  "name": "Solaris CET",
  "symbol": "CET",
  "description": "Official utility and governance token for the Solaris Ecosystem.",
  "image": "https://solaris-cet.com/logo.png",
  "websites": [
    "https://solaris-cet.com/"
  ],
  "social": [
    "https://t.me/solaris_cet_channel"
  ]
}
```

> **Image URL verification:** `https://solaris-cet.com/logo.png` resolves to `app/public/logo.png`
> in this repository (production is deployed from `main` via **Coolify** to **solaris-cet.com**;
> optional GitHub Pages mirrors may also serve the same asset).

---

## Step-by-Step PR Guide

### 1. Fork the repository

Go to <https://github.com/ton-blockchain/token-metadata> and click **Fork** in the
top-right corner. This creates a personal copy under your GitHub account.

### 2. Clone your fork locally

```bash
git clone https://github.com/<your-username>/token-metadata.git
cd token-metadata
```

### 3. Create a feature branch

```bash
git checkout -b feat/add-solaris-cet
```

### 4. Edit `jettons.json`

Open `jettons.json` and locate the alphabetically correct position for the entry
(entries are sorted by `address`). Insert the JSON block from the section above,
making sure to add a comma after the preceding entry if needed.

### 5. Validate the JSON

```bash
node -e "JSON.parse(require('fs').readFileSync('jettons.json','utf8')); console.log('Valid JSON');"
```

### 6. Commit the change

```bash
git add jettons.json
git commit -m "feat: add Solaris CET (CET) jetton metadata"
```

### 7. Push and open the pull request

```bash
git push origin feat/add-solaris-cet
```

Then open a pull request from `<your-username>/token-metadata:feat/add-solaris-cet`
to `ton-blockchain/token-metadata:main`.

**Suggested PR title:**
```
feat: add Solaris CET (CET) jetton
```

**Suggested PR body:**
```
## New Jetton

| Field       | Value |
|-------------|-------|
| Address     | EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX |
| Name        | Solaris CET |
| Symbol      | CET |
| Website     | https://solaris-cet.com/ |
| Logo        | https://solaris-cet.com/logo.png |

Verified that the image URL resolves correctly and the website is live.
```

---

## Notes

- The Jetton Master address `EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX` is the
  on-chain contract address for CET on the TON mainnet.
- The DeDust pool address for the CET/TON pair is
  `EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB`.
- The whitepaper is pinned on IPFS at CID
  `bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a`.
