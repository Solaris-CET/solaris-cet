import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { CheckCircle, XCircle, Minus, Trophy, Zap, Shield, Brain, Coins } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';

// ─── Types ────────────────────────────────────────────────────────────────

interface Competitor {
  name: string;
  symbol: string;
  chain: string;
  supply: string;
  tps: string;
  agents: string;
  rwa: boolean | 'partial';
  dualAi: boolean;
  mining: boolean;
  auditKyc: boolean;
  marginalCost: string;
  isCET?: boolean;
}

const competitors: Competitor[] = [
  {
    name: 'Solaris CET',
    symbol: 'CET',
    chain: 'TON',
    supply: '9,000',
    tps: '100,000',
    agents: '200,000',
    rwa: true,
    dualAi: true,
    mining: true,
    auditKyc: true,
    marginalCost: '$0',
    isCET: true,
  },
  {
    name: 'Fetch.ai',
    symbol: 'FET',
    chain: 'Cosmos',
    supply: '1.15B',
    tps: '~1,000',
    agents: 'Marketplace',
    rwa: false,
    dualAi: false,
    mining: false,
    auditKyc: true,
    marginalCost: 'Variable',
  },
  {
    name: 'Bittensor',
    symbol: 'TAO',
    chain: 'Custom',
    supply: '21M',
    tps: '~1,000',
    agents: 'Subnet miners',
    rwa: false,
    dualAi: false,
    mining: true,
    auditKyc: true,
    marginalCost: 'Variable',
  },
  {
    name: 'SingularityNET',
    symbol: 'AGIX',
    chain: 'ETH/BNB',
    supply: '2B',
    tps: '~15',
    agents: 'Marketplace',
    rwa: false,
    dualAi: false,
    mining: false,
    auditKyc: true,
    marginalCost: 'Variable',
  },
  {
    name: 'Ocean Protocol',
    symbol: 'OCEAN',
    chain: 'ETH/Polygon',
    supply: '1.41B',
    tps: '~15',
    agents: 'Data agents',
    rwa: 'partial',
    dualAi: false,
    mining: false,
    auditKyc: true,
    marginalCost: 'Variable',
  },
  {
    name: 'ASI Alliance',
    symbol: 'ASI',
    chain: 'Multi',
    supply: '~4.6B',
    tps: '~1,000',
    agents: 'Marketplace',
    rwa: false,
    dualAi: false,
    mining: false,
    auditKyc: true,
    marginalCost: 'Variable',
  },
];

// ─── Feature rows ─────────────────────────────────────────────────────────


function BoolCell({ value }: { value: boolean | 'partial' }) {
  if (value === true)    return <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (value === 'partial') return <Minus className="w-4 h-4 text-solaris-gold mx-auto" />;
  return <XCircle className="w-4 h-4 text-red-400/60 mx-auto" />;
}

function TextCell({ value, isCET }: { value: string; isCET?: boolean }) {
  return (
    <span className={`font-mono text-xs ${isCET ? 'text-solaris-gold font-bold' : 'text-solaris-muted'}`}>
      {value}
    </span>
  );
}

// ─── CET advantage cards ──────────────────────────────────────────────────

