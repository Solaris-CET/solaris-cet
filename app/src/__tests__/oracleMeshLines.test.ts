import { describe, it, expect } from 'vitest';
import { buildAgentPoolMeshLogMessage, buildTeamAgentMeshLogMessage } from '@/lib/oracleMeshLines';

describe('oracleMeshLines', () => {
  it('buildAgentPoolMeshLogMessage has fixed prefix and stable burst', () => {
    const a = buildAgentPoolMeshLogMessage('team', 'How do agents collaborate?');
    const b = buildAgentPoolMeshLogMessage('team', 'How do agents collaborate?');
    expect(a).toBe(b);
    expect(a.startsWith('AGENT_POOL_MESH: ')).toBe(true);
    expect(a.length).toBeLessThan(160);
  });

  it('buildTeamAgentMeshLogMessage has fixed prefix and stable whisper', () => {
    const a = buildTeamAgentMeshLogMessage('team scale', 'team');
    const b = buildTeamAgentMeshLogMessage('team scale', 'team');
    expect(a).toBe(b);
    expect(a.startsWith('TEAM_AGENT_MESH: ')).toBe(true);
    expect(a).toContain('—');
  });

  it('different queries change agent pool line', () => {
    const x = buildAgentPoolMeshLogMessage('default', 'aaa');
    const y = buildAgentPoolMeshLogMessage('default', 'bbb');
    expect(x).not.toBe(y);
  });
});
