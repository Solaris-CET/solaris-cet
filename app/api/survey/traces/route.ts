import { getAllowedOrigin } from '@/api/lib/cors';
import {
  fetchSurveyTracesFromEngine,
  resolveSurveyTracesEngineUrl,
  SURVEY_TRACES_PROBE,
} from '../../lib/surveyTrace';

export {
  SURVEY_TRACES_PATH,
  SURVEY_TRACES_PROBE,
} from '../../lib/surveyTrace';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
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
        'Access-Control-Allow-Methods': SURVEY_TRACES_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const url = new URL(req.url);
  const reportId = url.searchParams.get('report_id')?.trim() || undefined;
  const traceId = url.searchParams.get('trace_id')?.trim() || undefined;
  if (!reportId && !traceId) {
    return json({ error: 'report_id or trace_id required' }, allowed, 400);
  }

  try {
    const engineUrl = resolveSurveyTracesEngineUrl();
    const data = await fetchSurveyTracesFromEngine(engineUrl, { reportId, traceId });
    return json({ platform: 'solaris-cet', ...data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}