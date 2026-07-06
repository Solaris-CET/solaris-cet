import { describe, expect,it } from 'vitest';

import {
  expressSkillForFeed,
  formatBigSpace,
  NOMINAL_SKILL_UNIVERSE,
  SKILL_ALLELE_SPACE,
  synthesizeMeshSkills,
} from '@/lib/skillGenome';

describe('skillGenome', () => {
  it('allele space, nominal universe, formatting, synthesis tiers, uniqueness, feed line', () => {
    expect(SKILL_ALLELE_SPACE).toBeGreaterThan(100_000_000_000_000n);
    expect(NOMINAL_SKILL_UNIVERSE).toBe(SKILL_ALLELE_SPACE * 9n);
    expect(NOMINAL_SKILL_UNIVERSE).toBeGreaterThan(SKILL_ALLELE_SPACE);
    expect(formatBigSpace(NOMINAL_SKILL_UNIVERSE).length).toBeGreaterThan(3);

    const c = ['alpha beta gamma', 'delta epsilon zeta'];
    const a = synthesizeMeshSkills('eng', 'Backend', c, 24, 'standard');
    const b = synthesizeMeshSkills('eng', 'Backend', c, 24, 'standard');
    expect(a).toEqual(b);
    const d1 = synthesizeMeshSkills('eng', 'Backend', c, 12, 'deep');
    const d2 = synthesizeMeshSkills('eng', 'Backend', c, 12, 'deep');
    expect(d1).toEqual(d2);
    expect(d1[0]).not.toBe(a[0]);
    const f1 = synthesizeMeshSkills('eng', 'Backend', c, 8, 'flash');
    const f2 = synthesizeMeshSkills('eng', 'Backend', c, 8, 'flash');
    expect(f1).toEqual(f2);
    expect(f1[0]).toContain('⌁');

    const longCanon = Array.from({ length: 20 }, (_, i) => `canonical skill token ${i} for fusion`);
    const sample = synthesizeMeshSkills('sales', 'SDR', longCanon, 36, 'standard');
    expect(new Set(sample).size).toBe(sample.length);

    const shared = ['shared one', 'shared two'];
    const s1 = synthesizeMeshSkills('x', 'Role A', shared, 12, 'standard');
    const s2 = synthesizeMeshSkills('x', 'Role B', shared, 12, 'standard');
    expect(s1.join('|')).not.toBe(s2.join('|'));

    const { dept, line } = expressSkillForFeed(42);
    expect(dept.length).toBeGreaterThan(3);
    expect(line).toContain('[SKILL_EXPR]');
    expect(line).toContain(`dept=${dept}`);
    expect(line).toMatch(/tier=(flash|deep|standard)/);
  });
});
