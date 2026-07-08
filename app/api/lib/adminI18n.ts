export const ADMIN_I18N_PATH = '/api/admin/i18n';
export const ADMIN_I18N_METHODS = 'GET, PUT, OPTIONS';

export const ADMIN_I18N_PROBE = {
  path: ADMIN_I18N_PATH,
  methods: ['GET', 'PUT', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  putMinRole: 'editor' as const,
  unauthenticatedStatus: 401,
  defaultLocale: 'ro',
  defaultNamespace: 'common',
  maxLocaleLength: 5,
  maxNamespaceLength: 40,
  maxKeyLength: 120,
  maxValueLength: 10_000,
  maxListRows: 500,
  auditAction: 'I18N_UPDATED' as const,
};

export function normI18nLocale(v: unknown): string {
  if (typeof v === 'string') return v.slice(0, ADMIN_I18N_PROBE.maxLocaleLength).toLowerCase();
  return ADMIN_I18N_PROBE.defaultLocale;
}

export function normI18nNamespace(v: unknown): string {
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? s.slice(0, ADMIN_I18N_PROBE.maxNamespaceLength) : ADMIN_I18N_PROBE.defaultNamespace;
  }
  return ADMIN_I18N_PROBE.defaultNamespace;
}

export function normI18nKey(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (s.length > ADMIN_I18N_PROBE.maxKeyLength) return null;
  return s;
}

export function parseI18nListLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? ADMIN_I18N_PROBE.defaultLocale).slice(0, ADMIN_I18N_PROBE.maxLocaleLength);
}

export function parseI18nListNamespace(searchParams: URLSearchParams): string {
  return (searchParams.get('namespace') ?? ADMIN_I18N_PROBE.defaultNamespace).slice(0, ADMIN_I18N_PROBE.maxNamespaceLength);
}

export function parseI18nListQuery(searchParams: URLSearchParams): string {
  return (searchParams.get('q') ?? '').trim();
}

export type I18nPutBody =
  | { ok: true; locale: string; namespace: string; key: string; value: string }
  | { ok: false; error: 'Invalid payload' };

export function parseI18nPutBody(body: unknown): I18nPutBody {
  const locale = normI18nLocale(typeof body === 'object' && body !== null ? (body as { locale?: unknown }).locale : null);
  const namespace = normI18nNamespace(typeof body === 'object' && body !== null ? (body as { namespace?: unknown }).namespace : null);
  const key = normI18nKey(typeof body === 'object' && body !== null ? (body as { key?: unknown }).key : null);
  const value =
    typeof body === 'object' && body !== null && typeof (body as { value?: unknown }).value === 'string'
      ? (body as { value: string }).value.slice(0, ADMIN_I18N_PROBE.maxValueLength)
      : null;
  if (!key || value === null) return { ok: false, error: 'Invalid payload' };
  return { ok: true, locale, namespace, key, value };
}