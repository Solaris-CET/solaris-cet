import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, Droplets, Clock, Battery } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { SolarisLogoMark } from '../components/SolarisLogoMark';
import AppImage from '../components/AppImage';
import { useReducedMotion } from '../hooks/useReducedMotion';


// Static data defined outside component to avoid re-creation on every render
const tickerItems = [
  { label: 'Hashrate', value: '14.2 TH/s', icon: TrendingUp },
  { label: 'Earnings', value: '0.0041 CET / hr', icon: Droplets },
  { label: 'Uptime', value: '99.97%', icon: Battery },
  { label: 'Next Payout', value: '00:14:22', icon: Clock },
  { label: 'Task agents', value: '200,000+', icon: Battery },
  { label: 'Miners Active', value: '18,420', icon: TrendingUp },
];

// Pre-build the doubled ticker array once to avoid array spread on every render
const doubledTickerItems = [...tickerItems, ...tickerItems];

const NovaAppSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const textPanelRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

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
          end: '+=130%',
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

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        phoneRef.current,
        { y: 0, opacity: 1 },
        { y: '-30vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        textPanelRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        tickerRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={sectionRef}
      className="section-pinned section-glass flex items-center justify-center overflow-hidden mesh-bg section-padding-x"
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
        className="absolute left-[8vw] top-[18vh] w-[min(28vw,380px)] h-[min(62vh,520px)] z-10"
      >
        <div className="bento-card h-full p-4 relative overflow-hidden">
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
                    <div className="hud-label mb-1">Mining</div>
                    <div className="font-display font-bold text-2xl text-solaris-gold">Active</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-solaris-muted text-sm">Hashrate</span>
                    <span className="font-mono text-solaris-gold">14.2 TH/s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-solaris-muted text-sm">Earned Today</span>
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
        className="absolute right-[8vw] top-[26vh] w-[min(32vw,420px)] z-10"
      >
        <div className="bento-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="solaris-icon-glow h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <SolarisLogoMark className="h-full w-full" />
            </div>
            <span className="hud-label text-solaris-gold">Mobile Mining</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            Solaris <span className="text-gradient-gold">CET</span> App
          </h2>

          <div className="space-y-4 mb-6">
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              Mine <span className="text-solaris-gold font-semibold">CET</span> from your smartphone{' '}
              <span className="text-solaris-text font-medium">with minimal battery impact</span>.
              Mining suspends automatically when the app is in the background.
            </p>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              <span className="text-solaris-cyan font-semibold">Liquid staking</span> converts rewards into sCET—so you stay liquid while earning. Powered by the TON blockchain and High-Intelligence AI protocols.
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-solaris-gold/10 border border-solaris-gold/20">
              <span className="text-xs text-solaris-gold font-medium">Universal Mining</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-solaris-cyan/10 border border-solaris-cyan/20">
              <span className="text-xs text-solaris-cyan font-medium">Liquid Staking</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <span className="text-xs text-emerald-400 font-medium">90% Battery Savings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Ticker - Bottom */}
      <div
        ref={tickerRef}
        className="absolute left-1/2 top-[78vh] -translate-x-1/2 w-[min(80vw,1100px)] z-10"
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
