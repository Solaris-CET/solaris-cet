// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildOpenApiV2Spec, OPENAPI_V2_PATH, OPENAPI_V2_PROBE } from '../../api/lib/openapiV2';
import openapiV2Route, { OPENAPI_V2_PROBE as routeProbe } from '../../api/openapi/v2/route';

function openapiV2Request(init: RequestInit = {}): Request {
  return new Request(`http://test${OPENAPI_V2_PATH}`, { ...init });
}

describe('openapiV2 helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(OPENAPI_V2_PROBE.path).toBe('/api/openapi/v2');
    expect(routeProbe.apiVersion).toBe('v2');
    expect(routeProbe.openapiVersion).toBe('3.1.0');
  });

  it('buildOpenApiV2Spec merges survey paths', () => {
    const spec = buildOpenApiV2Spec();
    expect(spec.paths['/api/v2/ai/oracle']).toBeTruthy();
    expect(spec.paths['/api/survey/health']).toBeTruthy();
  });
});

describe('/api/openapi/v2 e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OPENAPI_V2_PATH);
    expect(src).toContain('api/openapi/v2/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await openapiV2Route(openapiV2Request({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns v2 OpenAPI document', async () => {
    const res = await openapiV2Route(openapiV2Request({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string; info: { version: string } };
    expect(body.openapi).toBe('3.1.0');
    expect(body.info.version).toBe('v2');
  });
});