/**
 * Canonical public filenames for Solaris CET brand rasters.
 * Keep in sync with `app/index.html` preload / JSON-LD and `app/public/tonconnect-manifest.json`
 * absolute URLs (same basename).
 */
export const SOLARIS_CET_LOGO_FILENAME = 'solaris-cet-logo.jpg' as const;

/** URL for `<img src>` / preload (respects Vite `base`). */
export function solarisCetLogoSrc(): string {
  return `${import.meta.env.BASE_URL}${SOLARIS_CET_LOGO_FILENAME}`;
}
