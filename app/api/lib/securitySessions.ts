export const SECURITY_SESSIONS_PATH = '/api/security/sessions';
export const SECURITY_SESSIONS_METHODS = 'GET, OPTIONS';

export const SECURITY_SESSIONS_PROBE = {
  path: SECURITY_SESSIONS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  listLimit: 50,
};

export type SessionRow = {
  id: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
};

export function mapSecuritySessionItem(s: SessionRow, now: number, currentSid: string | null) {
  return {
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt ? s.lastUsedAt.toISOString() : null,
    expiresAt: s.expiresAt.toISOString(),
    revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
    ip: s.ip ?? null,
    userAgent: s.userAgent ?? null,
    active: !s.revokedAt && s.expiresAt.getTime() > now,
    current: Boolean(currentSid && s.id === currentSid),
  };
}

export function normalizeSessionCount(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

export function buildSecuritySessionsPayload(params: {
  sessions: ReturnType<typeof mapSecuritySessionItem>[];
  currentSessionId: string | null;
  mfaEnabled: boolean;
  notRevokedCount: number;
}) {
  return {
    ok: true as const,
    currentSessionId: params.currentSessionId,
    mfaEnabled: params.mfaEnabled,
    sessions: params.sessions,
    counts: { total: params.sessions.length, notRevoked: params.notRevokedCount },
  };
}