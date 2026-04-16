import { lazy, Suspense } from 'react';
import { CheckCircle, XCircle, Minus, Trophy, Zap, Shield, Brain, Coins } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import { ChartLazyFallback } from '@/components/ChartLazyFallback';
import { useNearScreen } from '@/hooks/useNearScreen';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { useLanguage } from '../hooks/useLanguage';
import { CET_FIXED_SUPPLY_CAP, TASK_AGENT_MESH_TOTAL } from '@/lib/domainPillars';

const CompetitionCharts = lazy(() => import('@/components/CompetitionCharts'));

function CompetitionChartsPlaceholder() {
  return (
    <div className="grid lg:grid-cols-2 gap-8" aria-busy="true">
      <ChartLazyFallback className="min-h-[260px]" />
      <ChartLazyFallback className="min-h-[260px]" />
    </div>
  );
}

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

const fmtIntEn = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

const competitors: Competitor[] = [
  {
    name: 'Solaris CET',
    symbol: 'CET',
    chain: 'TON',
    supply: fmtIntEn(CET_FIXED_SUPPLY_CAP),
    tps: 'High (sharded)',
    agents: `${fmtIntEn(TASK_AGENT_MESH_TOTAL)} (simulated)`,
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
    tps: 'Varies',
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
    tps: 'Varies',
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
    tps: 'L1/L2 dependent',
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
    tps: 'L1/L2 dependent',
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
    tps: 'Varies',
    agents: 'Marketplace',
    rwa: false,
    dualAi: false,
    mining: false,
    auditKyc: true,
    marginalCost: 'Variable',
  },
];

function BoolCell({ value }: { value: boolean | 'partial' }) {
  if (value === true) return <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />;
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

const CompetitionSection = () => {
  const { t } = useLanguage();
  const cs = t.competitionSection;
  const { isNearScreen: chartsNearViewport, fromRef: chartsGateRef } = useNearScreen({ distance: '320px' });

  const advantageCards = [
    { icon: Coins, title: cs.advScarcityTitle, body: cs.advScarcityBody, color: 'text-solaris-gold', bg: 'bg-solaris-gold/10', border: 'border-solaris-gold/20' },
    { icon: Zap, title: cs.advTonTitle, body: cs.advTonBody, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { icon: Brain, title: cs.advDualAiTitle, body: cs.advDualAiBody, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { icon: Shield, title: cs.advRwaTitle, body: cs.advRwaBody, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  ];

  const tableRowsText = [
    { label: cs.rowTotalSupply, key: 'supply' as const },
    { label: cs.rowTps, key: 'tps' as const },
    { label: cs.rowAgents, key: 'agents' as const },
    { label: cs.rowMarginalCost, key: 'marginalCost' as const },
  ];

  const tableRowsBool = [
    { label: cs.rowRwa, key: 'rwa' as const },
    { label: cs.rowDualAi, key: 'dualAi' as const },
    { label: cs.rowPowMining, key: 'mining' as const },
    { label: cs.rowAuditKyc, key: 'auditKyc' as const },
  ];

  return (
    <section
      id="competition"
      aria-label={t.sectionAria.competition}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="gold" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <ScrollFadeUp className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">{cs.badge}</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {cs.titleLead}{' '}
            <span className="text-solaris-gold">{cs.titleAccent}</span>
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {cs.introLead}
            <span className="text-solaris-text font-semibold">{cs.introEmphasis}</span>
            {cs.introTail}
          </p>
        </ScrollFadeUp>

        <ScrollFadeUp className="mb-16 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left p-3 text-solaris-muted text-xs font-mono uppercase tracking-widest border-b border-white/10 w-36"
                >
                  {cs.tableFeature}
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.symbol}
                    scope="col"
                    className={`text-center p-3 text-xs font-bold uppercase tracking-wider border-b ${
                      c.isCET
                        ? 'text-solaris-gold border-solaris-gold/40 bg-solaris-gold/5'
                        : 'text-solaris-muted border-white/10'
                    }`}
                  >
                    <div>{c.symbol}</div>
                    <div
                      className={`text-[10px] font-normal mt-0.5 ${c.isCET ? 'text-solaris-gold/70' : 'text-solaris-muted/50'}`}
                    >
                      {c.chain}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRowsText.map(({ label, key }) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <th scope="row" className="p-3 text-solaris-muted text-xs font-mono text-left font-normal">
                    {label}
                  </th>
                  {competitors.map((c) => (
                    <td key={c.symbol} className={`p-3 text-center ${c.isCET ? 'bg-solaris-gold/5' : ''}`}>
                      <TextCell value={c[key] as string} isCET={c.isCET} />
                    </td>
                  ))}
                </tr>
              ))}
              {tableRowsBool.map(({ label, key }) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <th scope="row" className="p-3 text-solaris-muted text-xs font-mono text-left font-normal">
                    {label}
                  </th>
                  {competitors.map((c) => (
                    <td key={c.symbol} className={`p-3 text-center ${c.isCET ? 'bg-solaris-gold/5' : ''}`}>
                      <BoolCell value={c[key] as boolean | 'partial'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-solaris-muted/50 text-[11px] mt-2 font-mono max-w-4xl">{cs.dataDisclaimer}</p>
        </ScrollFadeUp>

        <ScrollStaggerFadeUp className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {advantageCards.map((adv) => {
            const Icon = adv.icon;
            return (
              <div
                key={adv.title}
                className={`adv-card bento-card p-6 border ${adv.border} group hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl ${adv.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${adv.color}`} />
                </div>
                <h3 className={`font-display font-bold text-sm mb-2 ${adv.color}`}>{adv.title}</h3>
                <p className="text-solaris-muted text-xs leading-relaxed">{adv.body}</p>
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        <div ref={chartsGateRef} className="mt-16">
          {!chartsNearViewport ? (
            <CompetitionChartsPlaceholder />
          ) : (
            <Suspense fallback={<CompetitionChartsPlaceholder />}>
              <CompetitionCharts />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
};

export default CompetitionSection;
