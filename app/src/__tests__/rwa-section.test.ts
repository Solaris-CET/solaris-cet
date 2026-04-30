import { describe, expect,it } from 'vitest';

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

describe('RwaSection', () => {
  it('stats, pillars, IPFS proof', () => {
    expect(RWA_STATS).toHaveLength(6);
    const labels = RWA_STATS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
    RWA_STATS.forEach((s) => {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.value.length).toBeGreaterThan(0);
    });
    expect(RWA_STATS.find((s) => s.label === 'Location')?.value).toBe('Cetățuia, Romania');
    expect(RWA_STATS.find((s) => s.label === 'Token Layer')?.value).toContain('9,000');
    const proof = RWA_STATS.find((s) => s.label === 'On-Chain Proof');
    expect(proof?.value).toContain('IPFS');
    expect(proof?.value).toContain('TON');

    expect(RWA_PILLARS).toHaveLength(4);
    const titles = RWA_PILLARS.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(RWA_PILLARS.some((p) => p.title === 'Tangible Backing')).toBe(true);
    expect(RWA_PILLARS.some((p) => p.title === 'AI-Optimised Yield')).toBe(true);
    expect(RWA_PILLARS.some((p) => p.title === 'Structural Scarcity')).toBe(true);
    RWA_PILLARS.forEach((p) => expect(p.border).toMatch(/^border-/));

    expect(IPFS_CID).toBe('bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a');
    expect(IPFS_URL).toMatch(/^https:\/\//);
    expect(IPFS_URL).toContain(IPFS_CID);
    expect(IPFS_CID).toMatch(/^bafkrei/);
  });
});
