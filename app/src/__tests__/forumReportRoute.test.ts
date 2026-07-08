// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FORUM_REPORT_PATH,
  FORUM_REPORT_PROBE,
  isForumReportTargetType,
  parseForumReportPostBody,
  validateForumReportPostBody,
} from '../../api/lib/forumReport';

const reportMocks = vi.hoisted(() => ({
  authOk: true,
  targetExists: true,
  reportId: 'report-1',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!reportMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => (reportMocks.targetExists ? [{ id: 'post-1' }] : []),
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: reportMocks.reportId }],
          };
        },
      };
    },
  }),
  schema: {
    forumPosts: { id: 'forumPosts.id' },
    forumComments: { id: 'forumComments.id' },
    forumReports: { id: 'forumReports.id' },
  },
}));

import forumReportRoute, { FORUM_REPORT_PROBE as routeProbe } from '../../api/forum/report/route';

function reportRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${FORUM_REPORT_PATH}`, { ...init, headers });
}

describe('forumReport helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(FORUM_REPORT_PROBE.path).toBe('/api/forum/report');
    expect(routeProbe.targetTypes).toEqual(['post', 'comment']);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseForumReportPostBody and validateForumReportPostBody', () => {
    const parsed = parseForumReportPostBody({ targetType: 'post', targetId: 'post-1', reason: 'spam', details: 'bad' });
    expect(validateForumReportPostBody(parsed).ok).toBe(true);
    expect(isForumReportTargetType('post')).toBe(true);
    expect(isForumReportTargetType('user')).toBe(false);
  });
});

describe('/api/forum/report e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportMocks.authOk = true;
    reportMocks.targetExists = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(FORUM_REPORT_PATH);
    expect(src).toContain('api/forum/report/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await forumReportRoute(reportRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    reportMocks.authOk = false;
    const res = await forumReportRoute(
      reportRequest({ method: 'POST', body: JSON.stringify({ targetType: 'post', targetId: 'post-1', reason: 'spam' }) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST submits forum report', async () => {
    const res = await forumReportRoute(
      reportRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ targetType: 'post', targetId: 'post-1', reason: 'spam' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; reportId: string };
    expect(body.ok).toBe(true);
    expect(body.reportId).toBe('report-1');
  });

  it('POST with invalid targetType returns 400', async () => {
    const res = await forumReportRoute(
      reportRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ targetType: 'user', targetId: 'x', reason: 'spam' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});