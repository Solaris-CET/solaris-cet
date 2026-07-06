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

type CorrectionPayload = {
  report_id?: string;
  field?: string;
  original?: string;
  corrected?: string;
  technician?: string;
  notes?: string;
};

export default async function handler(req: Request): Promise<Response> {
  const allowed = getAllowedOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Installer-Key',
        Vary: 'Origin',
      },
    });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const reportId = (url.searchParams.get('report_id') || '').trim();
    const qs = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
    try {
      const res = await fetch(`${ENGINE.replace(/\/$/, '')}/corrections${qs}`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (!res.ok) return json({ error: 'Corrections unavailable' }, allowed, 502);
      return json({ platform: 'solaris-cet', ...data }, allowed, 200);
    } catch {
      return json({ error: 'survey-engine unreachable' }, allowed, 503);
    }
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  let body: CorrectionPayload;
  try {
    body = (await req.json()) as CorrectionPayload;
  } catch {
    return json({ error: 'JSON invalid' }, allowed, 400);
  }

  const reportId = typeof body.report_id === 'string' ? body.report_id.trim() : '';
  const field = typeof body.field === 'string' ? body.field.trim() : '';
  const corrected = typeof body.corrected === 'string' ? body.corrected.trim() : '';
  if (!reportId || !field || !corrected) {
    return json({ error: 'Câmpuri obligatorii: report_id, field, corrected' }, allowed, 400);
  }

  const installerKey = req.headers.get('x-installer-key') || '';

  try {
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/corrections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(installerKey ? { 'X-Installer-Key': installerKey } : {}),
      },
      body: JSON.stringify({
        report_id: reportId,
        field,
        original: typeof body.original === 'string' ? body.original : '',
        corrected,
        technician: typeof body.technician === 'string' ? body.technician : '',
        notes: typeof body.notes === 'string' ? body.notes : '',
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!res.ok) {
      return json({ error: data.detail || 'Correction failed' }, allowed, res.status === 400 ? 400 : 502);
    }
    return json({ platform: 'solaris-cet', ...data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}