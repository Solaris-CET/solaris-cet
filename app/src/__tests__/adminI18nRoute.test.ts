// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_I18N_PATH,
  ADMIN_I18N_PROBE,
  normI18nKey,
  parseI18nPutBody,
} from '../../api/lib/adminI18n';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  existing: null as { id: string; key: string; value: string } | null,
  insertCalls: 0,
  updateCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({ getAllowedOrigin: () => 'https://allowed.test' }));
vi.mock('../../api/lib/adminAudit', () => ({ writeAdminAudit: vi.fn(async () => undefined) }));
vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));

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
                    limit: async () => [{ key: 'hello', value: 'Salut' }],
                  };
                },
                then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                  const rows = adminMocks.existing ? [adminMocks.existing] : [];
                  return Promise.resolve(rows).then(onFulfilled, onRejected);
                },
              };
            },
          };
        },
      };
    },
    update() {
      adminMocks.updateCalls += 1;
      return { set: () => ({ where: async () => undefined }) };
    },
    insert() {
      adminMocks.insertCalls += 1;
      return { values: async () => undefined };
    },
  }),
  schema: {
    cmsTranslations: {
      locale: 'cmsTranslations.locale',
      namespace: 'cmsTranslations.namespace',
      key: 'cmsTranslations.key',
    },
  },
}));

import adminI18nRoute, { ADMIN_I18N_PROBE as routeProbe } from '../../api/admin/i18n/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminI18n helpers', () => {
  it('normI18nKey validates key length', () => {
    expect(normI18nKey('  hello  ')).toBe('hello');
    expect(normI18nKey('')).toBeNull();
  });

  it('parseI18nPutBody validates payload', () => {
    expect(parseI18nPutBody({ locale: 'ro', namespace: 'common', key: 'hello', value: 'Salut' })).toEqual({
      ok: true,
      locale: 'ro',
      namespace: 'common',
      key: 'hello',
      value: 'Salut',
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(routeProbe.path).toBe('/api/admin/i18n');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.putMinRole).toBe('editor');
  });
});

describe('/api/admin/i18n e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.existing = null;
    adminMocks.insertCalls = 0;
    adminMocks.updateCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_I18N_PATH);
    expect(src).toContain('api/admin/i18n/route.js');
  });

  it('GET returns translations list', async () => {
    adminMocks.role = 'viewer';
    const res = await adminI18nRoute(
      adminRequest(`${ADMIN_I18N_PATH}?locale=ro&namespace=common`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { translations: Array<{ key: string }> };
    expect(body.translations[0]?.key).toBe('hello');
  });

  it('PUT inserts new translation', async () => {
    const res = await adminI18nRoute(
      adminRequest(ADMIN_I18N_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'ro', namespace: 'common', key: 'welcome', value: 'Bun venit' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.insertCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'I18N_UPDATED',
      'cms_translation',
      'ro:common:welcome',
      expect.objectContaining({ key: 'welcome' }),
    );
  });

  it('PUT updates existing translation', async () => {
    adminMocks.existing = { id: 't1', key: 'hello', value: 'Old' };
    const res = await adminI18nRoute(
      adminRequest(ADMIN_I18N_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'ro', namespace: 'common', key: 'hello', value: 'Salut nou' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.updateCalls).toBe(1);
    expect(adminMocks.insertCalls).toBe(0);
  });

  it('DELETE returns 405', async () => {
    const res = await adminI18nRoute(adminRequest(ADMIN_I18N_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(405);
  });
});