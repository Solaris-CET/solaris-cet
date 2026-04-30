import {
  OG_IMAGE_FILENAME,
  SOLARIS_CET_LOGO_FILENAME,
  solarisCetLogoSrc,
  TONCONNECT_ICON_FILENAME,
} from '@/lib/brandAssets';

export type AssetType = 'logo' | 'image' | 'icon' | 'doc';

export type BrandAsset = {
  id: string;
  name: string;
  type: AssetType;
  format: string;
  href: string;
  previewHref?: string;
};

function baseAssetHref(pathname: string) {
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

export function getBrandAssets(): BrandAsset[] {
  return [
    {
      id: 'logo-lockup-jpg',
      name: 'Solaris CET — logo lockup',
      type: 'logo',
      format: 'JPG',
      href: baseAssetHref(`/${SOLARIS_CET_LOGO_FILENAME}`),
      previewHref: solarisCetLogoSrc(),
    },
    {
      id: 'logo-mark-png',
      name: 'Logo mark',
      type: 'logo',
      format: 'PNG',
      href: baseAssetHref('/logo.png'),
      previewHref: baseAssetHref('/logo.png'),
    },
    {
      id: 'pwa-icon-192',
      name: 'PWA icon (192×192)',
      type: 'icon',
      format: 'PNG',
      href: baseAssetHref(`/${TONCONNECT_ICON_FILENAME}`),
      previewHref: baseAssetHref(`/${TONCONNECT_ICON_FILENAME}`),
    },
    {
      id: 'og-image',
      name: 'Open Graph image',
      type: 'image',
      format: 'PNG',
      href: baseAssetHref(`/${OG_IMAGE_FILENAME}`),
      previewHref: baseAssetHref(`/${OG_IMAGE_FILENAME}`),
    },
    {
      id: 'favicon-svg',
      name: 'Favicon',
      type: 'icon',
      format: 'SVG',
      href: baseAssetHref('/favicon.svg'),
      previewHref: baseAssetHref('/favicon.svg'),
    },
    {
      id: 'safari-pinned',
      name: 'Safari pinned tab',
      type: 'icon',
      format: 'SVG',
      href: baseAssetHref('/safari-pinned-tab.svg'),
      previewHref: baseAssetHref('/safari-pinned-tab.svg'),
    },
    {
      id: 'apple-touch',
      name: 'Apple touch icon',
      type: 'icon',
      format: 'PNG',
      href: baseAssetHref('/apple-touch-icon.png'),
      previewHref: baseAssetHref('/apple-touch-icon.png'),
    },
  ];
}

