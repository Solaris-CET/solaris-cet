export const BLOG_POST_PATH = '/api/blog/post';
export const BLOG_POST_METHODS = 'GET, OPTIONS';

export const BLOG_POST_PROBE = {
  path: BLOG_POST_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  defaultLocale: 'ro',
  maxLocaleLength: 5,
  publishedStatus: 'published' as const,
  missingSlugError: 'Missing slug' as const,
  notFoundError: 'Not found' as const,
};

export function parseBlogPostLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? BLOG_POST_PROBE.defaultLocale).slice(0, BLOG_POST_PROBE.maxLocaleLength);
}

export function parseBlogPostSlug(searchParams: URLSearchParams): string {
  return (searchParams.get('slug') ?? '').trim().toLowerCase();
}