import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const reportId = (url.searchParams.get('report_id') || '').trim();
  if (!reportId) return corsJson(req, 400, { error: 'report_id required' });

  const base = ENGINE.replace(/\/$/, '');
  const [contextRes, twinRes, corrRes] = await Promise.all([
    fetch(`${base}/context/${encodeURIComponent(reportId)}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/twin-feed/${encodeURIComponent(reportId)}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/corrections?report_id=${encodeURIComponent(reportId)}`, { signal: AbortSignal.timeout(8000) }),
  ]);

  if (!contextRes.ok) {
    return corsJson(req, contextRes.status === 404 ? 404 : 502, { error: 'Report not found' });
  }

  const context = await contextRes.json();
  const twin = twinRes.ok ? await twinRes.json() : null;
  const corrections = corrRes.ok ? await corrRes.json() : { corrections: [] };

  const lowConfidence = (context.explainable?.low_confidence_count ?? twin?.low_confidence_count ?? 0) as number;

  return corsJson(req, 200, {
    report_id: reportId,
    context,
    twin_feed: twin,
    corrections: corrections.corrections ?? [],
    flags: {
      low_confidence: lowConfidence > 0,
      low_confidence_count: lowConfidence,
      permit_pack_url: context.files?.permit_pack_url,
      context_url: context.crm?.context_url,
    },
  });
}