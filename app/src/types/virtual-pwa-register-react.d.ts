declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: unknown): {
    needRefresh: boolean
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
