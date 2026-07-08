// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_SETTINGS_PATH,
  ADMIN_SETTINGS_PROBE,
  normalizeSettingKey,
  parseSettingPutBody,
} from '../../api/lib/adminSettings';

type SettingRow = {
  key: string;
  value: unknown;
  updatedAt: Date;
  updatedByAdminId: string;
};

const settingsMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'admin' as 'admin' | 'editor' | 'viewer',
  pendingPutKey: '' as string,
  rows: [
    {
      key: 'site.name',
      value: 'Solaris',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedByAdminId: 'admin_1',
    },
  ] as SettingRow[],
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!settingsMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[settingsMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: settingsMocks.role }, sessionId: 'sess_1' };
  },
}));
import adminSettingsRoute, { ADMIN_SETTINGS_PROBE as routeProbe } from '../../api/admin/settings/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminSettings helpers', () => {
  it('normalizeSettingKey trims and validates keys', () => {
    expect(normalizeSettingKey('  site.name  ')).toBe('site.name');
    expect(normalizeSettingKey('')).toBeNull();
    expect(normalizeSettingKey('bad key!')).toBeNull();
    expect(normalizeSettingKey('x'.repeat(ADMIN_SETTINGS_PROBE.maxKeyLength + 1))).toBeNull();
  });

  it('parseSettingPutBody validates key and value', () => {
    expect(parseSettingPutBody({ key: 'site.name', value: 'Solaris CET' })).toEqual({
      ok: true,
      key: 'site.name',
      value: 'Solaris CET',
    });
    expect(parseSettingPutBody({ key: 'bad key', value: 'x' })).toEqual({ ok: false, error: 'Key invalid' });
    expect(parseSettingPutBody({ key: 'site.name' })).toEqual({ ok: false, error: 'Value missing' });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_SETTINGS_PROBE.path).toBe('/api/admin/settings');
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.putMinRole).toBe('admin');
    expect(routeProbe.methods).toEqual(['GET', 'PUT', 'OPTIONS']);
  });
});

describe('/api/admin/settings e2e probe', () => {
  beforeEach(() => {
    settingsMocks.authOk = true;
    settingsMocks.role = 'admin';
    settingsMocks.pendingPutKey = '';
    settingsMocks.rows = [
      {
        key: 'site.name',
        value: 'Solaris',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedByAdminId: 'admin_1',
      },
    ];
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_SETTINGS_PATH);
    expect(src).toContain('api/admin/settings/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminSettingsRoute(
      new Request(`http://test${ADMIN_SETTINGS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });

  it('GET requires admin auth', async () => {
    settingsMocks.authOk = false;
    const res = await adminSettingsRoute(adminRequest(ADMIN_SETTINGS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_SETTINGS_PROBE.unauthenticatedStatus);
  });

  it('GET returns settings list for viewer role', async () => {
    settingsMocks.role = 'viewer';
    const res = await adminSettingsRoute(adminRequest(ADMIN_SETTINGS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { settings: Array<{ key: string; value: string }> };
    expect(body.settings[0]?.key).toBe('site.name');
    expect(body.settings[0]?.value).toBe('Solaris');
  });

  it('PUT updates setting and writes audit', async () => {
    settingsMocks.pendingPutKey = 'site.name';
    const res = await adminSettingsRoute(
      adminRequest(ADMIN_SETTINGS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site.name', value: 'Solaris CET' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { setting: { key: string; value: string } };
    expect(body.setting.key).toBe('site.name');
    expect(body.setting.value).toBe('Solaris CET');
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      ADMIN_SETTINGS_PROBE.auditAction,
      'cms_setting',
      'site.name',
      { key: 'site.name' },
    );
  });

  it('PUT requires admin role', async () => {
    settingsMocks.role = 'viewer';
    const res = await adminSettingsRoute(
      adminRequest(ADMIN_SETTINGS_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site.name', value: 'x' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST returns 405', async () => {
    const res = await adminSettingsRoute(adminRequest(ADMIN_SETTINGS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});