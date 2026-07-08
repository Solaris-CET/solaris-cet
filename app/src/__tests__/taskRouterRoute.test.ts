// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  classifyTaskRouterQuery,
  executeTaskRouterAgent,
  parseTaskRouterQuery,
  TASK_ROUTER_PATH,
  TASK_ROUTER_PROBE,
} from '../../api/lib/taskRouter';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import taskRouterRoute, { TASK_ROUTER_PROBE as routeProbe } from '../../api/route/route';

function taskRouterRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${TASK_ROUTER_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('taskRouter helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TASK_ROUTER_PROBE.path).toBe('/api/route');
    expect(routeProbe.highLatencyMs).toBe(250);
    expect(routeProbe.authRequired).toBe(false);
  });

  it('classifyTaskRouterQuery prioritizes urgent queries', () => {
    expect(classifyTaskRouterQuery('Need help urgently').name).toBe('high');
    expect(classifyTaskRouterQuery('Quick price estimate').name).toBe('medium');
    expect(classifyTaskRouterQuery('General info').name).toBe('low');
  });

  it('parseTaskRouterQuery reads query field', () => {
    expect(parseTaskRouterQuery({ query: 'swap CET' })).toBe('swap CET');
    expect(parseTaskRouterQuery({})).toBe('');
  });

  it('executeTaskRouterAgent returns routed result', async () => {
    const result = await executeTaskRouterAgent('high', 'help now', 250);
    expect(result.ok).toBe(true);
    expect(result.result).toContain('Fast path');
  });
});

describe('/api/route e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TASK_ROUTER_PATH);
    expect(src).toContain('api/route/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await taskRouterRoute(
      new Request(`http://test${TASK_ROUTER_PATH}`, { method: 'OPTIONS', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(204);
  });

  it('POST routes query by priority', async () => {
    const res = await taskRouterRoute(taskRouterRequest({ query: 'Need help urgently' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; task: { name: string }; result: string };
    expect(body.ok).toBe(true);
    expect(body.task.name).toBe('high');
    expect(body.result).toContain('Fast path');
  });
});