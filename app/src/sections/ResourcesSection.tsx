import { useMemo } from 'react';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { BarChart2, BookOpen, Brain, Globe, ExternalLink } from 'lucide-react';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import {
  COINGECKO_SEARCH_CET_URL,
  COINMARKETCAP_SEARCH_CET_URL,
  TONVIEWER_CET_URL,
  DEXSCREENER_CET_SEARCH_URL,
  TONSCAN_CET_CONTRACT_URL,
} from '@/lib/cetContract';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { useLanguage } from '@/hooks/useLanguage';
import { PUBLIC_WHITEPAPER_IPFS_URL } from '@/lib/publicTrustLinks';

interface Resource {
  name: string;
  description: string;
  href: string;
  tag: string;
}

interface ResourceCategory {
  id: string;
  icon: typeof BarChart2;
  color: 'gold' | 'cyan' | 'emerald' | 'violet';
  label: string;
  title: string;
  resources: Resource[];
}

const WHITEPAPER_IPFS_URL = PUBLIC_WHITEPAPER_IPFS_URL;

const colorMap: Record<string, { bg: string; text: string; border: string; hud: string; hoverBorder: string }> = {
  gold: {
    bg: 'bg-solaris-gold/10',
    text: 'text-solaris-gold',
    border: 'border-solaris-gold/30',
    hud: 'text-solaris-gold',
    hoverBorder: 'hover:border-solaris-gold/30',
  },
  cyan: {
    bg: 'bg-solaris-cyan/10',
    text: 'text-solaris-cyan',
    border: 'border-solaris-cyan/30',
    hud: 'text-solaris-cyan',
    hoverBorder: 'hover:border-solaris-cyan/30',
  },
  emerald: {
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
    hud: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-400/30',
  },
  violet: {
    bg: 'bg-violet-400/10',
    text: 'text-violet-400',
    border: 'border-violet-400/30',
    hud: 'text-violet-400',
    hoverBorder: 'hover:border-violet-400/30',
  },
};

