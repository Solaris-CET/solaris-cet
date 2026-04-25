// Entry: Vite + React SPA (production: Coolify → solaris-cet.com).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import * as Sentry from '@sentry/react'
import '@fontsource/syne/400.css'
import '@fontsource/syne/600.css'
import '@fontsource/syne/700.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// When a lazy-loaded chunk fails to fetch (e.g. after a new deployment
// replaces the hashed file), reload the page once so the browser gets
// fresh HTML and correct chunk URLs.
window.addEventListener('vite:preloadError', () => {
  const key = 'vite_chunk_reload';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});

const sentryDsn = String(import.meta.env.VITE_SENTRY_DSN ?? '').trim()
if (sentryDsn) {
  const tracesSampleRate = Number.parseFloat(String(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0'))
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
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
