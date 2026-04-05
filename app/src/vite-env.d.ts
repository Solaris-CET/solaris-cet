/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH: string
  readonly VITE_BUILD_TIMESTAMP: string
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
