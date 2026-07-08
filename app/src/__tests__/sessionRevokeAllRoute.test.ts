// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildRevokeAllTelegramMessage, SESSION_REVOKE_ALL_PATH, SESSION_REVOKE_ALL_PROBE } from '../../api/lib/sessionRevokeAll';

const revokeAllMocks = vi.hoisted(() => ({
  authOk: true,
  mfaEnabled: false,
  revokedCount: 2,
  currentSid: 'sess-current',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!revokeAllMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' },
      sid: revokeAllMocks.currentSid,
      mfaEnabled: revokeAllMocks.mfaEnabled,
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
                returning: async () => Array.from({ length: revokeAllMocks.revokedCount }, (_, i) => ({ id: `sess-${i}` })),
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

import sessionRevokeAllRoute, { SESSION_REVOKE_ALL_PROBE as routeProbe } from '../../api/security/sessions/revoke-all/route';

function revokeAllRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${SESSION_REVOKE_ALL_PATH}`, { method: 'POST', ...init, headers });
}

describe('sessionRevokeAll helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SESSION_REVOKE_ALL_PROBE.path).toBe('/api/security/sessions/revoke-all');
    expect(routeProbe.allowHeaders).toContain('X-MFA-Code');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('buildRevokeAllTelegramMessage formats count', () => {
    expect(buildRevokeAllTelegramMessage(3)).toBe('Au fost revocate 3 sesiuni.');
  });
});

describe('/api/security/sessions/revoke-all e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    revokeAllMocks.authOk = true;
    revokeAllMocks.mfaEnabled = false;
    revokeAllMocks.revokedCount = 2;
    revokeAllMocks.currentSid = 'sess-current';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SESSION_REVOKE_ALL_PATH);
    expect(src).toContain('api/security/sessions/revoke-all/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await sessionRevokeAllRoute(revokeAllRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST revokes all other sessions', async () => {
    const res = await sessionRevokeAllRoute(revokeAllRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; revokedCount: number };
    expect(body.ok).toBe(true);
    expect(body.revokedCount).toBe(2);
  });

  it('POST without session id returns 400', async () => {
    revokeAllMocks.currentSid = '';
    const res = await sessionRevokeAllRoute(revokeAllRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SESSION_REVOKE_ALL_PROBE.missingSessionIdError);
  });
});