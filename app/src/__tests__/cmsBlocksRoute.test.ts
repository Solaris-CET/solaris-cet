// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CMS_BLOCKS_PATH,
  CMS_BLOCKS_PROBE,
  isValidCmsBlocksKeys,
  parseCmsBlocksKeys,
  parseCmsBlocksLocale,
} from '../../api/lib/cmsBlocks';

const blocksMocks = vi.hoisted(() => ({
  rows: [
    { key: 'hero.title', format: 'plain', content: 'Solaris CET' },
    { key: 'hero.subtitle', format: 'markdown', content: '**Energie**' },
  ],
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
            where() {
              return {
                limit: async () => blocksMocks.rows,
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    cmsBlocks: { key: 'cmsBlocks.key', locale: 'cmsBlocks.locale' },
  },
}));

import cmsBlocksRoute, { CMS_BLOCKS_PROBE as routeProbe } from '../../api/cms/blocks/route';

function blocksRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CMS_BLOCKS_PATH}${query}`, { ...init, headers });
}

describe('cmsBlocks helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CMS_BLOCKS_PROBE.path).toBe('/api/cms/blocks');
    expect(routeProbe.maxKeys).toBe(50);
    expect(routeProbe.defaultLocale).toBe('ro');
  });

  it('parseCmsBlocksKeys and isValidCmsBlocksKeys', () => {
    const keys = parseCmsBlocksKeys(new URLSearchParams('keys=hero.title, hero.subtitle'));
    expect(keys).toEqual(['hero.title', 'hero.subtitle']);
    expect(isValidCmsBlocksKeys(keys)).toBe(true);
    expect(isValidCmsBlocksKeys([])).toBe(false);
  });

  it('parseCmsBlocksLocale defaults to ro', () => {
    expect(parseCmsBlocksLocale(new URLSearchParams())).toBe('ro');
  });
});

describe('/api/cms/blocks e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CMS_BLOCKS_PATH);
    expect(src).toContain('api/cms/blocks/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await cmsBlocksRoute(blocksRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without keys returns 400', async () => {
    const res = await cmsBlocksRoute(blocksRequest('?locale=ro', { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(CMS_BLOCKS_PROBE.missingKeysError);
  });

  it('GET returns blocks map', async () => {
    const res = await cmsBlocksRoute(blocksRequest('?locale=ro&keys=hero.title,hero.subtitle', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string; blocks: Record<string, { content: string }> };
    expect(body.locale).toBe('ro');
    expect(body.blocks['hero.title']?.content).toBe('Solaris CET');
  });

  it('POST returns 405', async () => {
    const res = await cmsBlocksRoute(blocksRequest('?keys=hero.title', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});