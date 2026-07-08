// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinExecuteEngineBody,
  parseSurveyTwinExecuteBody,
  SURVEY_TWIN_AGENT_EXECUTE_PATH,
  SURVEY_TWIN_AGENT_EXECUTE_PROBE,
} from '../../api/lib/surveyTwinAgentExecute';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/surveyWebhook', () => ({
  dispatchSurveyWebhook: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/twinWebhook', () => ({
  dispatchTwinWebhook: vi.fn(async () => undefined),
}));

import surveyTwinAgentExecuteRoute, { SURVEY_TWIN_AGENT_EXECUTE_PROBE as routeProbe } from '../../api/survey/twin-agent/execute/route';

function executeRequest(reportId: string, body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SURVEY_TWIN_AGENT_EXECUTE_PATH}?report_id=${encodeURIComponent(reportId)}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('surveyTwinAgentExecute helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_AGENT_EXECUTE_PROBE.path).toBe('/api/survey/twin-agent/execute');
    expect(routeProbe.surveyWebhookEvent).toBe('agent_action');
  });

  it('parseSurveyTwinExecuteBody validates action fields', () => {
    expect(parseSurveyTwinExecuteBody({ action_id: 'a1', action_type: 'approve' })?.actionId).toBe('a1');
    expect(parseSurveyTwinExecuteBody({ action_id: 'a1' })).toBeNull();
  });

  it('buildSurveyTwinExecuteEngineBody maps payload', () => {
    const parsed = parseSurveyTwinExecuteBody({ action_id: 'a1', action_type: 'approve', detail: 'ok' })!;
    expect(buildSurveyTwinExecuteEngineBody(parsed)).toEqual({
      action_id: 'a1',
      action_type: 'approve',
      executed_by: 'technician',
      detail: 'ok',
    });
  });
});

describe('/api/survey/twin-agent/execute e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_AGENT_EXECUTE_PATH);
    expect(src).toContain('api/survey/twin-agent/execute/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyTwinAgentExecuteRoute(
      new Request(`http://test${SURVEY_TWIN_AGENT_EXECUTE_PATH}?report_id=rpt-1`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
  });

  it('POST without action fields returns 400', async () => {
    const res = await surveyTwinAgentExecuteRoute(executeRequest('rpt-1', { action_id: 'a1' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_AGENT_EXECUTE_PROBE.requiredActionFieldsError);
  });

  it('POST executes twin agent action', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, status: 'executed' }),
    });
    const res = await surveyTwinAgentExecuteRoute(
      executeRequest('rpt-1', { action_id: 'a1', action_type: 'approve' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; ok: boolean };
    expect(body.platform).toBe('solaris-cet');
    expect(body.ok).toBe(true);
  });

  it('POST returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinAgentExecuteRoute(
      executeRequest('rpt-1', { action_id: 'a1', action_type: 'approve' }),
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_AGENT_EXECUTE_PROBE.unreachableError);
  });
});