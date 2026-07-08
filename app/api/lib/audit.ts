export const AUDIT_PATH = '/api/audit';
export const AUDIT_METHODS = 'POST, OPTIONS';

export const AUDIT_PROBE = {
  path: AUDIT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  defaultAction: 'unknown' as const,
  dbSuccessStatus: 201,
  fallbackStatus: 202,
};

export type AuditBodyParse = {
  action: string;
  details: string | undefined;
  walletAddress: string | null;
};

export function parseAuditBody(body: unknown): AuditBodyParse {
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const action = typeof payload.action === 'string' ? payload.action : AUDIT_PROBE.defaultAction;
  const details = payload.details === undefined ? undefined : JSON.stringify(payload.details);
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress : null;
  return { action, details, walletAddress };
}

export function walletFromJwtDecoded(decoded: unknown): string | null {
  return decoded && typeof decoded === 'object' && typeof (decoded as { wallet?: unknown }).wallet === 'string'
    ? (decoded as { wallet: string }).wallet
    : null;
}