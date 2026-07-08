// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __resetRealtimePresenceForTests,
  formatPresenceCountEvent,
  formatPresencePingEvent,
  getRealtimePresenceCount,
  REALTIME_PRESENCE_PATH,
  REALTIME_PRESENCE_PROBE,
} from '../../api/lib/realtimePresence';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import realtimePresenceRoute, { REALTIME_PRESENCE_PROBE as routeProbe } from '../../api/realtime/presence/route';

function presenceRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${REALTIME_PRESENCE_PATH}`, { ...init, headers });
}

describe('realtimePresence helpers', () => {
  afterEach(() => {
    __resetRealtimePresenceForTests();
  });

  it('exports stable e2e probe contract', () => {
    expect(REALTIME_PRESENCE_PROBE.path).toBe('/api/realtime/presence');
    expect(routeProbe.contentType).toContain('text/event-stream');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('formatPresenceCountEvent and formatPresencePingEvent', () => {
    expect(formatPresenceCountEvent(3)).toBe('data: {"count":3}\n\n');
    expect(formatPresencePingEvent(123)).toBe('event: ping\ndata: 123\n\n');
  });
});

describe('/api/realtime/presence e2e probe', () => {
  afterEach(() => {
    __resetRealtimePresenceForTests();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(REALTIME_PRESENCE_PATH);
    expect(src).toContain('api/realtime/presence/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await realtimePresenceRoute(presenceRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET opens SSE stream with presence count', async () => {
    const res = await realtimePresenceRoute(presenceRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(REALTIME_PRESENCE_PROBE.contentType);
    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();
    const first = await reader!.read();
    const text = new TextDecoder().decode(first.value);
    expect(text).toContain('"count":1');
    expect(getRealtimePresenceCount()).toBe(1);
    await reader!.cancel();
  });

  it('POST returns 405', async () => {
    const res = await realtimePresenceRoute(presenceRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});