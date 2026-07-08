// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canSendCommunityDigestEmail,
  COMMUNITY_DIGEST_JOB_PATH,
  COMMUNITY_DIGEST_JOB_PROBE,
  communityDigestSiteOrigin,
  renderCommunityDigestEmail,
} from '../../api/lib/communityDigestJob';

const digestMocks = vi.hoisted(() => {
  const schema = {
    forumPosts: { id: 'forumPosts.id', status: 'forumPosts.status', createdAt: 'forumPosts.createdAt', title: 'forumPosts.title' },
    forumVotes: { targetType: 'forumVotes.targetType', targetId: 'forumVotes.targetId', value: 'forumVotes.value' },
    newsletterSubscriptions: { status: 'newsletterSubscriptions.status', contactId: 'newsletterSubscriptions.contactId', locale: 'newsletterSubscriptions.locale' },
    contacts: { id: 'contacts.id', email: 'contacts.email' },
    emailOutbox: { toEmail: 'emailOutbox.toEmail' },
  };

  const bag = {
    cronOk: true,
    queued: 0,
    topPosts: [{ id: 'post-1', title: 'Solar tips', score: 12 }],
    subs: [{ email: 'user@example.com', locale: 'ro' }],
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.forumPosts) {
            return {
              leftJoin() {
                return {
                  where() {
                    return {
                      groupBy() {
                        return {
                          orderBy() {
                            return {
                              limit: async () => bag.topPosts,
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          }
          if (table === schema.newsletterSubscriptions) {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      limit: async () => bag.subs,
                    };
                  },
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    insert(table: unknown) {
      return {
        values: async () => {
          if (table === schema.emailOutbox) bag.queued += 1;
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  requireCron: (req: Request) => req.headers.get('X-Cron-Secret') === 'test-secret',
}));

vi.mock('../../db/client', () => ({
  getDb: digestMocks.getDb,
  schema: digestMocks.schema,
}));

import communityDigestJobRoute, { COMMUNITY_DIGEST_JOB_PROBE as routeProbe } from '../../api/jobs/community-digest/route';

function digestRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${COMMUNITY_DIGEST_JOB_PATH}`, { ...init, headers });
}

describe('communityDigestJob helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(COMMUNITY_DIGEST_JOB_PROBE.path).toBe('/api/jobs/community-digest');
    expect(routeProbe.cronAuthRequired).toBe(true);
  });

  it('renderCommunityDigestEmail builds digest', () => {
    const rendered = renderCommunityDigestEmail({
      locale: 'ro',
      origin: 'https://solaris-cet.com',
      weekFrom: '2026-07-01',
      weekTo: '2026-07-07',
      posts: [{ title: 'Solar tips', url: 'https://solaris-cet.com/forum/post-1', score: 5 }],
    });
    expect(rendered.subject).toContain('Digest');
    expect(rendered.html).toContain('Solar tips');
    expect(communityDigestSiteOrigin()).toContain('solaris');
  });
});

describe('/api/jobs/community-digest e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    digestMocks.cronOk = true;
    digestMocks.queued = 0;
    process.env.RESEND_API_KEY = 're_test';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(COMMUNITY_DIGEST_JOB_PATH);
    expect(src).toContain('api/jobs/community-digest/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await communityDigestJobRoute(digestRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without cron auth returns 401', async () => {
    const res = await communityDigestJobRoute(
      new Request(`http://test${COMMUNITY_DIGEST_JOB_PATH}`, { method: 'POST', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(401);
  });

  it('POST queues digest emails', async () => {
    expect(canSendCommunityDigestEmail()).toBe(true);
    const res = await communityDigestJobRoute(digestRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; queued: number };
    expect(body.ok).toBe(true);
    expect(body.queued).toBe(1);
    expect(digestMocks.queued).toBe(1);
  });
});