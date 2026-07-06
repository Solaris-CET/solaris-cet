// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { permitPackUrl } from '@/lib/surveyContext';

describe('surveyContext', () => {
  it('permitPackUrl encodes report id', () => {
    expect(permitPackUrl('SOL-2026-0042')).toBe('/api/survey/permit-pack?report_id=SOL-2026-0042');
    expect(permitPackUrl('a b')).toBe('/api/survey/permit-pack?report_id=a%20b');
  });
});