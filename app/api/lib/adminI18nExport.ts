export const ADMIN_I18N_EXPORT_PATH = '/api/admin/i18n/export';
export const ADMIN_I18N_EXPORT_METHODS = 'GET, OPTIONS';

export const ADMIN_I18N_EXPORT_PROBE = {
  path: ADMIN_I18N_EXPORT_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  defaultLocale: 'ro',
  defaultNamespace: 'common',
  maxLocaleLength: 5,
  maxNamespaceLength: 40,
  maxRows: 50_000,
  auditAction: 'I18N_EXPORTED' as const,
};

export function parseI18nExportLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? ADMIN_I18N_EXPORT_PROBE.defaultLocale).slice(0, ADMIN_I18N_EXPORT_PROBE.maxLocaleLength);
}

export function parseI18nExportNamespace(searchParams: URLSearchParams): string {
  return (searchParams.get('namespace') ?? ADMIN_I18N_EXPORT_PROBE.defaultNamespace).slice(0, ADMIN_I18N_EXPORT_PROBE.maxNamespaceLength);
}

export function translationsToRecord(rows: Array<{ key: string; value: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}