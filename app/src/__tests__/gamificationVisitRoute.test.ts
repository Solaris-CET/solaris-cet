// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GAMIFICATION_VISIT_PATH, GAMIFICATION_VISIT_PROBE } from '../../api/lib/gamificationVisit';

const visitMocks = vi.hoisted(() => ({
  authOk: true,
  awarded: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!visitMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => ({ awarded: visitMocks.awarded }),
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({}),
}));

import gamificationVisitRoute, { GAMIFICATION_VISIT_PROBE as routeProbe } from '../../api/gamification/visit/route';

function visitRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GAMIFICATION_VISIT_PATH}`, { ...init, headers });
}

describe('gamificationVisit helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GAMIFICATION_VISIT_PROBE.path).toBe('/api/gamification/visit');
    expect(routeProbe.visitPoints).toBe(1);
  });
});

describe('/api/gamification/visit e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitMocks.authOk = true;
    visitMocks.awarded = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GAMIFICATION_VISIT_PATH);
    expect(src).toContain('api/gamification/visit/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gamificationVisitRoute(visitRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    visitMocks.authOk = false;
    const res = await gamificationVisitRoute(visitRequest({ method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('POST records daily visit', async () => {
    const res = await gamificationVisitRoute(
      visitRequest({ method: 'POST', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; awarded: boolean };
    expect(body.ok).toBe(true);
    expect(body.awarded).toBe(true);
  });
});