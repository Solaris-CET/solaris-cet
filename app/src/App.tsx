import { lazy, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Navigation from './components/Navigation';
import CursorGlow from './components/CursorGlow';
import TouchRipple from './components/TouchRipple';
import LazyLoadWrapper from './components/LazyLoadWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import BackToTop from './components/BackToTop';
import { ScrollFadeUp } from './components/ScrollFadeUp';
// Pinned sections — loaded eagerly so the snap/scroll setup can find their ScrollTriggers
import HeroSection from './sections/HeroSection';
import HybridEngineSection from './sections/HybridEngineSection';
import StatsBentoSection from './sections/StatsBentoSection';
import IntelligenceCoreSection from './sections/IntelligenceCoreSection';
import NovaAppSection from './sections/NovaAppSection';
import TokenomicsSection from './sections/TokenomicsSection';
import ComplianceSection from './sections/ComplianceSection';
// Non-pinned sections — lazy-loaded when they approach the viewport
const RoadmapSection = lazy(() => import('./sections/RoadmapSection'));
const AITeamSection = lazy(() => import('./sections/AITeamSection'));
const CompetitionSection = lazy(() => import('./sections/CompetitionSection'));
const NetworkPulseSection = lazy(() => import('./sections/NetworkPulseSection'));
const HowToBuySection = lazy(() => import('./sections/HowToBuySection'));
const MiningCalculatorSection = lazy(() => import('./sections/MiningCalculatorSection'));
const SecuritySection = lazy(() => import('./sections/SecuritySection'));
const WhitepaperSection = lazy(() => import('./sections/WhitepaperSection'));
const HighIntelligenceSection = lazy(() => import('./sections/HighIntelligenceSection'));
const EcosystemIndexSection = lazy(() => import('./sections/EcosystemIndexSection'));
const RwaSection = lazy(() => import('./sections/RwaSection'));
const ResourcesSection = lazy(() => import('./sections/ResourcesSection'));
const FAQSection = lazy(() => import('./sections/FAQSection'));
const FooterSection = lazy(() => import('./sections/FooterSection'));
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

const LOADING_DURATION_MS = 800;

function AppContent() {
  const mainRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const langState = useLanguageState();

  useEffect(() => {
    // Loading screen exit
    const loadingEl = loadingRef.current;
    if (!loadingEl) {
      const timer = setTimeout(() => setIsLoaded(true), 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      gsap.to(loadingEl, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          loadingEl.style.display = 'none';
          setIsLoaded(true);
        },
      });
    }, LOADING_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

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

  const buildSnapTo = useCallback((pinnedRanges: { start: number; end: number; center: number }[]) => {
    return (value: number) => {
      const inPinned = pinnedRanges.some(
        r => value >= r.start - 0.02 && value <= r.end + 0.02
      );
      if (!inPinned) return value;

      let closest = pinnedRanges[0]?.center ?? 0;
      let closestDist = Math.abs(closest - value);
      for (let i = 1; i < pinnedRanges.length; i++) {
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

    // Setup global snap for pinned sections
    const setupGlobalSnap = () => {
      // Skip snap on mobile — pin animations are disabled on mobile,
      // so snap would create confusing empty scroll space.
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (isMobile) return;

      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: buildSnapTo(pinnedRanges),
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    };

    // Delay snap setup to ensure all ScrollTriggers are created
    const snapTimer = setTimeout(setupGlobalSnap, 500);

    return () => {
      clearTimeout(snapTimer);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [isLoaded, buildSnapTo]);

  return (
    <LanguageContext.Provider value={langState}>
      {/* Loading overlay */}
      <div ref={loadingRef} className="loading-overlay">
        <div className="flex flex-col items-center gap-6">
          {/* Animated logo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-solaris-gold/10 flex items-center justify-center animate-gold-pulse">
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-solaris-gold" fill="currentColor">
                <circle cx="16" cy="16" r="6" opacity="0.9" />
                <path d="M16 4 L17.2 12 L16 10 L14.8 12 Z" opacity="0.7" />
                <path d="M16 28 L17.2 20 L16 22 L14.8 20 Z" opacity="0.7" />
                <path d="M4 16 L12 17.2 L10 16 L12 14.8 Z" opacity="0.7" />
                <path d="M28 16 L20 17.2 L22 16 L20 14.8 Z" opacity="0.7" />
                <path d="M7.5 7.5 L13 12.5 L11.5 11 L12.5 13 Z" opacity="0.5" />
                <path d="M24.5 24.5 L19 19.5 L20.5 21 L19.5 19 Z" opacity="0.5" />
                <path d="M24.5 7.5 L19.5 13 L21 11.5 L19 12.5 Z" opacity="0.5" />
                <path d="M7.5 24.5 L12.5 19 L11 20.5 L13 19.5 Z" opacity="0.5" />
              </svg>
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-display font-semibold text-lg text-solaris-text mb-1">
              Solaris <span className="text-solaris-gold">CET</span>
            </div>
            <div className="hud-label text-[10px]">INITIALIZING BRIDGE</div>
          </div>
          
          <div className="loading-bar-track">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </div>

      {/* Cursor glow effect */}
      <CursorGlow />

      {/* Touch ripple effect (mobile) */}
      <TouchRipple />

      <div ref={mainRef} className="relative min-h-screen overflow-x-clip bg-zinc-950">
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
        
        {/* Navigation */}
        <Navigation />
        
        {/* Main content */}
        <main id="main-content" className="relative w-full overflow-x-clip">
          {/* 1. Hero — pin: true */}
          <div className="relative z-10">
            <ErrorBoundary>
              <ScrollFadeUp>
                <HeroSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </div>

          {/* 2. Problema (Agricultural AI) — impact + AI gap + hybrid infra */}
          <div className="relative z-[15]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <StatsBentoSection />
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

          {/* 3. Soluția (Solaris) — app + RWA land anchor */}
          <div className="relative z-40">
            <ErrorBoundary>
              <ScrollFadeUp>
                <NovaAppSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </div>

          <div className="relative z-[45]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><RwaSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

          {/* 4. Tokenomics — pin: true */}
          <div className="relative z-50">
            <ErrorBoundary>
              <ScrollFadeUp>
                <TokenomicsSection />
              </ScrollFadeUp>
            </ErrorBoundary>
          </div>

          {/* 5. Roadmap — pin: false */}
          <div className="relative z-[70]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><RoadmapSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>

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
          
          {/* Section 18: Footer - pin: false */}
          <div className="relative z-[113]">
            <LazyLoadWrapper>
              <ScrollFadeUp>
                <ErrorBoundary><FooterSection /></ErrorBoundary>
              </ScrollFadeUp>
            </LazyLoadWrapper>
          </div>
        </main>
      </div>
      <BackToTop />
    </LanguageContext.Provider>
  );
}

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://solaris-cet.vercel.app/tonconnect-manifest.json">
      <AppContent />
      <Analytics />
    </TonConnectUIProvider>
  );
}

export default App;
