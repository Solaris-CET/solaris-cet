// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_AUDIT_LOGS_PROBE,
  auditSinceDate,
  parseAuditActionParam,
  parseAuditSinceHoursParam,
} from '../../api/lib/adminAuditLogs';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'viewer',
  rows: [
    {
      id: 'audit-1',
      actorAdminId: 'admin_1',
      action: 'CACHE_CLEARED',
      targetType: 'cache',
      targetId: null,
      meta: { keys: ['cet-state-json'] },
      ip: '127.0.0.1',
      userAgent: 'vitest',
      createdAt: new Date('2026-03-01T10:00:00Z'),
    },
  ],
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

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
                    limit: async () => adminMocks.rows,
                  };
                },
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    adminAuditLogs: {
      action: 'adminAuditLogs.action',
      createdAt: 'adminAuditLogs.createdAt',
    },
  },
}));

import adminAuditLogsRoute, { ADMIN_AUDIT_LOGS_PROBE as routeProbe } from '../../api/admin/audit/route';

describe('adminAuditLogs helpers', () => {
  it('parseAuditActionParam trims action filter', () => {
    expect(parseAuditActionParam(new URLSearchParams('action=LOGIN'))).toBe('LOGIN');
    expect(parseAuditActionParam(new URLSearchParams('action=  '))).toBe('');
  });

  it('parseAuditSinceHoursParam clamps hours window', () => {
    expect(parseAuditSinceHoursParam(new URLSearchParams('sinceHours=168'))).toBe(168);
    expect(parseAuditSinceHoursParam(new URLSearchParams('sinceHours=99999'))).toBe(24 * 90);
    expect(parseAuditSinceHoursParam(new URLSearchParams())).toBe(0);
  });

  it('auditSinceDate returns null for zero hours', () => {
    expect(auditSinceDate(0)).toBeNull();
    expect(auditSinceDate(24)).toBeInstanceOf(Date);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_AUDIT_LOGS_PROBE.path).toBe('/api/admin/audit');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/audit e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_AUDIT_LOGS_PATH);
    expect(src).toContain('api/admin/audit/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminAuditLogsRoute(
      new Request(`http://test${ADMIN_AUDIT_LOGS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminAuditLogsRoute(adminRequest(ADMIN_AUDIT_LOGS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_AUDIT_LOGS_PROBE.unauthenticatedStatus);
  });

  it('GET returns audit rows', async () => {
    const res = await adminAuditLogsRoute(
      adminRequest(`${ADMIN_AUDIT_LOGS_PATH}?sinceHours=168&action=CACHE_CLEARED`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { audit: Array<{ id: string; action: string }> };
    expect(body.audit[0]?.id).toBe('audit-1');
    expect(body.audit[0]?.action).toBe('CACHE_CLEARED');
  });

  it('POST returns 405', async () => {
    const res = await adminAuditLogsRoute(adminRequest(ADMIN_AUDIT_LOGS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});