// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildOracleCacheKey,
  buildOracleSystemPrompt,
  extractOracleAssistantText,
  oracleTokenEstimate,
  parseOracleRequestBody,
  V2_AI_ORACLE_PATH,
  V2_AI_ORACLE_PROBE,
} from '../../api/lib/v2AiOracle';

vi.mock('../../api/lib/publicApiAuth', () => ({
  requirePublicApiKey: async (req: Request) => {
    if (!req.headers.get('X-API-Key')) return new Response(JSON.stringify({ error: { code: 'unauthorized' } }), { status: 401 });
    return { apiKeyId: 'key-1', userId: 'user-1', apiKeyName: 'test', apiKeyPrefix: 'sk_test' };
  },
}));

vi.mock('../../api/lib/publicApiMetrics', () => ({
  recordPublicApiUsage: async () => undefined,
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 60, remaining: 59, reset: Date.now() + 60_000 }),
  rateLimitHeaders: () => ({ 'X-RateLimit-Limit': '60' }),
}));

vi.mock('../../api/lib/crypto', () => ({
  resolveApiKey: async () => null,
}));

import v2AiOracleRoute, { V2_AI_ORACLE_PROBE as routeProbe } from '../../api/v2/ai/oracle/route';

describe('v2AiOracle helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(V2_AI_ORACLE_PROBE.path).toBe('/api/v2/ai/oracle');
    expect(routeProbe.apiVersion).toBe('v2');
  });

  it('parseOracleRequestBody validates query', () => {
    expect(parseOracleRequestBody({ query: 'What is CET?' }).ok).toBe(true);
    expect(parseOracleRequestBody({ query: '' }).ok).toBe(false);
    expect(buildOracleCacheKey('auto', '0', 'test').startsWith('cet-ai:public:v1')).toBe(true);
  });

  it('buildOracleSystemPrompt includes retrieval blocks', () => {
    const prompt = buildOracleSystemPrompt('WEB', 'KB');
    expect(prompt).toContain('WEB');
    expect(prompt).toContain('KB');
    expect(extractOracleAssistantText({ choices: [{ message: { content: 'hello' } }] })).toBe('hello');
    expect(oracleTokenEstimate('abcd')).toBeGreaterThan(0);
  });
});

describe('/api/v2/ai/oracle e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(V2_AI_ORACLE_PATH);
    expect(src).toContain('api/v2/ai/oracle/route.js');
  });

  it('POST without providers returns 500', async () => {
    const res = await v2AiOracleRoute(
      new Request(`http://test${V2_AI_ORACLE_PATH}`, {
        method: 'POST',
        headers: { 'X-API-Key': 'sk_test_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What is CET?' }),
      }),
    );
    expect(res.status).toBe(500);
  });
});