// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinAgentDecisionsEngineUrl,
  parseSurveyTwinLimit,
  SURVEY_TWIN_AGENT_DECISIONS_PATH,
  SURVEY_TWIN_AGENT_DECISIONS_PROBE,
} from '../../api/lib/surveyTwinAgentDecisions';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinAgentDecisionsRoute, { SURVEY_TWIN_AGENT_DECISIONS_PROBE as routeProbe } from '../../api/survey/twin-agent/decisions/route';

function decisionsRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_TWIN_AGENT_DECISIONS_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinAgentDecisions helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_AGENT_DECISIONS_PROBE.path).toBe('/api/survey/twin-agent/decisions');
    expect(routeProbe.limitParam).toBe('limit');
  });

  it('parseSurveyTwinLimit clamps values', () => {
    expect(parseSurveyTwinLimit(null)).toBe(50);
    expect(parseSurveyTwinLimit('500')).toBe(200);
    expect(parseSurveyTwinLimit('10')).toBe(10);
  });

  it('buildSurveyTwinAgentDecisionsEngineUrl includes query params', () => {
    expect(buildSurveyTwinAgentDecisionsEngineUrl('http://engine.test', 25, 'rpt-1')).toBe(
      'http://engine.test/twin-agent/decisions?limit=25&report_id=rpt-1',
    );
  });
});

describe('/api/survey/twin-agent/decisions e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_AGENT_DECISIONS_PATH);
    expect(src).toContain('api/survey/twin-agent/decisions/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyTwinAgentDecisionsRoute(decisionsRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns decisions from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ decisions: [{ id: 'd1' }] }),
    });
    const res = await surveyTwinAgentDecisionsRoute(decisionsRequest('?limit=10&report_id=rpt-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; decisions: unknown[] };
    expect(body.platform).toBe('solaris-cet');
    expect(body.decisions).toHaveLength(1);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinAgentDecisionsRoute(decisionsRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_AGENT_DECISIONS_PROBE.unreachableError);
  });
});