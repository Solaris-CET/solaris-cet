import './App.css';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import CookieConsentBanner from '@/components/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';
import { parseUrlLocaleFromPathname, type UrlLocale, urlLocaleFromLang } from '@/i18n/urlRouting';
import { refreshScrollReveal } from '@/js/reveal';
import { isInternalLink, normalizePathname } from '@/lib/routing';
import { buildGlobalJsonLd, getRouteSeo, mergeJsonLd } from '@/lib/seoEngine';
import { applySpaSeo } from '@/lib/spaSeo';

import MobileAppNav from './components/MobileAppNav';
import Navigation from './components/Navigation';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { useTelegram } from './hooks/useTelegram';
import { Router } from './routes/Router';

const SolarisChatWidget = lazy(() =>
  import('@/components/company/SolarisChatWidget').then((m) => ({ default: m.SolarisChatWidget })),
);

function App() {
  const [locationKey, setLocationKey] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const langState = useLanguageState();
  useTelegram();

  const routePath = useMemo(() => {
    void locationKey;
    if (typeof window === 'undefined') return '/';
    return normalizePathname(window.location.pathname || '/');
  }, [locationKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => refreshScrollReveal());
  }, [routePath]);

  useEffect(() => {
    const origin = typeof window === 'undefined' ? 'https://solaris-cet.com' : window.location.origin;
    const urlLocale =
      typeof window === 'undefined'
        ? urlLocaleFromLang(langState.lang)
        : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(langState.lang);

    const seo = getRouteSeo(origin, urlLocale, routePath);
    const jsonLd = mergeJsonLd(buildGlobalJsonLd(origin), seo.jsonLd);
    applySpaSeo({
      origin,
      pathnameNoLocale: routePath,
      locale: urlLocale,
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      ogType: seo.ogType,
      noindex: seo.noindex,
      jsonLd,
    });
  }, [langState.lang, routePath]);

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
      <MobileAppNav />
      <Toaster />
      <Suspense fallback={null}>
        <Router routePath={routePath} />
      </Suspense>
      <Suspense fallback={null}>{showChat ? <SolarisChatWidget /> : null}</Suspense>
      <CookieConsentBanner />
    </LanguageContext.Provider>
  );
}

export default App;
