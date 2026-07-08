// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AI_ASK_PATH,
  AI_ASK_PROBE,
  normalizeConversation,
  parseAskModelPreference,
  parseAskQuery,
  parseAskTone,
  safeTrimText,
} from '../../api/lib/aiAsk';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withUpstashRateLimit: async () => null,
}));

vi.mock('../../api/lib/concurrencyLimit', () => ({
  acquireConcurrencySlot: async () => ({ release: async () => undefined }),
}));

vi.mock('../../api/lib/crypto', () => ({
  resolveApiKey: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => ({ error: 'Unauthorized', status: 401 }),
}));

import aiAskRoute, { AI_ASK_PROBE as routeProbe } from '../../api/ai/ask/route';

function askRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AI_ASK_PATH}`, { ...init, headers });
}

describe('aiAsk helpers', () => {
  it('parseAskQuery validates presence and length', () => {
    expect(parseAskQuery({ query: '  hello  ' })).toEqual({ ok: true, query: 'hello' });
    expect(parseAskQuery({ query: '' })).toEqual({ ok: false, message: AI_ASK_PROBE.missingQueryMessage, status: 400 });
    expect(parseAskQuery({ query: 'x'.repeat(AI_ASK_PROBE.maxQueryChars + 1) }).ok).toBe(false);
  });

  it('normalizeConversation keeps valid turns only', () => {
    expect(
      normalizeConversation([
        { role: 'user', content: ' Hi ' },
        { role: 'bot', content: 'ignored' },
        { role: 'assistant', content: 'Hello' },
      ]),
    ).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]);
  });

  it('parseAskModelPreference and parseAskTone apply defaults', () => {
    expect(parseAskModelPreference({ model: 'grok' })).toBe('grok');
    expect(parseAskModelPreference({ model: 'unknown' })).toBe('auto');
    expect(parseAskTone({ tone: 'fun' })).toBe('fun');
    expect(parseAskTone({})).toBe('brand');
    expect(safeTrimText('  abc  ', 2)).toBe('ab');
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_ASK_PROBE.path).toBe('/api/ai/ask');
    expect(routeProbe.rateLimitKey).toBe('cet-ai-ask');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/ai/ask e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_ASK_PATH);
    expect(src).toContain('api/ai/ask/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiAskRoute(askRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects missing query', async () => {
    const res = await aiAskRoute(
      askRequest({ method: 'POST', body: JSON.stringify({ query: '   ' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe(AI_ASK_PROBE.missingQueryMessage);
  });

  it('POST returns 500 when no provider keys configured', async () => {
    const res = await aiAskRoute(
      askRequest({ method: 'POST', body: JSON.stringify({ query: 'What is CET?' }) }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe(AI_ASK_PROBE.noProviderMessage);
  });

  it('GET returns 405', async () => {
    const res = await aiAskRoute(askRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});