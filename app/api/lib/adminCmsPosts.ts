export const ADMIN_CMS_POSTS_PATH = '/api/admin/cms/posts';
export const ADMIN_CMS_POSTS_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

export const ADMIN_CMS_POST_STATUSES = ['draft', 'published', 'archived'] as const;
export type CmsPostStatus = (typeof ADMIN_CMS_POST_STATUSES)[number];

export const ADMIN_CMS_POSTS_PROBE = {
  path: ADMIN_CMS_POSTS_PATH,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  getMinRole: 'viewer' as const,
  writeMinRole: 'editor' as const,
  unauthenticatedStatus: 401,
  defaultLocale: 'ro',
  maxLocaleLength: 5,
  maxTitleLength: 180,
  maxExcerptLength: 500,
  maxMarkdownLength: 200_000,
  maxListRows: 200,
  auditActions: {
    created: 'CMS_POST_CREATED',
    updated: 'CMS_POST_UPDATED',
    deleted: 'CMS_POST_DELETED',
  } as const,
};

export function normalizeCmsPostSlug(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(s)) return null;
  return s;
}

export function parseCmsPostsLocale(searchParams: URLSearchParams): string {
  return (searchParams.get('locale') ?? '').slice(0, ADMIN_CMS_POSTS_PROBE.maxLocaleLength);
}

export function parseCmsPostsStatusFilter(searchParams: URLSearchParams): string {
  return (searchParams.get('status') ?? '').trim();
}

export function parseCmsPostsQueryFilter(searchParams: URLSearchParams): string {
  return (searchParams.get('q') ?? '').trim();
}

export function parseCmsPostDeleteId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}

export function normalizeCmsPostStatus(status: string): CmsPostStatus {
  if (status === 'published' || status === 'archived') return status;
  return 'draft';
}

export type CmsPostCreateBody = { slug: string; title: string; locale: string };

export type CmsPostCreateResult =
  | { ok: true; value: CmsPostCreateBody }
  | { ok: false; error: 'Slug invalid' | 'Titlu invalid' };

export function parseCmsPostCreateBody(body: unknown): CmsPostCreateResult {
  const slug = normalizeCmsPostSlug(typeof body === 'object' && body !== null ? (body as { slug?: unknown }).slug : null);
  if (!slug) return { ok: false, error: 'Slug invalid' };
  const title =
    typeof body === 'object' && body !== null && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title.trim().slice(0, ADMIN_CMS_POSTS_PROBE.maxTitleLength)
      : '';
  if (!title) return { ok: false, error: 'Titlu invalid' };
  const locale =
    typeof body === 'object' && body !== null && typeof (body as { locale?: unknown }).locale === 'string'
      ? (body as { locale: string }).locale.slice(0, ADMIN_CMS_POSTS_PROBE.maxLocaleLength)
      : ADMIN_CMS_POSTS_PROBE.defaultLocale;
  return { ok: true, value: { slug, title, locale } };
}

export type CmsPostUpdateInput = {
  id: string;
  title: string;
  excerpt: string;
  markdown: string;
  status: CmsPostStatus;
};

export function parseCmsPostUpdateBody(
  body: unknown,
  existing: { title: string; excerpt: string | null; markdown: string | null; status: string },
): CmsPostUpdateInput | null {
  const id =
    typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
      ? (body as { id: string }).id
      : '';
  if (!id) return null;
  const title =
    typeof body === 'object' && body !== null && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title.trim().slice(0, ADMIN_CMS_POSTS_PROBE.maxTitleLength)
      : existing.title;
  const excerpt =
    typeof body === 'object' && body !== null && typeof (body as { excerpt?: unknown }).excerpt === 'string'
      ? (body as { excerpt: string }).excerpt.slice(0, ADMIN_CMS_POSTS_PROBE.maxExcerptLength)
      : (existing.excerpt ?? '');
  const markdown =
    typeof body === 'object' && body !== null && typeof (body as { markdown?: unknown }).markdown === 'string'
      ? (body as { markdown: string }).markdown.slice(0, ADMIN_CMS_POSTS_PROBE.maxMarkdownLength)
      : (existing.markdown ?? '');
  const status =
    typeof body === 'object' && body !== null && typeof (body as { status?: unknown }).status === 'string'
      ? (body as { status: string }).status
      : existing.status;
  return { id, title, excerpt, markdown, status: normalizeCmsPostStatus(status) };
}