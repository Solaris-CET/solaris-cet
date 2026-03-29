import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { BarChart2, BookOpen, Brain, Globe, ExternalLink } from 'lucide-react';

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

// Static data defined outside component to avoid re-creation on every render
const categories: ResourceCategory[] = [
  {
    id: 'market',
    icon: BarChart2,
    color: 'gold',
    label: 'MARKET DATA',
    title: 'Track & Trade',
    resources: [
      {
        name: 'CoinGecko',
        description: 'Live price charts, market cap, volume, and on-chain analytics for CET and the broader TON ecosystem.',
        href: 'https://www.coingecko.com',
        tag: 'coingecko.com',
      },
      {
        name: 'CoinMarketCap',
        description: 'Trusted global aggregator for token rankings, supply data, and the CoinMarketCap Learn academy.',
        href: 'https://coinmarketcap.com',
        tag: 'coinmarketcap.com',
      },
      {
        name: 'DeDust DEX',
        description: 'The native TON decentralised exchange where CET trades. Swap TON → CET directly in your Tonkeeper wallet.',
        href: 'https://dedust.io',
        tag: 'dedust.io',
      },
    ],
  },
  {
    id: 'ecosystem',
    icon: Globe,
    color: 'cyan',
    label: 'TON ECOSYSTEM',
    title: 'Explore TON',
    resources: [
      {
        name: 'TON Foundation',
        description: 'Official documentation, developer guides, and the full specification of the TON blockchain — the home of CET.',
        href: 'https://ton.org',
        tag: 'ton.org',
      },
      {
        name: 'Tonkeeper',
        description: 'The most-used non-custodial TON wallet. Available as a mobile app and browser extension — required to hold CET.',
        href: 'https://tonkeeper.com',
        tag: 'tonkeeper.com',
      },
      {
        name: 'Tonscan Explorer',
        description: 'Real-time TON block explorer. Verify CET transactions, inspect contract state, and audit the DeDust pool on-chain.',
        href: 'https://tonscan.org',
        tag: 'tonscan.org',
      },
    ],
  },
  {
    id: 'research',
    icon: BookOpen,
    color: 'emerald',
    label: 'RESEARCH & NEWS',
    title: 'Stay Informed',
    resources: [
      {
        name: 'Messari',
        description: 'Institutional-grade research, protocol reports, and on-chain data analytics — the standard for informed crypto investment.',
        href: 'https://messari.io',
        tag: 'messari.io',
      },
      {
        name: 'CoinDesk',
        description: 'Award-winning crypto journalism: market news, regulatory developments, and deep-dive investigative reports.',
        href: 'https://www.coindesk.com',
        tag: 'coindesk.com',
      },
      {
        name: 'Solaris Whitepaper',
        description: 'Read the full Solaris CET whitepaper on IPFS — tokenomics, architecture, roadmap, and the High Intelligence thesis.',
        href: 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a',
        tag: 'ipfs',
      },
    ],
  },
  {
    id: 'ai',
    icon: Brain,
    color: 'violet',
    label: 'AI & AGENTS',
    title: 'Build Intelligence',
    resources: [
      {
        name: 'AI Agents for Beginners',
        description: 'Free 12-lesson course by Microsoft for building AI agents from the ground up — fundamentals, code examples, and hands-on exercises.',
        href: 'https://github.com/microsoft/ai-agents-for-beginners',
        tag: 'github.com/microsoft',
      },
      {
        name: 'HuggingFace Agents Course',
        description: 'Free intermediate-to-expert course on AI agents from HuggingFace — core concepts, code snippets, and practical build-and-deploy examples.',
        href: 'https://huggingface.co/learn/agents-course/en/unit0/introduction',
        tag: 'huggingface.co',
      },
      {
        name: 'Prompt Engineering Guide',
        description: 'Comprehensive free guide by DAIR.AI covering prompt engineering techniques essential for optimizing AI agents, with tutorials and research papers.',
        href: 'https://github.com/dair-ai/Prompt-Engineering-Guide',
        tag: 'github.com/dair-ai',
      },
      {
        name: 'Solaris CET on GitHub',
        description: 'Official open-source repository for the Solaris CET landing page — explore the code, open issues, or contribute to the project.',
        href: 'https://github.com/Solaris-CET/solaris-cet',
        tag: 'github.com/Solaris-CET',
      },
    ],
  },
];

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 82%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      const columns = gridRef.current?.querySelectorAll('.resource-column');
      if (columns) {
        gsap.fromTo(
          columns,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.7,
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              end: 'top 35%',
              scrub: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="resources"
      ref={sectionRef}
      className="relative section-glass py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-solaris-cyan/5 blur-[140px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-solaris-gold/5 blur-[140px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-cyan/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">ECOSYSTEM RESOURCES</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Everything You Need to{' '}
            <span className="text-solaris-cyan">Navigate</span>{' '}
            the Ecosystem
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            From tracking CET on-chain to exploring the TON network, staying informed on the
            latest research, and learning to build AI agents — these are the trusted platforms
            used by the Solaris community.
          </p>
        </div>

        {/* Quick Links bar */}
        <div className="bento-card p-4 mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Buy CET', href: 'https://dedust.io/swap/TON/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB', color: 'text-solaris-gold' },
            { label: 'Whitepaper', href: 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a', color: 'text-solaris-cyan' },
            { label: 'GitHub', href: 'https://github.com/Solaris-CET/solaris-cet', color: 'text-solaris-text' },
            { label: 'Telegram', href: 'https://t.me/SolarisCET', color: 'text-[#2AABEE]' },
          ].map(({ label, href, color }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold ${color}`}
            >
              {label} ↗
            </a>
          ))}
        </div>

        {/* Resource columns */}
        <div
          ref={gridRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
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
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
