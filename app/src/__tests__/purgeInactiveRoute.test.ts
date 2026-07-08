// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseMaintenanceBearer,
  parsePurgeInactiveBody,
  PURGE_INACTIVE_PATH,
  PURGE_INACTIVE_PROBE,
} from '../../api/lib/purgeInactive';

const purgeMocks = vi.hoisted(() => {
  const schema = {
    users: { id: 'users.id', role: 'users.role', createdAt: 'users.createdAt' },
    sessions: { userId: 'sessions.userId', lastUsedAt: 'sessions.lastUsedAt', createdAt: 'sessions.createdAt' },
  };

  const bag = {
    candidates: [{ userId: 'user-old-1' }, { userId: 'user-old-2' }],
    deleted: false,
  };

  const getDb = () => ({
    select() {
      return {
        from() {
          return {
            leftJoin() {
              return {
                where() {
                  return {
                    groupBy() {
                      return {
                        having() {
                          return {
                            limit: async () => bag.candidates,
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    delete() {
      return {
        where: async () => {
          bag.deleted = true;
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: purgeMocks.getDb,
  schema: purgeMocks.schema,
}));

import purgeInactiveRoute, { PURGE_INACTIVE_PROBE as routeProbe } from '../../api/maintenance/purge-inactive/route';

const MAINT_TOKEN = 'maint-test-token';

function purgeRequest(body: Record<string, unknown> = {}, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Authorization', `Bearer ${MAINT_TOKEN}`);
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${PURGE_INACTIVE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('purgeInactive helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PURGE_INACTIVE_PROBE.path).toBe('/api/maintenance/purge-inactive');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.protectedRoles).toContain('admin');
  });

  it('parseMaintenanceBearer extracts bearer token', () => {
    const req = new Request('http://test', { headers: { Authorization: 'Bearer secret-token' } });
    expect(parseMaintenanceBearer(req)).toBe('secret-token');
    expect(parseMaintenanceBearer(new Request('http://test'))).toBeNull();
  });

  it('parsePurgeInactiveBody clamps days and limit', () => {
    expect(parsePurgeInactiveBody({ days: 10, limit: 9999, dryRun: true })).toEqual({
      days: PURGE_INACTIVE_PROBE.minDays,
      limit: PURGE_INACTIVE_PROBE.maxLimit,
      dryRun: true,
    });
    expect(parsePurgeInactiveBody({})).toEqual({
      days: PURGE_INACTIVE_PROBE.defaultDays,
      limit: PURGE_INACTIVE_PROBE.defaultLimit,
      dryRun: false,
    });
  });
});

describe('/api/maintenance/purge-inactive e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purgeMocks.candidates = [{ userId: 'user-old-1' }, { userId: 'user-old-2' }];
    purgeMocks.deleted = false;
    process.env.MAINTENANCE_TOKEN = MAINT_TOKEN;
  });

  afterEach(() => {
    delete process.env.MAINTENANCE_TOKEN;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PURGE_INACTIVE_PATH);
    expect(src).toContain('api/maintenance/purge-inactive/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await purgeInactiveRoute(
      new Request(`http://test${PURGE_INACTIVE_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST without token returns 401', async () => {
    const res = await purgeInactiveRoute(
      new Request(`http://test${PURGE_INACTIVE_PATH}`, {
        method: 'POST',
        headers: { origin: 'https://allowed.test', 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('POST dryRun reports candidates without deleting', async () => {
    const res = await purgeInactiveRoute(purgeRequest({ dryRun: true, days: 400 }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; dryRun: boolean; candidates: number };
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.candidates).toBe(2);
    expect(purgeMocks.deleted).toBe(false);
  });

  it('POST deletes inactive users', async () => {
    const res = await purgeInactiveRoute(purgeRequest({ dryRun: false, days: 400, limit: 50 }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; deleted: number };
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(2);
    expect(purgeMocks.deleted).toBe(true);
  });
});