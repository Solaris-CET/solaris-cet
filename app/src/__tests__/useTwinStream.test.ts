// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTwinStream } from '@/hooks/useTwinStream';

function sseBody(frames: string[]): ReadableStream<Uint8Array> {
  const text = frames.join('\n\n') + '\n\n';
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

describe('useTwinStream persistent', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    fetchMock.mockReset();
  });

  it('parses snapshot, ready, and heartbeat', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      body: sseBody([
        'event: snapshot\ndata: {"schema":"solaris-twin-feed-v1","report_id":"SOL-1","site":{"client_name":"A","city":"B","latitude":1,"longitude":2},"system":{"capacity_kwp":6,"annual_kwh":1,"suitability_score":80,"premium_tier":false},"low_confidence_count":0,"corrections_count":0,"corrections_recent":[]}',
        'event: ready\ndata: {"report_id":"SOL-1"}',
        'event: heartbeat\ndata: {"report_id":"SOL-1","ts":"2026-01-01T00:00:00Z"}',
      ]),
    });

    const { result } = renderHook(() => useTwinStream('SOL-1', { persistent: false }));

    await waitFor(
      () => {
        expect(result.current.ready).toBe(true);
        expect(result.current.feed?.report_id).toBe('SOL-1');
        expect(result.current.heartbeats).toBe(1);
      },
      { timeout: 3000 },
    );
  });

  it('schedules reconnect when persistent stream ends', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      body: sseBody(['event: ready\ndata: {"report_id":"SOL-2"}']),
    });

    renderHook(() => useTwinStream('SOL-2', { persistent: true }));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});