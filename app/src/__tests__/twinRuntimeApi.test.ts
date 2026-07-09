// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTwinEvents, fetchTwinReplay, twinStreamUrl } from '@/lib/twinRuntimeApi';

describe('twinRuntimeApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('fetchTwinEvents builds query', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ event_id: 'e1', event_type: 'twin_ready' }] }),
    });
    const rows = await fetchTwinEvents('SOL-1', 10);
    expect(rows).toHaveLength(1);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('report_id=SOL-1');
    expect(url).toContain('limit=10');
  });

  it('twinStreamUrl encodes report id', () => {
    expect(twinStreamUrl('SOL/X')).toContain('report_id=SOL%2FX');
  });

  it('twinStreamUrl adds persistent by default', () => {
    expect(twinStreamUrl('SOL-1')).toContain('persistent=1');
    expect(twinStreamUrl('SOL-1', false)).not.toContain('persistent=1');
  });

  it('fetchTwinReplay calls twin-replay with from_seq', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ event_id: 'e2', seq: 2, event_type: 'twin_ready' }] }),
    });
    const events = await fetchTwinReplay('SOL-1', 1);
    expect(events).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/survey/twin-replay');
    expect(fetchMock.mock.calls[0][0]).toContain('from_seq=1');
  });
});