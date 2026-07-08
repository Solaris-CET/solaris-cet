// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CMS_MEDIA_PATH,
  CMS_MEDIA_PROBE,
  decodeCmsMediaBase64,
  parseCmsMediaId,
} from '../../api/lib/cmsMedia';

const mediaMocks = vi.hoisted(() => ({
  asset: {
    id: 'asset-1',
    mimeType: 'image/png',
    dataBase64: Buffer.from('PNGDATA').toString('base64'),
  },
  found: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => (mediaMocks.found ? [mediaMocks.asset] : []),
          };
        },
      };
    },
  }),
  schema: {
    cmsAssets: { id: 'cmsAssets.id' },
  },
}));

import cmsMediaRoute, { CMS_MEDIA_PROBE as routeProbe } from '../../api/media/route';

function mediaRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CMS_MEDIA_PATH}${query}`, { ...init, headers });
}

describe('cmsMedia helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CMS_MEDIA_PROBE.path).toBe('/api/media');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.queryParam).toBe('id');
  });

  it('parseCmsMediaId reads query param', () => {
    expect(parseCmsMediaId(new URL('http://test/api/media?id=asset-1'))).toBe('asset-1');
    expect(parseCmsMediaId(new URL('http://test/api/media'))).toBeNull();
  });

  it('decodeCmsMediaBase64 decodes bytes', () => {
    const encoded = Buffer.from('hello').toString('base64');
    const bytes = decodeCmsMediaBase64(encoded);
    expect(Buffer.from(bytes).toString('utf8')).toBe('hello');
  });
});

describe('/api/media e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mediaMocks.found = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CMS_MEDIA_PATH);
    expect(src).toContain('api/media/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cmsMediaRoute(mediaRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without id returns 400', async () => {
    const res = await cmsMediaRoute(mediaRequest('', { method: 'GET' }));
    expect(res.status).toBe(400);
    expect(await res.text()).toBe(CMS_MEDIA_PROBE.missingIdError);
  });

  it('GET returns asset bytes', async () => {
    const res = await cmsMediaRoute(mediaRequest('?id=asset-1', { method: 'GET' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Cache-Control')).toBe(CMS_MEDIA_PROBE.cacheControl);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString('utf8')).toBe('PNGDATA');
  });

  it('GET missing asset returns 404', async () => {
    mediaMocks.found = false;
    const res = await cmsMediaRoute(mediaRequest('?id=missing', { method: 'GET' }));
    expect(res.status).toBe(404);
    expect(await res.text()).toBe(CMS_MEDIA_PROBE.notFoundError);
  });
});