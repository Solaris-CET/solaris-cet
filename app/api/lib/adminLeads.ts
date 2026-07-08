export const ADMIN_LEADS_PATH = '/api/admin/leads';
export const ADMIN_LEADS_METHODS = 'GET, OPTIONS';

export const ADMIN_LEADS_SORT_FIELDS = ['createdAt', 'name', 'serviceType', 'location'] as const;
export type AdminLeadsSortField = (typeof ADMIN_LEADS_SORT_FIELDS)[number];

export const ADMIN_LEADS_PROBE = {
  path: ADMIN_LEADS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  defaultPage: 1,
  defaultLimit: 20,
  minLimit: 1,
  maxLimit: 100,
  defaultSortField: 'createdAt' as AdminLeadsSortField,
  defaultLeadStatus: 'nou' as const,
};

export function parseLeadsPage(searchParams: URLSearchParams): number {
  const page = Number(searchParams.get('page'));
  if (!Number.isFinite(page) || page < 1) return ADMIN_LEADS_PROBE.defaultPage;
  return Math.floor(page);
}

export function parseLeadsLimit(searchParams: URLSearchParams): number {
  const limit = Number(searchParams.get('limit'));
  if (!Number.isFinite(limit)) return ADMIN_LEADS_PROBE.defaultLimit;
  return Math.min(ADMIN_LEADS_PROBE.maxLimit, Math.max(ADMIN_LEADS_PROBE.minLimit, Math.floor(limit)));
}

export function parseLeadsOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function parseLeadsSortField(searchParams: URLSearchParams): AdminLeadsSortField {
  const raw = searchParams.get('sortField') || ADMIN_LEADS_PROBE.defaultSortField;
  return (ADMIN_LEADS_SORT_FIELDS as readonly string[]).includes(raw) ? (raw as AdminLeadsSortField) : ADMIN_LEADS_PROBE.defaultSortField;
}

export function parseLeadsSortDir(searchParams: URLSearchParams): 'asc' | 'desc' {
  return searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
}

export function shouldReturnEmptyLeads(statusFilter: string): boolean {
  return Boolean(statusFilter && statusFilter !== ADMIN_LEADS_PROBE.defaultLeadStatus);
}