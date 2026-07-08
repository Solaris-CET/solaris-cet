// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildReactAgentFinalAnswer,
  buildReactAgentTrace,
  isLikelyTonAddress,
  parseReactAgentBody,
  REACT_AGENT_PATH,
  REACT_AGENT_PROBE,
} from '../../api/lib/reactAgent';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import reactAgentRoute, { REACT_AGENT_PROBE as routeProbe } from '../../api/react/route';

const wallet = 'EQTestWalletAddress1234567890123456789012345';

function reactRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${REACT_AGENT_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('reactAgent helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(REACT_AGENT_PROBE.path).toBe('/api/react');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('isLikelyTonAddress validates TON-like strings', () => {
    expect(isLikelyTonAddress(wallet)).toBe(true);
    expect(isLikelyTonAddress('short')).toBe(false);
  });

  it('buildReactAgentTrace reflects wallet connection', () => {
    const trace = buildReactAgentTrace(wallet);
    expect(trace).toHaveLength(2);
    expect(trace[0]?.verified).toBe(true);
    expect(buildReactAgentFinalAnswer(wallet)).toContain('Wallet detected');
  });

  it('parseReactAgentBody normalizes query', () => {
    expect(parseReactAgentBody({ query: ' balance ', walletAddress: wallet })).toEqual({
      query: 'balance',
      walletAddress: wallet,
    });
  });
});

describe('/api/react e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(REACT_AGENT_PATH);
    expect(src).toContain('api/react/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await reactAgentRoute(
      new Request(`http://test${REACT_AGENT_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST returns reasoning trace', async () => {
    const res = await reactAgentRoute(reactRequest({ query: 'Check CET balance', walletAddress: wallet }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { trace: unknown[]; finalAnswer: string; walletAddress: string };
    expect(body.trace).toHaveLength(2);
    expect(body.walletAddress).toBe(wallet);
    expect(body.finalAnswer).toContain('Wallet detected');
  });
});