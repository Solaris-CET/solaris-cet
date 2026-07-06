import { describe, expect,it } from 'vitest';

import {
  buildAgentPoolMeshLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildSkillLocusLogMessage,
  buildTeamAgentMeshLogMessage,
  CET_AI_LATTICE_PHASE,
} from '@/lib/cetAiMeshLines';

describe('cetAiMeshLines', () => {
  it('pool/team/deep lattice/skill locus prefixes, stability, phases', () => {
    const pool = buildAgentPoolMeshLogMessage('team', 'How do agents collaborate?');
    expect(pool).toBe(buildAgentPoolMeshLogMessage('team', 'How do agents collaborate?'));
    expect(pool.startsWith('AGENT_POOL_MESH: ')).toBe(true);
    expect(pool.length).toBeLessThan(160);
    expect(buildAgentPoolMeshLogMessage('default', 'aaa')).not.toBe(
      buildAgentPoolMeshLogMessage('default', 'bbb'),
    );

    const team = buildTeamAgentMeshLogMessage('team scale', 'team');
    expect(team).toBe(buildTeamAgentMeshLogMessage('team scale', 'team'));
    expect(team.startsWith('TEAM_AGENT_MESH: ')).toBe(true);
    expect(team).toContain('—');

    const q = 'test cet ai lattice';
    const input = buildDeepLatticeMeshLogMessage('INPUT_MESH', q, CET_AI_LATTICE_PHASE.inputStream);
    expect(input.startsWith('INPUT_MESH: ')).toBe(true);
    expect(input).toContain(' · ');
    const parse = buildDeepLatticeMeshLogMessage('PARSE_MESH', q, CET_AI_LATTICE_PHASE.observeParse);
    expect(parse.startsWith('PARSE_MESH: ')).toBe(true);
    expect(input).toBe(buildDeepLatticeMeshLogMessage('INPUT_MESH', q, 'inputStream'));

    const rawQ = 'raw lattice query';
    const raw = buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', rawQ);
    expect(raw).toBe(buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', rawQ));
    expect(raw.startsWith('DEEP_LATTICE: ')).toBe(true);

    const loc = buildSkillLocusLogMessage('What is mining?', 'mining');
    expect(loc.startsWith('SKILL_LOCUS: ')).toBe(true);
    expect(loc).toContain('topic=mining');

    expect(Object.keys(CET_AI_LATTICE_PHASE).sort()).toEqual(
      [
        'actExecute',
        'inputStream',
        'meshSeal',
        'observeContext',
        'observeParse',
        'sessionClose',
        'thinkRoute',
        'thinkValidate',
        'verifyCross',
      ].sort()
    );
  });
});
