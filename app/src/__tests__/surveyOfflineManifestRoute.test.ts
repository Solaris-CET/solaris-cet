// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyOfflineManifest,
  buildSurveyOfflineManifestResponse,
  SURVEY_OFFLINE_MANIFEST_PATH,
  SURVEY_OFFLINE_MANIFEST_PROBE,
  SURVEY_OFFLINE_SCHEMA,
} from '../../api/lib/surveyOfflineManifest';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyOfflineManifestRoute, { SURVEY_OFFLINE_MANIFEST_PROBE as routeProbe } from '../../api/survey/offline-manifest/route';

function offlineManifestRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_OFFLINE_MANIFEST_PATH}`, { method: 'GET', ...init, headers });
}

describe('surveyOfflineManifest helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_OFFLINE_MANIFEST_PROBE.path).toBe('/api/survey/offline-manifest');
    expect(routeProbe.offlineHintsPath).toBe('/offline-hints');
  });

  it('buildSurveyOfflineManifest uses default schema', () => {
    expect(buildSurveyOfflineManifest().schema).toBe(SURVEY_OFFLINE_SCHEMA);
    expect(buildSurveyOfflineManifest().queue_supported).toBe(true);
  });

  it('buildSurveyOfflineManifestResponse wraps manifest', () => {
    const manifest = buildSurveyOfflineManifest();
    expect(buildSurveyOfflineManifestResponse(manifest).platform).toBe('solaris-cet');
  });
});

describe('/api/survey/offline-manifest e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_OFFLINE_MANIFEST_PATH);
    expect(src).toContain('api/survey/offline-manifest/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyOfflineManifestRoute(offlineManifestRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns offline manifest without engine hints', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyOfflineManifestRoute(offlineManifestRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; manifest: { schema: string } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.manifest.schema).toBe(SURVEY_OFFLINE_SCHEMA);
  });

  it('GET merges engine hints when available', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ schema: 'engine-schema-v2', max_queue_items: 30 }),
    });
    const res = await surveyOfflineManifestRoute(offlineManifestRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { manifest: { schema: string; max_queue_items: number } };
    expect(body.manifest.schema).toBe('engine-schema-v2');
    expect(body.manifest.max_queue_items).toBe(30);
  });
});