const advantages = [
  {
    icon: Coins,
    title: 'Extreme Scarcity',
    body: '9,000 CET total — forever. FET has 1.15B tokens. AGIX has 2B. Scarcity is Solaris CET\'s permanent structural advantage.',
    color: 'text-solaris-gold',
    bg: 'bg-solaris-gold/10',
    border: 'border-solaris-gold/20',
  },
  {
    icon: Zap,
    title: 'Fastest Chain: TON',
    body: '100,000 TPS and 2-second finality. Fetch.ai, TAO, AGIX, and OCEAN run on chains with <1,000 TPS. Speed is not even close.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  {
    icon: Brain,
    title: 'Only Dual-AI Protocol',
    body: 'Grok (xAI) × Gemini (Google) — every agent action Reasons + Acts + Verifies with two independent frontier models. No competitor does this.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Shield,
    title: 'Real-World Asset Backing',
    body: 'Each CET is anchored to actual agricultural and AI infrastructure in Cetățuia, Romania. Every competitor is purely digital speculation.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
];

// ─── Component ────────────────────────────────────────────────────────────

const CompetitionSection = () => {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const headingRef   = useRef<HTMLDivElement>(null);
  const tableRef     = useRef<HTMLDivElement>(null);
  const cardsRef     = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current,
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8,
          scrollTrigger: { trigger: headingRef.current, start: 'top 82%', end: 'top 55%', scrub: true } }
      );
      gsap.fromTo(tableRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8,
          scrollTrigger: { trigger: tableRef.current, start: 'top 80%', end: 'top 45%', scrub: true } }
      );
      const cards = cardsRef.current?.querySelectorAll('.adv-card');
      if (cards) {
        gsap.fromTo(cards,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.7,
            scrollTrigger: { trigger: cardsRef.current, start: 'top 80%', end: 'top 30%', scrub: true } }
        );
      }
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="competition"
      ref={sectionRef}
      aria-label="Competitive Analysis"
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
    >
      <GlowOrbs variant="gold" />

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">

        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">COMPETITIVE ANALYSIS</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            How Solaris CET Compares to{' '}
            <span className="text-solaris-gold">AI Token Leaders</span>
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            FET, TAO, AGIX, OCEAN and ASI combined represent{' '}
            <span className="text-solaris-text font-semibold">$8B+ in market capitalisation</span>.
            Below is why Solaris CET is structurally different — and superior — on every dimension that drives long-term value.
          </p>
        </div>

        {/* Comparison table */}
        <div ref={tableRef} className="mb-16 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 text-solaris-muted text-xs font-mono uppercase tracking-widest border-b border-white/10 w-36">
                  Feature
                </th>
                {competitors.map(c => (
                  <th
                    key={c.symbol}
                    className={`text-center p-3 text-xs font-bold uppercase tracking-wider border-b ${
                      c.isCET
                        ? 'text-solaris-gold border-solaris-gold/40 bg-solaris-gold/5'
                        : 'text-solaris-muted border-white/10'
                    }`}
                  >
                    <div>{c.symbol}</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${c.isCET ? 'text-solaris-gold/70' : 'text-solaris-muted/50'}`}>
                      {c.chain}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { label: 'Total Supply',   key: 'supply'       as const },
                  { label: 'TPS',            key: 'tps'          as const },
                  { label: 'Active Agents',  key: 'agents'       as const },
                  { label: 'Marginal Cost',  key: 'marginalCost' as const },
                ] as { label: string; key: keyof Competitor }[]
              ).map(({ label, key }) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-3 text-solaris-muted text-xs font-mono">{label}</td>
                  {competitors.map(c => (
                    <td key={c.symbol} className={`p-3 text-center ${c.isCET ? 'bg-solaris-gold/5' : ''}`}>
                      <TextCell value={c[key] as string} isCET={c.isCET} />
                    </td>
                  ))}
                </tr>
              ))}
              {(
                [
                  { label: 'RWA Backing',  key: 'rwa'      as const },
                  { label: 'Dual-AI',      key: 'dualAi'   as const },
                  { label: 'PoW Mining',   key: 'mining'   as const },
                  { label: 'Audit + KYC', key: 'auditKyc' as const },
                ] as { label: string; key: keyof Competitor }[]
              ).map(({ label, key }) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-3 text-solaris-muted text-xs font-mono">{label}</td>
                  {competitors.map(c => (
                    <td key={c.symbol} className={`p-3 text-center ${c.isCET ? 'bg-solaris-gold/5' : ''}`}>
                      <BoolCell value={c[key] as boolean | 'partial'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-solaris-muted/50 text-[11px] mt-2 font-mono">
            * Data sourced from public whitepapers and official project documentation. Supply figures are approximate.
          </p>
        </div>

        {/* Advantage cards */}
        <div ref={cardsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {advantages.map(adv => {
            const Icon = adv.icon;
            return (
              <div
                key={adv.title}
                className={`adv-card glass-card p-6 border ${adv.border} group hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl ${adv.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${adv.color}`} />
                </div>
                <h3 className={`font-display font-bold text-sm mb-2 ${adv.color}`}>{adv.title}</h3>
                <p className="text-solaris-muted text-xs leading-relaxed">{adv.body}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default CompetitionSection;
