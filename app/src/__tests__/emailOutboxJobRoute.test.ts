// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EMAIL_OUTBOX_JOB_PATH, EMAIL_OUTBOX_JOB_PROBE } from '../../api/lib/emailOutboxJob';

const outboxMocks = vi.hoisted(() => ({
  cronOk: true,
  pending: [
    {
      id: 'mail-1',
      toEmail: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      textBody: 'Hi',
    },
  ],
  sentCount: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  requireCron: (req: Request) => req.headers.get('X-Cron-Secret') === 'test-secret',
}));

vi.mock('../../api/lib/emailProvider', () => ({
  sendEmail: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => outboxMocks.pending,
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => {
              outboxMocks.sentCount += 1;
            },
          };
        },
      };
    },
  }),
  schema: {
    emailOutbox: { id: 'emailOutbox.id', status: 'emailOutbox.status', sendAfter: 'emailOutbox.sendAfter' },
  },
}));

import emailOutboxJobRoute, { EMAIL_OUTBOX_JOB_PROBE as routeProbe } from '../../api/jobs/email-outbox/route';

function outboxRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${EMAIL_OUTBOX_JOB_PATH}`, { ...init, headers });
}

describe('emailOutboxJob helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(EMAIL_OUTBOX_JOB_PROBE.path).toBe('/api/jobs/email-outbox');
    expect(routeProbe.batchLimit).toBe(20);
  });
});

describe('/api/jobs/email-outbox e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outboxMocks.sentCount = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(EMAIL_OUTBOX_JOB_PATH);
    expect(src).toContain('api/jobs/email-outbox/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await emailOutboxJobRoute(outboxRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST processes pending emails', async () => {
    const res = await emailOutboxJobRoute(outboxRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; processed: number; sent: number };
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.sent).toBe(1);
    expect(outboxMocks.sentCount).toBe(1);
  });
});