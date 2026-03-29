import { describe, it, expect } from 'vitest';
import {
  expressMeshSkillForFeed,
  shortSkillWhisper,
  skillCaptionForDept,
  standardSkillBurst,
  skillFlashForBoardDept,
  skillSaltFromQuery,
  skillSeedFromLabel,
  observeLocusBranchFromTopic,
  observeLocusClip,
} from '@/lib/meshSkillFeed';

function stripFeedTimestamp(line: string): string {
  return line.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/, '[TS]');
}

describe('meshSkillFeed', () => {
  it('expressMeshSkillForFeed is deterministic aside from clock and tags SKILL_MESH', () => {
    const a = expressMeshSkillForFeed(11);
    const b = expressMeshSkillForFeed(11);
    expect(a.dept).toBe(b.dept);
    expect(stripFeedTimestamp(a.line)).toBe(stripFeedTimestamp(b.line));
    expect(a.line).toContain('[SKILL_MESH]');
    expect(a.line).toContain('dept=');
    expect(a.line).toMatch(/tier=(flash|deep|standard)/);
  });

  it('shortSkillWhisper stays within display budget', () => {
    const s = shortSkillWhisper(3);
    expect(s.length).toBeLessThanOrEqual(130);
    expect(s).toContain('—');
  });

  it('skillCaptionForDept returns empty for unknown id', () => {
    expect(skillCaptionForDept('no-such-dept', 0)).toBe('');
  });

  it('observeLocusBranchFromTopic maps oracle topics', () => {
    expect(observeLocusBranchFromTopic('price')).toBe('price');
    expect(observeLocusBranchFromTopic('mining')).toBe('mining');
    expect(observeLocusBranchFromTopic('rav')).toBe('ai');
    expect(observeLocusBranchFromTopic('unknown')).toBe('default');
  });

  it('observeLocusClip is deterministic per branch and bounded', () => {
    const a = observeLocusClip('test query locus', 'price');
    const b = observeLocusClip('test query locus', 'price');
    expect(a).toBe(b);
    expect(a.length).toBeLessThanOrEqual(84);
    expect(observeLocusClip('test query locus', 'mining')).not.toBe(a);
  });

  it('skillSaltFromQuery is deterministic', () => {
    expect(skillSaltFromQuery('What are AI agents?')).toBe(skillSaltFromQuery('What are AI agents?'));
    expect(skillSaltFromQuery('aaa')).not.toBe(skillSaltFromQuery('aab'));
  });

  it('skillSeedFromLabel is stable per string', () => {
    expect(skillSeedFromLabel('Parallel agents')).toBe(skillSeedFromLabel('Parallel agents'));
    expect(skillSeedFromLabel('metric-aaa')).not.toBe(skillSeedFromLabel('metric-bbb'));
  });

  it('skillFlashForBoardDept returns flash line for chart dept names', () => {
    const s = skillFlashForBoardDept('Engineering', 3);
    expect(s).toBeTruthy();
    expect(s!.length).toBeLessThanOrEqual(96);
    expect(s).toContain(':');
  });

  it('skillFlashForBoardDept returns null for unknown display name', () => {
    expect(skillFlashForBoardDept('Mars Colony', 0)).toBeNull();
  });

  it('standardSkillBurst is deterministic and includes role prefix', () => {
    const a = standardSkillBurst(44);
    const b = standardSkillBurst(44);
    expect(a).toBe(b);
    expect(a).toContain(':');
    expect(a.length).toBeLessThanOrEqual(118);
  });

  it('skillCaptionForDept changes with tick for same dept', () => {
    const a = skillCaptionForDept('engineering', 0);
    const b = skillCaptionForDept('engineering', 19);
    expect(a.length).toBeGreaterThan(5);
    expect(b.length).toBeGreaterThan(5);
    expect(a).not.toBe(b);
  });
});