const ResourcesSection = () => {
  const { t } = useLanguage();
  const tx = t.resourcesUi;
  const categories: ResourceCategory[] = useMemo(() => {
    return [
      {
        id: 'market',
        icon: BarChart2,
        color: 'gold',
        label: tx.categories.market.label,
        title: tx.categories.market.title,
        resources: [
          {
            name: 'CoinGecko',
            description: tx.categories.market.resources.coinGeckoDescription,
            href: COINGECKO_SEARCH_CET_URL,
            tag: 'coingecko.com',
          },
          {
            name: 'CoinMarketCap',
            description: tx.categories.market.resources.coinMarketCapDescription,
            href: COINMARKETCAP_SEARCH_CET_URL,
            tag: 'coinmarketcap.com',
          },
          {
            name: 'DeDust DEX',
            description: tx.categories.market.resources.dedustDescription,
            href: 'https://dedust.io',
            tag: 'dedust.io',
          },
          {
            name: 'DEX Screener',
            description: tx.categories.market.resources.dexScreenerDescription,
            href: DEXSCREENER_CET_SEARCH_URL,
            tag: 'dexscreener.com',
          },
        ],
      },
      {
        id: 'ecosystem',
        icon: Globe,
        color: 'cyan',
        label: tx.categories.ecosystem.label,
        title: tx.categories.ecosystem.title,
        resources: [
          {
            name: 'TON Foundation',
            description: tx.categories.ecosystem.resources.tonFoundationDescription,
            href: 'https://ton.org',
            tag: 'ton.org',
          },
          {
            name: 'Tonkeeper',
            description: tx.categories.ecosystem.resources.tonkeeperDescription,
            href: 'https://tonkeeper.com',
            tag: 'tonkeeper.com',
          },
          {
            name: 'Tonscan Explorer',
            description: tx.categories.ecosystem.resources.tonscanDescription,
            href: TONSCAN_CET_CONTRACT_URL,
            tag: 'tonscan.org',
          },
          {
            name: 'Tonviewer',
            description: tx.categories.ecosystem.resources.tonviewerDescription,
            href: TONVIEWER_CET_URL,
            tag: 'tonviewer.com',
          },
        ],
      },
      {
        id: 'research',
        icon: BookOpen,
        color: 'emerald',
        label: tx.categories.research.label,
        title: tx.categories.research.title,
        resources: [
          {
            name: 'Messari',
            description: tx.categories.research.resources.messariDescription,
            href: 'https://messari.io',
            tag: 'messari.io',
          },
          {
            name: 'CoinDesk',
            description: tx.categories.research.resources.coindeskDescription,
            href: 'https://www.coindesk.com',
            tag: 'coindesk.com',
          },
          {
            name: tx.categories.research.resources.whitepaperName,
            description: tx.categories.research.resources.whitepaperDescription,
            href: WHITEPAPER_IPFS_URL,
            tag: 'ipfs',
          },
        ],
      },
      {
        id: 'ai',
        icon: Brain,
        color: 'violet',
        label: tx.categories.ai.label,
        title: tx.categories.ai.title,
        resources: [
          {
            name: tx.categories.ai.resources.agentsBeginnersName,
            description: tx.categories.ai.resources.agentsBeginnersDescription,
            href: 'https://github.com/microsoft/ai-agents-for-beginners',
            tag: 'github.com/microsoft',
          },
          {
            name: tx.categories.ai.resources.hfAgentsName,
            description: tx.categories.ai.resources.hfAgentsDescription,
            href: 'https://huggingface.co/learn/agents-course/en/unit0/introduction',
            tag: 'huggingface.co',
          },
          {
            name: tx.categories.ai.resources.promptGuideName,
            description: tx.categories.ai.resources.promptGuideDescription,
            href: 'https://github.com/dair-ai/Prompt-Engineering-Guide',
            tag: 'github.com/dair-ai',
          },
          {
            name: tx.categories.ai.resources.githubName,
            description: tx.categories.ai.resources.githubDescription,
            href: 'https://github.com/Solaris-CET/solaris-cet',
            tag: 'github.com/Solaris-CET',
          },
        ],
      },
    ];
  }, [tx]);

  return (
    <section
      id="resources"
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-solaris-cyan/5 blur-[140px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-solaris-gold/5 blur-[140px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <ScrollFadeUp className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-cyan/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">{tx.kicker}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-solaris-cyan">{tx.titleHighlight}</span> {tx.titleTail}
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.subtitle}
          </p>
        </ScrollFadeUp>

        {/* Quick Links bar */}
        <ScrollFadeUp>
          <div className="bento-card p-4 mb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: tx.quickLinks.buyCet, href: DEDUST_SWAP_URL, color: 'text-solaris-gold' },
              { label: tx.quickLinks.whitepaper, href: WHITEPAPER_IPFS_URL, color: 'text-solaris-cyan' },
              { label: tx.quickLinks.github, href: 'https://github.com/Solaris-CET/solaris-cet', color: 'text-solaris-text' },
              { label: tx.quickLinks.telegram, href: 'https://t.me/SolarisCET', color: 'text-solaris-cyan' },
              { label: tx.quickLinks.cetContract, href: TONSCAN_CET_CONTRACT_URL, color: 'text-emerald-400' },
            ].map(({ label, href, color }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold ${color} btn-quantum`}
              >
                {label} ↗
              </a>
            ))}
          </div>
        </ScrollFadeUp>

        {/* Resource columns */}
        <ScrollStaggerFadeUp className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const c = colorMap[cat.color];
            return (
              <div key={cat.id} className={`resource-column flex flex-col gap-4`}>
                {/* Category header */}
                <div className={`bento-card p-5 border ${c.border}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <span className={`hud-label ${c.hud}`}>{cat.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-solaris-text text-lg">
                    {cat.title}
                  </h3>
                </div>

                {/* Resource cards */}
                {cat.resources.map((res) => (
                  <a
                    key={res.name}
                    href={res.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`resource-card bento-card p-5 border border-white/5 ${c.hoverBorder} flex flex-col gap-2 group transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display font-semibold text-solaris-text group-hover:text-solaris-gold transition-colors">
                        {res.name}
                      </span>
                      <ExternalLink className={`w-4 h-4 shrink-0 mt-0.5 ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <p className="text-solaris-muted text-sm leading-relaxed">
                      {res.description}
                    </p>
                    <span className={`font-mono text-[11px] ${c.text} opacity-60 mt-1`}>
                      {res.tag} ↗
                    </span>
                  </a>
                ))}
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        <div className="mt-12 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={1810} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
