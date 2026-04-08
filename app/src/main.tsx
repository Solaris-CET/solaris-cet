// Entry: Vite + React SPA (production: Coolify → solaris-cet.com).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="theme">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
