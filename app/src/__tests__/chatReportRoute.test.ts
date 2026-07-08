// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHAT_REPORT_PATH,
  CHAT_REPORT_PROBE,
  isValidChatReportPost,
  parseChatReportPostBody,
} from '../../api/lib/chatReport';

const reportMocks = vi.hoisted(() => ({
  authOk: true,
  inserted: false,
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
    insert() {
      return {
        values: async () => {
          reportMocks.inserted = true;
        },
      };
    },
  }),
  schema: {
    chatReports: { messageId: 'chatReports.messageId' },
  },
}));

import chatReportRoute, { CHAT_REPORT_PROBE as routeProbe } from '../../api/chat/report/route';

function reportRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CHAT_REPORT_PATH}`, { ...init, headers });
}

describe('chatReport helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CHAT_REPORT_PROBE.path).toBe('/api/chat/report');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.maxReasonLength).toBe(80);
  });

  it('parseChatReportPostBody and isValidChatReportPost', () => {
    const parsed = parseChatReportPostBody({ messageId: ' msg-1 ', reason: ' spam ', details: ' details ' });
    expect(parsed.messageId).toBe('msg-1');
    expect(parsed.reason).toBe('spam');
    expect(isValidChatReportPost(parsed)).toBe(true);
    expect(isValidChatReportPost({ messageId: '', reason: '', details: null })).toBe(false);
  });
});

describe('/api/chat/report e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportMocks.authOk = true;
    reportMocks.inserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CHAT_REPORT_PATH);
    expect(src).toContain('api/chat/report/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await chatReportRoute(reportRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    reportMocks.authOk = false;
    const res = await chatReportRoute(
      reportRequest({ method: 'POST', body: JSON.stringify({ messageId: 'msg-1', reason: 'spam' }) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST submits report when authenticated', async () => {
    const res = await chatReportRoute(
      reportRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ messageId: 'msg-1', reason: 'spam', details: 'off-topic' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(reportMocks.inserted).toBe(true);
  });

  it('POST with missing fields returns 400', async () => {
    const res = await chatReportRoute(
      reportRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ messageId: 'msg-1' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});