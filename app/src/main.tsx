// Entry: Vite + React SPA (production: Coolify → solaris-cet.com).
import './polyfills'
import '@fontsource/syne/400.css'
import '@fontsource/syne/600.css'
import '@fontsource/syne/700.css'
import './index.css'

import * as Sentry from '@sentry/react'
import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { isChunkLoadFailure, recoverAppOnce } from '@/lib/appRecovery'

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
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: String(import.meta.env.VITE_GIT_COMMIT_HASH ?? '').trim() || undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
    sendDefaultPii: false,
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
