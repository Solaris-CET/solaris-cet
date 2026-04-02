import { describe, it, expect } from 'vitest';
import {
  CET_AI_TASK_MESH_LINE,
  buildCetAiObserveParse,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildSkillLocusLogMessage,
  CET_AI_LATTICE_PHASE,
} from '@/lib/cetAiTelemetry';

describe('cetAiTelemetry barrel', () => {
  it('TASK_MESH line, observe_parse snapshot, deep lattice + skill locus', () => {
    expect(CET_AI_TASK_MESH_LINE.startsWith('TASK_MESH:')).toBe(true);
    expect(CET_AI_TASK_MESH_LINE).toContain('200k');
    expect(CET_AI_TASK_MESH_LINE).toContain('CET AI');

    const q = 'How do 200k agents route tasks?';
    const detected = 'team';
    const tokenCount = q.split(/\s+/).length;
    const seq = buildCetAiObserveParse(q, detected, tokenCount);
    expect(seq[0]).toMatch(/^RAV_BURST: /);
    expect(seq[1]).toBe(CET_AI_TASK_MESH_LINE);
    expect(seq.some((l) => l.startsWith('INPUT_STREAM:'))).toBe(true);
    expect(seq).toMatchSnapshot();

    const q2 = 'cet ai snapshot';
    const detected2 = 'default';
    expect(buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', q2)).toBe(
      buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', q2)
    );
    expect(buildDeepLatticeMeshLogMessage('ACT_MESH', q2, CET_AI_LATTICE_PHASE.actExecute)).toContain(
      'ACT_MESH:'
    );
    expect(buildSkillLocusLogMessage(q2, detected2)).toContain('topic=default');
  });
});
