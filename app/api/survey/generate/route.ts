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
        'Access-Control-Allow-Headers': 'Content-Type, X-Installer-Key',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, allowed, 405);
  }

  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, allowed, 415);
  }

  try {
    const incoming = await req.formData();
    const engineForm = new FormData();
    for (const [key, value] of incoming.entries()) {
      engineForm.append(key, value);
    }

    const installerKey = req.headers.get('x-installer-key');
    const res = await fetch(`${ENGINE.replace(/\/$/, '')}/generate`, {
      method: 'POST',
      headers: installerKey ? { 'X-Installer-Key': installerKey } : undefined,
      body: engineForm,
      signal: AbortSignal.timeout(300_000),
    });

    const data = await res.json().catch(() => ({ error: 'Invalid engine response' }));
    if (!res.ok) {
      return json({ error: (data as { detail?: string }).detail || 'Engine error', engine_url: ENGINE }, allowed, res.status);
    }

    const payload = data as {
      report_id: string;
      pdf_filename: string;
      ahj_filename: string;
      score: number;
      verdict: string;
      capacity_kwp: number;
      annual_kwh: number;
      routing_reason: string;
      cost_usd: number;
      installer_id?: string;
    };

    return json(
      {
        ...payload,
        pdf_url: `/api/survey/files?file=${encodeURIComponent(payload.pdf_filename)}`,
        ahj_url: `/api/survey/files?file=${encodeURIComponent(payload.ahj_filename)}`,
      },
      allowed,
      200,
    );
  } catch {
    return json({ error: 'survey-engine unreachable', engine_url: ENGINE }, allowed, 503);
  }
}