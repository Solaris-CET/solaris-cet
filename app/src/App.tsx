import './App.css';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import CookieConsentBanner from '@/components/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';

import Navigation from './components/Navigation';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { NotFoundPage } from './pages/NotFoundPage';

const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TokenCetPage = lazy(() => import('./pages/TokenCetPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const LegalDocPage = lazy(() => import('./pages/LegalDocPage'));
const CookieSettingsPage = lazy(() => import('./pages/CookieSettingsPage'));
const SolarisChatWidget = lazy(() =>
  import('@/components/company/SolarisChatWidget').then((m) => ({ default: m.SolarisChatWidget })),
);

function normalizePathname(pathname: string): string {
  const clean = (pathname || '/').replace(/\/$/, '') || '/';
  const m = clean.match(/^\/(en|ro|es|de|pt|ru|zh)(\/|$)/);
  if (!m) return clean || '/';
  const rest = clean.slice(3);
  return (rest || '/').replace(/\/$/, '') || '/';
}

function isInternalLink(a: HTMLAnchorElement): boolean {
  const href = a.getAttribute('href') ?? '';
  if (!href || href === '#' || href.startsWith('#')) return false;
  if (a.hasAttribute('download')) return false;
  const target = (a.getAttribute('target') ?? '').toLowerCase();
  if (target && target !== '_self') return false;
  if (a.getAttribute('rel')?.includes('external')) return false;
  if (a.getAttribute('data-no-spa') === '1') return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname.startsWith('/api/')) return false;
    return true;
  } catch {
    return false;
  }
}

function App() {
  const [locationKey, setLocationKey] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const langState = useLanguageState();

  const routePath = useMemo(() => {
    void locationKey;
    if (typeof window === 'undefined') return '/';
    return normalizePathname(window.location.pathname || '/');
  }, [locationKey]);

  useEffect(() => {
    const meta: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Solaris CET — Fotovoltaice, Acoperișuri, Construcții',
        description:
          'Servicii complete: instalații fotovoltaice, construcții, acoperișuri tablă/țiglă/TPO, atice și fațade tablă, reparații.',
      },
      '/servicii': {
        title: 'Servicii — Solaris CET',
        description:
          'Detalii servicii: fotovoltaice, construcții, acoperișuri tablă/țiglă/TPO, atice și fațade tablă, reparații și mentenanță.',
      },
      '/contact': {
        title: 'Contact — Solaris CET',
        description: 'Cere ofertă sau contactează Solaris CET: +40 769 889 721 · solaris-cet@protonmail.com.',
      },
      '/token-cet': {
        title: 'Token CET — Solaris CET',
        description: 'Informații despre tokenul CET și ecosistemul Solaris CET.',
      },
      '/about': {
        title: 'Despre — Solaris CET',
        description: 'Despre Solaris CET: fotovoltaice, construcții, acoperișuri și mentenanță, cu acoperire națională.',
      },
      '/faq': {
        title: 'Întrebări frecvente — Solaris CET',
        description: 'Întrebări frecvente despre servicii, ofertare și execuție (fotovoltaice, acoperișuri, TPO).',
      },
      '/privacy': {
        title: 'Confidențialitate — Solaris CET',
        description: 'Politica de confidențialitate Solaris CET.',
      },
      '/terms': {
        title: 'Termeni — Solaris CET',
        description: 'Termeni și condiții Solaris CET.',
      },
      '/cookies': {
        title: 'Cookie-uri — Solaris CET',
        description: 'Politica de cookie-uri Solaris CET.',
      },
      '/privacy-settings': {
        title: 'Setări cookie — Solaris CET',
        description: 'Preferințe cookie (analitice/marketing) pentru Solaris CET.',
      },
    };
    const m = meta[routePath];
    if (!m) return;
    document.title = m.title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute('content', m.description);
  }, [routePath]);

  useEffect(() => {
    const bump = () => setLocationKey((k) => k + 1);
    window.addEventListener('popstate', bump);
    window.addEventListener('hashchange', bump);
    return () => {
      window.removeEventListener('popstate', bump);
      window.removeEventListener('hashchange', bump);
    };
  }, []);

  useEffect(() => {
    const delay = import.meta.env.MODE === 'test' ? 0 : 1200;
    if (delay === 0) {
      setShowChat(true);
      return;
    }
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setShowChat(true), { timeout: delay });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setShowChat(true), delay);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const a = (t.tagName.toLowerCase() === 'a' ? (t as HTMLAnchorElement) : t.closest('a')) as HTMLAnchorElement | null;
      if (!a) return;
      if (!isInternalLink(a)) return;

      const href = a.getAttribute('href') ?? '';
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      e.preventDefault();
      window.history.pushState(null, '', url.pathname + url.search + url.hash);
      setLocationKey((k) => k + 1);

      if (url.hash) {
        const el = document.querySelector(url.hash);
        if (el) {
          requestAnimationFrame(() => {
            const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          });
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <LanguageContext.Provider value={langState}>
      <Navigation />
      <Toaster />
      <Suspense fallback={null}>
        {routePath === '/' ? (
          <HomePage />
        ) : routePath === '/servicii' ? (
          <ServicesPage />
        ) : routePath === '/contact' ? (
          <ContactPage />
        ) : routePath === '/token-cet' ? (
          <TokenCetPage />
        ) : routePath === '/about' ? (
          <AboutPage />
        ) : routePath === '/faq' ? (
          <FaqPage />
        ) : routePath === '/privacy' ? (
          <LegalDocPage doc="privacy" />
        ) : routePath === '/terms' ? (
          <LegalDocPage doc="terms" />
        ) : routePath === '/cookies' ? (
          <LegalDocPage doc="cookies" />
        ) : routePath === '/privacy-settings' ? (
          <CookieSettingsPage />
        ) : (
          <NotFoundPage attemptedPath={routePath} />
        )}
      </Suspense>
      <Suspense fallback={null}>{showChat ? <SolarisChatWidget /> : null}</Suspense>
      <CookieConsentBanner />
    </LanguageContext.Provider>
  );
}

export default App;
