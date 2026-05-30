import { describe, expect, it } from 'vitest';
import chatHandler from '../../api/chat/route';

async function jsonBody(res: Response) {
  return await res.json();
}

describe('API routes integration', () => {
  it('/api/chat: POST returns 200 with offline source when no provider keys are set', async () => {
    // Ensure keys are undefined
    const originalEnv = { ...process.env };
    process.env.GROK_API_KEY = '';
    process.env.GEMINI_API_KEY = '';
    process.env.ANTHROPIC_API_KEY = '';
    process.env.GROK_API_KEY_ENC = '';
    process.env.GEMINI_API_KEY_ENC = '';
    process.env.ANTHROPIC_API_KEY_ENC = '';

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'Hello' }),
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
