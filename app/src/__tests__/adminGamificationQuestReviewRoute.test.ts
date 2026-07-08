// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_GAMIFICATION_QUEST_REVIEW_PATH,
  ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE,
  parseQuestReviewBody,
} from '../../api/lib/adminGamificationQuestReview';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  progress: {
    id: 'prog-1',
    userId: 'user-1',
    questId: 'quest-1',
    day: '2026-03-01',
    status: 'pending_review',
  } as {
    id: string;
    userId: string;
    questId: string;
    day: string;
    status: string;
  } | null,
  quest: { slug: 'share-proof', pointsReward: 50, requiresProof: true } as {
    slug: string;
    pointsReward: number;
    requiresProof: boolean;
  } | null,
  queryStep: 0,
  updateCalls: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));
vi.mock('../../api/lib/rateLimit', () => ({ withRateLimit: async () => null }));
vi.mock('../../api/lib/adminAudit', () => ({ writeAdminAudit: vi.fn(async () => undefined) }));
vi.mock('../../api/lib/points', () => ({
  awardPoints: vi.fn(async () => ({ awarded: true })),
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
import adminGamificationQuestReviewRoute, {
  ADMIN_GAMIFICATION_QUEST_REVIEW_PROBE as routeProbe,
} from '../../api/admin/gamification/quests/review/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminGamificationQuestReview helpers', () => {
  it('parseQuestReviewBody validates decision', () => {
    expect(parseQuestReviewBody({ progressId: 'prog-1', decision: 'approve' })).toEqual({
      ok: true,
      progressId: 'prog-1',
      decision: 'approve',
    });
    expect(parseQuestReviewBody({ progressId: 'prog-1', decision: 'maybe' })).toEqual({
      ok: false,
      error: 'Invalid request',
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(routeProbe.path).toBe('/api/admin/gamification/quests/review');
    expect(routeProbe.minRole).toBe('editor');
    expect(routeProbe.pendingStatus).toBe('pending_review');
  });
});

describe('/api/admin/gamification/quests/review e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'editor';
    adminMocks.queryStep = 0;
    adminMocks.updateCalls = 0;
    adminMocks.progress = {
      id: 'prog-1',
      userId: 'user-1',
      questId: 'quest-1',
      day: '2026-03-01',
      status: 'pending_review',
    };
    adminMocks.quest = { slug: 'share-proof', pointsReward: 50, requiresProof: true };
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_GAMIFICATION_QUEST_REVIEW_PATH);
    expect(src).toContain('api/admin/gamification/quests/review/route.js');
  });

  it('POST rejects quest proof review', async () => {
    const res = await adminGamificationQuestReviewRoute(
      adminRequest(ADMIN_GAMIFICATION_QUEST_REVIEW_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId: 'prog-1', decision: 'reject' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; rejected: boolean };
    expect(body.rejected).toBe(true);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.any(Object),
      'QUEST_REVIEWED',
      'user_quest_progress',
      'prog-1',
      expect.objectContaining({ decision: 'reject' }),
    );
  });

  it('POST approves quest and awards points', async () => {
    const res = await adminGamificationQuestReviewRoute(
      adminRequest(ADMIN_GAMIFICATION_QUEST_REVIEW_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId: 'prog-1', decision: 'approve' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; approved: boolean; awarded: boolean };
    expect(body.approved).toBe(true);
    expect(body.awarded).toBe(true);
  });

  it('GET returns 405', async () => {
    const res = await adminGamificationQuestReviewRoute(
      adminRequest(ADMIN_GAMIFICATION_QUEST_REVIEW_PATH, { method: 'GET' }),
    );
    expect(res.status).toBe(405);
  });
});