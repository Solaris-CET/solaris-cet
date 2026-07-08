// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPublicChatResponse,
  detectPublicChatIntent,
  getPublicChatKnowledge,
  parsePublicChatPostBody,
  PUBLIC_CHAT_PATH,
  PUBLIC_CHAT_PROBE,
  validatePublicChatMessages,
} from '../../api/lib/publicChat';

vi.mock('openai', () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: async () => ({ choices: [{ message: { content: 'Răspuns AI' } }] }),
      },
    };
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import publicChatRoute, { PUBLIC_CHAT_PROBE as routeProbe } from '../../api/chat/route';

function chatRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${PUBLIC_CHAT_PATH}`, { ...init, headers });
}

describe('publicChat helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(PUBLIC_CHAT_PROBE.path).toBe('/api/chat');
    expect(routeProbe.runtime).toBe('edge');
    expect(routeProbe.deepseekModel).toBe('deepseek-v4-pro');
  });

  it('detectPublicChatIntent matches preturi', () => {
    expect(detectPublicChatIntent('Cat costa un sistem de 5kW?')).toBe('preturi');
    expect(getPublicChatKnowledge('preturi')).toContain('Prețuri orientative');
  });

  it('parsePublicChatPostBody builds messages from query', () => {
    const messages = parsePublicChatPostBody({ query: 'Salut' });
    expect(messages).toEqual([{ role: 'user', content: 'Salut' }]);
    expect(validatePublicChatMessages(messages)).toBe(true);
  });

  it('buildPublicChatResponse includes suggested questions', () => {
    const res = buildPublicChatResponse('test', 'fallback');
    expect(res.source).toBe('fallback');
    expect(res.suggestedQuestions.length).toBe(3);
  });
});

describe('/api/chat e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEEPSEEK_CHATBOT_API_KEY;
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_CHATBOT_API_KEY;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(PUBLIC_CHAT_PATH);
    expect(src).toContain('api/chat/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await publicChatRoute(chatRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST with empty messages returns 400', async () => {
    const res = await publicChatRoute(chatRequest({ method: 'POST', body: JSON.stringify({ messages: [] }) }));
    expect(res.status).toBe(400);
  });

  it('POST with preturi intent returns knowledge base offline', async () => {
    const res = await publicChatRoute(
      chatRequest({
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Cat costa un sistem de 5kW?' }] }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; content: string };
    expect(body.source).toBe('fallback');
    expect(body.content).toContain('Prețuri orientative');
    expect(res.headers.get('X-Cet-Ai-Source')).toBe('offline');
  });

  it('POST without API key returns offline fallback', async () => {
    const res = await publicChatRoute(
      chatRequest({
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Bună ziua' }] }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe('fallback');
  });

  it('GET returns 405', async () => {
    const res = await publicChatRoute(chatRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});