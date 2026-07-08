// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUSH_VAPID_PATH, PUSH_VAPID_PROBE } from '../../api/lib/pushVapid';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/webPush', () => ({
  getVapidPublicKey: vi.fn(() => 'BPublicVapidKeyExample123'),
}));

import { getVapidPublicKey } from '../../api/lib/webPush';
import pushVapidRoute, { PUSH_VAPID_PROBE as routeProbe } from '../../api/push/vapid/route';

function vapidRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${PUSH_VAPID_PATH}`, { ...init, headers });
}

describe('pushVapid helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUSH_VAPID_PROBE.path).toBe('/api/push/vapid');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.notConfiguredError).toBe('Push not configured');
  });
});

describe('/api/push/vapid e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getVapidPublicKey).mockReturnValue('BPublicVapidKeyExample123');
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUSH_VAPID_PATH);
    expect(src).toContain('api/push/vapid/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await pushVapidRoute(vapidRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns VAPID public key', async () => {
    const res = await pushVapidRoute(vapidRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; publicKey: string };
    expect(body.ok).toBe(true);
    expect(body.publicKey).toBe('BPublicVapidKeyExample123');
  });

  it('GET returns 500 when push is not configured', async () => {
    vi.mocked(getVapidPublicKey).mockImplementation(() => {
      throw new Error('not configured');
    });
    const res = await pushVapidRoute(vapidRequest({ method: 'GET' }));
    expect(res.status).toBe(PUSH_VAPID_PROBE.notConfiguredStatus);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(PUSH_VAPID_PROBE.notConfiguredError);
  });
});