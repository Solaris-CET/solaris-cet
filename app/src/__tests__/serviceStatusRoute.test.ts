// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  collectServiceStatusSnapshot,
  SERVICE_STATUS_PATH,
  SERVICE_STATUS_PROBE,
} from '../../api/lib/serviceStatus';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import serviceStatusRoute, { SERVICE_STATUS_PROBE as routeProbe } from '../../api/status/route';

function statusRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SERVICE_STATUS_PATH}`, { ...init, headers });
}

describe('serviceStatus helpers', () => {
  beforeEach(() => {
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROK_API_KEY_ENC;
    delete process.env.GEMINI_API_KEY_ENC;
    delete process.env.ENCRYPTION_SECRET;
    delete process.env.TONCENTER_RPC_URL;
    delete process.env.TONCENTER_API_KEY;
  });

  it('exports stable e2e probe contract', () => {
    expect(SERVICE_STATUS_PROBE.path).toBe('/api/status');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.cacheControl).toBe('no-store');
  });

  it('collectServiceStatusSnapshot reports missing keys by default', () => {
    const snap = collectServiceStatusSnapshot(new Date('2026-07-07T12:00:00.000Z'));
    expect(snap.ok).toBe(true);
    expect(snap.ai).toBe(SERVICE_STATUS_PROBE.aiMissingLabel);
    expect(snap.ton).toBe(SERVICE_STATUS_PROBE.tonNotConfiguredLabel);
    expect(snap.time).toBe('2026-07-07T12:00:00.000Z');
  });

  it('collectServiceStatusSnapshot reports configured when env present', () => {
    process.env.GROK_API_KEY = 'grok';
    process.env.GEMINI_API_KEY = 'gemini';
    process.env.TONCENTER_RPC_URL = 'https://toncenter.test';
    const snap = collectServiceStatusSnapshot();
    expect(snap.ai).toBe(SERVICE_STATUS_PROBE.aiConfiguredLabel);
    expect(snap.ton).toBe(SERVICE_STATUS_PROBE.tonConfiguredLabel);
    expect(snap.env.ai.grokKey).toBe(true);
    expect(snap.env.ton.rpcUrl).toBe(true);
  });
});

describe('/api/status e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.TONCENTER_RPC_URL;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SERVICE_STATUS_PATH);
    expect(src).toContain('api/status/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await serviceStatusRoute(statusRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns service status snapshot', async () => {
    const res = await serviceStatusRoute(statusRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = (await res.json()) as { ok: boolean; ai: string; ton: string; time: string };
    expect(body.ok).toBe(true);
    expect(body.ai).toBe(SERVICE_STATUS_PROBE.aiMissingLabel);
    expect(body.ton).toBe(SERVICE_STATUS_PROBE.tonNotConfiguredLabel);
    expect(body.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});