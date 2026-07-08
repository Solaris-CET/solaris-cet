import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyPermitPackEngineUrl,
  buildSurveyPermitPackFilename,
  buildSurveyPermitPackUnreachablePayload,
  parseSurveyPermitPackReportId,
  resolveSurveyPermitPackEngineUrl,
  SURVEY_PERMIT_PACK_PROBE,
  surveyPermitPackErrorMessage,
  surveyPermitPackHttpStatus,
} from '../../lib/surveyPermitPack';

export { SURVEY_PERMIT_PACK_PATH, SURVEY_PERMIT_PACK_PROBE } from '@/api/lib/surveyPermitPack';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': SURVEY_PERMIT_PACK_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const url = new URL(req.url);
  const reportId = parseSurveyPermitPackReportId(url.searchParams.get(SURVEY_PERMIT_PACK_PROBE.reportIdParam));
  if (!reportId) {
    return new Response(JSON.stringify({ error: SURVEY_PERMIT_PACK_PROBE.missingReportIdError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }

  const engineUrl = resolveSurveyPermitPackEngineUrl();

  try {
    const res = await fetch(buildSurveyPermitPackEngineUrl(engineUrl, reportId), {
      signal: AbortSignal.timeout(SURVEY_PERMIT_PACK_PROBE.fetchTimeoutMs),
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: surveyPermitPackErrorMessage(err) }), {
        status: surveyPermitPackHttpStatus(res.status),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
      });
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': SURVEY_PERMIT_PACK_PROBE.zipMediaType,
        'Content-Disposition': `attachment; filename="${buildSurveyPermitPackFilename(reportId)}"`,
        'Access-Control-Allow-Origin': allowed,
        Vary: 'Origin',
        'Cache-Control': SURVEY_PERMIT_PACK_PROBE.cacheControl,
      },
    });
  } catch {
    return new Response(JSON.stringify(buildSurveyPermitPackUnreachablePayload()), {
      status: SURVEY_PERMIT_PACK_PROBE.unreachableStatus,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' },
    });
  }
}