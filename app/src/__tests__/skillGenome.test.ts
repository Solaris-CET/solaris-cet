import { describe, it, expect } from 'vitest';
import {
  SKILL_ALLELE_SPACE,
  NOMINAL_SKILL_UNIVERSE,
  synthesizeMeshSkills,
  formatBigSpace,
  expressSkillForFeed,
} from '@/lib/skillGenome';

describe('skillGenome', () => {
  it('10-locus allele space exceeds 10¹⁴', () => {
    expect(SKILL_ALLELE_SPACE).toBeGreaterThan(100_000_000_000_000n);
  });

  it('nominal universe (× template isomers) exceeds allele space', () => {
    expect(NOMINAL_SKILL_UNIVERSE).toBe(SKILL_ALLELE_SPACE * 9n);
    expect(NOMINAL_SKILL_UNIVERSE).toBeGreaterThan(SKILL_ALLELE_SPACE);
  });

  it('formatBigSpace returns a non-empty human string', () => {
    expect(formatBigSpace(NOMINAL_SKILL_UNIVERSE).length).toBeGreaterThan(3);
  });

  it('synthesizeMeshSkills is deterministic per tier', () => {
    const c = ['alpha beta gamma', 'delta epsilon zeta'];
    const a = synthesizeMeshSkills('eng', 'Backend', c, 24, 'standard');
    const b = synthesizeMeshSkills('eng', 'Backend', c, 24, 'standard');
    expect(a).toEqual(b);
    const d1 = synthesizeMeshSkills('eng', 'Backend', c, 12, 'deep');
    const d2 = synthesizeMeshSkills('eng', 'Backend', c, 12, 'deep');
    expect(d1).toEqual(d2);
    expect(d1[0]).not.toBe(a[0]);
  });

  it('synthesized lines are unique within one sample', () => {
    const c = Array.from({ length: 20 }, (_, i) => `canonical skill token ${i} for fusion`);
    const s = synthesizeMeshSkills('sales', 'SDR', c, 36, 'standard');
    expect(new Set(s).size).toBe(s.length);
  });

  it('different roles yield different samples', () => {
    const c = ['shared one', 'shared two'];
    const s1 = synthesizeMeshSkills('x', 'Role A', c, 12, 'standard');
    const s2 = synthesizeMeshSkills('x', 'Role B', c, 12, 'standard');
    expect(s1.join('|')).not.toBe(s2.join('|'));
  });

  it('expressSkillForFeed returns SKILL_EXPR line with dept', () => {
    const { dept, line } = expressSkillForFeed(42);
    expect(dept.length).toBeGreaterThan(3);
    expect(line).toContain('[SKILL_EXPR]');
    expect(line).toContain(`dept=${dept}`);
  });
});
