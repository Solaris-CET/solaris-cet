import { lazy, useCallback, useEffect, useRef, useState } from 'react';
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
import LazyLoadWrapper from './components/LazyLoadWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import BackToTop from './components/BackToTop';
import MobileConversionDock from './components/MobileConversionDock';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { BuildSeal } from './components/BuildSeal';
import { ScrollFadeUp } from './components/ScrollFadeUp';
// Pinned sections — loaded eagerly so the snap/scroll setup can find their ScrollTriggers
import HeroSection from './sections/HeroSection';
import HybridEngineSection from './sections/HybridEngineSection';
import StatsBentoSection from './sections/StatsBentoSection';
import AuthorityTrustSection from './sections/AuthorityTrustSection';
import IntelligenceCoreSection from './sections/IntelligenceCoreSection';
import NovaAppSection from './sections/NovaAppSection';
import TokenomicsSection from './sections/TokenomicsSection';
import ComplianceSection from './sections/ComplianceSection';
// Non-pinned sections — lazy-loaded when they approach the viewport
const AgenticEngineSection = lazy(() => import('./sections/AgenticEngineSection'));
const RoadmapSection = lazy(() => import('./sections/RoadmapSection'));
const AITeamSection = lazy(() => import('./sections/AITeamSection'));
const CompetitionSection = lazy(() => import('./sections/CompetitionSection'));
const NetworkPulseSection = lazy(() => import('./sections/NetworkPulseSection'));
const HowToBuySection = lazy(() => import('./sections/HowToBuySection'));
const MiningCalculatorSection = lazy(() => import('./sections/MiningCalculatorSection'));
const StakingCalculatorSection = lazy(() => import('./sections/StakingCalculatorSection'));
const SecuritySection = lazy(() => import('./sections/SecuritySection'));
const WhitepaperSection = lazy(() => import('./sections/WhitepaperSection'));
const HighIntelligenceSection = lazy(() => import('./sections/HighIntelligenceSection'));
const EcosystemIndexSection = lazy(() => import('./sections/EcosystemIndexSection'));
const RwaSection = lazy(() => import('./sections/RwaSection'));
const ResourcesSection = lazy(() => import('./sections/ResourcesSection'));
const FAQSection = lazy(() => import('./sections/FAQSection'));
const FooterSection = lazy(() => import('./sections/FooterSection'));
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { useSmoothAnchors } from './hooks/useSmoothAnchors';
import './App.css';
import { shortSkillWhisper, skillSeedFromLabel } from './lib/meshSkillFeed';
import CookieConsentBanner from './components/CookieConsentBanner';

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

  useSmoothAnchors();

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
      ScrollTrigger.getAll().forEach((st) => st.kill());
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

    // Below 1024 px (tablets/small laptops), free scrolling is more natural
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const setupSnap = () => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st) => ({
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

    const timer = window.setTimeout(setupSnap, 500);
    return () => {
      window.clearTimeout(timer);
      snapTriggerRef.current?.kill();
      snapTriggerRef.current = null;
    };
  }, [isLoaded, buildSnapTo]);

  /** When the server serves `index.html` for `/mining`, scroll to the calculator after lazy sections mount. */
  useEffect(() => {
    if (!isLoaded) return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path !== '/mining') return;

    const maxWaitMs = 12_000;
    const started = performance.now();
    const id = window.setInterval(() => {
      const el = document.getElementById('mining');
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
      <CursorGlow />
      <InteractionEffectsManager />

      <div
        ref={mainRef}
        className="relative min-h-dvh overflow-x-clip bg-slate-950 text-white/90"
        aria-hidden={!isLoaded}
        inert={!isLoaded ? true : undefined}
      >
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
        <div className="noise-overlay" />
        
        <a href="#main-content" className="skip-to-content">
          {langState.t.common.skipToMain}
        </a>
        {/* Navigation */}
        <Navigation />
        <Toaster />
        <StatusBar />
        
        {/* Main content — conversion flow: Hero → Problem → Solution → Tokenomics → RWA → Roadmap → Footer */}
        <main
          id="main-content"
          className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
        >
          {/* 1. Hero — Atenție */}
          <section
            id="hero"
            aria-label={langState.t.landmarks.hero}
            className="relative z-10 py-24"
          >
            <ErrorBoundary>
              {/* Hero: GSAP entrance only (no pin — avoids scroll-jacking); ScrollFadeUp here caused double opacity */}
              <HeroSection />
            </ErrorBoundary>
          </section>

          {/* 2. Problema agriculturii — impact, gap AI, infrastructură hibridă */}
          <section
            id="problem-agriculture"
            aria-label={langState.t.landmarks.problemAgriculture}
            className="relative z-[15] py-24"
          >
            <div className="relative z-[15]">
              <LazyLoadWrapper>
                <ScrollFadeUp>
                  <StatsBentoSection />
                </ScrollFadeUp>
              </LazyLoadWrapper>
            </div>
            <div className="relative z-[16]">
              <LazyLoadWrapper>
                <ScrollFadeUp>
                  <AuthorityTrustSection />
                </ScrollFadeUp>
              </LazyLoadWrapper>
            </div>
            <div className="relative z-20">
              <ErrorBoundary>
                <ScrollFadeUp>
                  <IntelligenceCoreSection />
                </ScrollFadeUp>
              </ErrorBoundary>
            </div>
            <div className="relative z-30">
              <ErrorBoundary>
                <ScrollFadeUp>
                  <HybridEngineSection />
                </ScrollFadeUp>
              </ErrorBoundary>
            </div>
            <div className="relative z-[32]">
              <LazyLoadWrapper>
                <ScrollFadeUp>
                  <ErrorBoundary>
                    <AgenticEngineSection />
                  </ErrorBoundary>
                </ScrollFadeUp>
              </LazyLoadWrapper>
            </div>
          </section>

          {/* 3. Soluția Solaris AI — aplicația & motorul (id matches nav #nova-app) */}
          <section
            id="nova-app"
            aria-label={langState.t.landmarks.novaApp}
            className="relative z-40 scroll-mt-24 py-24"
          >
            <ErrorBoundary>
              <ScrollFadeUp>
                <NovaAppSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </section>

          {/* 4. Tokenomics — 9,000 CET dashboard (id matches nav #staking) */}
          <section
            id="staking"
            aria-label={langState.t.landmarks.tokenomics}
            className="relative z-50 scroll-mt-24 py-24"
          >
            <ErrorBoundary>
              <ScrollFadeUp>
                <TokenomicsSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </section>

          {/* 5. RWA — Cetățuia, real estate */}
          <section
            aria-label={langState.t.landmarks.rwa}
            className="relative z-[55] py-24"
          >
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><RwaSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </section>

          {/* 6. Roadmap (id matches nav #roadmap) */}
          <section
            aria-label={langState.t.landmarks.roadmap}
            className="relative z-[70] scroll-mt-24 py-24"
          >
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><RoadmapSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </section>

          {/* Secțiuni suport (nav / mining / FAQ) — după roadmap, înainte de footer */}
          {/* Compliance — after core story arc (z above Roadmap so stacking matches DOM order) */}
          <div className="relative z-[72]">
            <ErrorBoundary>
              <ScrollFadeUp>
                <ComplianceSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </div>

          {/* Section 8: AI Team - pin: false */}
          <div className="relative z-[75]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><AITeamSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 9: Competition - pin: false */}
          <div className="relative z-[78]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><CompetitionSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 9.5: Network Pulse — live TON + CET stats */}
          <div className="relative z-[79]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><NetworkPulseSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 10: How to Buy - pin: false */}
          <div className="relative z-[80]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><HowToBuySection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 11: Mining Calculator - pin: false */}
          <div className="relative z-[90]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><MiningCalculatorSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 11.5: Staking Calculator - pin: false */}
          <div className="relative z-[95]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><StakingCalculatorSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 12: Security - pin: false */}
          <div className="relative z-[100]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><SecuritySection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>
          
          {/* Section 13: Whitepaper - pin: false */}
          <div className="relative z-[105]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><WhitepaperSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 14: High Intelligence - pin: false */}
          <div className="relative z-[108]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><HighIntelligenceSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>
          
          {/* Section 15: Ecosystem Index - pin: false */}
          <div className="relative z-[109]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><EcosystemIndexSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 16: Resources - pin: false */}
          <div className="relative z-[110]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><ResourcesSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* Section 17: FAQ - pin: false */}
          <div className="relative z-[112]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><FAQSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* 7. Footer — landmark lives here; FooterSection is nested inside LazyLoadWrapper */}
          <section
            aria-label={langState.t.landmarks.footer}
            data-testid="footer-landmark-section"
            className="relative z-[113] py-24"
          >
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><FooterSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </section>
        </main>
      </div>
      <PwaInstallPrompt />
      <MobileConversionDock />
      <BackToTop />
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
