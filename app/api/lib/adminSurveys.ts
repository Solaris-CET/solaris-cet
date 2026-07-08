import { z } from 'zod';

import type { AdminRouteGuardProbe } from './adminAuth';
import { logApiRouteEvent } from './apiObservability';

export const ADMIN_SURVEYS_PATH = '/api/admin/surveys';
export const ADMIN_SURVEYS_METHODS = 'GET, OPTIONS';

export const ADMIN_SURVEYS_PROBE = {
  path: ADMIN_SURVEYS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  unauthorizedError: 'Unauthorized' as const,
  forbiddenStatus: 403,
  forbiddenError: 'Forbidden' as const,
  methodNotAllowedError: 'Method not allowed' as const,
  defaultLimit: 30,
  minLimit: 1,
  maxLimit: 100,
  maxInstallerIdLength: 80,
  fetchTimeoutMs: 8000,
  platform: 'solaris-cet' as const,
  rateLimitKey: 'admin-surveys' as const,
  rateLimit: 60,
  rateWindowSeconds: 60,
  observabilityLabel: 'admin.surveys' as const,
};

export const ADMIN_SURVEYS_AUTH_GUARD: AdminRouteGuardProbe = {
  minRole: ADMIN_SURVEYS_PROBE.minRole,
  unauthenticatedStatus: ADMIN_SURVEYS_PROBE.unauthenticatedStatus,
  unauthorizedError: ADMIN_SURVEYS_PROBE.unauthorizedError,
  forbiddenStatus: ADMIN_SURVEYS_PROBE.forbiddenStatus,
  forbiddenError: ADMIN_SURVEYS_PROBE.forbiddenError,
};

export const ADMIN_SURVEYS_OPENAPI = {
  path: ADMIN_SURVEYS_PATH,
  method: 'get' as const,
  tag: 'admin-survey' as const,
  summary: 'Admin survey leads list with engine dashboard stats',
};

function normalizeAdminSurveysLimit(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || raw.trim() === '') return ADMIN_SURVEYS_PROBE.defaultLimit;
  const limit = Number(raw);
  if (!Number.isFinite(limit)) return ADMIN_SURVEYS_PROBE.defaultLimit;
  return Math.min(ADMIN_SURVEYS_PROBE.maxLimit, Math.max(ADMIN_SURVEYS_PROBE.minLimit, Math.floor(limit)));
}

export const adminSurveysQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((raw) => normalizeAdminSurveysLimit(raw ?? null)),
  installer_id: z
    .string()
    .trim()
    .max(ADMIN_SURVEYS_PROBE.maxInstallerIdLength)
    .optional()
    .transform((raw) => raw ?? ''),
});

export type AdminSurveysQuery = z.infer<typeof adminSurveysQuerySchema>;

export type SurveyLead = {
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

export function parseAdminSurveysQuery(searchParams: URLSearchParams): { limit: number; installerId: string } {
  const parsed = adminSurveysQuerySchema.parse({
    limit: searchParams.get('limit') ?? undefined,
    installer_id: searchParams.get('installer_id') ?? undefined,
  });
  return {
    limit: parsed.limit,
    installerId: parsed.installer_id,
  };
}

export function buildAdminSurveysError(error: string): { error: string } {
  return { error };
}

export function logAdminSurveysEvent(
  event: 'request' | 'success' | 'error',
  meta: Record<string, unknown> = {},
): void {
  logApiRouteEvent(ADMIN_SURVEYS_PROBE.observabilityLabel, event, meta);
}

export function surveyEngineBaseUrl(): string {
  return (process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export function surveyDashboardUrl(): string {
  return `${surveyEngineBaseUrl()}/dashboard`;
}

export function leadStorageDir(): string {
  return (process.env.LEAD_STORAGE_DIR || '/data/solaris-cet/leads').trim();
}

export function parseAdminSurveysLimit(searchParams: URLSearchParams): number {
  return parseAdminSurveysQuery(searchParams).limit;
}

export function parseAdminSurveysInstallerFilter(searchParams: URLSearchParams): string {
  return parseAdminSurveysQuery(searchParams).installerId;
}

export function parseSurveyLeadLine(line: string): SurveyLead | null {
  try {
    const d = JSON.parse(line) as Record<string, unknown>;
    return {
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
    };
  } catch {
    return null;
  }
}