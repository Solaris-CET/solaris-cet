/**
 * Public filenames only (no `import.meta`) so Node/tsconfig.node can import from `vite.config.ts`.
 * Re-exported from `brandAssets.ts` for app code.
 *
 * `PRODUCTION_SITE_ORIGIN` / URL helpers must stay aligned with `app/index.html` meta + JSON-LD
 * and `app/public/tonconnect-manifest.json` (see `productionTonConnectIconUrl` vs brand lockup).
 */
export const PRODUCTION_SITE_ORIGIN = "https://solaris-cet.com" as const;

export const SOLARIS_CET_LOGO_FILENAME = "solaris-cet-logo.jpg" as const;

/**
 * Square PWA icon for TON Connect `iconUrl` (192×192 PNG). Do not use the portrait lockup JPG —
 * wallets expect a roughly square asset.
 */
export const TONCONNECT_ICON_FILENAME = "icon-192.png" as const;

/** Social preview card (1200×630 typical); matches `og:image` / `twitter:image` in `index.html`. */
export const OG_IMAGE_FILENAME = "og-image.png" as const;

/** Canonical site URL (TON `url`, canonical link). */
export function productionSiteUrl(): string {
  return PRODUCTION_SITE_ORIGIN;
}

/** Absolute production URL for the raster lockup (matches Organization `logo` in `index.html`). */
export function productionBrandLogoUrl(): string {
  return `${PRODUCTION_SITE_ORIGIN}/${SOLARIS_CET_LOGO_FILENAME}`;
}

/** Absolute URL for Open Graph / Twitter large card image. */
export function productionOgImageUrl(): string {
  return `${PRODUCTION_SITE_ORIGIN}/${OG_IMAGE_FILENAME}`;
}

/** Absolute URL for `tonconnect-manifest.json` `iconUrl` (square icon for wallet UIs). */
export function productionTonConnectIconUrl(): string {
  return "https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreid6hoewfj66y6wwefhiyp46madxlqtgnvut6tz7y2i4xwbj5yda3a";
}
