import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/crypto', () => ({
  resolveApiKey: async (_enc: unknown, plain: unknown) => (typeof plain === 'string' ? plain : null),
}));

vi.mock('../../api/lib/cetAiRetrieval', () => ({
  buildCetAiRetrievalBlock: async () => ({ block: '', sources: [] as unknown[] }),
}));

vi.mock('../../api/lib/reactBrain', () => ({
  deriveCetAiResourceBudget: () => ({ budgetMs: 5000, maxParallel: 2 }),
  decideCetAiRavPlan: () => ({
    agentCount: 2,
    providers: { strategy: 'single', singleProvider: 'grok' },
    temperature: 0.2,
    useOnChain: false,
    useWebRetrieval: false,
    budget: { budgetMs: 5000, maxParallel: 2 },
  }),
}));

vi.mock('openai', () => {
  class OpenAI {
    chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: {
                content:
                  '[DIAGNOSTIC INTERN]\nReason.\n\n[DECODARE ORACOL]\nAct.\n\n[DIRECTIVĂ DE ACȚIUNE]\nObserve.',
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
import healthHandler from '../../api/health/route';

function jsonBody(res: Response): Promise<unknown> {
  return res.text().then((t) => (t ? (JSON.parse(t) as unknown) : null));
}

describe('API routes integration', () => {
  const envSnapshot = { ...process.env };
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env = { ...envSnapshot };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = { ...envSnapshot };
  });

  it('/api/health: OPTIONS returns 204 with CORS headers', async () => {
    const req = new Request('http://test/api/health', { method: 'OPTIONS', headers: { origin: 'https://x.test' } });
    const res = await healthHandler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('/api/health: GET returns ok payload with checks', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    process.env.TONCENTER_RPC_URL = 'https://rpc.test';
    process.env.GROK_API_KEY = 'grok-test';
    process.env.GEMINI_API_KEY = 'gemini-test';

    const req = new Request('http://test/api/health', { method: 'GET', headers: { origin: 'https://x.test' } });
    const res = await healthHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as {
      status: string;
      checks: { db: string; ton: string; ai: string };
    };
    expect(body.status).toBe('ok');
    expect(body.checks.db).toBe('configured');
    expect(body.checks.ton).toBe('configured');
    expect(body.checks.ai).toBe('configured');
  });

  it('/api/chat: OPTIONS returns 204 with CORS headers', async () => {
    const req = new Request('http://test/api/chat', { method: 'OPTIONS', headers: { origin: 'https://x.test' } });
    const res = await chatHandler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.test');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('/api/chat: POST fails with 500 when no provider keys are set', async () => {
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const req = new Request('http://test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ query: 'hi' }),
    });
    const res = await chatHandler(req);
    expect(res.status).toBe(500);
    const body = (await jsonBody(res)) as { message?: unknown };
    expect(String(body.message || '')).toMatch(/No AI provider API key/i);
  });

  it('/api/chat: POST returns {response} on success', async () => {
    process.env.GROK_API_KEY = 'grok-test';

    const req = new Request('http://test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ query: 'Explain RAV in one sentence.' }),
    });
    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('live');
    const body = (await jsonBody(res)) as { response: unknown };
    expect(typeof body.response).toBe('string');
    expect(body.response).toContain('[DIAGNOSTIC INTERN]');
  });
});
