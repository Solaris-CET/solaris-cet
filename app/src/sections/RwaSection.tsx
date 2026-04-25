import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { MapPin, Leaf, Shield, TrendingUp, Layers, Sun, Landmark, ExternalLink, Fingerprint, Wallet } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { useLanguage } from '../hooks/useLanguage';
import { PredictiveTerrainHeatmap } from '@/components/PredictiveTerrainHeatmap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RwaPortfolioMap } from '@/components/rwa/RwaPortfolioMap';
import { RwaTimelinePanel } from '@/components/rwa/RwaTimelinePanel';
import { RwaDocumentsPanel } from '@/components/rwa/RwaDocumentsPanel';
import { RWA_DOCUMENTS, RWA_PROJECTS, RWA_TIMELINE, statusChipClass } from '@/lib/rwaPortfolio';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TONSCAN_CET_CONTRACT_URL } from '@/lib/cetContract';
import { DEDUST_POOL_PAGE_URL } from '@/lib/dedustUrls';
import { PUBLIC_WHITEPAPER_IPFS_CID, PUBLIC_WHITEPAPER_IPFS_URL } from '@/lib/publicTrustLinks';

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
      <text x="960" y="380" text-anchor="middle" fill="rgba(242,201,76,0.22)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" font-weight="700">Cetățuia, Romania</text>
      <text x="960" y="420" text-anchor="middle" fill="rgba(148,163,184,0.45)" font-family="ui-monospace,monospace" font-size="14">Cetățuia, România · teren agricol</text>
    </svg>`
  );

const DEFAULT_PHYSICAL_ASSET_PHOTO_URL = '/rwa/cetatuia.jpg';

function ipfsCidFromUrl(url: string): string | null {
  const m = url.match(/\/ipfs\/([^/?#]+)/i);
  return m?.[1] ?? null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

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
    description: 'Solaris CET\'s ~200,000 task-specialist AI agents coordinate agricultural operations — soil analysis, crop rotation planning, weather prediction, and irrigation scheduling — with CET AI–orchestrated validation, maximising yield sustainably.',
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
  const { t } = useLanguage();
  const tx = t.rwaSectionUi;
  const cx = t.rwaContentUi;
  const prefersReducedMotion = useReducedMotion();
  const physicalBgRef = useRef<HTMLDivElement | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(RWA_PROJECTS[0]?.id ?? null);
  const [physicalAssetPhotoUrl, setPhysicalAssetPhotoUrl] = useState<string | null>(null);

  const rwaStats = useMemo(() => {
    return [
      { ...RWA_STATS[0], label: cx.stats.locationLabel, value: cx.stats.locationValue },
      { ...RWA_STATS[1], label: cx.stats.assetClassLabel, value: cx.stats.assetClassValue },
      { ...RWA_STATS[2], label: cx.stats.aiIntegrationLabel, value: cx.stats.aiIntegrationValue },
      { ...RWA_STATS[3], label: cx.stats.onChainProofLabel, value: cx.stats.onChainProofValue },
      { ...RWA_STATS[4], label: cx.stats.yieldTypeLabel, value: cx.stats.yieldTypeValue },
      { ...RWA_STATS[5], label: cx.stats.tokenLayerLabel, value: cx.stats.tokenLayerValue },
    ];
  }, [cx.stats]);

  const rwaPillars = useMemo(() => {
    return [
      { ...RWA_PILLARS[0], title: cx.pillars.tangibleTitle, description: cx.pillars.tangibleDescription },
      { ...RWA_PILLARS[1], title: cx.pillars.transparencyTitle, description: cx.pillars.transparencyDescription },
      { ...RWA_PILLARS[2], title: cx.pillars.aiYieldTitle, description: cx.pillars.aiYieldDescription },
      { ...RWA_PILLARS[3], title: cx.pillars.scarcityTitle, description: cx.pillars.scarcityDescription },
    ];
  }, [cx.pillars]);

  const selectedProject = useMemo(() => {
    return RWA_PROJECTS.find((p) => p.id === selectedProjectId) ?? RWA_PROJECTS[0] ?? null;
  }, [selectedProjectId]);

  const selectedDocuments = useMemo(() => {
    if (!selectedProject) return [];
    const ids = new Set(selectedProject.documentIds);
    return RWA_DOCUMENTS.filter((d) => ids.has(d.id));
  }, [selectedProject]);

  const selectedTimeline = useMemo(() => {
    if (!selectedProject) return [];
    const ids = new Set(selectedProject.timelineIds);
    return RWA_TIMELINE.filter((e) => ids.has(e.id));
  }, [selectedProject]);

  useEffect(() => {
    const configured = import.meta.env.VITE_RWA_PHOTO_URL;
    const candidate = configured?.trim() ? configured.trim() : DEFAULT_PHYSICAL_ASSET_PHOTO_URL;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => setPhysicalAssetPhotoUrl(candidate);
    img.onerror = () => setPhysicalAssetPhotoUrl(null);
    img.src = candidate;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const bg = physicalBgRef.current;
    if (!bg) return;
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = bg.getBoundingClientRect();
      const offset = clamp(rect.top, -900, 900);
      const y = clamp(offset * -0.08, -48, 48);
      bg.style.transform = `translate3d(0, ${y}px, 0) scale(1.05)`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      bg.style.transform = '';
    };
  }, [prefersReducedMotion]);

  const ipfsCid = useMemo(() => ipfsCidFromUrl(PUBLIC_WHITEPAPER_IPFS_URL), []);
  const proofCid = ipfsCid ?? PUBLIC_WHITEPAPER_IPFS_CID;
  const mapsQuery = useMemo(() => encodeURIComponent(selectedProject?.region ?? tx.physicalLocationName), [selectedProject, tx.physicalLocationName]);
  const mapsEmbedUrl = useMemo(() => `https://www.google.com/maps?q=${mapsQuery}&output=embed`, [mapsQuery]);
  const mapsOpenUrl = useMemo(() => `https://www.google.com/maps?q=${mapsQuery}`, [mapsQuery]);
  const verifiedBodyParts = useMemo(() => tx.verifiedBody.split('{cid}'), [tx.verifiedBody]);

  return (
    <section
      id="rwa"
      aria-label={t.sectionAria.rwa}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="gold" />
      <div className="scan-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">

        {/* Header */}
        <ScrollFadeUp className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="hud-label text-emerald-400">{tx.kicker}</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.titleLead}{' '}
            <span className="text-gradient-gold">{tx.titleAccent}</span>
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed max-w-2xl">
            {tx.subtitle}
          </p>
        </ScrollFadeUp>

        {/* Physical asset — token ↔ land (not digital air) */}
        <ScrollFadeUp>
          <div
            id="physical-asset"
            className="relative mb-12 rounded-2xl overflow-hidden border border-emerald-400/25 shadow-depth min-h-[min(52vh,420px)]"
            aria-labelledby="physical-asset-heading"
          >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 motion-safe:transition-transform duration-700"
            ref={physicalBgRef}
            style={{
              backgroundImage: `linear-gradient(105deg, rgba(2,12,8,0.92) 0%, rgba(2,12,8,0.72) 38%, rgba(2,12,8,0.55) 65%, rgba(2,12,8,0.78) 100%), url(${physicalAssetPhotoUrl ?? PHYSICAL_ASSET_PLACEHOLDER_BG})`,
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 p-7 md:p-10 lg:p-12 flex flex-col justify-end min-h-[min(52vh,420px)] max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              </div>
              <span className="hud-label text-emerald-300/90">
                {tx.physicalKicker}
              </span>
            </div>
            <h3
              id="physical-asset-heading"
              className="font-display font-bold text-2xl md:text-3xl text-white mb-4 drop-shadow-sm"
            >
              {tx.physicalHeadingLead} <span className="text-emerald-300">{tx.physicalHeadingAccent}</span>,{' '}
              {tx.physicalHeadingTail}
            </h3>
            <p className="text-solaris-muted text-sm md:text-base leading-relaxed mb-3">
              {tx.physicalBodyPrefix} <strong className="text-solaris-text font-semibold">{tx.physicalLocationName}</strong>{' '}
              {tx.physicalBodySuffix}
            </p>
            <p className="text-emerald-200/85 text-sm md:text-[15px] leading-relaxed border-l-2 border-emerald-400/40 pl-4">
              {tx.physicalQuote}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href={TONSCAN_CET_CONTRACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-mono text-emerald-200 hover:bg-emerald-400/15 transition-colors btn-quantum"
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                {tx.chipTonContract}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>
              <a
                href={DEDUST_POOL_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-solaris-gold/25 bg-solaris-gold/10 px-3 py-1.5 text-[11px] font-mono text-solaris-gold hover:bg-solaris-gold/15 transition-colors btn-quantum"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                {tx.chipDedustPool}
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>
              <a
                href={PUBLIC_WHITEPAPER_IPFS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-solaris-text hover:bg-white/10 transition-colors btn-quantum"
                title={ipfsCid ? `CID: ${ipfsCid}` : undefined}
              >
                <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
                {tx.chipIpfsProof}
                <span className="text-solaris-muted">{ipfsCid ? ipfsCid.slice(0, 10) + '…' : ''}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>
            </div>
          </div>
          </div>
        </ScrollFadeUp>

        {/* Stats grid */}
        <ScrollStaggerFadeUp className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {rwaStats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rwa-stat bento-card p-5 border ${stat.border} flex items-center gap-4`}>
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className={`w-[18px] h-[18px] ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <div className={`font-display font-bold text-sm ${stat.color}`}>{stat.value}</div>
                  <div className="text-solaris-muted text-[10px] font-mono uppercase">{stat.label}</div>
                  <p
                    className="mt-2 text-[10px] font-mono text-fuchsia-200/70 leading-snug line-clamp-2 border-t border-fuchsia-500/10 pt-2"
                    title={shortSkillWhisper(skillSeedFromLabel(`rwa|${stat.label}`))}
                  >
                    {shortSkillWhisper(skillSeedFromLabel(`rwa|${stat.label}`))}
                  </p>
                </div>
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        <PredictiveTerrainHeatmap />

        <ScrollFadeUp>
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <RwaPortfolioMap
                projects={RWA_PROJECTS}
                selectedProjectId={selectedProject?.id ?? null}
                onSelectProject={setSelectedProjectId}
              />
            </div>
            <div
              className="lg:col-span-4 bento-card border border-white/10 p-6 shadow-depth"
              aria-label={tx.asideAria}
            >
              {selectedProject ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-base text-solaris-text">{selectedProject.title}</h3>
                      <p className="text-solaris-muted text-sm mt-1 leading-relaxed">{selectedProject.summary}</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono ${statusChipClass(
                        selectedProject.status,
                      )}`}
                    >
                      {selectedProject.status.toUpperCase()}
                    </span>
                  </div>

                  <dl className="mt-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                        {tx.asideRegion}
                      </dt>
                      <dd className="text-xs text-solaris-text">{selectedProject.region}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                        {tx.asideType}
                      </dt>
                      <dd className="text-xs text-solaris-text">{selectedProject.projectType.replace(/_/g, ' ')}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href="#documente"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold text-sm font-semibold hover:bg-solaris-gold/20 transition-colors btn-quantum"
                    >
                      {tx.asideJumpDocs}
                    </a>
                    <a
                      href={selectedTimeline[0] ? `#milestone-${selectedTimeline[0].slug}` : '#rwa'}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
                    >
                      {tx.asideJumpTimeline}
                    </a>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-[11px] font-mono text-solaris-muted leading-relaxed">
                      {tx.asideProofBundle}
                    </p>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-solaris-muted">
                        {tx.asideMapTitlePrefix} · {selectedProject?.region ?? tx.physicalLocationName}
                      </div>
                      <a
                        href={mapsOpenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-solaris-cyan hover:text-solaris-text transition-colors btn-quantum"
                      >
                        {tx.asideMapOpen}
                        <ExternalLink className="h-3 w-3 opacity-80" aria-hidden="true" />
                      </a>
                    </div>
                    <iframe
                      title={`${tx.asideMapTitlePrefix}: ${selectedProject?.region ?? tx.physicalLocationName}`}
                      src={mapsEmbedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-[220px]"
                    />
                  </div>
                </>
              ) : (
                <div className="text-solaris-muted text-sm">{tx.asideNoSelection}</div>
              )}
            </div>
          </div>
        </ScrollFadeUp>

        {/* Four pillars */}
        <ScrollStaggerFadeUp className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rwaPillars.map(pillar => {
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
        </ScrollStaggerFadeUp>

        {/* IPFS proof CTA */}
        <ScrollFadeUp>
          <div className="mt-10 bento-card p-6 border border-solaris-gold/20 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-solaris-gold" />
            </div>
            <div className="flex-1">
              <div className="hud-label text-solaris-gold mb-1">{tx.verifiedKicker}</div>
              <p className="text-solaris-muted text-sm leading-relaxed">
                {verifiedBodyParts[0]}
                <code className="text-solaris-cyan text-[11px] font-mono bg-white/5 px-1.5 py-0.5 rounded">
                  {proofCid}
                </code>
                {verifiedBodyParts[1] ?? ''}
              </p>
            </div>
            <a
              href={PUBLIC_WHITEPAPER_IPFS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold text-sm font-semibold hover:bg-solaris-gold/20 transition-colors btn-quantum"
            >
              {tx.verifiedCta}
            </a>
          </div>
        </ScrollFadeUp>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollFadeUp>
            <RwaTimelinePanel events={selectedTimeline} />
          </ScrollFadeUp>
          <ScrollFadeUp>
            <RwaDocumentsPanel documents={selectedDocuments} />
          </ScrollFadeUp>
        </div>

        <div className="mt-10 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={2140} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>

      </div>
    </section>
  );
};

export default RwaSection;
