import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyDemoEngineUrl,
  buildSurveyDemoOrchestrateUrl,
  buildSurveyDemoSuccessPayload,
  buildSurveyDemoUnreachablePayload,
  extractSurveyDemoPdfFilename,
  resolveSurveyDemoEngineUrl,
  SURVEY_DEMO_PROBE,
  type SurveyDemoEnginePayload,
} from '../../lib/surveyDemo';

export { SURVEY_DEMO_PATH, SURVEY_DEMO_PROBE } from '@/api/lib/surveyDemo';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_DEMO_PROBE.cacheControl,
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_DEMO_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const engineUrl = resolveSurveyDemoEngineUrl();

  try {
    const res = await fetch(buildSurveyDemoEngineUrl(engineUrl), {
      method: 'POST',
      signal: AbortSignal.timeout(SURVEY_DEMO_PROBE.fetchTimeoutMs),
    });
    const data = await res.json().catch(() => ({ error: SURVEY_DEMO_PROBE.invalidEngineResponseError }));
    if (!res.ok) {
      return json({ error: SURVEY_DEMO_PROBE.engineDemoFailedError, engine_url: engineUrl }, allowed, res.status);
    }

    const payload = data as SurveyDemoEnginePayload;
    const pdfFilename = extractSurveyDemoPdfFilename(payload.pdf_path, payload.report_id);

    let orchestration: Record<string, unknown> | undefined;
    try {
      const orchRes = await fetch(buildSurveyDemoOrchestrateUrl(engineUrl, payload.report_id), {
        signal: AbortSignal.timeout(SURVEY_DEMO_PROBE.orchestrateTimeoutMs),
      });
      if (orchRes.ok) {
        orchestration = (await orchRes.json()) as Record<string, unknown>;
      }
    } catch {
      void 0;
    }

    return json(
      buildSurveyDemoSuccessPayload({
        reportId: payload.report_id,
        pdfFilename,
        score: payload.score,
        orchestration,
      }),
      allowed,
      200,
    );
  } catch {
    return json(buildSurveyDemoUnreachablePayload(engineUrl), allowed, SURVEY_DEMO_PROBE.unreachableStatus);
  }
}