// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveOutboundTraceparent } from '../../api/lib/surveyTraceHeaders';

describe('surveyTraceHeaders', () => {
  it('forwards valid incoming traceparent', () => {
    const tp = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const req = new Request('http://localhost/api/survey/generate', {
      headers: { traceparent: tp },
    });
    const out = resolveOutboundTraceparent(req);
    expect(out.traceparent).toBe(tp);
    expect(out.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('generates traceparent when missing', () => {
    const req = new Request('http://localhost/api/survey/generate');
    const out = resolveOutboundTraceparent(req);
    expect(out.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i);
    expect(out.traceId).toHaveLength(32);
  });
});