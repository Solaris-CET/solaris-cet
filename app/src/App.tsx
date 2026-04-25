import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRODUCTION_SITE_ORIGIN } from '@/lib/brandAssets';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Navigation from './components/Navigation';
import StatusBar from './components/StatusBar';
import { Toaster } from '@/components/ui/sonner';
import { SolarisLogoMark } from './components/SolarisLogoMark';
import CursorGlow from './components/CursorGlow';
import { InteractionEffectsManager } from '@/components/InteractionEffectsManager';
import { CinematicBackground } from '@/components/CinematicBackground';
import RouteSignatureLayer from './components/RouteSignatureLayer';
import ScrollStoryOverlay from './components/ScrollStoryOverlay';
import BackToTop from './components/BackToTop';
import MobileConversionDock from './components/MobileConversionDock';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { BuildSeal } from './components/BuildSeal';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { RegionContext, useRegionState } from './hooks/useRegion';
import { useSmoothAnchors } from './hooks/useSmoothAnchors';
import { useReducedMotion } from './hooks/useReducedMotion';
import { applySpaSeo } from '@/lib/spaSeo';
import './App.css';
import { shortSkillWhisper, skillSeedFromLabel } from './lib/meshSkillFeed';
import CookieConsentBanner from './components/CookieConsentBanner';
import { NotFoundPage } from './pages/NotFoundPage';
import { CetSymbol } from './components/CetSymbol';
import {
  URL_LOCALES,
  localizePathname,
  parseUrlLocaleFromPathname,
  shouldLocalePrefixPathname,
  urlLocaleFromLang,
} from '@/i18n/urlRouting';

