import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Coins, Pickaxe, Users, TrendingDown } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import LivePoolStats from '../components/LivePoolStats';
import ChainStateWidget from '../components/ChainStateWidget';
import TokenomicsChart from '../components/TokenomicsChart';
import { useLanguage } from '../hooks/useLanguage';
import { useReducedMotion } from '../hooks/useReducedMotion';

const BENTO_TILE_INTERACTION =
  'transition-all duration-300 hover:!-translate-y-1 hover:!scale-100 hover:!shadow-[0_0_15px_rgba(234,179,8,0.2)]';

const CET_TOTAL_SUPPLY = 9000;
const CET_MINED_SUPPLY = 9000; // 100% mined on launch - hyper-scarce supply

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;


const TokenomicsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [ringVisible, setRingVisible] = useState(false);
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // Animate ring on mount
  useEffect(() => {
    const timer = setTimeout(() => setRingVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const circle = ringRef.current;
    if (!circle || !ringVisible) return;

    const progress = CET_MINED_SUPPLY / CET_TOTAL_SUPPLY;

    gsap.set(circle, { strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: RING_CIRCUMFERENCE });
    const tween = gsap.to(circle, {
      strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress),
      duration: 2,
      ease: 'power3.out',
      delay: 0.3,
    });

    return () => {
      tween.kill();
    };
  }, [ringVisible]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    if (isMobile || prefersReducedMotion) {
      [cardRef.current, pillsRef.current].forEach(el => {
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
        cardRef.current,
        { scale: 0.78, y: '40vh', opacity: 0 },
        { scale: 1, y: 0, opacity: 1, ease: 'none' },
        0
      );

      const pills = pillsRef.current?.querySelectorAll('.metric-pill');
      if (pills) {
        scrollTl.fromTo(
          pills,
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.03, ease: 'none' },
          0.1
        );
      }

      // SETTLE (30% - 70%): Hold

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        cardRef.current,
        { scale: 1, y: 0, opacity: 1 },
        { scale: 0.92, y: '-30vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (pills) {
        scrollTl.fromTo(
          pills,
          { opacity: 1 },
          { opacity: 0, ease: 'power2.in' },
          0.75
        );
      }
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="staking"
      className="section-pinned section-glass flex items-center justify-center overflow-hidden mesh-bg section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="cyan" />

      {/* Floating metric pills (pointer-events-auto per pill for hover) */}
      <div ref={pillsRef} className="absolute inset-0 z-20 pointer-events-none">
        <div
          className={`metric-pill pointer-events-auto absolute left-[6vw] top-[20vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
        >
          <Coins className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Max Supply</div>
            <div className="font-mono text-solaris-gold font-semibold">21M BTC-S</div>
          </div>
        </div>
        <div
          className={`metric-pill pointer-events-auto absolute right-[8vw] top-[24vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
          style={{ animationDelay: '0.5s' }}
        >
          <Pickaxe className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Mining</div>
            <div className="font-mono text-solaris-gold font-semibold">66.66%</div>
          </div>
        </div>
        <div
          className={`metric-pill pointer-events-auto absolute right-[10vw] top-[64vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
          style={{ animationDelay: '1s' }}
        >
          <Users className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Team</div>
            <div className="font-mono text-solaris-gold font-semibold">0.33%</div>
          </div>
        </div>
      </div>

      {/* Main tokenomics — Bento grid */}
      <div ref={cardRef} className="relative z-10 w-full max-w-[1100px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Title tile */}
          <div
            className={`lg:col-span-12 bento-card p-6 lg:p-8 relative overflow-hidden holo-card border border-solaris-gold/30 shadow-depth ${BENTO_TILE_INTERACTION}`}
          >
            <div className="absolute inset-0 rounded-[18px] shimmer-border pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 flex items-center justify-center animate-gold-pulse shrink-0">
                <Coins className="w-6 h-6 text-solaris-gold" />
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text">
                <span className="text-shimmer">{t.tokenomics.title}</span>
              </h2>
            </div>
          </div>

          {/* Ring tile */}
          <div
            className={`lg:col-span-4 bento-card p-6 lg:p-8 flex flex-col items-center justify-center border border-white/10 shadow-depth ${BENTO_TILE_INTERACTION}`}
          >
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="64"
                  cy="64"
                  r={RING_RADIUS}
                  className="progress-ring-track"
                  strokeWidth="8"
                />
                <circle
                  ref={ringRef}
                  cx="64"
                  cy="64"
                  r={RING_RADIUS}
                  className="progress-ring-fill"
                  strokeWidth="8"
                  stroke="url(#tokenomicsRingGrad)"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="tokenomicsRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F2C94C" />
                    <stop offset="100%" stopColor="#2EE7FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-bold text-2xl text-solaris-gold">100%</div>
                <div className="hud-label text-[9px]">MINED</div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="font-mono text-solaris-gold font-semibold">{CET_TOTAL_SUPPLY.toLocaleString()} CET</div>
              <div className="hud-label text-[10px] mt-1">TOTAL SUPPLY ON TON NETWORK</div>
            </div>
          </div>

          {/* Supply + on-chain */}
          <div
            className={`lg:col-span-4 bento-card p-5 lg:p-6 border border-white/10 shadow-depth ${BENTO_TILE_INTERACTION}`}
          >
            <div className="hud-label mb-2">Fixed Supply</div>
            <div className="font-display font-bold text-3xl text-solaris-gold mb-1">21,000,000</div>
            <div className="text-solaris-muted text-sm">BTC-S Total Supply</div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="hud-label text-[10px] mb-1">CET (TON Network)</div>
                  <div className="font-display font-bold text-xl text-solaris-cyan">9,000</div>
                </div>
                <div className="text-right">
                  <div className="hud-label text-[10px] mb-1">DeDust Pool</div>
                  <a
                    href="https://dedust.io/swap/TON/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View CET token on DeDust exchange"
                    className="font-mono text-[10px] text-solaris-cyan hover:text-solaris-gold transition-colors"
                  >
                    EQB5…lfnB ↗
                  </a>
                </div>
              </div>
            </div>
            <LivePoolStats />
            <div className="mt-4">
              <ChainStateWidget />
            </div>
          </div>

          {/* DCBM + mini stats column */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div
              className={`bento-card p-5 lg:p-6 bg-solaris-gold/5 border border-solaris-gold/20 shadow-depth flex-1 ${BENTO_TILE_INTERACTION}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown className="w-5 h-5 text-solaris-gold" />
                <div className="hud-label text-solaris-gold">DCBM Stability</div>
              </div>
              <p className="text-solaris-muted text-sm leading-relaxed mb-3">
                <span className="text-solaris-text font-medium">Dynamic-Control Buyback Mechanism</span>{' '}
                uses PID controllers to reduce volatility by{' '}
                <span className="text-solaris-gold font-semibold">66%</span>.
              </p>
              <div className="flex items-center gap-1 mb-2">
                {[1.0, 1.4, 0.7, 1.2, 0.9, 1.5, 0.8, 1.1, 0.6, 1.3].map((h, i) => (
                  <div
                    key={i}
                    className="wave-bar text-solaris-gold"
                    style={{ height: `${h * 12}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-solaris-muted">
                <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
                Scientific price stability
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Launch Type', value: 'Fair Launch', valueClass: 'text-solaris-text' },
                { label: 'Mining Period', value: '90 Years', valueClass: 'text-solaris-cyan' },
                { label: 'Volatility ↓', value: '66%', valueClass: 'text-solaris-gold' },
                { label: 'Target Val.', value: '€1B', valueClass: 'text-emerald-400' },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className={`bento-card p-3 text-center border border-white/10 shadow-depth ${BENTO_TILE_INTERACTION}`}
                >
                  <div className="hud-label text-[9px] mb-1">{cell.label}</div>
                  <div className={`font-display font-semibold text-sm ${cell.valueClass}`}>{cell.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution — full width row */}
          <div
            className={`lg:col-span-12 bento-card p-5 lg:p-6 border border-white/10 shadow-depth ${BENTO_TILE_INTERACTION}`}
          >
            <div className="hud-label mb-3">Distribution</div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-solaris-muted text-sm">Mining (90 years)</span>
                  <span className="font-mono text-solaris-cyan font-semibold text-sm">66.66%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-solaris-cyan to-solaris-gold rounded-full animate-gradient-shift"
                    style={{ width: '66.66%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-solaris-muted text-sm">Team & Advisors</span>
                  <span className="font-mono text-emerald-400 font-semibold text-sm">0.33%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '0.33%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12">
            <TokenomicsChart />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
