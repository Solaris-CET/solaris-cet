import { describe, it, expect } from 'vitest';
import {
  expressMeshSkillForFeed,
  shortSkillWhisper,
  skillCaptionForDept,
} from '@/lib/meshSkillFeed';

describe('meshSkillFeed', () => {
  it('expressMeshSkillForFeed is deterministic and tags SKILL_MESH', () => {
    const a = expressMeshSkillForFeed(11);
    const b = expressMeshSkillForFeed(11);
    expect(a).toEqual(b);
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

  it('skillCaptionForDept changes with tick for same dept', () => {
    const a = skillCaptionForDept('engineering', 0);
    const b = skillCaptionForDept('engineering', 19);
    expect(a.length).toBeGreaterThan(5);
    expect(b.length).toBeGreaterThan(5);
    expect(a).not.toBe(b);
  });
});
