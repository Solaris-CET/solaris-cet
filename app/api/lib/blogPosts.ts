export const BLOG_POSTS_PATH = '/api/blog/posts';
export const BLOG_POSTS_METHODS = 'GET, OPTIONS';

export const BLOG_POSTS_PROBE = {
  path: BLOG_POSTS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  defaultLocale: 'ro',
  maxLocaleLength: 5,
  publishedStatus: 'published' as const,
  maxListRows: 200,
};

export function parseBlogPostsLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? BLOG_POSTS_PROBE.defaultLocale).slice(0, BLOG_POSTS_PROBE.maxLocaleLength);
}