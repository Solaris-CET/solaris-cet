// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_FEEDBACK_PATH,
  AI_FEEDBACK_PROBE,
  parseFeedbackBody,
  parseFeedbackRating,
  safeFeedbackId,
} from '../../api/lib/aiFeedback';

const feedbackMocks = vi.hoisted(() => ({
  inserted: { id: 'fb-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withUpstashRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => ({ error: 'Unauthorized', status: 401 }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            returning: async () => [feedbackMocks.inserted],
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
  },
}));

import aiFeedbackRoute, { AI_FEEDBACK_PROBE as routeProbe } from '../../api/ai/feedback/route';

function feedbackRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AI_FEEDBACK_PATH}`, { ...init, headers });
}

describe('aiFeedback helpers', () => {
  it('parseFeedbackRating accepts -1, 0, 1 only', () => {
    expect(parseFeedbackRating({ rating: 1 })).toBe(1);
    expect(parseFeedbackRating({ rating: 2 })).toBeNull();
    expect(parseFeedbackRating({ rating: -1 })).toBe(-1);
  });

  it('parseFeedbackBody and safeFeedbackId', () => {
    expect(parseFeedbackBody({ rating: 1, messageId: '1234567890', comment: ' ok ' })).toEqual({
      rating: 1,
      messageId: '1234567890',
      queryLogId: null,
      comment: 'ok',
    });
    expect(safeFeedbackId('short')).toBeNull();
    expect(safeFeedbackId('1234567890')).toBe('1234567890');
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_FEEDBACK_PROBE.path).toBe('/api/ai/feedback');
    expect(routeProbe.rateLimitKey).toBe('cet-ai-feedback');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/ai/feedback e2e probe', () => {
  const prevDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = prevDbUrl;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_FEEDBACK_PATH);
    expect(src).toContain('api/ai/feedback/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiFeedbackRoute(feedbackRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects invalid rating', async () => {
    const res = await aiFeedbackRoute(
      feedbackRequest({ method: 'POST', body: JSON.stringify({ rating: 9 }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AI_FEEDBACK_PROBE.invalidRatingError);
  });

  it('POST stores feedback without auth', async () => {
    const res = await aiFeedbackRoute(
      feedbackRequest({ method: 'POST', body: JSON.stringify({ rating: 1, comment: 'Great' }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toBe('fb-1');
  });

  it('GET returns 405', async () => {
    const res = await aiFeedbackRoute(feedbackRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});