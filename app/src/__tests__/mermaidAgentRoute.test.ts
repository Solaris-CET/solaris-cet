// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildMermaidAgentGraph,
  MERMAID_AGENT_PATH,
  MERMAID_AGENT_PROBE,
  parseMermaidAgentQuery,
} from '../../api/lib/mermaidAgent';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import mermaidAgentRoute, { MERMAID_AGENT_PROBE as routeProbe } from '../../api/mermaid/agent/route';

function mermaidRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${MERMAID_AGENT_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('mermaidAgent helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(MERMAID_AGENT_PROBE.path).toBe('/api/mermaid/agent');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.format).toBe('mermaid');
  });

  it('parseMermaidAgentQuery defaults empty query', () => {
    expect(parseMermaidAgentQuery({})).toBe(MERMAID_AGENT_PROBE.defaultQuery);
    expect(parseMermaidAgentQuery({ query: '  Stake CET  ' })).toBe('Stake CET');
  });

  it('buildMermaidAgentGraph escapes quotes and includes nodes', () => {
    const graph = buildMermaidAgentGraph('Say "hello"');
    expect(graph).toContain('Say \'hello\'');
    expect(graph).toContain('graph TD');
    expect(graph).toContain('Show staking calculator');
  });
});

describe('/api/mermaid/agent e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(MERMAID_AGENT_PATH);
    expect(src).toContain('api/mermaid/agent/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await mermaidAgentRoute(
      new Request(`http://test${MERMAID_AGENT_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST returns mermaid graph', async () => {
    const res = await mermaidAgentRoute(mermaidRequest({ query: 'How to bridge CET?' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { format: string; graph: string; render: string };
    expect(body.format).toBe(MERMAID_AGENT_PROBE.format);
    expect(body.render).toBe(MERMAID_AGENT_PROBE.renderMode);
    expect(body.graph).toContain('How to bridge CET?');
  });

  it('GET returns 405', async () => {
    const res = await mermaidAgentRoute(
      new Request(`http://test${MERMAID_AGENT_PATH}`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(405);
  });
});