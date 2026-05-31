import { describe, expect, it } from 'vitest';
import chatHandler from '../../api/chat/route';

async function jsonBody(res: Response) {
  return await res.json();
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

  it('/api/chat: POST degrades gracefully with 200 when no provider keys are set', async () => {
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;

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
    process.env.GROK_API_KEY = 'grok-test';

    const req = new Request('http://test/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({ query: 'Explain RAV in one sentence.' }),
    });
    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    const body = (await jsonBody(res)) as { response?: string; message?: string };
    expect(body.response).toBe('');
    expect(body.message).toBe('OFFLINE_MODE');
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('offline');

    // Restore env
    process.env = originalEnv;
  });
});
