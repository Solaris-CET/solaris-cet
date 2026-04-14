import { useMemo } from 'react';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { TrendingUp, ExternalLink, BarChart2 } from 'lucide-react';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { productionSiteUrl } from '@/lib/brandAssets';
import { useLanguage } from '@/hooks/useLanguage';

interface CryptoProject {
  name: string;
  symbol: string;
  href: string;
  category: 'l1' | 'stablecoin' | 'defi' | 'ai' | 'meme' | 'other';
}

const projects: CryptoProject[] = [
  // L1 Blockchains
  { name: 'Bitcoin', symbol: 'BTC', href: 'https://bitcoin.org/', category: 'l1' },
  { name: 'Ethereum', symbol: 'ETH', href: 'https://www.ethereum.org/', category: 'l1' },
  { name: 'BNB', symbol: 'BNB', href: 'https://www.bnbchain.org/en', category: 'l1' },
  { name: 'XRP', symbol: 'XRP', href: 'https://www.xrpl.org', category: 'l1' },
  { name: 'Solana', symbol: 'SOL', href: 'https://solana.com', category: 'l1' },
  { name: 'Toncoin', symbol: 'TON', href: 'https://ton.org/', category: 'l1' },
  { name: 'Cardano', symbol: 'ADA', href: 'https://www.cardano.org', category: 'l1' },
  { name: 'Avalanche', symbol: 'AVAX', href: 'https://coinmarketcap.com/currencies/avalanche/', category: 'l1' },
  { name: 'Polkadot', symbol: 'DOT', href: 'https://polkadot.network/', category: 'l1' },
  { name: 'NEAR Protocol', symbol: 'NEAR', href: 'https://near.org/', category: 'l1' },
  { name: 'Stellar', symbol: 'XLM', href: 'https://www.stellar.org', category: 'l1' },
  { name: 'Hedera', symbol: 'HBAR', href: 'https://www.hedera.com/', category: 'l1' },
  { name: 'Sui', symbol: 'SUI', href: 'https://sui.io/', category: 'l1' },
  { name: 'Internet Computer', symbol: 'ICP', href: 'https://internetcomputer.org/', category: 'l1' },
  // Stablecoins
  { name: 'Tether', symbol: 'USDT', href: 'https://tether.to', category: 'stablecoin' },
  { name: 'USDC', symbol: 'USDC', href: 'https://www.circle.com/en/usdc', category: 'stablecoin' },
  { name: 'Dai', symbol: 'DAI', href: 'https://makerdao.com/', category: 'stablecoin' },
  { name: 'Ethena USDe', symbol: 'USDe', href: 'https://www.ethena.fi/', category: 'stablecoin' },
  { name: 'Ripple USD', symbol: 'RLUSD', href: 'https://ripple.com/solutions/stablecoin/', category: 'stablecoin' },
  { name: 'Tether Gold', symbol: 'XAUt', href: 'https://gold.tether.to/', category: 'stablecoin' },
  { name: 'PAX Gold', symbol: 'PAXG', href: 'https://www.paxos.com/wp-content/uploads/2019/09/PAX-Gold-Whitepaper.pdf', category: 'stablecoin' },
  // DeFi & Infrastructure
  { name: 'Chainlink', symbol: 'LINK', href: 'https://chain.link/', category: 'defi' },
  { name: 'Uniswap', symbol: 'UNI', href: 'https://uniswap.org', category: 'defi' },
  { name: 'Aave', symbol: 'AAVE', href: 'https://aave.com/', category: 'defi' },
  { name: 'Hyperliquid', symbol: 'HYPE', href: 'https://hyperliquid.xyz/', category: 'defi' },
  { name: 'Mantle', symbol: 'MNT', href: 'https://group.mantle.xyz/', category: 'defi' },
  // AI Tokens — Solaris CET's direct competitive space
  { name: 'Solaris CET', symbol: 'CET', href: productionSiteUrl(), category: 'ai' },
  { name: 'Fetch.ai',    symbol: 'FET',   href: 'https://fetch.ai/',                      category: 'ai' },
  { name: 'Bittensor',   symbol: 'TAO',   href: 'https://bittensor.com',                  category: 'ai' },
  { name: 'SingularityNET', symbol: 'AGIX', href: 'https://singularitynet.io/',           category: 'ai' },
  { name: 'Ocean Protocol', symbol: 'OCEAN', href: 'https://oceanprotocol.com/',          category: 'ai' },
  { name: 'ASI Alliance', symbol: 'ASI',  href: 'https://superintelligence.io/',          category: 'ai' },
  { name: 'Render',      symbol: 'RNDR',  href: 'https://rendernetwork.com/',             category: 'ai' },
  { name: 'Akash',       symbol: 'AKT',   href: 'https://akash.network/',                 category: 'ai' },
  { name: 'Sky', symbol: 'SKY', href: 'https://sky.money/', category: 'defi' },
  { name: 'Aster', symbol: 'ATR', href: 'https://www.asterdex.com/', category: 'defi' },
  // Meme & Community
  { name: 'Dogecoin', symbol: 'DOGE', href: 'https://foundation.dogecoin.com/about/', category: 'meme' },
  { name: 'Shiba Inu', symbol: 'SHIB', href: 'https://shibatoken.com/', category: 'meme' },
  { name: 'Pepe', symbol: 'PEPE', href: 'https://www.pepe.vip/', category: 'meme' },
  // Other
  { name: 'TRON', symbol: 'TRX', href: 'https://trondao.org/', category: 'other' },
  { name: 'Monero', symbol: 'XMR', href: 'https://www.getmonero.org/', category: 'other' },
  { name: 'Bitcoin Cash', symbol: 'BCH', href: 'https://bch.info', category: 'other' },
  { name: 'Litecoin', symbol: 'LTC', href: 'https://litecoin.org/', category: 'other' },
  { name: 'UNUS SED LEO', symbol: 'LEO', href: 'https://www.bitfinex.com/', category: 'other' },
  { name: 'Cronos', symbol: 'CRO', href: 'https://cronos.org/', category: 'other' },
  { name: 'OKB', symbol: 'OKB', href: 'https://www.okx.com/', category: 'other' },
  { name: 'Canton', symbol: 'CANT', href: 'https://www.cantonscan.com/', category: 'other' },
  { name: 'Pi', symbol: 'PI', href: 'https://minepi.com', category: 'other' },
];

