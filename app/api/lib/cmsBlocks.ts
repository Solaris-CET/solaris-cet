export const CMS_BLOCKS_PATH = '/api/cms/blocks';
export const CMS_BLOCKS_METHODS = 'GET, OPTIONS';

export const CMS_BLOCKS_PROBE = {
  path: CMS_BLOCKS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  defaultLocale: 'ro',
  maxLocaleLength: 5,
  minKeys: 1,
  maxKeys: 50,
  maxListRows: 200,
  missingKeysError: 'Missing keys' as const,
};

export function parseCmsBlocksLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? CMS_BLOCKS_PROBE.defaultLocale).slice(0, CMS_BLOCKS_PROBE.maxLocaleLength);
}

export function parseCmsBlocksKeys(searchParams: URLSearchParams): string[] {
  return (searchParams.get('keys') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidCmsBlocksKeys(keys: string[]): boolean {
  return keys.length >= CMS_BLOCKS_PROBE.minKeys && keys.length <= CMS_BLOCKS_PROBE.maxKeys;
}