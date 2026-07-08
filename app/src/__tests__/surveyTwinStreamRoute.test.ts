// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinStreamEngineUrl,
  parseSurveyTwinStreamPersistent,
  SURVEY_TWIN_STREAM_PATH,
  SURVEY_TWIN_STREAM_PROBE,
} from '../../api/lib/surveyTwinStream';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinStreamRoute, { SURVEY_TWIN_STREAM_PROBE as routeProbe } from '../../api/survey/twin-stream/route';

function streamRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_TWIN_STREAM_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinStream helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_STREAM_PROBE.path).toBe('/api/survey/twin-stream');
    expect(routeProbe.sseContentType).toBe('text/event-stream');
  });

  it('parseSurveyTwinStreamPersistent detects truthy values', () => {
    expect(parseSurveyTwinStreamPersistent('true')).toBe(true);
    expect(parseSurveyTwinStreamPersistent('no')).toBe(false);
  });

  it('buildSurveyTwinStreamEngineUrl adds persistent query', () => {
    expect(buildSurveyTwinStreamEngineUrl('http://engine.test', 'rpt-1', false)).toBe('http://engine.test/twin-stream/rpt-1');
    expect(buildSurveyTwinStreamEngineUrl('http://engine.test', 'rpt-1', true)).toBe(
      'http://engine.test/twin-stream/rpt-1?persistent=true',
    );
  });
});

describe('/api/survey/twin-stream e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_STREAM_PATH);
    expect(src).toContain('api/survey/twin-stream/route.js');
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyTwinStreamRoute(streamRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_STREAM_PROBE.missingReportIdError);
  });

  it('GET proxies SSE body from engine', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"ok":true}\n\n'));
        controller.close();
      },
    });
    fetchMock.mockResolvedValueOnce({ ok: true, body: stream });
    const res = await surveyTwinStreamRoute(streamRequest('?report_id=rpt-1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinStreamRoute(streamRequest('?report_id=rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_STREAM_PROBE.unreachableError);
  });
});