interface CategoryConfig {
  id: CryptoProject['category'];
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

const EcosystemIndexSection = () => {
  const { t } = useLanguage();
  const tx = t.ecosystemIndexUi;

  const categoryConfig: CategoryConfig[] = useMemo(() => {
    return [
      {
        id: 'l1',
        label: tx.categories.l1,
        color: 'text-solaris-cyan',
        badgeBg: 'bg-solaris-cyan/15',
        badgeText: 'text-solaris-cyan',
      },
      {
        id: 'stablecoin',
        label: tx.categories.stablecoin,
        color: 'text-solaris-gold',
        badgeBg: 'bg-solaris-gold/15',
        badgeText: 'text-solaris-gold',
      },
      {
        id: 'ai',
        label: tx.categories.ai,
        color: 'text-purple-400',
        badgeBg: 'bg-purple-400/15',
        badgeText: 'text-purple-400',
      },
      {
        id: 'defi',
        label: tx.categories.defi,
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-400/15',
        badgeText: 'text-emerald-400',
      },
      {
        id: 'meme',
        label: tx.categories.meme,
        color: 'text-violet-400',
        badgeBg: 'bg-violet-400/15',
        badgeText: 'text-violet-400',
      },
      {
        id: 'other',
        label: tx.categories.other,
        color: 'text-slate-400',
        badgeBg: 'bg-slate-400/15',
        badgeText: 'text-slate-400',
      },
    ];
  }, [tx.categories.ai, tx.categories.defi, tx.categories.l1, tx.categories.meme, tx.categories.other, tx.categories.stablecoin]);

  return (
    <section
      id="ecosystem-index"
      aria-label={t.sectionAria.ecosystemIndex}
      className="relative section-glass py-20 lg:py-28 overflow-hidden mesh-bg"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-solaris-cyan/20 to-transparent" />
        <div className="absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full bg-solaris-gold/4 blur-[160px]" />
        <div className="absolute bottom-1/3 -right-48 w-[600px] h-[600px] rounded-full bg-solaris-cyan/4 blur-[160px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <ScrollFadeUp className="max-w-2xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">{tx.kicker}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.titleLead ? <>{tx.titleLead} </> : null}
            <span className="text-gradient-gold">{tx.titleAccent}</span> {tx.titleTail}
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.subtitle}
          </p>
        </ScrollFadeUp>

        {/* CET unique value callout */}
        <div className="glass-card-gold p-5 mb-8 flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-solaris-gold" />
          </div>
          <div>
            <div className="hud-label text-solaris-gold mb-1">{tx.uniqueKicker}</div>
            <p className="text-solaris-muted text-sm leading-relaxed">
              {tx.uniqueBodyPrefix} <span className="text-solaris-text font-semibold">{tx.uniqueTokenName}</span>{' '}
              {tx.uniqueBodySuffix}
            </p>
          </div>
        </div>

        {/* CMC20 Index featured card */}
        <ScrollFadeUp className="mb-14">
          <a
            href="https://app.reserve.org/bsc/index-dtf/0x2f8a339b5889ffac4c5a956787cda593b3c36867/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="group bento-card p-6 lg:p-8 border border-solaris-gold/30 hover:border-solaris-gold/60 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 btn-quantum"
          >
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center">
                <BarChart2 className="w-7 h-7 text-solaris-gold" />
              </div>
              <div>
                <span className="hud-label text-solaris-gold text-[10px]">{tx.featuredKicker}</span>
                <h3 className="font-display font-bold text-solaris-text text-xl mt-0.5">
                  CoinMarketCap 20 Index
                </h3>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-solaris-muted text-sm leading-relaxed">
                {tx.featuredBody}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-solaris-gold/60">app.reserve.org ↗</span>
              <ExternalLink className="w-4 h-4 text-solaris-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        </ScrollFadeUp>

        {/* Project grid grouped by category */}
        <ScrollStaggerFadeUp className="space-y-10">
          {categoryConfig.map((cat) => {
            const catProjects = projects.filter((p) => p.category === cat.id);
            return (
              <div key={cat.id} className="category-group">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`hud-label ${cat.color}`}>{cat.label.toUpperCase()}</span>
                  <div className="flex-1 h-[1px] bg-white/5" />
                  <span className="font-mono text-[11px] text-solaris-muted">
                    {catProjects.length} {tx.projectsUnit}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {catProjects.map((project) => (
                    <a
                      key={project.symbol}
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/8 ${cat.badgeBg} hover:border-white/20 transition-all duration-200 btn-quantum`}
                    >
                      <span className={`font-mono font-semibold text-xs ${cat.badgeText}`}>
                        {project.symbol}
                      </span>
                      <span className="text-solaris-muted text-xs group-hover:text-solaris-text transition-colors">
                        {project.name}
                      </span>
                      <ExternalLink className={`w-3 h-3 ${cat.badgeText} opacity-0 group-hover:opacity-60 transition-opacity`} />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        <div className="mt-10 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={1180} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default EcosystemIndexSection;
