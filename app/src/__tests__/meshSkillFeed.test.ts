import { describe, expect,it } from 'vitest';

import {
  agentBoardLiveAgentKey,
  aiTeamRoleAgentKey,
  aiTeamRoleGeneKey,
  aiTeamSynthKey,
  deepLatticeLineForQuery,
  expressMeshSkillForFeed,
  meshStandardBurstForAiTeamRoleAgent,
  meshStandardBurstForBoardCollab,
  meshStandardBurstForBoardLiveAgent,
  meshStandardBurstFromKey,
  meshWhisperForAiTeamRoleAgent,
  meshWhisperForAiTeamRoleGene,
  meshWhisperForAiTeamSynth,
  meshWhisperForBoardCollab,
  meshWhisperForBoardLiveAgent,
  meshWhisperFromKey,
  observeLocusBranchFromTopic,
  observeLocusClip,
  shortSkillWhisper,
  skillCaptionForDept,
  skillFlashForBoardDept,
  skillSaltFromQuery,
  skillSeedFromLabel,
  standardSkillBurst,
} from '@/lib/meshSkillFeed';

function stripFeedTimestamp(line: string): string {
  return line.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/, '[TS]');
}

describe('meshSkillFeed', () => {
  it('feed lines, locus, salts, board keys, AI team + agentBoard wiring', () => {
    const ex = expressMeshSkillForFeed(11);
    const ex2 = expressMeshSkillForFeed(11);
    expect(ex.dept).toBe(ex2.dept);
    expect(stripFeedTimestamp(ex.line)).toBe(stripFeedTimestamp(ex2.line));
    expect(ex.line).toContain('[SKILL_MESH]');
    expect(ex.line).toContain('dept=');
    expect(ex.line).toMatch(/tier=(flash|deep|standard)/);

    const sw = shortSkillWhisper(3);
    expect(sw.length).toBeLessThanOrEqual(130);
    expect(sw).toContain('—');

    expect(skillCaptionForDept('no-such-dept', 0)).toBe('');

    const dl = deepLatticeLineForQuery('oracle deep test');
    expect(dl).toBe(deepLatticeLineForQuery('oracle deep test'));
    expect(dl).toMatch(/ · /);
    expect(dl.length).toBeLessThanOrEqual(102);

    expect(observeLocusBranchFromTopic('price')).toBe('price');
    expect(observeLocusBranchFromTopic('mining')).toBe('mining');
    expect(observeLocusBranchFromTopic('rav')).toBe('ai');
    expect(observeLocusBranchFromTopic('unknown')).toBe('default');

    const loc = observeLocusClip('test query locus', 'price');
    expect(loc).toBe(observeLocusClip('test query locus', 'price'));
    expect(loc.length).toBeLessThanOrEqual(84);
    expect(observeLocusClip('test query locus', 'mining')).not.toBe(loc);

    expect(skillSaltFromQuery('What are AI agents?')).toBe(skillSaltFromQuery('What are AI agents?'));
    expect(skillSaltFromQuery('aaa')).not.toBe(skillSaltFromQuery('aab'));

    expect(skillSeedFromLabel('Parallel agents')).toBe(skillSeedFromLabel('Parallel agents'));
    expect(skillSeedFromLabel('metric-aaa')).not.toBe(skillSeedFromLabel('metric-bbb'));

    const flash = skillFlashForBoardDept('Engineering', 3);
    expect(flash).toBeTruthy();
    expect(flash!.length).toBeLessThanOrEqual(96);
    expect(flash).toContain(':');
    expect(skillFlashForBoardDept('Mars Colony', 0)).toBeNull();

    const burst = standardSkillBurst(44);
    expect(burst).toBe(standardSkillBurst(44));
    expect(burst).toContain(':');
    expect(burst.length).toBeLessThanOrEqual(118);

    const cap0 = skillCaptionForDept('engineering', 0);
    const cap19 = skillCaptionForDept('engineering', 19);
    expect(cap0.length).toBeGreaterThan(5);
    expect(cap19.length).toBeGreaterThan(5);
    expect(cap0).not.toBe(cap19);

    const k = 'statsBento|agents';
    expect(meshWhisperFromKey(k)).toBe(shortSkillWhisper(skillSeedFromLabel(k)));
    const k2 = 'miningCalc|device|node';
    expect(meshStandardBurstFromKey(k2)).toBe(standardSkillBurst(skillSeedFromLabel(k2)));

    expect(aiTeamRoleAgentKey('engineering', 'SRE')).toBe('aiTeam|roleAgent|engineering|SRE');
    expect(aiTeamRoleGeneKey('legal', 'Counsel', 3)).toBe('aiTeam|roleGene|legal|3|Counsel');
    expect(aiTeamSynthKey('sales', 'AE', 'deep', 2)).toBe('aiTeam|synth|sales|deep|2|AE');

    expect(meshWhisperForAiTeamRoleAgent('engineering', 'SRE')).toBe(
      meshWhisperFromKey(aiTeamRoleAgentKey('engineering', 'SRE'))
    );
    expect(meshStandardBurstForAiTeamRoleAgent('engineering', 'SRE')).toBe(
      meshStandardBurstFromKey(aiTeamRoleAgentKey('engineering', 'SRE'))
    );
    expect(meshWhisperForAiTeamRoleGene('legal', 'Counsel', 1)).toBe(
      meshWhisperFromKey(aiTeamRoleGeneKey('legal', 'Counsel', 1))
    );
    expect(meshWhisperForAiTeamSynth('marketing', 'Growth', 'flash', 0)).toBe(
      meshWhisperFromKey(aiTeamSynthKey('marketing', 'Growth', 'flash', 0))
    );

    expect(agentBoardLiveAgentKey('CX-00042', 'Customer Ops', 'skill', 'Tier-1 Support')).toBe(
      'agentBoard|liveAgent|CX-00042|Customer Ops|skill|Tier-1 Support'
    );
    expect(agentBoardLiveAgentKey('ENG-00001', 'Engineering', 'solved')).toBe(
      'agentBoard|liveAgent|ENG-00001|Engineering|solved|—'
    );
    const fp = 'resolved: pool liquidity';
    expect(agentBoardLiveAgentKey('ENG-00001', 'Engineering', 'solved', undefined, fp)).toBe(
      `agentBoard|liveAgent|ENG-00001|Engineering|solved|—|msg${skillSeedFromLabel(fp)}`
    );
    expect(meshWhisperForBoardLiveAgent('AI-00003', 'Data & AI', 'learned')).toBe(
      meshWhisperFromKey(agentBoardLiveAgentKey('AI-00003', 'Data & AI', 'learned'))
    );
    expect(meshStandardBurstForBoardLiveAgent('FIN-00999', 'Finance', 'alert')).toBe(
      meshStandardBurstFromKey(agentBoardLiveAgentKey('FIN-00999', 'Finance', 'alert'))
    );
    expect(meshWhisperForBoardCollab('SEC-00001')).toBe(
      meshWhisperFromKey('agentBoard|collab|SEC-00001')
    );
    expect(meshStandardBurstForBoardCollab('SEC-00001')).toBe(
      meshStandardBurstFromKey('agentBoard|collab|SEC-00001')
    );
  });
});
