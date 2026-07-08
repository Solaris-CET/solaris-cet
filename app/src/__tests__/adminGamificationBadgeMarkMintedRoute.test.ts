// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH,
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE,
  parseBadgeMarkMintedBody,
} from '../../api/lib/adminGamificationBadgeMarkMinted';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  badgeFound: true,
  updateCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({ withRateLimit: async () => null }));
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
                limit: async () => (adminMocks.badgeFound ? [{ id: 'badge-1' }] : []),
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
  }),
  schema: {
    badges: { id: 'badges.id', slug: 'badges.slug', active: 'badges.active' },
    nftBadgeClaims: { userId: 'nftBadgeClaims.userId', badgeId: 'nftBadgeClaims.badgeId' },
  },
}));

import adminGamificationBadgeMarkMintedRoute, {
  ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PROBE as routeProbe,
} from '../../api/admin/gamification/badges/mark-minted/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminGamificationBadgeMarkMinted helpers', () => {
  it('parseBadgeMarkMintedBody validates required fields', () => {
    expect(parseBadgeMarkMintedBody({ userId: 'u1', badgeSlug: 'solar-pioneer' })).toEqual({
      ok: true,
      userId: 'u1',
      badgeSlug: 'solar-pioneer',
      txHash: '',
      nftAddress: '',
    });
    expect(parseBadgeMarkMintedBody({ userId: '', badgeSlug: 'x' })).toEqual({ ok: false, error: 'Invalid request' });
  });

  it('exports stable e2e probe contract', () => {
    expect(routeProbe.path).toBe('/api/admin/gamification/badges/mark-minted');
    expect(routeProbe.minRole).toBe('editor');
    expect(routeProbe.rateLimitKey).toBe('admin-badge-mint');
  });
});

describe('/api/admin/gamification/badges/mark-minted e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.badgeFound = true;
    adminMocks.updateCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH);
    expect(src).toContain('api/admin/gamification/badges/mark-minted/route.js');
  });

  it('POST marks badge minted and writes audit', async () => {
    const res = await adminGamificationBadgeMarkMintedRoute(
      adminRequest(ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u1', badgeSlug: 'solar-pioneer', txHash: '0xabc' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(adminMocks.updateCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'BADGE_MARK_MINTED',
      'nft_badge_claim',
      'u1:badge-1',
      expect.objectContaining({ userId: 'u1', badgeSlug: 'solar-pioneer' }),
    );
  });

  it('POST returns 404 when badge not found', async () => {
    adminMocks.badgeFound = false;
    const res = await adminGamificationBadgeMarkMintedRoute(
      adminRequest(ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u1', badgeSlug: 'missing' }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it('GET returns 405', async () => {
    const res = await adminGamificationBadgeMarkMintedRoute(
      adminRequest(ADMIN_GAMIFICATION_BADGE_MARK_MINTED_PATH, { method: 'GET' }),
    );
    expect(res.status).toBe(405);
  });
});