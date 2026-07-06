// @vitest-environment node
import { describe, expect, it } from 'vitest';

const pactIt = process.env.PACT_ENABLED === '1' ? it : it.skip;

describe('API contract: GET /api/health', () => {
  pactIt('returns a stable health payload shape', async () => {
    if (process.env.PACT_ENABLED !== '1') return;
    const { PactV3, MatchersV3 } = await import('@pact-foundation/pact');
    const pact = new PactV3({
      consumer: 'solaris-cet-app',
      provider: 'solaris-cet-api',
      dir: 'pacts',
    });

    pact
      .uponReceiving('a health check request')
      .withRequest({ method: 'GET', path: '/api/health' })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          status: 'ok',
          checks: {
            db: MatchersV3.regex('missing', '^(configured|missing)$'),
            ai: MatchersV3.regex('missing', '^(configured|missing)$'),
            ton: MatchersV3.regex('missing', '^(configured|missing)$'),
            rateLimit: MatchersV3.regex('missing', '^(configured|missing)$'),
            jwt: MatchersV3.regex('missing', '^(configured|missing)$'),
          },
          build: {
            gitSha: MatchersV3.like('unknown'),
            node: MatchersV3.like('v22.0.0'),
          },
          time: MatchersV3.regex('2026-01-01T00:00:00.000Z', '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'),
        },
      });

    await pact.executeTest(async (mockServer: { url: string }) => {
      const res = await fetch(`${mockServer.url}/api/health`);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { status?: unknown; checks?: unknown };
      expect(json.status).toBe('ok');
      expect(json.checks).toBeTruthy();
    });
  });
});
