import {
  OG_IMAGE_FILENAME,
  PRODUCTION_SITE_ORIGIN,
  productionBrandLogoUrl,
  productionOgImageUrl,
  productionSiteUrl,
  productionTonConnectIconUrl,
  SOLARIS_CET_LOGO_FILENAME,
  TONCONNECT_ICON_FILENAME,
} from './brandAssetFilenames';

export {
  OG_IMAGE_FILENAME,
  PRODUCTION_SITE_ORIGIN,
  productionBrandLogoUrl,
  productionOgImageUrl,
  productionSiteUrl,
  productionTonConnectIconUrl,
  SOLARIS_CET_LOGO_FILENAME,
  TONCONNECT_ICON_FILENAME,
};

/**
 * When renaming assets: update `brandAssetFilenames.ts` (logo + `OG_IMAGE_FILENAME`, URL helpers),
 * `.gitignore` `!app/public/…`, `app/index.html` (preload, JSON-LD, og/twitter),
 * `app/public/tonconnect-manifest.json` (`iconUrl` → `productionTonConnectIconUrl`, `url`). PWA precache: `vite.config.ts` `includeAssets`.
 */

/** URL for `<img src>` / preload (respects Vite `base`). */
export function solarisCetLogoSrc(): string {
  return `${import.meta.env.BASE_URL}${SOLARIS_CET_LOGO_FILENAME}`;
}
