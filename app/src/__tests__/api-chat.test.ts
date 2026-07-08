import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import handler from '../../api/chat/route';

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

          if (this.baseURL.includes('api.deepseek.com')) {
            if (process.env.TEST_DEEPSEEK_FAIL === '1') throw new Error('deepseek down');
            return {
              choices: [
                {
                  message: {
                    content: 'Salut! Sunt Solarix, asistentul Solaris CET. Cu ce te pot ajuta?',
                  },
                },
              ],
            };
          }

          return { choices: [{ message: { content: 'unknown provider' } }] };
        },
      },
    };
  }
  return { default: OpenAI };
});

const ENV_KEYS = ['DEEPSEEK_CHATBOT_API_KEY', 'TEST_DEEPSEEK_FAIL'] as const;

const savedEnv: Record<(typeof ENV_KEYS)[number], string | undefined> = {
  DEEPSEEK_CHATBOT_API_KEY: undefined,
  TEST_DEEPSEEK_FAIL: undefined,
};

beforeEach(() => {
  createCalls = [];
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.DEEPSEEK_CHATBOT_API_KEY = 'test';
  process.env.TEST_DEEPSEEK_FAIL = '0';
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    const v = savedEnv[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe('/api/chat', () => {
  it('returns 200 and includes response from DeepSeek', async () => {
    const req = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({ query: 'hello', conversation: [] }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('live');
    const json = (await res.json()) as { response: string; source: string };
    expect(json.response).toContain('Solarix');
    expect(json.source).toBe('deepseek');
    expect(createCalls.length).toBeGreaterThan(0);
    expect(createCalls[0]?.baseURL).toContain('api.deepseek.com');
  });

  it('returns offline knowledge base for known intents', async () => {
    const req = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '2.2.2.2' },
      body: JSON.stringify({ query: 'cât costă un sistem de 5kW?', conversation: [] }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('offline');
    const json = (await res.json()) as { response: string; source: string };
    expect(json.response).toContain('5 kW');
    expect(json.source).toBe('fallback');
    expect(createCalls.length).toBe(0);
  });

  it('falls back when DeepSeek fails and still returns a response', async () => {
    process.env.TEST_DEEPSEEK_FAIL = '1';
    const req = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://example.com', 'x-forwarded-for': '4.4.4.4' },
      body: JSON.stringify({ query: 'fallback', conversation: [] }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('offline');
    const json = (await res.json()) as { response: string };
    expect(json.response).toBeTruthy();
  });
});
