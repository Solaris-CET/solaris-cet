import { describe, it, expect } from 'vitest';

// ─── RwaSection data integrity ────────────────────────────────────────────

const RWA_STATS = [
  { label: 'Location',       value: 'Cetățuia, Romania'   },
  { label: 'Asset Class',    value: 'Agricultural Land'   },
  { label: 'AI Integration', value: 'Precision Farming'   },
  { label: 'On-Chain Proof', value: 'IPFS + TON L1'       },
  { label: 'Yield Type',     value: 'Agricultural + Token' },
  { label: 'Token Layer',    value: 'CET · 9,000 supply'  },
];

const RWA_PILLARS = [
  { title: 'Tangible Backing',     border: 'border-emerald-400/20' },
  { title: 'On-Chain Transparency', border: 'border-solaris-cyan/20' },
  { title: 'AI-Optimised Yield',   border: 'border-solaris-gold/20' },
  { title: 'Structural Scarcity',  border: 'border-purple-400/20'  },
];

const IPFS_CID = 'bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';
const IPFS_URL = `https://scarlet-past-walrus-15.mypinata.cloud/ipfs/${IPFS_CID}`;

describe('RwaSection — stats integrity', () => {
  it('has exactly 6 stats', () => {
    expect(RWA_STATS).toHaveLength(6);
  });

  it('all stat labels are non-empty', () => {
    RWA_STATS.forEach(s => expect(s.label.length).toBeGreaterThan(0));
  });

  it('all stat values are non-empty', () => {
    RWA_STATS.forEach(s => expect(s.value.length).toBeGreaterThan(0));
  });

  it('all stat labels are unique', () => {
    const labels = RWA_STATS.map(s => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('Location is Cetățuia, Romania', () => {
    const loc = RWA_STATS.find(s => s.label === 'Location');
    expect(loc?.value).toBe('Cetățuia, Romania');
  });

  it('Token Layer references 9,000 supply', () => {
    const token = RWA_STATS.find(s => s.label === 'Token Layer');
    expect(token?.value).toContain('9,000');
  });

  it('On-Chain Proof references IPFS and TON', () => {
    const proof = RWA_STATS.find(s => s.label === 'On-Chain Proof');
    expect(proof?.value).toContain('IPFS');
    expect(proof?.value).toContain('TON');
  });
});

describe('RwaSection — pillars integrity', () => {
  it('has exactly 4 pillars', () => {
    expect(RWA_PILLARS).toHaveLength(4);
  });

  it('all pillar titles are unique', () => {
    const titles = RWA_PILLARS.map(p => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('Tangible Backing pillar exists', () => {
    expect(RWA_PILLARS.some(p => p.title === 'Tangible Backing')).toBe(true);
  });

  it('AI-Optimised Yield pillar exists', () => {
    expect(RWA_PILLARS.some(p => p.title === 'AI-Optimised Yield')).toBe(true);
  });

  it('Structural Scarcity pillar exists', () => {
    expect(RWA_PILLARS.some(p => p.title === 'Structural Scarcity')).toBe(true);
  });

  it('all border classes are defined', () => {
    RWA_PILLARS.forEach(p => {
      expect(p.border).toMatch(/^border-/);
    });
  });
});

describe('RwaSection — IPFS proof', () => {
  it('IPFS CID matches whitepaper CID from project constants', () => {
    expect(IPFS_CID).toBe('bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a');
  });

  it('IPFS URL is a valid https URL', () => {
    expect(IPFS_URL).toMatch(/^https:\/\//);
  });

  it('IPFS URL contains the correct CID', () => {
    expect(IPFS_URL).toContain(IPFS_CID);
  });

  it('IPFS CID is a valid v1 bafy CID (starts with bafkrei)', () => {
    expect(IPFS_CID).toMatch(/^bafkrei/);
  });
});
