import { getAllowedOrigin } from '../../lib/cors';
import { buildSurveyOfflineManifest } from '../../lib/surveyOfflineManifest';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

function json(body: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': 'public, max-age=300',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  let engineHints: Record<string, unknown> = {};
  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/offline-hints`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      engineHints = (await res.json()) as Record<string, unknown>;
    }
  } catch {
    void 0;
  }

  const manifest = buildSurveyOfflineManifest(
    engineHints.schema ? (engineHints as Parameters<typeof buildSurveyOfflineManifest>[0]) : undefined,
  );

  return json({ platform: 'solaris-cet', manifest }, allowed, 200);
}