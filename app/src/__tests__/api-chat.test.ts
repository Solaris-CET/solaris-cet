import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import handler from '../../api/chat/route';
import { TOKEN_DECIMALS } from '../constants/token';
import { CET_CONTRACT_ADDRESS } from '../lib/cetContract';
import { DEDUST_POOL_ADDRESS } from '../lib/dedustUrls';

type CreateInput = { model: string; messages: Array<{ role: string; content: string }> };

let createCalls: Array<{ baseURL: string; input: CreateInput }> = [];

vi.mock('openai', () => {
  class OpenAI {
    baseURL: string;
    constructor(opts: { baseURL?: string }) {
      this.baseURL = opts.baseURL ?? '';
    }
    chat = {
      completions: {
        create: async (input: CreateInput) => {
          createCalls.push({ baseURL: this.baseURL, input });
          const system = input.messages[0]?.content ?? '';

          if (this.baseURL.includes('api.x.ai')) {
            if (process.env.TEST_GROK_FAIL === '1') throw new Error('grok down');
            return {
              choices: [
                {
                  message: {
                    content:
                      '[DECODARE ORACOL]\nAction.\n\n[DIRECTIVĂ DE ACȚIUNE]\nObservation.\nSOURCES: none',
                  },
                },
              ],
              usage: { prompt_tokens: 7, completion_tokens: 13, total_tokens: 20 },
            };
          }

          if (system.includes('REASON phase')) {
            return {
              choices: [{ message: { content: '[DIAGNOSTIC INTERN]\nReason.' } }],
              usage: { prompt_tokens: 5, completion_tokens: 6, total_tokens: 11 },
            };
          }

          if (system.includes('ACT and VERIFY')) {
            return {
              choices: [
                {
                  message: {
                    content:
                      '[DECODARE ORACOL]\nAction (via gemini).\n\n[DIRECTIVĂ DE ACȚIUNE]\nObservation.\nSOURCES: none',
                  },
                },
              ],
              usage: { prompt_tokens: 4, completion_tokens: 9, total_tokens: 13 },
            };
          }

          return {
            choices: [
              {
                message: {
                  content:
                    '[DIAGNOSTIC INTERN]\nD.\n\n[DECODARE ORACOL]\nA.\n\n[DIRECTIVĂ DE ACȚIUNE]\nO.\nSOURCES: none',
                },
              },
            ],
            usage: { prompt_tokens: 3, completion_tokens: 7, total_tokens: 10 },
          };
        },
      },
    };
  }
  return { default: OpenAI };
});

function mockOnChainFetch() {
  const pool = {
    address: DEDUST_POOL_ADDRESS,
    assets: [{ type: 'native' }, { type: 'jetton', address: CET_CONTRACT_ADDRESS }],
    reserves: ['1000000000', String(5000 * Math.pow(10, TOKEN_DECIMALS))],
    stats: { volume_24h: '1000000000' },
  };
  const prices = [
    { address: 'native', price: '2.0' },
    { address: CET_CONTRACT_ADDRESS, price: '0.001' },
  ];

  const original = globalThis.fetch;
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    const u = String(url);
    if (u.includes('api.dedust.io/v2/pools')) {
      return new Response(JSON.stringify([pool]), { status: 200 });
    }
    if (u.includes('api.dedust.io/v2/prices')) {
      return new Response(JSON.stringify(prices), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const ENV_KEYS = ['GEMINI_API_KEY', 'GROK_API_KEY', 'CET_AI_CACHE_TTL_SECONDS', 'TEST_GROK_FAIL'] as const;

const savedEnv: Record<(typeof ENV_KEYS)[number], string | undefined> = {
  GEMINI_API_KEY: undefined,
  GROK_API_KEY: undefined,
  CET_AI_CACHE_TTL_SECONDS: undefined,
  TEST_GROK_FAIL: undefined,
};

let restoreFetch: (() => void) | null = null;

beforeEach(() => {
  createCalls = [];
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.GEMINI_API_KEY = 'test';
  process.env.GROK_API_KEY = 'test';
  process.env.CET_AI_CACHE_TTL_SECONDS = '60';
  process.env.TEST_GROK_FAIL = '0';
});

afterEach(() => {
  if (restoreFetch) {
    restoreFetch();
    restoreFetch = null;
  }
  for (const k of ENV_KEYS) {
    const v = savedEnv[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('/api/chat', () => {
  it('returns 200 and includes response + usage', async () => {
    restoreFetch = mockOnChainFetch();
    const req = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({ query: 'hello', conversation: [] }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { response: string; usage?: unknown };
    expect(json.response).toContain('[DIAGNOSTIC INTERN]');
    expect(json.response).toContain('[DECODARE ORACOL]');
    expect(json.usage).toBeTruthy();
  });

  it('caches identical requests per IP and returns cache hit', async () => {
    restoreFetch = mockOnChainFetch();
    const mkReq = () =>
      new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '2.2.2.2' },
        body: JSON.stringify({ query: 'cache-me', conversation: [] }),
      });

    const res1 = await handler(mkReq());
    expect(res1.status).toBe(200);
    const callsAfterFirst = createCalls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    const res2 = await handler(mkReq());
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cet-Ai-Cache')).toBe('hit');
    expect(createCalls.length).toBe(callsAfterFirst);
  });

  it('falls back when Grok fails and still returns RAV output', async () => {
    restoreFetch = mockOnChainFetch();
    process.env.TEST_GROK_FAIL = '1';
    const req = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '4.4.4.4' },
      body: JSON.stringify({ query: 'fallback', conversation: [] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { response: string };
    expect(json.response).toContain('[DIAGNOSTIC INTERN]');
    expect(json.response).toContain('[DECODARE ORACOL]');
    expect(json.response).toContain('SOURCES:');
  });
});
