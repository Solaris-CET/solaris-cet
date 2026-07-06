// Entry: Vite + React SPA (production: Coolify → solaris-cet.com).
import './polyfills'
import './index.css'
import './css/type.css'
import './css/reveal.css'

const scheduleEditorialFonts = () => {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const load = () => {
    void import('@fontsource/dm-sans/latin-400.css');
    void import('@fontsource/dm-sans/latin-500.css');
    void import('@fontsource/dm-sans/latin-700.css');
    void import('@fontsource/playfair-display/latin-400.css');
    void import('@fontsource/playfair-display/latin-700.css');
    void import('@fontsource/playfair-display/latin-900.css');
  };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(load, { timeout: 2500 });
    return;
  }
  window.setTimeout(load, 1200);
};

if (typeof window !== 'undefined' && import.meta.env.VITE_LHCI !== '1') {
  if (document.readyState === 'complete') {
    scheduleEditorialFonts();
  } else {
    window.addEventListener('load', scheduleEditorialFonts, { once: true });
  }
}

import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { isChunkLoadFailure, recoverAppOnce, resetRecoveryState } from '@/lib/appRecovery'
import { scheduleSentryInit } from '@/lib/sentryClient'

if (import.meta.env.DEV && typeof window !== 'undefined') {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    void recoverAppOnce('dev_sw_reset')
  }
}

function setupServiceWorkerRecovery(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  let recoveryTriggered = false

  const triggerControllerRecovery = () => {
    if (recoveryTriggered) return
    recoveryTriggered = true
    void recoverAppOnce('sw_controller_change')
  }

  const activateWaitingWorker = async (registration: ServiceWorkerRegistration | undefined) => {
    if (!registration?.waiting) return
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  const watchRegistration = (registration: ServiceWorkerRegistration | undefined) => {
    if (!registration) return

    const watchInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          void activateWaitingWorker(registration)
        }
      })
    }

    watchInstalling(registration.installing)
    registration.addEventListener('updatefound', () => {
      watchInstalling(registration.installing)
    })
    void activateWaitingWorker(registration)
  }

  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration) return
      watchRegistration(registration)
      await registration.update()
      watchRegistration(registration)
    } catch {
      void 0
    }
  }

  navigator.serviceWorker.addEventListener('controllerchange', triggerControllerRecovery)
  void checkForUpdates()
  window.addEventListener('focus', () => {
    void checkForUpdates()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkForUpdates()
    }
  })
}

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// When a lazy-loaded chunk fails to fetch (e.g. after a new deployment
// replaces the hashed file), reload the page once so the browser gets
// fresh HTML and correct chunk URLs.
window.addEventListener('vite:preloadError', () => {
  void recoverAppOnce('vite_chunk_reload')
});

window.addEventListener('error', (event) => {
  const message = (event as ErrorEvent | undefined)?.message ?? ''
  if (isChunkLoadFailure(message) || isChunkLoadFailure((event as ErrorEvent | undefined)?.error)) {
    void recoverAppOnce()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event as PromiseRejectionEvent | undefined)?.reason
  if (isChunkLoadFailure(reason)) {
    void recoverAppOnce()
  }
})

const sentryDsn = String(import.meta.env.VITE_SENTRY_DSN ?? '').trim()
if (sentryDsn) {
  const tracesSampleRate = Number.parseFloat(String(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0'))
  scheduleSentryInit({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: String(import.meta.env.VITE_GIT_COMMIT_HASH ?? '').trim() || undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="theme">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)

setupServiceWorkerRecovery()

if (typeof window !== 'undefined') {
  const markAppStable = () => {
    window.setTimeout(() => {
      resetRecoveryState()
    }, 1200)
  }

  if (document.readyState === 'complete') {
    markAppStable()
  } else {
    window.addEventListener('load', markAppStable, { once: true })
  }
}
