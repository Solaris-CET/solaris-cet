import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { MapPin, Leaf, Shield, TrendingUp, Layers, Sun, Landmark } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';

/** Inline SVG placeholder — replace with on-site photography of Cetățuia land when available */
const PHYSICAL_ASSET_PLACEHOLDER_BG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="pa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a1410"/>
          <stop offset="55%" stop-color="#12261c"/>
          <stop offset="100%" stop-color="#0d1f16"/>
        </linearGradient>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="rgba(255,255,255,0.02)"/>
        </pattern>
      </defs>
      <rect fill="url(#pa)" width="1920" height="800"/>
      <rect fill="url(#grain)" width="1920" height="800"/>
      <ellipse cx="960" cy="620" rx="900" ry="120" fill="rgba(16,185,129,0.08)"/>
      <text x="960" y="380" text-anchor="middle" fill="rgba(110,231,183,0.35)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" font-weight="600">Physical asset image — placeholder</text>
      <text x="960" y="420" text-anchor="middle" fill="rgba(148,163,184,0.45)" font-family="ui-monospace,monospace" font-size="14">Cetățuia, Romania · agricultural land</text>
    </svg>`
  );

// ─── RWA stats ────────────────────────────────────────────────────────────

const RWA_STATS = [
  { label: 'Location',       value: 'Cetățuia, Romania',   icon: MapPin,    color: 'text-emerald-400', border: 'border-emerald-400/20' },
  { label: 'Asset Class',    value: 'Agricultural Land',   icon: Leaf,      color: 'text-solaris-gold', border: 'border-solaris-gold/20' },
  { label: 'AI Integration', value: 'Precision Farming',   icon: Sun,       color: 'text-solaris-cyan', border: 'border-solaris-cyan/20' },
  { label: 'On-Chain Proof', value: 'IPFS + TON L1',       icon: Shield,    color: 'text-purple-400',   border: 'border-purple-400/20'  },
  { label: 'Yield Type',     value: 'Agricultural + Token', icon: TrendingUp,color: 'text-amber-400',    border: 'border-amber-400/20'  },
  { label: 'Token Layer',    value: 'CET · 9,000 supply',  icon: Layers,    color: 'text-pink-400',     border: 'border-pink-400/20'   },
];

const RWA_PILLARS = [
  {
    title: 'Tangible Backing',
    description: 'Every CET token is backed by productive agricultural land in Cetățuia, Romania — not speculative promises. The land generates real-world agricultural yield independent of crypto market cycles.',
    icon: Leaf,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    title: 'On-Chain Transparency',
    description: 'All land ownership documents, agricultural records, and AI farming reports are stored on IPFS and anchored to TON L1. Any holder can verify the backing assets without trusting a third party.',
    icon: Shield,
    color: 'text-solaris-cyan',
    bg: 'bg-solaris-cyan/10',
    border: 'border-solaris-cyan/20',
  },
  {
    title: 'AI-Optimised Yield',
    description: 'Solaris CET\'s ~200,000 task-specialist AI agents coordinate agricultural operations — soil analysis, crop rotation planning, weather prediction, and irrigation scheduling — with Oracle-orchestrated validation, maximising yield sustainably.',
    icon: Sun,
    color: 'text-solaris-gold',
    bg: 'bg-solaris-gold/10',
    border: 'border-solaris-gold/20',
  },
  {
    title: 'Structural Scarcity',
    description: 'With only 9,000 CET ever minted, each token represents a proportional share of a unique real-world asset. No competitor combines AI agent infrastructure with hard-capped supply and physical asset backing.',
    icon: TrendingUp,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
];

// ─── Component ────────────────────────────────────────────────────────────

/**
 * RwaSection — Real World Assets section showcasing the physical land
 * backing of Solaris CET and how AI agents optimise its yield.
 */
const RwaSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const physicalAssetRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      // Stats grid entrance
      gsap.fromTo(
        gridRef.current?.querySelectorAll('.rwa-stat') ?? [],
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1,
          stagger: { each: 0.07 },
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 82%', toggleActions: 'play none none none' },
        }
      );
      // Physical asset panel
      gsap.fromTo(
        physicalAssetRef.current?.querySelectorAll('.physical-asset-animate') ?? [],
        { y: 28, opacity: 0 },
        {
          y: 0, opacity: 1,
          stagger: { each: 0.08 },
          duration: 0.75,
          ease: 'expo.out',
          scrollTrigger: { trigger: physicalAssetRef.current, start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
      // Pillars entrance
      gsap.fromTo(
        pillarsRef.current?.querySelectorAll('.rwa-pillar') ?? [],
        { x: -24, opacity: 0 },
        {
          x: 0, opacity: 1,
          stagger: { each: 0.1 },
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: pillarsRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="rwa"
      ref={sectionRef}
      aria-label="Real World Assets — Cetățuia Agricultural Land"
      className="relative section-glass py-20 lg:py-28 overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="gold" />
      <div className="scan-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="hud-label text-emerald-400">REAL WORLD ASSETS · RWA</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Grounded in{' '}
            <span className="text-gradient-gold">Real Land</span>
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed max-w-2xl">
            Solaris CET is the only AI token backed by physical real-world assets.
            Productive agricultural land in Cetățuia, Romania — managed by 200,000 AI agents —
            provides structural backing that no competitor can replicate.
          </p>
        </div>

        {/* Physical asset — token ↔ land (not digital air) */}
        <div
          id="physical-asset"
          ref={physicalAssetRef}
          className="relative mb-12 rounded-2xl overflow-hidden border border-emerald-400/25 shadow-depth min-h-[min(52vh,420px)]"
          aria-labelledby="physical-asset-heading"
        >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 motion-safe:transition-transform duration-700"
            style={{
              backgroundImage: `linear-gradient(105deg, rgba(2,12,8,0.92) 0%, rgba(2,12,8,0.72) 38%, rgba(2,12,8,0.55) 65%, rgba(2,12,8,0.78) 100%), url(${PHYSICAL_ASSET_PLACEHOLDER_BG})`,
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 p-7 md:p-10 lg:p-12 flex flex-col justify-end min-h-[min(52vh,420px)] max-w-3xl">
            <div className="physical-asset-animate flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              </div>
              <span className="hud-label text-emerald-300/90">PHYSICAL ASSET · LAND ANCHOR</span>
            </div>
            <h3
              id="physical-asset-heading"
              className="physical-asset-animate font-display font-bold text-2xl md:text-3xl text-white mb-4 drop-shadow-sm"
            >
              The token is tied to{' '}
              <span className="text-emerald-300">real soil</span>, not screens
            </h3>
            <p className="physical-asset-animate text-solaris-muted text-sm md:text-base leading-relaxed mb-3">
              CET is designed as a claim on productive agricultural land in{' '}
              <strong className="text-solaris-text font-semibold">Cetățuia, Romania</strong>
              — the same jurisdiction and asset class referenced in RWA documentation. Each unit in the 9,000 CET supply maps to a
              fractional economic interest in that land-backed stack: crop yield, verified operations, and on-chain attestations
              (IPFS + TON) are the bridge between the token and the field.
            </p>
            <p className="physical-asset-animate text-emerald-200/85 text-sm md:text-[15px] leading-relaxed border-l-2 border-emerald-400/40 pl-4">
              This is structural backing: the project is not &ldquo;digital air&rdquo; — it is explicitly anchored in a named
              location and a tangible asset class you can verify independently.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {RWA_STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rwa-stat bento-card p-5 border ${stat.border} flex items-center gap-4`}>
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className={`w-[18px] h-[18px] ${stat.color}`} />
                </div>
                <div>
                  <div className={`font-display font-bold text-sm ${stat.color}`}>{stat.value}</div>
                  <div className="text-solaris-muted text-[10px] font-mono uppercase">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Four pillars */}
        <div ref={pillarsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {RWA_PILLARS.map(pillar => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className={`rwa-pillar bento-card p-6 border ${pillar.border} shadow-depth`}>
                <div className={`w-10 h-10 rounded-xl ${pillar.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${pillar.color}`} />
                </div>
                <h3 className={`font-display font-bold text-base mb-2 ${pillar.color}`}>{pillar.title}</h3>
                <p className="text-solaris-muted text-sm leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>

        {/* IPFS proof CTA */}
        <div className="mt-10 bento-card p-6 border border-solaris-gold/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-solaris-gold" />
          </div>
          <div className="flex-1">
            <div className="hud-label text-solaris-gold mb-1">VERIFIED ON-CHAIN</div>
            <p className="text-solaris-muted text-sm leading-relaxed">
              All RWA documentation is immutably stored on IPFS and anchored to TON Layer 1.
              The whitepaper CID{' '}
              <code className="text-solaris-cyan text-[11px] font-mono bg-white/5 px-1.5 py-0.5 rounded">
                bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a
              </code>
              {' '}is the on-chain proof of the agricultural backing.
            </p>
          </div>
          <a
            href="https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold text-sm font-semibold hover:bg-solaris-gold/20 transition-colors"
          >
            View IPFS Proof ↗
          </a>
        </div>

      </div>
    </section>
  );
};

export default RwaSection;
