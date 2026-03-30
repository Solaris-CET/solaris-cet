import { describe, it, expect } from 'vitest';
import {
  ORACLE_TASK_MESH_LINE,
  buildOracleObserveParseSequence,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildSkillLocusLogMessage,
  ORACLE_LATTICE_PHASE,
} from '@/lib/oracleTelemetry';

describe('oracleTelemetry barrel', () => {
  it('re-exports TASK_MESH line for SKILL terminal styling', () => {
    expect(ORACLE_TASK_MESH_LINE.startsWith('TASK_MESH:')).toBe(true);
    expect(ORACLE_TASK_MESH_LINE).toContain('200k');
  });

  it('observe_parse sequence matches buildOracleObserveParseSequence (snapshot)', () => {
    const q = 'How do 200k agents route tasks?';
    const detected = 'team';
    const tokenCount = q.split(/\s+/).length;
    const seq = buildOracleObserveParseSequence(q, detected, tokenCount);
    expect(seq[0]).toMatch(/^RAV_BURST: /);
    expect(seq[1]).toBe(ORACLE_TASK_MESH_LINE);
    expect(seq.some((l) => l.startsWith('INPUT_STREAM:'))).toBe(true);
    expect(seq).toMatchSnapshot();
  });

  it('deep lattice + act phase lines stay stable', () => {
    const q = 'oracle snapshot';
    const detected = 'default';
    expect(buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', q)).toBe(
      buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', q)
    );
    expect(buildDeepLatticeMeshLogMessage('ACT_MESH', q, ORACLE_LATTICE_PHASE.actExecute)).toContain(
      'ACT_MESH:'
    );
    expect(buildSkillLocusLogMessage(q, detected)).toContain('topic=default');
  });
});
