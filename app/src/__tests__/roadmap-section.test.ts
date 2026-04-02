import { describe, it, expect } from 'vitest';

type PhaseStatus = 'done' | 'active' | 'upcoming';

interface Phase {
  id: string;
  quarter: string;
  title: string;
  status: PhaseStatus;
  milestones: { text: string }[];
}

const PHASES: Phase[] = [
  {
    id: 'q1', quarter: 'Q1 2025', title: 'Foundation', status: 'done',
    milestones: [
      { text: 'Token contract deployed on TON mainnet' },
      { text: 'Cyberscope smart contract audit completed' },
      { text: 'Freshcoins project verification' },
      { text: 'KYC process completed for core team' },
    ],
  },
  {
    id: 'q2', quarter: 'Q2 2025', title: 'Launch', status: 'done',
    milestones: [
      { text: 'DeDust DEX liquidity pool live' },
      { text: 'IPFS whitepaper publication' },
      { text: 'Landing page and community channels live' },
      { text: 'Initial token distribution completed' },
    ],
  },
  {
    id: 'q3', quarter: 'Q3 2025', title: 'Growth', status: 'done',
    milestones: [
      { text: 'AI-driven precision farming pilot in Puiești' },
      { text: 'Developer SDK and API beta release' },
      { text: 'ReAct Protocol on-chain reasoning traces' },
      { text: 'Governance voting module' },
    ],
  },
  {
    id: 'q4', quarter: 'Q4 2025', title: 'Scale', status: 'done',
    milestones: [
      { text: 'Next-gen processing units deployment' },
      { text: 'Self-Actualization Protocol mainnet' },
      { text: 'Cross-chain bridge exploration' },
      { text: 'Ecosystem grants program launch' },
    ],
  },
  {
    id: 'q1-2026', quarter: 'Q1 2026', title: 'Expand', status: 'done',
    milestones: [
      { text: 'Multi-chain liquidity integration completed' },
      { text: 'Community governance portal launched' },
      { text: 'AI oracle public API v1 released' },
      { text: 'Mobile wallet deep-link support deployed' },
    ],
  },
  {
    id: 'q2-2026', quarter: 'Q2 2026+', title: 'Evolve', status: 'active',
    milestones: [
      { text: 'Decentralized autonomous organization (DAO)' },
      { text: 'Cross-chain bridge mainnet launch' },
      { text: 'Ecosystem grants program expansion' },
      { text: 'Real-world asset (RWA) tokenisation pilot' },
    ],
  },
  {
    id: 'q3-2026', quarter: 'Q3 2026+', title: 'Transcend', status: 'upcoming',
    milestones: [
      { text: 'AI-to-AI autonomous contract execution' },
      { text: 'Solaris Prime mainnet neural mesh' },
      { text: 'Global agricultural AI network' },
      { text: 'Cross-chain hyper-intelligence protocol' },
    ],
  },
];

function calcProgress(phases: Phase[]): number {
  const done = phases.filter((p) => p.status === 'done').length;
  const active = phases.filter((p) => p.status === 'active').length;
  return Math.round(((done + active * 0.5) / phases.length) * 100);
}

describe('RoadmapSection', () => {
  it('phase data + progress formula', () => {
    expect(PHASES).toHaveLength(7);
    const ids = PHASES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = PHASES.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);

    const valid: PhaseStatus[] = ['done', 'active', 'upcoming'];
    PHASES.forEach((p) => {
      expect(p.milestones).toHaveLength(4);
      p.milestones.forEach((m) => expect(m.text.length).toBeGreaterThan(5));
      expect(valid).toContain(p.status);
    });

    const active = PHASES.filter((p) => p.status === 'active');
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('q2-2026');
    expect(PHASES.filter((p) => p.status === 'upcoming')).toHaveLength(1);

    const statusOrder = PHASES.map((p) => p.status);
    expect(statusOrder.lastIndexOf('done')).toBeLessThan(statusOrder.indexOf('active'));
    expect(statusOrder.indexOf('active')).toBeLessThan(statusOrder.indexOf('upcoming'));

    const foundation = PHASES.find((p) => p.title === 'Foundation')!;
    expect(foundation.milestones.some((m) => m.text.toLowerCase().includes('cyberscope'))).toBe(true);
    const transcend = PHASES.find((p) => p.title === 'Transcend')!;
    expect(transcend.milestones.some((m) => m.text.toLowerCase().includes('ai-to-ai'))).toBe(true);

    const p = calcProgress(PHASES);
    expect(p).toBe(79);
    expect(p).toBeGreaterThan(70);
    expect(p).toBeLessThan(100);
  });
});
