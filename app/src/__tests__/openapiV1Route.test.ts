// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildOpenApiV1Spec, OPENAPI_V1_PATH, OPENAPI_V1_PROBE } from '../../api/lib/openapiV1';
import openapiV1Route, { OPENAPI_V1_PROBE as routeProbe } from '../../api/openapi/v1/route';

function openapiV1Request(init: RequestInit = {}): Request {
  return new Request(`http://test${OPENAPI_V1_PATH}`, { ...init });
}

describe('openapiV1 helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(OPENAPI_V1_PROBE.path).toBe('/api/openapi/v1');
    expect(routeProbe.apiVersion).toBe('v1');
    expect(routeProbe.openapiVersion).toBe('3.0.3');
  });

  it('buildOpenApiV1Spec documents v1 price endpoint', () => {
    const spec = buildOpenApiV1Spec();
    expect(spec.info.version).toBe('v1');
    expect(spec.paths['/api/v1/price']).toBeTruthy();
    expect(spec.paths['/api/v1/webhooks']).toBeTruthy();
  });
});

describe('/api/openapi/v1 e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(OPENAPI_V1_PATH);
    expect(src).toContain('api/openapi/v1/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await openapiV1Route(openapiV1Request({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns v1 OpenAPI document', async () => {
    const res = await openapiV1Route(openapiV1Request({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string; info: { version: string } };
    expect(body.openapi).toBe('3.0.3');
    expect(body.info.version).toBe('v1');
  });
});