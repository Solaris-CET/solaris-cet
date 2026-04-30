/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: unknown): {
    needRefresh: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    offlineReady: boolean;
  };
}

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH: string
  readonly VITE_BUILD_TIMESTAMP: string
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_LHCI?: string
  readonly VITE_UX_TEST_SRC?: string

  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string

  readonly VITE_GA4_MEASUREMENT_ID?: string
  readonly VITE_GTM_CONTAINER_ID?: string
  readonly VITE_MIXPANEL_TOKEN?: string
  readonly VITE_AMPLITUDE_API_KEY?: string
  readonly VITE_HOTJAR_SITE_ID?: string
  readonly VITE_HOTJAR_SNIPPET_VERSION?: string
  readonly VITE_ANALYTICS_DEBUG?: string

  readonly VITE_FACEBOOK_PIXEL_ID?: string
  readonly VITE_LINKEDIN_PARTNER_ID?: string
  readonly VITE_LINKEDIN_CONVERSION_ID?: string
  readonly VITE_MARKETING_DEBUG?: string

  readonly VITE_FIXED_STAKING_POOL_ADDRESS?: string
  readonly VITE_DISCORD_INVITE_URL?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_BSC_TESTNET_RPC_URL?: string
  readonly VITE_SPECIAL_NFT_COLLECTION_ADDRESS?: string

  readonly VITE_CRISP_WEBSITE_ID?: string
  readonly VITE_TAWK_PROPERTY_ID?: string
  readonly VITE_TAWK_WIDGET_ID?: string

  readonly VITE_ANNOUNCEMENT_TEXT?: string
  readonly VITE_ANNOUNCEMENT_HREF?: string
  readonly VITE_ANNOUNCEMENT_CTA?: string
  readonly VITE_ANNOUNCEMENT_ID?: string

  readonly VITE_RWA_PHOTO_URL?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
