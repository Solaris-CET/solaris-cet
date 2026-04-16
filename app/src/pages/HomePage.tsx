import { lazy } from 'react';
import LazyLoadWrapper from '@/components/LazyLoadWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { useLanguage } from '@/hooks/useLanguage';
import HeroSection from '@/sections/HeroSection';
import HybridEngineSection from '@/sections/HybridEngineSection';
import StatsBentoSection from '@/sections/StatsBentoSection';
import AuthorityTrustSection from '@/sections/AuthorityTrustSection';
import IntelligenceCoreSection from '@/sections/IntelligenceCoreSection';
import NovaAppSection from '@/sections/NovaAppSection';
import TokenomicsSection from '@/sections/TokenomicsSection';
import ComplianceSection from '@/sections/ComplianceSection';

const AgenticEngineSection = lazy(() => import('@/sections/AgenticEngineSection'));
const RoadmapSection = lazy(() => import('@/sections/RoadmapSection'));
const AITeamSection = lazy(() => import('@/sections/AITeamSection'));
const CompetitionSection = lazy(() => import('@/sections/CompetitionSection'));
const NetworkPulseSection = lazy(() => import('@/sections/NetworkPulseSection'));
const HowToBuySection = lazy(() => import('@/sections/HowToBuySection'));
const MiningCalculatorSection = lazy(() => import('@/sections/MiningCalculatorSection'));
const StakingCalculatorSection = lazy(() => import('@/sections/StakingCalculatorSection'));
const SecuritySection = lazy(() => import('@/sections/SecuritySection'));
const WhitepaperSection = lazy(() => import('@/sections/WhitepaperSection'));
const HighIntelligenceSection = lazy(() => import('@/sections/HighIntelligenceSection'));
const EcosystemIndexSection = lazy(() => import('@/sections/EcosystemIndexSection'));
const RwaSection = lazy(() => import('@/sections/RwaSection'));
const ResourcesSection = lazy(() => import('@/sections/ResourcesSection'));
const FAQSection = lazy(() => import('@/sections/FAQSection'));
const FooterSection = lazy(() => import('@/sections/FooterSection'));

export default function HomePage({ heroCinematic = false }: { heroCinematic?: boolean }) {
  const { t } = useLanguage();

  return (
    <main
      id="main-content"
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <section id="hero" aria-label={t.landmarks.hero} className="relative z-10">
        <ErrorBoundary>
          <HeroSection cinematic={heroCinematic} />
        </ErrorBoundary>
      </section>

      <section
        id="problem-agriculture"
        aria-label={t.landmarks.problemAgriculture}
        className="relative z-[15]"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="cosmic-burst -top-[10%] left-[10%] opacity-35" />
          <div
            className="cosmic-burst bottom-[-20%] right-[-10%] opacity-25"
            style={{ animationDelay: '1.4s' }}
          />
        </div>
        <div className="cosmic-event-stamp absolute right-5 top-6 sm:right-8 sm:top-8" aria-hidden>
          EVENT · QUANTUM LATTICE
        </div>
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

      <section id="nova-app" aria-label={t.landmarks.novaApp} className="relative z-40 scroll-mt-24">
        <ErrorBoundary>
          <ScrollFadeUp>
            <NovaAppSection />
          </ScrollFadeUp>
        </ErrorBoundary>
      </section>

      <section id="staking" aria-label={t.landmarks.tokenomics} className="relative z-50 scroll-mt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="cosmic-burst -top-[18%] left-1/2 -translate-x-1/2 opacity-30"
            style={{ animationDelay: '0.6s' }}
          />
          <div className="cosmic-shockwave" />
        </div>
        <div className="cosmic-event-stamp absolute left-5 top-6 sm:left-8 sm:top-8" aria-hidden>
          EVENT · BIG BANG 9,000 CET
        </div>
        <ErrorBoundary>
          <ScrollFadeUp>
            <TokenomicsSection />
          </ScrollFadeUp>
        </ErrorBoundary>
      </section>

      <section aria-label={t.landmarks.rwa} className="relative z-[55]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <RwaSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </section>

      <section aria-label={t.landmarks.roadmap} className="relative z-[70] scroll-mt-24">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <RoadmapSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </section>

      <div className="relative z-[72]">
        <ErrorBoundary>
          <ScrollFadeUp>
            <ComplianceSection />
          </ScrollFadeUp>
        </ErrorBoundary>
      </div>

      <div className="relative z-[75]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <AITeamSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[78]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <CompetitionSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[79]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <NetworkPulseSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[80]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <HowToBuySection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[90]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <MiningCalculatorSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[95]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <StakingCalculatorSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[100]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <SecuritySection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[105]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <WhitepaperSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[108]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <HighIntelligenceSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[109]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <EcosystemIndexSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[110]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <ResourcesSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <div className="relative z-[112]">
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <FAQSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </div>

      <section
        aria-label={t.landmarks.footer}
        data-testid="footer-landmark-section"
        className="relative z-[113]"
      >
        <LazyLoadWrapper>
          <ScrollFadeUp>
            <ErrorBoundary>
              <FooterSection />
            </ErrorBoundary>
          </ScrollFadeUp>
        </LazyLoadWrapper>
      </section>
    </main>
  );
}
