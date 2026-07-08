export const PURGE_INACTIVE_PATH = '/api/maintenance/purge-inactive';
export const PURGE_INACTIVE_METHODS = 'POST, OPTIONS';

export const PURGE_INACTIVE_PROBE = {
  path: PURGE_INACTIVE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  maintenanceTokenEnv: 'MAINTENANCE_TOKEN' as const,
  inactivityDaysEnv: 'GDPR_INACTIVITY_DAYS' as const,
  defaultDays: 365,
  minDays: 30,
  maxDays: 3650,
  defaultLimit: 200,
  minLimit: 1,
  maxLimit: 1000,
  notConfiguredStatus: 501,
  protectedRoles: ['admin', 'support'] as const,
};

export function parseMaintenanceBearer(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice('bearer '.length).trim();
  return token ? token : null;
}

export function parsePurgeInactiveBody(raw: unknown): { days: number; limit: number; dryRun: boolean } {
  const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const daysRaw = typeof rec.days === 'number' ? rec.days : Number.NaN;
  const limitRaw = typeof rec.limit === 'number' ? rec.limit : Number.NaN;
  const dryRun = Boolean(rec.dryRun);

  const daysEnv = Number.parseInt(String(process.env[PURGE_INACTIVE_PROBE.inactivityDaysEnv] ?? String(PURGE_INACTIVE_PROBE.defaultDays)), 10);
  const days = Number.isFinite(daysRaw) ? Math.floor(daysRaw) : Number.isFinite(daysEnv) ? daysEnv : PURGE_INACTIVE_PROBE.defaultDays;
  const limit = Number.isFinite(limitRaw) ? Math.floor(limitRaw) : PURGE_INACTIVE_PROBE.defaultLimit;

  return {
    days: Math.min(Math.max(days, PURGE_INACTIVE_PROBE.minDays), PURGE_INACTIVE_PROBE.maxDays),
    limit: Math.min(Math.max(limit, PURGE_INACTIVE_PROBE.minLimit), PURGE_INACTIVE_PROBE.maxLimit),
    dryRun,
  };
}