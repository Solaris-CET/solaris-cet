import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/crypto', () => ({
  resolveApiKey: async (_enc: unknown, plain: unknown) => (typeof plain === 'string' ? plain : null),
}));

vi.mock('../../api/lib/healthCheck', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/lib/healthCheck')>();
  return {
    ...original,
    checkHealthDatabase: async () => ({ status: 'ok' as const, latencyMs: 1 }),
    checkHealthRedis: async () => ({ status: 'ok' as const, latencyMs: 1 }),
  };
});

vi.mock('openai', () => {
  class OpenAI {
    baseURL: string;
    constructor(opts: { baseURL?: string }) {
      this.baseURL = opts.baseURL ?? '';
    }
    chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: {
                content: 'Salut! Sunt Solarix, asistentul Solaris CET.',
              },
            },
          ],
        })),
      },
    };
  }
  return { default: OpenAI };
});

import chatHandler from '../../api/chat/route';
import healthRoute from '../../api/health/route';

function jsonBody(res: Response): Promise<unknown> {
  return res.text().then((t) => (t ? (JSON.parse(t) as unknown) : null));
}

describe('API routes integration', () => {
  const originalEnv = { ...process.env };
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = { ...originalEnv };
  });

  it('/api/health: OPTIONS returns 204 with CORS headers', async () => {
    const req = new Request('http://test/api/health', { method: 'OPTIONS', headers: { origin: 'https://x.test' } });
    const res = await healthRoute(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('/api/health: GET returns ok payload with checks', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    process.env.REDIS_URL = 'https://redis.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.DEEPSEEK_CHATBOT_API_KEY = 'deepseek-test';

    const req = new Request('http://test/api/health', { method: 'GET', headers: { origin: 'https://x.test' } });
    const res = await healthRoute(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as {
      status: string;
      checks: { database: { status: string }; redis: { status: string }; deepseek: { status: string } };
    };
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('ok');
    expect(body.checks.redis.status).toBe('ok');
  });

  it('/api/chat: OPTIONS returns 204 with CORS headers', async () => {
    const req = new Request('http://test/api/chat', { method: 'OPTIONS', headers: { origin: 'https://x.test' } });
    const res = await chatHandler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('/api/chat: POST degrades gracefully with 200 when no provider keys are set', async () => {
    delete process.env.DEEPSEEK_CHATBOT_API_KEY;

    const req = new Request('http://test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ query: 'hi' }),
    });
    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('offline');
    const body = (await jsonBody(res)) as { response?: unknown; message?: unknown };
    const text = typeof body.response === 'string' ? body.response : typeof body.message === 'string' ? body.message : '';
    expect(text).toBeTruthy();
  });

  it('/api/chat: POST returns {response} on success', async () => {
    process.env.DEEPSEEK_CHATBOT_API_KEY = 'deepseek-test';

    const req = new Request('http://test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ query: 'Explain photovoltaics in one sentence.' }),
    });
    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('live');
    const body = (await jsonBody(res)) as { response: unknown };
    expect(typeof body.response).toBe('string');
    expect(body.response).toContain('Solarix');
  });
});
