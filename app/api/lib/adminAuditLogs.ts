export const ADMIN_AUDIT_LOGS_PATH = '/api/admin/audit';
export const ADMIN_AUDIT_LOGS_METHODS = 'GET, OPTIONS';

export const ADMIN_AUDIT_LOGS_PROBE = {
  path: ADMIN_AUDIT_LOGS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  defaultSinceHours: 0,
  maxSinceHours: 24 * 90,
  maxRows: 500,
};

export function parseAuditActionParam(searchParams: URLSearchParams): string {
  return (searchParams.get('action') ?? '').trim();
}

export function parseAuditSinceHoursParam(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get('sinceHours') ?? String(ADMIN_AUDIT_LOGS_PROBE.defaultSinceHours));
  if (!Number.isFinite(raw)) return ADMIN_AUDIT_LOGS_PROBE.defaultSinceHours;
  return Math.max(0, Math.min(ADMIN_AUDIT_LOGS_PROBE.maxSinceHours, raw));
}

export function auditSinceDate(sinceHours: number): Date | null {
  return sinceHours > 0 ? new Date(Date.now() - sinceHours * 60 * 60 * 1000) : null;
}