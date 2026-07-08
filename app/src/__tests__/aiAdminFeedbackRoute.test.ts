// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_ADMIN_FEEDBACK_PATH,
  AI_ADMIN_FEEDBACK_PROBE,
  aiAdminFeedbackSince24h,
  aiAdminFeedbackSince7d,
  anonymizeAiAdminUserId,
  normalizeAvgQualityScore,
  parseAiAdminFeedbackLimit,
} from '../../api/lib/aiAdminFeedback';

const feedbackMocks = vi.hoisted(() => ({
  authOk: true,
  isAdmin: true,
  dbUrl: 'postgres://test',
  feedbackRows: [
    {
      id: 'fb-1',
      userId: 'user-secret',
      queryLogId: 'ql-1',
      messageId: 'msg-1',
      rating: 1,
      comment: 'Great answer',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
  avgRow: { avgScore7d: 0.88, scoredCount7d: 12 },
  fb24Row: { total24h: 5, up24h: 4, down24h: 1 },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/nodeCrypto', () => ({
  sha256Hex: (v: string) => `hash-${v}`,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!feedbackMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'admin-1', role: feedbackMocks.isAdmin ? 'admin' : 'user' },
      sid: null,
      mfaEnabled: false,
    };
  },
  requireAdmin: (ctx: { user: { role: string } }) => {
    if (ctx.user.role === 'admin') return { ok: true as const };
    return { ok: false as const, error: 'Forbidden', status: 403 };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select(arg?: unknown) {
      const isFeedbackList = arg && typeof arg === 'object' && 'queryLogId' in arg;
      const isAvg = arg && typeof arg === 'object' && 'avgScore7d' in arg;
      const isFb24 = arg && typeof arg === 'object' && 'total24h' in arg;

      if (isFeedbackList) {
        return {
          from() {
            return {
              orderBy() {
                return {
                  limit: async () => feedbackMocks.feedbackRows,
                };
              },
            };
          },
        };
      }

      if (isAvg) {
        return {
          from() {
            return {
              where: async () => [feedbackMocks.avgRow],
            };
          },
        };
      }

      if (isFb24) {
        return {
          from() {
            return {
              where: async () => [feedbackMocks.fb24Row],
            };
          },
        };
      }

      return {
        from() {
          return {
            where: async () => [],
          };
        },
      };
    },
  }),
  schema: {
    aiFeedback: {
      id: 'aiFeedback.id',
      userId: 'aiFeedback.userId',
      queryLogId: 'aiFeedback.queryLogId',
      messageId: 'aiFeedback.messageId',
      rating: 'aiFeedback.rating',
      comment: 'aiFeedback.comment',
      createdAt: 'aiFeedback.createdAt',
    },
    aiQueryLogs: {
      qualityScore: 'aiQueryLogs.qualityScore',
      createdAt: 'aiQueryLogs.createdAt',
    },
  },
}));

import aiAdminFeedbackRoute, { AI_ADMIN_FEEDBACK_PROBE as routeProbe } from '../../api/ai/admin/feedback/route';

describe('aiAdminFeedback helpers', () => {
  it('parseAiAdminFeedbackLimit applies defaults and bounds', () => {
    // Number(null) === 0, which clamps to minLimit when param is absent
    expect(parseAiAdminFeedbackLimit(new URLSearchParams())).toBe(AI_ADMIN_FEEDBACK_PROBE.minLimit);
    expect(parseAiAdminFeedbackLimit(new URLSearchParams('limit=50'))).toBe(50);
    expect(parseAiAdminFeedbackLimit(new URLSearchParams('limit=9999'))).toBe(AI_ADMIN_FEEDBACK_PROBE.maxLimit);
  });

  it('window helpers and anonymizeAiAdminUserId', () => {
    const now = Date.UTC(2026, 0, 2, 12, 0, 0);
    expect(aiAdminFeedbackSince7d(now).getTime()).toBe(now - AI_ADMIN_FEEDBACK_PROBE.window7dMs);
    expect(aiAdminFeedbackSince24h(now).getTime()).toBe(now - AI_ADMIN_FEEDBACK_PROBE.window24hMs);
    expect(anonymizeAiAdminUserId('user-1', (v) => `abcdef${v}`)).toHaveLength(AI_ADMIN_FEEDBACK_PROBE.userHashLength);
    expect(anonymizeAiAdminUserId(null, (v) => v)).toBe('anon');
    expect(normalizeAvgQualityScore(0.9)).toBe(0.9);
    expect(normalizeAvgQualityScore('bad')).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_ADMIN_FEEDBACK_PROBE.path).toBe('/api/ai/admin/feedback');
    expect(routeProbe.adminRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/ai/admin/feedback e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    feedbackMocks.authOk = true;
    feedbackMocks.isAdmin = true;
    process.env.DATABASE_URL = feedbackMocks.dbUrl;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_ADMIN_FEEDBACK_PATH);
    expect(src).toContain('api/ai/admin/feedback/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiAdminFeedbackRoute(
      new Request(`http://test${AI_ADMIN_FEEDBACK_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires auth', async () => {
    feedbackMocks.authOk = false;
    const res = await aiAdminFeedbackRoute(authRequest(AI_ADMIN_FEEDBACK_PATH, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET requires admin role', async () => {
    feedbackMocks.isAdmin = false;
    const res = await aiAdminFeedbackRoute(authRequest(AI_ADMIN_FEEDBACK_PATH, { method: 'GET' }));
    expect(res.status).toBe(403);
  });

  it('GET returns feedback and aggregates', async () => {
    const res = await aiAdminFeedbackRoute(authRequest(`${AI_ADMIN_FEEDBACK_PATH}?limit=10`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      feedback: Array<{ id: string; user: string; rating: number }>;
      aggregates: {
        avgQualityScore7d: number | null;
        scoredCount7d: number;
        feedback24h: { total: number; up: number; down: number };
      };
    };
    expect(body.feedback[0]?.id).toBe('fb-1');
    expect(body.feedback[0]?.user).toBe('hash-user-secret'.slice(0, AI_ADMIN_FEEDBACK_PROBE.userHashLength));
    expect(body.aggregates.avgQualityScore7d).toBe(0.88);
    expect(body.aggregates.feedback24h).toEqual({ total: 5, up: 4, down: 1 });
  });

  it('POST returns 405', async () => {
    const res = await aiAdminFeedbackRoute(authRequest(AI_ADMIN_FEEDBACK_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});