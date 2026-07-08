import { promises as fs } from 'node:fs';
import path from 'node:path';

import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_SURVEYS_AUTH_GUARD,
  ADMIN_SURVEYS_PROBE,
  buildAdminSurveysError,
  leadStorageDir,
  logAdminSurveysEvent,
  parseAdminSurveysQuery,
  parseSurveyLeadLine,
  surveyDashboardUrl,
  type SurveyLead,
} from '../../lib/adminSurveys';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_SURVEYS_AUTH_GUARD,
  ADMIN_SURVEYS_OPENAPI,
  ADMIN_SURVEYS_PATH,
  ADMIN_SURVEYS_PROBE,
} from '../../lib/adminSurveys';

export const config = { runtime: 'nodejs' };

async function readSurveyLeads(limit: number): Promise<SurveyLead[]> {
  const ledger = path.join(leadStorageDir(), 'surveys.jsonl');
  try {
    const raw = await fs.readFile(ledger, 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim());
    const items: SurveyLead[] = [];
    for (const line of lines.slice(-limit)) {
      const lead = parseSurveyLeadLine(line);
      if (lead) items.push(lead);
    }
    return items.reverse();
  } catch {
    return [];
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) {
    return corsJson(req, ADMIN_SURVEYS_PROBE.forbiddenStatus, buildAdminSurveysError(ADMIN_SURVEYS_PROBE.forbiddenError));
  }
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') {
    return corsJson(req, 405, buildAdminSurveysError(ADMIN_SURVEYS_PROBE.methodNotAllowedError));
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_SURVEYS_PROBE.rateLimitKey,
    limit: ADMIN_SURVEYS_PROBE.rateLimit,
    windowSeconds: ADMIN_SURVEYS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, ADMIN_SURVEYS_AUTH_GUARD);
  if ('error' in ctx) {
    logAdminSurveysEvent('error', { status: ctx.status, reason: 'auth' });
    return corsJson(req, ctx.status, buildAdminSurveysError(ctx.error));
  }

  const { limit, installerId: installerFilter } = parseAdminSurveysQuery(new URL(req.url).searchParams);
  logAdminSurveysEvent('request', { limit, installerFilter: installerFilter || null, adminId: ctx.admin.id });

  const [crmLeads, engineDashboard] = await Promise.all([
    readSurveyLeads(limit * 2),
    fetch(surveyDashboardUrl(), { signal: AbortSignal.timeout(ADMIN_SURVEYS_PROBE.fetchTimeoutMs) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const filtered = installerFilter
    ? crmLeads.filter((l) => l.installerId === installerFilter)
    : crmLeads;

  const installers = [...new Set(crmLeads.map((l) => l.installerId).filter(Boolean))] as string[];

  logAdminSurveysEvent('success', { total: filtered.length, adminId: ctx.admin.id });

  return corsJson(req, 200, {
    crm_leads: filtered.slice(0, limit),
    total: filtered.length,
    installers,
    engine: engineDashboard,
  });
}