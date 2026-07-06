import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/demo`, {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json().catch(() => ({ error: 'Invalid engine response' }));
    if (!res.ok) {
      return json({ error: 'Engine demo failed', engine_url: ENGINE }, allowed, res.status);
    }

    const payload = data as { report_id: string; pdf_path: string; score: number };
    const pdfFilename = payload.pdf_path.split(/[/\\]/).pop() || `RAPORT_${payload.report_id}.pdf`;

    let orchestration: Record<string, unknown> | undefined;
    try {
      const orchRes = await fetch(
        `${ENGINE.replace(/\/$/, '')}/orchestrate/${encodeURIComponent(payload.report_id)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (orchRes.ok) {
        orchestration = (await orchRes.json()) as Record<string, unknown>;
      }
    } catch {
      /* orchestration optional */
    }

    return json(
      {
        report_id: payload.report_id,
        pdf_filename: pdfFilename,
        ahj_filename: `AHJ_${payload.report_id}.json`,
        score: payload.score,
        verdict: 'Demo — date sample',
        capacity_kwp: 6,
        annual_kwh: 7200,
        routing_reason: 'demo/sample-data',
        cost_usd: 0,
        pdf_url: `/api/survey/files?file=${encodeURIComponent(pdfFilename)}`,
        ahj_url: `/api/survey/files?file=${encodeURIComponent(`AHJ_${payload.report_id}.json`)}`,
        orchestration,
        demo: true,
      },
      allowed,
      200,
    );
  } catch {
    return json({ error: 'survey-engine unreachable', engine_url: ENGINE }, allowed, 503);
  }
}