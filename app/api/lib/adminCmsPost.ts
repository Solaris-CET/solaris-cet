export const ADMIN_CMS_POST_PATH = '/api/admin/cms/post';
export const ADMIN_CMS_POST_METHODS = 'GET, OPTIONS';

export const ADMIN_CMS_POST_PROBE = {
  path: ADMIN_CMS_POST_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Not found' as const,
};

export function parseCmsPostId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}