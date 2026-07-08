export const ADMIN_SETTINGS_PATH = '/api/admin/settings';
export const ADMIN_SETTINGS_METHODS = 'GET, PUT, OPTIONS';

export const ADMIN_SETTINGS_PROBE = {
  path: ADMIN_SETTINGS_PATH,
  methods: ['GET', 'PUT', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  putMinRole: 'admin' as const,
  unauthenticatedStatus: 401,
  maxListRows: 200,
  maxKeyLength: 80,
  auditAction: 'SETTING_UPDATED' as const,
};

export function normalizeSettingKey(key: string): string | null {
  const k = key.trim();
  if (!k) return null;
  if (k.length > ADMIN_SETTINGS_PROBE.maxKeyLength) return null;
  if (!/^[a-z0-9_.-]+$/i.test(k)) return null;
  return k;
}

export type SettingPutBody = { ok: true; key: string; value: unknown } | { ok: false; error: 'Key invalid' | 'Value missing' };

export function parseSettingPutBody(body: unknown): SettingPutBody {
  const keyRaw =
    typeof body === 'object' && body !== null && typeof (body as { key?: unknown }).key === 'string'
      ? (body as { key: string }).key
      : '';
  const key = normalizeSettingKey(keyRaw);
  const value = typeof body === 'object' && body !== null && 'value' in body ? (body as { value?: unknown }).value : null;
  if (!key) return { ok: false, error: 'Key invalid' };
  if (value === null) return { ok: false, error: 'Value missing' };
  return { ok: true, key, value };
}