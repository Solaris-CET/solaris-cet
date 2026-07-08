// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildGdprExportFilename, GDPR_EXPORT_PATH, GDPR_EXPORT_PROBE, isoDateString } from '../../api/lib/gdprExport';

const exportMocks = vi.hoisted(() => {
  const schema = {
    users: { id: 'users.id' },
    userSettings: { userId: 'userSettings.userId' },
    notificationPreferences: { userId: 'notificationPreferences.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
    consentProofs: { userId: 'consentProofs.userId', createdAt: 'consentProofs.createdAt' },
    contacts: { userId: 'contacts.userId', createdAt: 'contacts.createdAt' },
    pointsLedger: { userId: 'pointsLedger.userId', createdAt: 'pointsLedger.createdAt' },
    referrals: { referrerUserId: 'referrals.referrerUserId', referredUserId: 'referrals.referredUserId', createdAt: 'referrals.createdAt' },
  };

  const userRow = {
    id: 'user-1',
    walletAddress: 'EQabc',
    referralCode: 'REF1',
    points: 100,
    role: 'user',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const bag = { authOk: true, userFound: true };

  const listTables = new Set([schema.consentProofs, schema.contacts, schema.pointsLedger, schema.referrals]);

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.users) {
            return {
              where() {
                return {
                  limit: async () => (bag.userFound ? [userRow] : []),
                };
              },
            };
          }
          if (table === schema.userSettings || table === schema.notificationPreferences || table === schema.telegramLinks) {
            return {
              where() {
                return {
                  limit: async () => [],
                };
              },
            };
          }
          if (listTables.has(table as (typeof schema)['consentProofs'])) {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit: async () => [],
                    };
                  },
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!exportMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: exportMocks.getDb,
  schema: exportMocks.schema,
}));

import gdprExportRoute, { GDPR_EXPORT_PROBE as routeProbe } from '../../api/gdpr/export/route';

function exportRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${GDPR_EXPORT_PATH}`, { ...init, headers });
}

describe('gdprExport helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GDPR_EXPORT_PROBE.path).toBe('/api/gdpr/export');
    expect(routeProbe.consentProofsLimit).toBe(2000);
  });

  it('isoDateString and buildGdprExportFilename', () => {
    expect(isoDateString(new Date('2026-07-07T10:00:00Z'))).toBe('2026-07-07T10:00:00.000Z');
    expect(buildGdprExportFilename(new Date('2026-07-07T10:00:00Z'))).toBe('solaris-cet-data-export-2026-07-07.json');
  });
});

describe('/api/gdpr/export e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportMocks.authOk = true;
    exportMocks.userFound = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GDPR_EXPORT_PATH);
    expect(src).toContain('api/gdpr/export/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gdprExportRoute(exportRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    exportMocks.authOk = false;
    const res = await gdprExportRoute(exportRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns JSON attachment export', async () => {
    const res = await gdprExportRoute(
      exportRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('solaris-cet-data-export');
    const body = (await res.json()) as { exportedAt: string; user: { id: string; walletAddress: string } };
    expect(body.user.id).toBe('user-1');
    expect(body.user.walletAddress).toBe('EQabc');
    expect(body.exportedAt).toBeTruthy();
  });
});