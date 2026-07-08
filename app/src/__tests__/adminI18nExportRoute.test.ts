// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_I18N_EXPORT_PATH,
  ADMIN_I18N_EXPORT_PROBE,
  parseI18nExportLocale,
  parseI18nExportNamespace,
  translationsToRecord,
} from '../../api/lib/adminI18nExport';

const adminMocks = vi.hoisted(() => ({ authOk: true, role: 'viewer' as 'admin' | 'viewer' }));

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
import adminI18nExportRoute, { ADMIN_I18N_EXPORT_PROBE as routeProbe } from '../../api/admin/i18n/export/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminI18nExport helpers', () => {
  it('parseI18nExportLocale and namespace default', () => {
    expect(parseI18nExportLocale(new URLSearchParams())).toBe('ro');
    expect(parseI18nExportNamespace(new URLSearchParams())).toBe('common');
  });

  it('translationsToRecord builds map', () => {
    expect(translationsToRecord([{ key: 'a', value: '1' }])).toEqual({ a: '1' });
  });

  it('exports stable e2e probe contract', () => {
    expect(routeProbe.path).toBe('/api/admin/i18n/export');
    expect(routeProbe.minRole).toBe('viewer');
  });
});

describe('/api/admin/i18n/export e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_I18N_EXPORT_PATH);
    expect(src).toContain('api/admin/i18n/export/route.js');
  });

  it('GET exports translations and writes audit', async () => {
    const res = await adminI18nExportRoute(
      adminRequest(`${ADMIN_I18N_EXPORT_PATH}?locale=ro&namespace=common`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string; namespace: string; translations: Record<string, string> };
    expect(body.locale).toBe('ro');
    expect(body.translations.hello).toBe('Salut');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'I18N_EXPORTED',
      'cms_translations',
      'ro:common',
      expect.objectContaining({ count: 2 }),
    );
  });

  it('POST returns 405', async () => {
    const res = await adminI18nExportRoute(adminRequest(ADMIN_I18N_EXPORT_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});