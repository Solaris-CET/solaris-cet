import type { AdminRole } from './adminAuth';

export const ADMIN_INVITES_PATH = '/api/admin/invites';
export const ADMIN_INVITES_METHODS = 'GET, POST, DELETE, OPTIONS';

export const ADMIN_INVITE_STATUSES = ['active', 'used', 'expired', 'revoked'] as const;
export type AdminInviteStatus = (typeof ADMIN_INVITE_STATUSES)[number];

export const ADMIN_INVITES_PROBE = {
  path: ADMIN_INVITES_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'admin' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-invites',
  maxListRows: 200,
  defaultMaxUses: 1,
  defaultExpiresInHours: 168,
  minMaxUses: 1,
  maxMaxUses: 50,
  minExpiresInHours: 1,
  maxExpiresInHours: 24 * 30,
};

export function normalizeInviteRole(role: unknown): AdminRole | null {
  if (role === 'admin' || role === 'editor' || role === 'viewer') return role;
  return null;
}

export function isInviteUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function parseInviteDeleteId(searchParams: URLSearchParams): string {
  return searchParams.get('id') ?? '';
}

export function resolveInviteStatus(invite: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  usedCount: number;
  maxUses: number;
}): AdminInviteStatus {
  const now = Date.now();
  if (invite.revokedAt) return 'revoked';
  if (invite.expiresAt && invite.expiresAt.getTime() <= now) return 'expired';
  if (invite.usedCount >= invite.maxUses) return 'used';
  return 'active';
}

export type InviteCreateInput = { role: AdminRole; maxUses: number; expiresInHours: number };

export function parseInviteCreateBody(body: unknown): InviteCreateInput | null {
  const role =
    typeof body === 'object' && body !== null && 'role' in body
      ? normalizeInviteRole((body as { role?: unknown }).role)
      : null;
  if (!role) return null;
  const maxUses =
    typeof body === 'object' && body !== null && 'maxUses' in body && typeof (body as { maxUses?: unknown }).maxUses === 'number'
      ? Math.floor((body as { maxUses: number }).maxUses)
      : ADMIN_INVITES_PROBE.defaultMaxUses;
  const expiresInHours =
    typeof body === 'object' && body !== null && 'expiresInHours' in body && typeof (body as { expiresInHours?: unknown }).expiresInHours === 'number'
      ? Math.floor((body as { expiresInHours: number }).expiresInHours)
      : ADMIN_INVITES_PROBE.defaultExpiresInHours;
  return {
    role,
    maxUses: Math.max(ADMIN_INVITES_PROBE.minMaxUses, Math.min(ADMIN_INVITES_PROBE.maxMaxUses, maxUses)),
    expiresInHours: Math.max(ADMIN_INVITES_PROBE.minExpiresInHours, Math.min(ADMIN_INVITES_PROBE.maxExpiresInHours, expiresInHours)),
  };
}