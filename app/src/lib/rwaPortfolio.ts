import { PUBLIC_WHITEPAPER_IPFS_URL } from '@/lib/publicTrustLinks';

export type RwaStatus = 'active' | 'planned' | 'risk';

export type RwaProjectType = 'virtual_agricultural_land' | 'ai_infrastructure' | 'compliance_anchor';

export type RwaDocType = 'whitepaper' | 'land_registry' | 'audit' | 'ipfs_proof' | 'timeline';

export type RwaTimelineStatus = 'complete' | 'active' | 'planned';

export type RwaProject = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: RwaStatus;
  region: string;
  projectType: RwaProjectType;
  marker: { xPct: number; yPct: number };
  documentIds: string[];
  timelineIds: string[];
};

export type RwaDocument = {
  id: string;
  title: string;
  docType: RwaDocType;
  publishedAt: string;
  url: string;
};

export type RwaTimelineEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  status: RwaTimelineStatus;
};

export const RWA_DOCUMENTS: readonly RwaDocument[] = [
  {
    id: 'whitepaper-ipfs',
    title: 'Whitepaper (IPFS)',
    docType: 'whitepaper',
    publishedAt: '2026-03-31',
    url: PUBLIC_WHITEPAPER_IPFS_URL,
  },
  {
    id: 'whitepaper-html',
    title: 'Whitepaper (No-JS HTML)',
    docType: 'whitepaper',
    publishedAt: '2026-03-31',
    url: '/sovereign/whitepaper.html',
  },
  {
    id: 'audit-report',
    title: 'Audit report (public)',
    docType: 'audit',
    publishedAt: '2026-03-31',
    url: 'https://raw.githubusercontent.com/Solaris-CET/solaris-cet/main/AUDIT_REPORT_2026-03-31.md',
  },
  {
    id: 'ipfs-proof',
    title: 'IPFS CID proof (gateway)',
    docType: 'ipfs_proof',
    publishedAt: '2026-03-31',
    url: PUBLIC_WHITEPAPER_IPFS_URL,
  },
];

export const RWA_TIMELINE: readonly RwaTimelineEvent[] = [
  {
    id: 'tl-2025-q4',
    slug: 'contract-audit-dedust',
    title: 'Contract deployed · Audit complete · DeDust pool live',
    description:
      'Core on-chain deployment completed; public audit references published; liquidity pool established for price discovery.',
    date: '2025-12-31',
    status: 'complete',
  },
  {
    id: 'tl-2026-q1',
    slug: 'ipfs-proof-and-reason-act-verify',
    title: 'IPFS proof published · RAV protocol surface shipped',
    description:
      'Whitepaper and proof artifacts anchored via IPFS gateway; CET AI UI ships structured RAV output with on-chain context when available.',
    date: '2026-03-31',
    status: 'complete',
  },
  {
    id: 'tl-2026-q2',
    slug: 'rwa-tokenisation-pilot',
    title: 'Virtual land layer pilot (Cetățuia) — active phase',
    description:
      'Pilot phase for publishing world specs, deterministic generation proofs and on-chain references into a cohesive public virtual land portfolio view.',
    date: '2026-06-30',
    status: 'active',
  },
  {
    id: 'tl-2026-q3',
    slug: 'zk-proof-layer',
    title: 'Zero-knowledge proof layer — planned',
    description:
      'Roadmap milestone for stronger integrity proofs across the on-chain ↔ off-chain evidence bundle (directional, not deployed in TASK 05–10).',
    date: '2026-09-30',
    status: 'planned',
  },
];

export const RWA_PROJECTS: readonly RwaProject[] = [
  {
    id: 'cetatuia-land',
    slug: 'cetatuia-virtual-agricultural-land',
    title: 'Cetățuia Virtual Agricultural Land',
    summary:
      'Primary narrative anchor: a Cetățuia-inspired virtual agricultural land layer with IPFS + TON attestations.',
    status: 'active',
    region: 'Cetățuia, Romania',
    projectType: 'virtual_agricultural_land',
    marker: { xPct: 62, yPct: 48 },
    documentIds: ['whitepaper-ipfs', 'whitepaper-html', 'ipfs-proof'],
    timelineIds: ['tl-2025-q4', 'tl-2026-q1', 'tl-2026-q2', 'tl-2026-q3'],
  },
];

export function statusChipClass(status: RwaStatus): string {
  if (status === 'active') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  if (status === 'risk') return 'bg-amber-500/10 text-amber-200 border-amber-500/25';
  return 'bg-cyan-500/10 text-cyan-200 border-cyan-500/25';
}

export function timelineChipClass(status: RwaTimelineStatus): string {
  if (status === 'complete') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  if (status === 'active') return 'bg-amber-500/10 text-amber-200 border-amber-500/25';
  return 'bg-cyan-500/10 text-cyan-200 border-cyan-500/25';
}
