import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Coins, Pickaxe, Users, TrendingDown, Lock, Cpu } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import LivePoolStats from '../components/LivePoolStats';
import ChainStateWidget from '../components/ChainStateWidget';
import TokenomicsChart from '../components/TokenomicsChart';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';
import { useReducedMotion } from '../hooks/useReducedMotion';

const BENTO_TILE_INTERACTION =
  'transition-all duration-300 hover:!-translate-y-1 hover:!scale-100 hover:!shadow-[0_0_15px_rgba(234,179,8,0.2)]';

const CET_TOTAL_SUPPLY = 9000;
const CET_MINED_SUPPLY = 9000; // 100% mined on launch - hyper-scarce supply

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const DEDUST_POOL =
  'https://dedust.io/swap/TON/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';

const TokenomicsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [ringVisible, setRingVisible] = useState(false);
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

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

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
    if (isMobile || prefersReducedMotion) {
      [cardRef.current, pillsRef.current].forEach(el => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
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

      scrollTl.fromTo(
        cardRef.current,
        { scale: 1, y: 0, opacity: 1 },
        { scale: 0.92, y: '-30vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (pills) {
        scrollTl.fromTo(pills, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.75);
      }
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={sectionRef}
      className="section-pinned section-glass flex items-center justify-center overflow-hidden mesh-bg section-padding-x"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      <GlowOrbs variant="cyan" />

      <div ref={pillsRef} className="absolute inset-0 z-20 pointer-events-none">
        <div
          className={`metric-pill pointer-events-auto absolute left-[6vw] top-[20vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
        >
          <Coins className="w-5 h-5 text-amber-400" />
          <div>
            <div className="hud-label text-[10px]">{t.tokenomics.cetCapLabel}</div>
            <div className="font-mono tabular-nums text-amber-300 font-semibold">9,000</div>
          </div>
        </div>
        <div
          className={`metric-pill pointer-events-auto absolute right-[8vw] top-[24vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
          style={{ animationDelay: '0.5s' }}
        >
          <Pickaxe className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Mining</div>
            <div className="font-mono tabular-nums text-solaris-gold font-semibold">66.66%</div>
          </div>
        </div>
        <div
          className={`metric-pill pointer-events-auto absolute right-[10vw] top-[64vh] bento-card px-5 py-3 flex items-center gap-3 animate-float shadow-depth ${BENTO_TILE_INTERACTION}`}
          style={{ animationDelay: '1s' }}
        >
          <Users className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Team</div>
            <div className="font-mono tabular-nums text-solaris-gold font-semibold">0.33%</div>
          </div>
        </div>
      </div>

      <div ref={cardRef} className="relative z-10 w-full max-w-[1100px]">
        {/* Bank dashboard shell */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#05070a]/90 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
          {/* Header strip */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 py-4 md:px-6 border-b border-white/10 bg-black/50">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg bg-solaris-gold/10 flex items-center justify-center shrink-0 border border-solaris-gold/25">
                <Coins className="w-5 h-5 text-solaris-gold" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[clamp(22px,3vw,36px)] text-solaris-text leading-tight">
                  <span className="text-shimmer">{t.tokenomics.title}</span>
                </h2>
                <p className="mt-1 text-xs text-solaris-muted max-w-xl">{t.tokenomics.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400/95 shrink-0">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              ON-CHAIN
            </div>
          </header>

          {/* Investor KPI row: Fixed Supply (amber) vs RAV (cyan/violet) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-white/10">
            <div
              className={`p-5 sm:p-6 border-b lg:border-b-0 border-white/10 bg-gradient-to-br from-amber-950/50 via-[#0a0b0f] to-transparent ${BENTO_TILE_INTERACTION}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-amber-400" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/90">
                  {t.tokenomics.fixedSupply}
                </span>
              </div>
              <p className="text-[11px] text-solaris-muted mb-1">
                {t.tokenomics.cetCapLabel}
              </p>
              <p className="font-mono tabular-nums text-4xl sm:text-5xl font-bold text-amber-300 tracking-tight breathing-tabular">
                {CET_TOTAL_SUPPLY.toLocaleString()}
                <span className="text-lg sm:text-xl text-amber-400/80 ml-2">CET</span>
              </p>
              <div className="mt-5 pt-4 border-t border-amber-500/20">
                <p className="text-[11px] text-solaris-muted mb-1">{t.tokenomics.btcSReference}</p>
                <p className="font-mono tabular-nums text-xl text-amber-200/90">21,000,000</p>
                <p className="text-[10px] text-solaris-muted mt-0.5">BTC-S</p>
              </div>
            </div>

            <div
              className={`p-5 sm:p-6 bg-gradient-to-br from-cyan-950/35 via-violet-950/20 to-[#0a0b0f] crt-terminal ${BENTO_TILE_INTERACTION}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-cyan-300" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/90">
                  {t.tokenomics.ravProtocol}
                </span>
              </div>
              <p className="text-sm text-solaris-text leading-relaxed border-l-2 border-cyan-400/60 pl-3">
                {t.tokenomics.ravStack}
              </p>
              <ul className="mt-4 space-y-2 font-mono text-[11px] text-cyan-100/85">
                <li className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-solaris-muted">REASON</span>
                  <span className="text-cyan-300 tabular-nums">Gemini</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <span className="text-solaris-muted">ACT</span>
                  <span className="text-violet-300 tabular-nums">Grok</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-solaris-muted">VERIFY</span>
                  <span className="text-emerald-400/90 tabular-nums">IPFS</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Secondary row: emission ring · liquidity & chain · DCBM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 border-t border-white/10">
            <div
              className={`lg:col-span-4 p-5 lg:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 ${BENTO_TILE_INTERACTION}`}
            >
              <div className="relative w-36 h-36">
                <svg className="w-full h-full" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="64" cy="64" r={RING_RADIUS} className="progress-ring-track" strokeWidth="8" />
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
                  <div className="font-mono tabular-nums font-bold text-2xl text-solaris-gold">100%</div>
                  <div className="hud-label text-[9px]">MINED</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="font-mono tabular-nums text-solaris-gold font-semibold">
                  {CET_TOTAL_SUPPLY.toLocaleString()} CET
                </div>
                <div className="hud-label text-[10px] mt-1">{t.tokenomics.supply.toUpperCase()} · TON</div>
              </div>
            </div>

            <div
              className={`lg:col-span-4 p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-white/10 ${BENTO_TILE_INTERACTION}`}
            >
              <div className="hud-label mb-3">{t.tokenomics.poolAddress}</div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="hud-label text-[10px] mb-1">CET</div>
                  <div className="font-mono tabular-nums font-bold text-lg text-cyan-300">
                    {CET_TOTAL_SUPPLY.toLocaleString()}
                  </div>
                </div>
                <a
                  href={DEDUST_POOL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View CET token on DeDust exchange"
                  className="font-mono text-[10px] text-cyan-400 hover:text-amber-300 transition-colors text-right"
                >
                  EQB5…lfnB ↗
                </a>
              </div>
              <LivePoolStats />
              <div className="mt-4">
                <ChainStateWidget />
              </div>
            </div>

            <div
              className={`lg:col-span-4 p-5 lg:p-6 bg-solaris-gold/[0.04] ${BENTO_TILE_INTERACTION}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown className="w-5 h-5 text-solaris-gold" />
                <div className="hud-label text-solaris-gold">DCBM Stability</div>
              </div>
              <p className="text-solaris-muted text-sm leading-relaxed mb-3">
                <span className="text-solaris-text font-medium">Dynamic-Control Buyback Mechanism</span>{' '}
                uses PID controllers to reduce volatility by{' '}
                <span className="font-mono tabular-nums text-solaris-gold font-semibold">66%</span>.
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
          </div>

          {/* Mini metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-t border-white/10">
            {[
              { label: 'Launch Type', value: 'Fair Launch', valueClass: 'text-solaris-text' },
              { label: 'Mining Period', value: '90 Years', valueClass: 'text-cyan-300' },
              { label: 'Volatility ↓', value: '66%', valueClass: 'text-amber-300' },
              { label: 'Target Val.', value: '€1B', valueClass: 'text-emerald-400' },
            ].map(cell => (
              <div
                key={cell.label}
                className={`bg-[#080a0f] p-3 md:p-4 text-center ${BENTO_TILE_INTERACTION}`}
              >
                <div className="hud-label text-[9px] mb-1">{cell.label}</div>
                <div className={`font-mono tabular-nums text-sm font-semibold ${cell.valueClass}`}>{cell.value}</div>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <div className={`p-5 lg:p-6 border-t border-white/10 bg-black/20 ${BENTO_TILE_INTERACTION}`}>
            <div className="hud-label mb-3">Distribution</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-solaris-muted text-sm">Mining (90 years)</span>
                  <span className="font-mono tabular-nums text-cyan-300 font-semibold text-sm">66.66%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full animate-gradient-shift"
                    style={{ width: '66.66%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-solaris-muted text-sm">Team & Advisors</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-semibold text-sm">0.33%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '0.33%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-white/10 bg-black/30">
            <TokenomicsChart />
          </div>

          <div className="p-3 sm:p-4 border-t border-fuchsia-500/10 bg-black/25">
            <MeshSkillRibbon variant="compact" saltOffset={1330} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsSection;
