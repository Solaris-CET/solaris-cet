export const INVITES_CREATE_PATH = '/api/gamification/invites/create';
export const INVITES_CREATE_METHODS = 'POST, OPTIONS';

export const INVITES_CREATE_PROBE = {
  path: INVITES_CREATE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  minMaxUses: 1,
  maxMaxUses: 20,
  defaultMaxUses: 1,
  inviteExpiryDays: 30,
};

export function parseInvitesCreateMaxUses(body: unknown): number {
  const maxUsesRaw = Number((body as { maxUses?: unknown })?.maxUses ?? INVITES_CREATE_PROBE.defaultMaxUses);
  return Number.isFinite(maxUsesRaw)
    ? Math.max(INVITES_CREATE_PROBE.minMaxUses, Math.min(INVITES_CREATE_PROBE.maxMaxUses, Math.floor(maxUsesRaw)))
    : INVITES_CREATE_PROBE.defaultMaxUses;
}