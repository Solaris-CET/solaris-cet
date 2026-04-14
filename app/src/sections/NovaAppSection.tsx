import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, Droplets, Clock, Battery } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { SolarisLogoMark } from '../components/SolarisLogoMark';
import AppImage from '../components/AppImage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';


type TickerItem = { label: string; value: string; icon: typeof TrendingUp };

const NovaAppSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const textPanelRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();
  const tx = t.novaAppUi;

  const tickerItems: TickerItem[] = [
    { label: tx.ticker.hashrate, value: '14.2 TH/s', icon: TrendingUp },
    { label: tx.ticker.earnings, value: '0.0041 CET / hr', icon: Droplets },
    { label: tx.ticker.uptime, value: '99.97%', icon: Battery },
    { label: tx.ticker.nextPayout, value: '00:14:22', icon: Clock },
    { label: tx.ticker.taskAgents, value: '200,000+', icon: Battery },
    { label: tx.ticker.minersActive, value: '18,420', icon: TrendingUp },
  ];

  const doubledTickerItems = [...tickerItems, ...tickerItems];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
    if (isMobile || prefersReducedMotion) {
      [phoneRef.current, textPanelRef.current, tickerRef.current].forEach(el => {
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=70%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        phoneRef.current,
        { y: '70vh', rotateZ: -6, opacity: 0 },
        { y: 0, rotateZ: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        textPanelRef.current,
        { x: '40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        tickerRef.current,
        { y: '20vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.15
      );

      // SETTLE (30% - 70%): Hold

      scrollTl.to([phoneRef.current, textPanelRef.current], { scale: 0.99, ease: 'none' }, 0.72);
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={sectionRef}
      className="section-pinned section-glass flex flex-col items-start justify-start gap-10 py-16 xl:flex-row xl:items-center xl:justify-center xl:py-0 xl:overflow-hidden mesh-bg section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="gold" />

      {/* Phone Card - Center Left */}
      <div
        ref={phoneRef}
        className="relative z-10 w-full max-w-[420px] mx-auto xl:mx-0 xl:absolute xl:left-[8vw] xl:top-[18vh] xl:w-[min(28vw,380px)] xl:h-[min(62vh,520px)]"
      >
        <div className="bento-card p-4 relative overflow-hidden xl:h-full">
          {/* Gold accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-solaris-gold via-solaris-gold to-transparent" />

          {/* Phone mockup */}
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              <AppImage
                src={`${import.meta.env.BASE_URL}phone-mockup.png`}
                alt="Solaris CET App"
                width="360"
                height="720"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="w-full h-full object-contain"
              />

              {/* App UI overlay */}
              <div className="absolute inset-[8%] top-[12%] bottom-[10%] flex flex-col">
                {/* App header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="solaris-icon-glow h-6 w-6 shrink-0 overflow-hidden rounded-md">
                      <SolarisLogoMark className="h-full w-full" />
                    </div>
                    <span className="font-display font-semibold text-solaris-text text-sm">CET</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Mining status */}
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="w-24 h-24 rounded-full border-4 border-solaris-gold/30 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-solaris-gold border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <TrendingUp className="w-8 h-8 text-solaris-gold" />
                  </div>
                  <div className="text-center">
                    <div className="hud-label mb-1">{tx.miningLabel}</div>
                    <div className="font-display font-bold text-2xl text-solaris-gold">
                      {tx.miningActive}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-solaris-muted text-sm">{tx.ticker.hashrate}</span>
                    <span className="font-mono text-solaris-gold">14.2 TH/s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-solaris-muted text-sm">{tx.earnedToday}</span>
                    <span className="font-mono text-solaris-text">0.098 CET</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Text Panel */}
      <div
        ref={textPanelRef}
        className="relative z-10 w-full max-w-[520px] mx-auto xl:mx-0 xl:absolute xl:right-[8vw] xl:top-[26vh] xl:w-[min(32vw,420px)]"
      >
        <div className="bento-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="solaris-icon-glow h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <SolarisLogoMark className="h-full w-full" />
            </div>
            <span className="hud-label text-solaris-gold">{tx.kicker}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-gradient-gold">{tx.titleToken}</span> {tx.titleTail}
          </h2>

          <div className="space-y-4 mb-6">
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">{tx.body1}</p>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">{tx.body2}</p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-solaris-gold/10 border border-solaris-gold/20">
              <span className="text-xs text-solaris-gold font-medium">{tx.badgeUniversalMining}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-solaris-cyan/10 border border-solaris-cyan/20">
              <span className="text-xs text-solaris-cyan font-medium">{tx.badgeLiquidStaking}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <span className="text-xs text-emerald-400 font-medium">{tx.badgeBatterySavings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Ticker - Bottom */}
      <div
        ref={tickerRef}
        className="relative z-10 w-full max-w-[1100px] mx-auto xl:absolute xl:left-1/2 xl:top-[78vh] xl:-translate-x-1/2 xl:w-[min(80vw,1100px)]"
      >
        <div className="bento-card p-4 overflow-hidden">
          <div className="flex animate-ticker">
            {doubledTickerItems.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center gap-3 px-6 border-r border-white/10 last:border-r-0 whitespace-nowrap"
              >
                <item.icon className="w-4 h-4 text-solaris-gold" />
                <span className="text-solaris-muted text-sm">{item.label}</span>
                <span className="font-mono text-solaris-text font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <MeshSkillRibbon variant="compact" saltOffset={220} className="mt-3 border-t border-white/8 rounded-none border-x-0 border-b-0 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </div>
  );
};

export default NovaAppSection;
