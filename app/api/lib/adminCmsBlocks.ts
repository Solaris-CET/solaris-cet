export const ADMIN_CMS_BLOCKS_PATH = '/api/admin/cms/blocks';
export const ADMIN_CMS_BLOCKS_METHODS = 'GET, PUT, OPTIONS';

export const ADMIN_CMS_BLOCK_FORMATS = ['plain', 'markdown'] as const;
export type CmsBlockFormat = (typeof ADMIN_CMS_BLOCK_FORMATS)[number];

export const ADMIN_CMS_BLOCKS_PROBE = {
  path: ADMIN_CMS_BLOCKS_PATH,
  methods: ['GET', 'PUT', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  putMinRole: 'editor' as const,
  unauthenticatedStatus: 401,
  defaultLocale: 'ro',
  maxLocaleLength: 5,
  maxKeyLength: 120,
  maxContentLength: 50_000,
  maxUpdates: 50,
  maxListRows: 200,
  auditAction: 'CMS_BLOCKS_UPDATED' as const,
};

export function normalizeCmsBlockFormat(v: unknown): CmsBlockFormat {
  return v === 'markdown' ? 'markdown' : 'plain';
}

export function parseCmsBlocksLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? ADMIN_CMS_BLOCKS_PROBE.defaultLocale).slice(0, ADMIN_CMS_BLOCKS_PROBE.maxLocaleLength);
}

export function parseCmsBlocksKeys(searchParams: URLSearchParams): string[] {
  return (searchParams.get('keys') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export type CmsBlockUpdate = { key: string; locale: string; format: CmsBlockFormat; content: string };

export function parseCmsBlockUpdates(body: unknown): CmsBlockUpdate[] {
  const updates =
    typeof body === 'object' && body !== null && 'updates' in body && Array.isArray((body as { updates?: unknown }).updates)
      ? ((body as { updates: unknown[] }).updates as unknown[])
      : [];
  if (updates.length === 0 || updates.length > ADMIN_CMS_BLOCKS_PROBE.maxUpdates) return [];

  const out: CmsBlockUpdate[] = [];
  for (const u of updates) {
    if (!u || typeof u !== 'object') continue;
    const key = 'key' in u && typeof (u as { key?: unknown }).key === 'string' ? (u as { key: string }).key.trim() : '';
    const locale =
      'locale' in u && typeof (u as { locale?: unknown }).locale === 'string'
        ? (u as { locale: string }).locale.slice(0, ADMIN_CMS_BLOCKS_PROBE.maxLocaleLength)
        : ADMIN_CMS_BLOCKS_PROBE.defaultLocale;
    const content =
      'content' in u && typeof (u as { content?: unknown }).content === 'string'
        ? (u as { content: string }).content
        : '';
    const format = normalizeCmsBlockFormat('format' in u ? (u as { format?: unknown }).format : 'plain');
    if (!key || key.length > ADMIN_CMS_BLOCKS_PROBE.maxKeyLength) continue;
    out.push({
      key,
      locale,
      format,
      content: content.slice(0, ADMIN_CMS_BLOCKS_PROBE.maxContentLength),
    });
  }
  return out;
}