// @vitest-environment node
import { authRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_ATTACHMENTS_PATH,
  AI_ATTACHMENTS_PROBE,
  attachmentDownloadUrl,
  isAllowedAttachmentMime,
  parseAttachmentGetId,
  sanitizeAttachmentFilename,
} from '../../api/lib/aiAttachments';

const attachMocks = vi.hoisted(() => ({
  authOk: true,
  rows: [] as Array<{ id: string; filename: string; mimeType: string; bytes: number; dataBase64: string }>,
  inserted: null as { id: string; filename: string; mimeType: string; bytes: number } | null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withUpstashRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!attachMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', role: 'user' }, sid: null, mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => attachMocks.rows,
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => (attachMocks.inserted ? [attachMocks.inserted] : []),
          };
        },
      };
    },
  }),
  schema: {
    aiAttachments: {
      id: 'aiAttachments.id',
      userId: 'aiAttachments.userId',
      filename: 'aiAttachments.filename',
      mimeType: 'aiAttachments.mimeType',
      bytes: 'aiAttachments.bytes',
      dataBase64: 'aiAttachments.dataBase64',
    },
  },
}));

import aiAttachmentsRoute, { AI_ATTACHMENTS_PROBE as routeProbe } from '../../api/ai/attachments/route';

describe('aiAttachments helpers', () => {
  it('isAllowedAttachmentMime accepts known types', () => {
    expect(isAllowedAttachmentMime('image/png')).toBe(true);
    expect(isAllowedAttachmentMime('application/exe')).toBe(false);
  });

  it('parseAttachmentGetId and sanitizeAttachmentFilename', () => {
    expect(parseAttachmentGetId(new URLSearchParams('id= att-1 '))).toBe('att-1');
    expect(sanitizeAttachmentFilename('x'.repeat(300))).toHaveLength(AI_ATTACHMENTS_PROBE.maxFilenameLength);
    expect(attachmentDownloadUrl('att-99')).toBe('/api/ai/attachments?id=att-99');
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_ATTACHMENTS_PROBE.path).toBe('/api/ai/attachments');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'OPTIONS']);
  });
});

describe('/api/ai/attachments e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    attachMocks.authOk = true;
    attachMocks.rows = [];
    attachMocks.inserted = {
      id: 'att-1',
      filename: 'note.txt',
      mimeType: 'text/plain',
      bytes: 5,
    };
    process.env.DATABASE_URL = 'postgres://test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_ATTACHMENTS_PATH);
    expect(src).toContain('api/ai/attachments/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiAttachmentsRoute(authRequest(AI_ATTACHMENTS_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('GET requires auth', async () => {
    attachMocks.authOk = false;
    const res = await aiAttachmentsRoute(authRequest(`${AI_ATTACHMENTS_PATH}?id=att-1`, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET requires id', async () => {
    const res = await aiAttachmentsRoute(authRequest(AI_ATTACHMENTS_PATH, { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AI_ATTACHMENTS_PROBE.missingIdError);
  });

  it('GET returns attachment bytes', async () => {
    attachMocks.rows = [
      {
        id: 'att-1',
        filename: 'note.txt',
        mimeType: 'text/plain',
        bytes: 5,
        dataBase64: Buffer.from('hello').toString('base64'),
      },
    ];
    const res = await aiAttachmentsRoute(authRequest(`${AI_ATTACHMENTS_PATH}?id=att-1`, { method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain');
    expect(await res.text()).toBe('hello');
  });

  it('POST rejects non-multipart', async () => {
    const res = await aiAttachmentsRoute(
      authRequest(AI_ATTACHMENTS_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(415);
  });

  it('DELETE returns 405', async () => {
    const res = await aiAttachmentsRoute(authRequest(AI_ATTACHMENTS_PATH, { method: 'DELETE' }));
    expect(res.status).toBe(405);
  });
});