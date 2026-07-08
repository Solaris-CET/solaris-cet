// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseSessionRevokeId, SESSION_REVOKE_PATH, SESSION_REVOKE_PROBE } from '../../api/lib/sessionRevoke';

const revokeMocks = vi.hoisted(() => ({
  authOk: true,
  mfaEnabled: false,
  revoked: false,
  currentSid: 'sess-current',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!revokeMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' },
      sid: revokeMocks.currentSid,
      mfaEnabled: revokeMocks.mfaEnabled,
    };
  },
}));

vi.mock('../../api/lib/userMfaShared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/userMfaShared')>();
  return {
    ...actual,
    verifyUserMfaGate: vi.fn(async () => ({ ok: true as const })),
    notifyUserSecurityTelegram: vi.fn(async () => undefined),
  };
});

vi.mock('../../db/client', () => ({
  getDb: () => ({
    update() {
      return {
        set() {
          return {
            where() {
              return {
                returning: async () => {
                  revokeMocks.revoked = true;
                  return [{ id: 'sess-other' }];
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    sessions: { id: 'sessions.id', userId: 'sessions.userId', revokedAt: 'sessions.revokedAt' },
  },
}));

import sessionRevokeRoute, { SESSION_REVOKE_PROBE as routeProbe } from '../../api/security/sessions/revoke/route';

function revokeRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SESSION_REVOKE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('sessionRevoke helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SESSION_REVOKE_PROBE.path).toBe('/api/security/sessions/revoke');
    expect(routeProbe.allowHeaders).toContain('X-MFA-Code');
  });

  it('parseSessionRevokeId extracts session id', () => {
    expect(parseSessionRevokeId({ sessionId: ' sess-2 ' })).toBe('sess-2');
    expect(parseSessionRevokeId({})).toBeNull();
  });
});

describe('/api/security/sessions/revoke e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeMocks.authOk = true;
    revokeMocks.mfaEnabled = false;
    revokeMocks.revoked = false;
    revokeMocks.currentSid = 'sess-current';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SESSION_REVOKE_PATH);
    expect(src).toContain('api/security/sessions/revoke/route.js');
  });

  it('POST revokes session', async () => {
    const res = await sessionRevokeRoute(revokeRequest({ sessionId: 'sess-other' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; revoked: boolean; sessionId: string };
    expect(body.ok).toBe(true);
    expect(body.sessionId).toBe('sess-other');
    expect(body.revoked).toBe(false);
    expect(revokeMocks.revoked).toBe(true);
  });

  it('POST without sessionId returns 400', async () => {
    const res = await sessionRevokeRoute(revokeRequest({}));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SESSION_REVOKE_PROBE.invalidSessionIdError);
  });
});