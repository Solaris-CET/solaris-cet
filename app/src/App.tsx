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
import { useSmoothAnchors } from './hooks/useSmoothAnchors';
import './App.css';
import { shortSkillWhisper, skillSeedFromLabel } from './lib/meshSkillFeed';
import CookieConsentBanner from './components/CookieConsentBanner';
import { NotFoundPage } from './pages/NotFoundPage';
import { CetSymbol } from './components/CetSymbol';

const HomePage = lazy(() => import('./pages/HomePage'));
const RwaPage = lazy(() => import('./pages/RwaPage'));
const CetAiPage = lazy(() => import('./pages/CetAiPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));

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
  const isLhci = import.meta.env.VITE_LHCI === '1';

  useSmoothAnchors();
  const pathnameRaw = (() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname || '/';
  })();
  const routePath = (() => {
    const raw = pathnameRaw.replace(/\/$/, '') || '/';
    return raw === '/index.html' ? '/' : raw;
  })();

  useEffect(() => {
    const loadingEl = loadingRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSeen =
      typeof window !== 'undefined' &&
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('solaris_intro_seen') === '1';
    const delayMs = reducedMotion || isSeen ? LOADING_DURATION_REDUCED_MS : LOADING_DURATION_MS;
    const fadeOutSec = reducedMotion ? 0.12 : 0.55;
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
        ease: reducedMotion ? 'none' : 'power3.out',
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
  }, []);

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
  }, [isLoaded, buildSnapTo, routePath]);

  /** When the server serves `index.html` for a route, scroll to the matching section after lazy sections mount. */
  useEffect(() => {
    if (!isLoaded) return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
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
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.clearInterval(id);
        return;
      }
      if (performance.now() - started > maxWaitMs) {
        window.clearInterval(id);
      }
    }, 120);

    return () => window.clearInterval(id);
  }, [isLoaded]);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const routeMeta: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Home | Solaris CET',
        description:
          "Solaris CET is an AI-native RWA token on TON blockchain. 9,000 CET fixed supply. 200,000 autonomous AI agents via Grok × Gemini dual-AI RAV Protocol.",
      },
      '/demo': {
        title: 'Demo | Solaris CET',
        description:
          'Experimental cinematic demo build: hologram visuals, progressive WebGL, and motion choreography. Falls back safely on low-end devices.',
      },
      '/rwa': {
        title: 'RWA | Solaris CET',
        description:
          'Explore Solaris CET real-world asset proof surface: evidence links, timeline, and project documents anchored in Cetățuia, Romania.',
      },
      '/cet-ai': {
        title: 'CET AI Demo | Solaris CET',
        description:
          'Try the CET AI demo UI with secure /api/chat integration, UX error states, and privacy guidance (do not enter personal data).',
      },
    };
    const meta = routeMeta[path];
    if (!meta) return;

    const absoluteUrl = `${PRODUCTION_SITE_ORIGIN}${path === '/' ? '' : path}`;
    document.title = meta.title;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector) as HTMLMetaElement | null;
      if (el) el.setAttribute('content', content);
    };

    const setLink = (selector: string, href: string) => {
      const el = document.querySelector(selector) as HTMLLinkElement | null;
      if (el) el.setAttribute('href', href);
    };

    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[property="og:url"]', absoluteUrl);
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[name="twitter:url"]', absoluteUrl);
    setMeta('meta[name="twitter:title"]', meta.title);
    setMeta('meta[name="twitter:description"]', meta.description);
    setLink('link[rel="canonical"]', absoluteUrl);
  }, []);

  return (
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
        
        <a href="#main-content" className="skip-to-content">
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
            !isLhci ? (
            <NotFoundPage attemptedPath={pathnameRaw} />
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

export default App;
