// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyInstallerMeEngineUrl,
  buildSurveyInstallerMeSuccessPayload,
  SURVEY_INSTALLER_ME_PATH,
  SURVEY_INSTALLER_ME_PROBE,
  surveyInstallerMeHttpStatus,
} from '../../api/lib/surveyInstallerMe';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyInstallerMeRoute, { SURVEY_INSTALLER_ME_PROBE as routeProbe } from '../../api/survey/installer/me/route';

function installerMeRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_INSTALLER_ME_PATH}`, { method: 'GET', ...init, headers });
}

describe('surveyInstallerMe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_INSTALLER_ME_PROBE.path).toBe('/api/survey/installer/me');
    expect(routeProbe.installerKeyHeader).toBe('X-Installer-Key');
  });

  it('buildSurveyInstallerMeEngineUrl points to installer profile', () => {
    expect(buildSurveyInstallerMeEngineUrl('http://engine.test/')).toBe('http://engine.test/installer/me');
  });

  it('buildSurveyInstallerMeSuccessPayload adds platform', () => {
    expect(buildSurveyInstallerMeSuccessPayload({ id: 'inst-1', name: 'Solar Tech' })).toEqual({
      platform: 'solaris-cet',
      id: 'inst-1',
      name: 'Solar Tech',
    });
  });

  it('surveyInstallerMeHttpStatus preserves unauthorized', () => {
    expect(surveyInstallerMeHttpStatus(401)).toBe(401);
    expect(surveyInstallerMeHttpStatus(500)).toBe(502);
  });
});

describe('/api/survey/installer/me e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_INSTALLER_ME_PATH);
    expect(src).toContain('api/survey/installer/me/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyInstallerMeRoute(installerMeRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns installer profile from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'inst-1', name: 'Solar Tech' }),
    });
    const res = await surveyInstallerMeRoute(
      installerMeRequest({ headers: { 'X-Installer-Key': 'secret-key' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; id: string };
    expect(body.platform).toBe('solaris-cet');
    expect(body.id).toBe('inst-1');
  });

  it('GET returns 401 when engine rejects key', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid installer key' }),
    });
    const res = await surveyInstallerMeRoute(installerMeRequest());
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid installer key');
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyInstallerMeRoute(installerMeRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_INSTALLER_ME_PROBE.unreachableError);
  });
});