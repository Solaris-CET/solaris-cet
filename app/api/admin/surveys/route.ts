import { promises as fs } from 'node:fs';
import path from 'node:path';

import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

const LEAD_DIR = (process.env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();
const ENGINE = process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000';

type SurveyLead = {
  receivedAt: string;
  reportId: string;
  name: string;
  telefon: string;
  email?: string;
  judet: string;
  installerId?: string;
  installerName?: string;
  score?: number;
  capacityKwp?: number;
  pdfUrl?: string;
  pdfFilename?: string;
};

async function readSurveyLeads(limit: number): Promise<SurveyLead[]> {
  const ledger = path.join(LEAD_DIR, 'surveys.jsonl');
  try {
    const raw = await fs.readFile(ledger, 'utf8');
    const lines = raw.split('\n').filter((l) => l.trim());
    const items: SurveyLead[] = [];
    for (const line of lines.slice(-limit)) {
      try {
        const d = JSON.parse(line) as Record<string, unknown>;
        items.push({
          receivedAt: String(d.receivedAt ?? ''),
          reportId: String(d.reportId ?? ''),
          name: String(d.name ?? ''),
          telefon: String(d.telefon ?? ''),
          email: d.email ? String(d.email) : undefined,
          judet: String(d.judet ?? ''),
          installerId: d.installerId ? String(d.installerId) : undefined,
          installerName: d.installerName ? String(d.installerName) : undefined,
          score: typeof d.score === 'number' ? d.score : undefined,
          capacityKwp: typeof d.capacityKwp === 'number' ? d.capacityKwp : undefined,
          pdfUrl: d.pdfUrl ? String(d.pdfUrl) : undefined,
          pdfFilename: d.pdfFilename ? String(d.pdfFilename) : undefined,
        });
      } catch {
        // skip malformed line
      }
    }
    return items.reverse();
  } catch {
    return [];
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30));
  const installerFilter = (url.searchParams.get('installer_id') || '').trim();

  const [crmLeads, engineDashboard] = await Promise.all([
    readSurveyLeads(limit * 2),
    fetch(`${ENGINE.replace(/\/$/, '')}/dashboard`, { signal: AbortSignal.timeout(8000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const filtered = installerFilter
    ? crmLeads.filter((l) => l.installerId === installerFilter)
    : crmLeads;

  const installers = [...new Set(crmLeads.map((l) => l.installerId).filter(Boolean))] as string[];

  return corsJson(req, 200, {
    crm_leads: filtered.slice(0, limit),
    total: filtered.length,
    installers,
    engine: engineDashboard,
  });
}