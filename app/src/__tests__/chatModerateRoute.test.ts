// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHAT_MODERATE_PATH,
  CHAT_MODERATE_PROBE,
  isChatModeratorRole,
  parseChatModerateAction,
  parseChatModeratePostBody,
} from '../../api/lib/chatModerate';

const modMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'moderator' as string,
  updated: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!modMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'mod-1', walletAddress: 'EQabc', role: modMocks.role },
      sid: 'sess-1',
      mfaEnabled: false,
    };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    update() {
      return {
        set() {
          return {
            where: async () => {
              modMocks.updated = true;
            },
          };
        },
      };
    },
  }),
  schema: {
    chatMessages: { id: 'chatMessages.id' },
  },
}));

import chatModerateRoute, { CHAT_MODERATE_PROBE as routeProbe } from '../../api/chat/moderate/route';

function moderateRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${CHAT_MODERATE_PATH}`, { ...init, headers });
}

describe('chatModerate helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CHAT_MODERATE_PROBE.path).toBe('/api/chat/moderate');
    expect(routeProbe.actions).toEqual(['hide', 'approve']);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseChatModeratePostBody extracts fields', () => {
    expect(parseChatModeratePostBody({ messageId: ' msg-1 ', action: ' hide ' })).toEqual({
      messageId: 'msg-1',
      action: 'hide',
    });
  });

  it('parseChatModerateAction maps to status', () => {
    expect(parseChatModerateAction('hide')).toBe('hidden');
    expect(parseChatModerateAction('approve')).toBe('visible');
    expect(parseChatModerateAction('bad')).toBeNull();
  });

  it('isChatModeratorRole checks roles', () => {
    expect(isChatModeratorRole('admin')).toBe(true);
    expect(isChatModeratorRole('user')).toBe(false);
  });
});

describe('/api/chat/moderate e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modMocks.authOk = true;
    modMocks.role = 'moderator';
    modMocks.updated = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CHAT_MODERATE_PATH);
    expect(src).toContain('api/chat/moderate/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await chatModerateRoute(moderateRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    modMocks.authOk = false;
    const res = await chatModerateRoute(
      moderateRequest({
        method: 'POST',
        body: JSON.stringify({ messageId: 'msg-1', action: 'hide' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('POST as non-moderator returns 403', async () => {
    modMocks.role = 'user';
    const res = await chatModerateRoute(
      moderateRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ messageId: 'msg-1', action: 'hide' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST approve updates message status', async () => {
    const res = await chatModerateRoute(
      moderateRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ messageId: 'msg-1', action: 'approve' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('visible');
    expect(modMocks.updated).toBe(true);
  });

  it('POST with invalid action returns 400', async () => {
    const res = await chatModerateRoute(
      moderateRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ messageId: 'msg-1', action: 'delete' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});