import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildSurveyBatchEngineUrl,
  buildSurveyBatchSuccessPayload,
  buildSurveyBatchUnreachablePayload,
  isSurveyBatchMultipartContentType,
  resolveSurveyBatchEngineUrl,
  SURVEY_BATCH_PROBE,
  type SurveyBatchEnginePayload,
} from '../../lib/surveyBatch';

export { SURVEY_BATCH_PATH, SURVEY_BATCH_PROBE } from '@/api/lib/surveyBatch';

export const config = { runtime: 'nodejs' };

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': SURVEY_BATCH_PROBE.cacheControl,
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
        'Access-Control-Allow-Methods': SURVEY_BATCH_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': SURVEY_BATCH_PROBE.allowHeaders,
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const contentType = req.headers.get('content-type') || '';
  if (!isSurveyBatchMultipartContentType(contentType)) {
    return json({ error: SURVEY_BATCH_PROBE.invalidContentTypeError }, allowed, 415);
  }

  const engineUrl = resolveSurveyBatchEngineUrl();

  try {
    const incoming = await req.formData();
    const engineForm = new FormData();
    for (const [key, value] of incoming.entries()) {
      engineForm.append(key, value);
    }

    const installerKey = req.headers.get('x-installer-key');
    const res = await fetch(buildSurveyBatchEngineUrl(engineUrl), {
      method: 'POST',
      headers: installerKey ? { [SURVEY_BATCH_PROBE.installerKeyHeader]: installerKey } : undefined,
      body: engineForm,
      signal: AbortSignal.timeout(SURVEY_BATCH_PROBE.fetchTimeoutMs),
    });

    const data = await res.json().catch(() => ({ error: SURVEY_BATCH_PROBE.invalidEngineResponseError }));
    if (!res.ok) {
      return json(
        {
          error: (data as { detail?: string }).detail || SURVEY_BATCH_PROBE.engineBatchErrorFallback,
          engine_url: engineUrl,
        },
        allowed,
        res.status,
      );
    }

    return json(buildSurveyBatchSuccessPayload(data as SurveyBatchEnginePayload), allowed, 200);
  } catch {
    return json(buildSurveyBatchUnreachablePayload(engineUrl), allowed, 503);
  }
}