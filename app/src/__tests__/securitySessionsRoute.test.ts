// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSecuritySessionsPayload,
  mapSecuritySessionItem,
  normalizeSessionCount,
  SECURITY_SESSIONS_PATH,
  SECURITY_SESSIONS_PROBE,
} from '../../api/lib/securitySessions';

const sessionsMocks = vi.hoisted(() => ({
  authOk: true,
  currentSid: 'sess-current',
  mfaEnabled: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!sessionsMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' },
      sid: sessionsMocks.currentSid,
      mfaEnabled: sessionsMocks.mfaEnabled,
    };
  },
}));

const sampleSession = {
  id: 'sess-current',
  createdAt: new Date('2026-07-01T10:00:00.000Z'),
  lastUsedAt: new Date('2026-07-07T09:00:00.000Z'),
  expiresAt: new Date('2026-12-31T23:59:59.000Z'),
  revokedAt: null,
  ip: '127.0.0.1',
  userAgent: 'vitest',
};

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy() {
                  return {
                    limit: async () => [sampleSession],
                  };
                },
                then(resolve: (value: Array<{ c: number }>) => void, reject?: (reason: unknown) => void) {
                  return Promise.resolve([{ c: 1 }]).then(resolve, reject);
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    sessions: { userId: 'sessions.userId', createdAt: 'sessions.createdAt', revokedAt: 'sessions.revokedAt' },
  },
}));

import securitySessionsRoute, { SECURITY_SESSIONS_PROBE as routeProbe } from '../../api/security/sessions/route';

function sessionsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${SECURITY_SESSIONS_PATH}`, { ...init, headers });
}

describe('securitySessions helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SECURITY_SESSIONS_PROBE.path).toBe('/api/security/sessions');
    expect(routeProbe.listLimit).toBe(50);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('mapSecuritySessionItem marks current and active', () => {
    const now = Date.parse('2026-07-07T12:00:00.000Z');
    const item = mapSecuritySessionItem(sampleSession, now, 'sess-current');
    expect(item.current).toBe(true);
    expect(item.active).toBe(true);
    expect(item.ip).toBe('127.0.0.1');
  });

  it('normalizeSessionCount coerces invalid values', () => {
    expect(normalizeSessionCount(3)).toBe(3);
    expect(normalizeSessionCount('bad')).toBe(0);
  });

  it('buildSecuritySessionsPayload shapes response', () => {
    const now = Date.parse('2026-07-07T12:00:00.000Z');
    const sessions = [mapSecuritySessionItem(sampleSession, now, 'sess-current')];
    const payload = buildSecuritySessionsPayload({
      sessions,
      currentSessionId: 'sess-current',
      mfaEnabled: true,
      notRevokedCount: 1,
    });
    expect(payload.ok).toBe(true);
    expect(payload.counts.notRevoked).toBe(1);
    expect(payload.mfaEnabled).toBe(true);
  });
});

describe('/api/security/sessions e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionsMocks.authOk = true;
    sessionsMocks.currentSid = 'sess-current';
    sessionsMocks.mfaEnabled = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SECURITY_SESSIONS_PATH);
    expect(src).toContain('api/security/sessions/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await securitySessionsRoute(sessionsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET lists sessions for authenticated user', async () => {
    const res = await securitySessionsRoute(sessionsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      currentSessionId: string;
      mfaEnabled: boolean;
      sessions: Array<{ id: string; current: boolean }>;
      counts: { total: number; notRevoked: number };
    };
    expect(body.ok).toBe(true);
    expect(body.currentSessionId).toBe('sess-current');
    expect(body.mfaEnabled).toBe(true);
    expect(body.sessions[0]?.current).toBe(true);
    expect(body.counts.notRevoked).toBe(1);
  });
});