const HomePage = lazy(() => import('./pages/HomePage'));
const RwaPage = lazy(() => import('./pages/RwaPage'));
const CetAiPage = lazy(() => import('./pages/CetAiPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

gsap.registerPlugin(ScrollTrigger);

/** Brief shell warm-up; shorter than earlier builds to avoid artificial wait (B2B credibility). */
const LOADING_DURATION_MS = 450;
/** Skip fixed delay when user requests reduced motion (WCAG 2.3.3). */
const LOADING_DURATION_REDUCED_MS = 0;

function AppContent() {
  const mainRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const langState = useLanguageState();
  const regionState = useRegionState();
  const isLhci = import.meta.env.VITE_LHCI === '1';
  const prefersReducedMotion = useReducedMotion();

  useSmoothAnchors();
  const pathnameRaw = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const parsedPath = parseUrlLocaleFromPathname(pathnameRaw);
  const activeUrlLocale = parsedPath.locale ?? urlLocaleFromLang(langState.lang);
  const routePath = (parsedPath.pathnameNoLocale.replace(/\/$/, '') || '/').replace('/index.html', '/') || '/';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const parsed = parseUrlLocaleFromPathname(url.pathname);

    const qpLang = url.searchParams.get('lang');
    const qpLocale = qpLang ? qpLang.slice(0, 2).toLowerCase() : '';
    if (qpLocale && (URL_LOCALES as readonly string[]).includes(qpLocale)) {
      url.pathname = localizePathname(parsed.pathnameNoLocale, qpLocale as (typeof URL_LOCALES)[number]);
      url.searchParams.delete('lang');
      window.location.replace(url.toString());
      return;
    }

    if (parsed.locale === 'en') {
      const canonical = localizePathname(parsed.pathnameNoLocale, 'en');
      if (url.pathname !== canonical) {
        url.pathname = canonical;
        window.location.replace(url.toString());
      }
      return;
    }
    if (parsed.locale) return;
    if (!shouldLocalePrefixPathname(url.pathname)) return;
    if (activeUrlLocale === 'en') return;
    url.pathname = localizePathname(parsed.pathnameNoLocale, activeUrlLocale);
    url.searchParams.delete('lang');
    window.location.replace(url.toString());
  }, [activeUrlLocale]);

  useEffect(() => {
    const loadingEl = loadingRef.current;
    const isSeen =
      typeof window !== 'undefined' &&
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('solaris_intro_seen') === '1';
    const delayMs = prefersReducedMotion || isSeen ? LOADING_DURATION_REDUCED_MS : LOADING_DURATION_MS;
    const fadeOutSec = prefersReducedMotion ? 0.12 : 0.55;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('solaris_intro_seen', '1');
      }

      if (!loadingEl) {
        setIsLoaded(true);
        return;
      }

      loadingEl.style.pointerEvents = 'none';
      setIsLoaded(true);
      gsap.to(loadingEl, {
        opacity: 0,
        duration: fadeOutSec,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        onComplete: () => {
          loadingEl.style.display = 'none';
        },
      });
    };

    const timer = window.setTimeout(finish, delayMs);
    const safety = window.setTimeout(finish, 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(safety);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    // Ensure all ScrollTriggers are released if AppContent unmounts (HMR, route-level remounts).
    return () => {
      ScrollTrigger.getAll().forEach((st: ScrollTrigger) => st.kill());
    };
  }, []);

  const buildSnapTo = useCallback((pinnedRanges: { start: number; end: number; center: number }[]) => {
    return (value: number) => {
      const inPinned = pinnedRanges.some(
        (r) => value >= r.start - 0.02 && value <= r.end + 0.02,
      );
      if (!inPinned) return value;

      let closest = pinnedRanges[0]?.center ?? value;
      let closestDist = Math.abs(closest - value);
      for (let i = 1; i < pinnedRanges.length; i += 1) {
        const dist = Math.abs(pinnedRanges[i].center - value);
        if (dist < closestDist) {
          closestDist = dist;
          closest = pinnedRanges[i].center;
        }
      }
      return closest;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (routePath !== '/') return;

    // Below 1024 px (tablets/small laptops), free scrolling is more natural
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;
    if (prefersReducedMotion) return;

    const setupSnap = () => {
      const pinned = ScrollTrigger.getAll()
        .filter((st: ScrollTrigger) => st.vars.pin)
        .sort((a: ScrollTrigger, b: ScrollTrigger) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st: ScrollTrigger) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      snapTriggerRef.current?.kill();
      snapTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: buildSnapTo(pinnedRanges),
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    };

    const maxWaitMs = 12_000;
    const started = performance.now();
    const id = window.setInterval(() => {
      setupSnap();
      if (snapTriggerRef.current) {
        window.clearInterval(id);
        return;
      }
      if (performance.now() - started > maxWaitMs) {
        window.clearInterval(id);
      }
    }, 300);
    return () => {
      window.clearInterval(id);
      snapTriggerRef.current?.kill();
      snapTriggerRef.current = null;
    };
  }, [isLoaded, buildSnapTo, routePath, prefersReducedMotion]);

  /** When the server serves `index.html` for a route, scroll to the matching section after lazy sections mount. */
  useEffect(() => {
    if (!isLoaded) return;
    const path = routePath;
    const routeToSectionId: Record<string, string> = {
      '/mining': 'mining',
      '/rwa': 'rwa',
      '/cet-ai': 'cet-ai',
    };
    const targetId = routeToSectionId[path];
    if (!targetId) return;

    const maxWaitMs = 12_000;
    const started = performance.now();
    const id = window.setInterval(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        window.clearInterval(id);
        return;
      }
      if (performance.now() - started > maxWaitMs) {
        window.clearInterval(id);
      }
    }, 120);

    return () => window.clearInterval(id);
  }, [isLoaded, routePath, prefersReducedMotion]);

  useEffect(() => {
    const seo = (langState.t as unknown as { seo?: Record<string, string> }).seo ?? {};
    const routeMeta: Record<string, { title: string; description: string; noindex?: boolean }> = {
      '/': { title: seo.homeTitle, description: seo.homeDescription },
      '/demo': { title: seo.demoTitle, description: seo.demoDescription },
      '/rwa': { title: seo.rwaTitle, description: seo.rwaDescription },
      '/cet-ai': { title: seo.cetAiTitle, description: seo.cetAiDescription },
      '/mining': { title: seo.miningTitle, description: seo.miningDescription },
      '/accessibility': {
        title: seo.accessibilityTitle ?? seo.homeTitle,
        description: seo.accessibilityDescription ?? seo.homeDescription,
      },
      '/login': {
        title: 'Login | Solaris CET',
        description: 'Login for Solaris CET web app.',
        noindex: true,
      },
      '/app': {
        title: 'Account | Solaris CET',
        description: 'Solaris CET account area.',
        noindex: true,
      },
      '/admin': {
        title: 'Admin | Solaris CET',
        description: 'Solaris CET admin area.',
        noindex: true,
      },
    };

    const meta = routeMeta[routePath];
    if (!meta) {
      applySpaSeo({
        origin: PRODUCTION_SITE_ORIGIN,
        pathnameNoLocale: routePath,
        locale: activeUrlLocale,
        title: seo.homeTitle,
        description: seo.homeDescription,
        noindex: true,
      });
      return;
    }
    applySpaSeo({
      origin: PRODUCTION_SITE_ORIGIN,
      pathnameNoLocale: routePath,
      locale: activeUrlLocale,
      title: meta.title,
      description: meta.description,
      noindex: meta.noindex,
    });
  }, [activeUrlLocale, langState.t, routePath]);

  return (
    <RegionContext.Provider value={regionState}>
      <LanguageContext.Provider value={langState}>
      {/* Loading overlay — blocks interaction with page until warm-up; shell uses inert + aria-hidden */}
      <div
        ref={loadingRef}
        className="loading-overlay"
        aria-busy={!isLoaded}
        aria-hidden={isLoaded}
        aria-live="polite"
      >
        <span className="sr-only" role="status">
          {langState.t.appLoader.brandLine}
          {' — '}
          {langState.t.appLoader.statusLine}
        </span>
        <div className="flex flex-col items-center gap-6" aria-hidden>
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-solaris-gold/[0.08] blur-xl motion-safe:animate-gold-pulse" />
            <div className="relative w-14 h-14 overflow-hidden rounded-2xl bg-slate-950/80 border border-white/[0.08] shadow-[0_0_40px_rgba(242,201,76,0.12)] flex items-center justify-center p-0">
              <SolarisLogoMark
                crop="emblem"
                priority
                className="h-full w-full drop-shadow-[0_0_12px_rgba(242,201,76,0.4)]"
              />
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-display font-semibold text-lg text-solaris-text mb-1">
              Solaris <span className="text-solaris-gold">CET</span>
            </div>
            <div className="hud-label text-[10px]">{langState.t.appLoader.statusLine}</div>
          </div>
          
          <div className="loading-bar-track" aria-hidden>
            <div className="loading-bar-fill" />
          </div>

          <p
            className="max-w-[min(92vw,320px)] text-center text-[9px] font-mono text-fuchsia-200/40 leading-snug line-clamp-2 px-2"
            aria-hidden
          >
            {shortSkillWhisper(skillSeedFromLabel('appLoader|meshWarm'))}
          </p>
        </div>
      </div>

      {/* Cursor glow effect */}
      {!isLhci ? <CursorGlow /> : null}
      {!isLhci ? <InteractionEffectsManager /> : null}

      <div
        ref={mainRef}
        className="relative min-h-dvh overflow-x-clip bg-slate-950 text-white/90"
        aria-hidden={!isLoaded}
        inert={!isLoaded ? true : undefined}
      >
        {!isLhci ? <CinematicBackground /> : null}
        {!isLhci ? <RouteSignatureLayer routePath={routePath} /> : null}
        {!isLhci ? <ScrollStoryOverlay routePath={routePath} /> : null}

        {/* Ambient solar glow — fixed, behind sections */}
        <div
          className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -top-[28%] left-1/2 h-[min(58vh,520px)] w-[min(140vw,960px)] -translate-x-1/2 rounded-full opacity-[0.38] blur-[100px]"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 50% 42%, rgba(255,220,165,0.5) 0%, rgba(240,185,70,0.14) 48%, transparent 74%)',
            }}
          />
          <div
            className="absolute top-[12%] right-[4%] h-[min(42vw,400px)] w-[min(42vw,400px)] rounded-full opacity-[0.2] blur-[110px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,205,130,0.55) 0%, rgba(242,180,60,0.08) 50%, transparent 72%)',
            }}
          />
          <div
            className="absolute bottom-[8%] left-[6%] h-[300px] w-[300px] rounded-full opacity-[0.14] blur-[90px]"
            style={{
              background:
                'radial-gradient(circle, rgba(46,231,255,0.4) 0%, transparent 70%)',
            }}
          />
        </div>
        {/* Noise overlay */}
        {!isLhci ? <div className="noise-overlay" /> : null}
        
        <a
          href="#main-content"
          className="skip-to-content"
          onClick={() => {
            const el = document.getElementById('main-content');
            if (!el) return;
            requestAnimationFrame(() => {
              (el as HTMLElement).focus?.();
            });
          }}
        >
          {langState.t.common.skipToMain}
        </a>
        {/* Navigation */}
        {!isLhci ? <Navigation /> : null}
        <Toaster />
        {!isLhci ? <StatusBar /> : null}
        
        <Suspense fallback={null}>
          {routePath === '/whitepaper' ? (
            <NotFoundPage attemptedPath={pathnameRaw} staticRedirectHref="/whitepaper" />
          ) : routePath === '/audit' ? (
            <NotFoundPage attemptedPath={pathnameRaw} staticRedirectHref="/audit/" />
          ) : routePath.startsWith('/sovereign') || routePath.startsWith('/apocalypse') ? (
            <NotFoundPage attemptedPath={pathnameRaw} staticRedirectHref={pathnameRaw} />
          ) : routePath !== '/' &&
            routePath !== '/rwa' &&
            routePath !== '/demo' &&
            routePath !== '/cet-ai' &&
            routePath !== '/mining' &&
            routePath !== '/accessibility' &&
            routePath !== '/login' &&
            routePath !== '/app' &&
            routePath !== '/admin' &&
            !isLhci ? (
            <NotFoundPage attemptedPath={pathnameRaw} />
          ) : routePath === '/mining' ? (
            <HomePage />
          ) : routePath === '/accessibility' ? (
            <AccessibilityPage />
          ) : routePath === '/login' ? (
            <LoginPage />
          ) : routePath === '/app' ? (
            <AccountPage />
          ) : routePath === '/admin' ? (
            <AdminPage />
          ) : routePath === '/rwa' ? (
            <RwaPage />
          ) : routePath === '/demo' ? (
            <DemoPage />
          ) : routePath === '/cet-ai' ? (
            <CetAiPage />
          ) : isLhci ? (
            <main
              id="main-content"
              className="relative z-10 min-h-[60vh] w-full max-w-4xl mx-auto px-6 py-20 text-center"
            >
              <h1 className="font-display text-4xl md:text-5xl text-white mb-5">
                Solaris <CetSymbol className="text-white" />
              </h1>
              <p className="text-slate-200/90 max-w-2xl mx-auto leading-relaxed">
                AI-native RWA token on TON with fixed 9,000 <CetSymbol className="text-slate-200/90" /> supply and a sovereign proof surface.
              </p>
            </main>
          ) : (
            <HomePage />
          )}
        </Suspense>
      </div>
      {!isLhci ? <PwaInstallPrompt /> : null}
      {!isLhci ? <MobileConversionDock /> : null}
      {!isLhci ? <BackToTop /> : null}
      <BuildSeal />
      <CookieConsentBanner />
      </LanguageContext.Provider>
    </RegionContext.Provider>
  );
}

function App() {
  const manifestUrl = import.meta.env.DEV 
    ? `${window.location.origin}/tonconnect-manifest.json`
    : `${PRODUCTION_SITE_ORIGIN}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AppContent />
    </TonConnectUIProvider>
  );
}

export { App };
export default App;
