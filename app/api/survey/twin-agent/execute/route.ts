import { getAllowedOrigin } from '../../../lib/cors';
import { dispatchSurveyWebhook } from '../../../lib/surveyWebhook';
import { dispatchTwinWebhook } from '../../../lib/twinWebhook';

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

  const url = new URL(req.url);
  const reportId = (url.searchParams.get('report_id') || '').trim();
  if (!reportId || reportId.length > 80) {
    return json({ error: 'report_id required' }, allowed, 400);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'JSON invalid' }, allowed, 400);
  }

  const actionId = String(body.action_id ?? '').trim();
  const actionType = String(body.action_type ?? '').trim();
  if (!actionId || !actionType) {
    return json({ error: 'action_id and action_type required' }, allowed, 400);
  }

  const installerKey = req.headers.get('x-installer-key') ?? '';

  try {
    const res = await fetch(
      `${ENGINE.replace(/\/$/, '')}/twin-agent/${encodeURIComponent(reportId)}/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(installerKey ? { 'X-Installer-Key': installerKey } : {}),
        },
        body: JSON.stringify({
          action_id: actionId,
          action_type: actionType,
          executed_by: body.executed_by ?? 'technician',
          detail: body.detail ?? '',
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return json(
        { error: (data as { detail?: string }).detail || 'Twin agent execute failed' },
        allowed,
        res.status === 400 ? 400 : 502,
      );
    }

    void dispatchSurveyWebhook({
      event: 'agent_action',
      report_id: reportId,
      action_id: actionId,
      action_type: actionType,
    });
    void dispatchTwinWebhook({
      event: 'agent_action',
      report_id: reportId,
      action_id: actionId,
      action_type: actionType,
    });

    return json({ platform: 'solaris-cet', ...data }, allowed, 200);
  } catch {
    return json({ error: 'survey-engine unreachable' }, allowed, 503);
  }
}