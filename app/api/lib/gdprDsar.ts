export const GDPR_DSAR_PATH = '/api/gdpr/dsar';
export const GDPR_DSAR_METHODS = 'POST, OPTIONS';

export const GDPR_DSAR_TYPES = ['access', 'portability', 'delete', 'rectification', 'restriction', 'objection', 'other'] as const;
export type GdprDsarType = (typeof GDPR_DSAR_TYPES)[number];

export const GDPR_DSAR_PROBE = {
  path: GDPR_DSAR_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'gdpr_dsar',
  rateLimit: 5,
  rateLimitWindowSeconds: 3600,
  maxMessageLength: 2000,
  maxWalletLength: 200,
  maxPageUrlLength: 600,
  maxLocaleLength: 12,
  maxMessageBodyLength: 2400,
  invalidJsonError: 'Invalid JSON' as const,
  invalidEmailError: 'Invalid email' as const,
  invalidMessageError: 'Invalid message' as const,
  emailRequiredError: 'Email required' as const,
  utmKind: 'dsar' as const,
};

export type GdprDsarPostBody = {
  type: string;
  message: string;
  email: string;
  walletAddress: string;
  pageUrl: string | null;
  locale: string | null;
};

export function normalizeGdprDsarType(v: string): GdprDsarType {
  const t = v.trim().toLowerCase();
  if (t === 'access' || t === 'portability' || t === 'delete' || t === 'rectification' || t === 'restriction' || t === 'objection') {
    return t;
  }
  return 'other';
}

export function parseGdprDsarPostBody(body: unknown): GdprDsarPostBody {
  const typeRaw = typeof (body as { type?: unknown })?.type === 'string' ? (body as { type: string }).type : '';
  const messageRaw = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim() : '';
  const emailRaw = typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  const walletAddress =
    typeof (body as { walletAddress?: unknown })?.walletAddress === 'string'
      ? (body as { walletAddress: string }).walletAddress.trim().slice(0, GDPR_DSAR_PROBE.maxWalletLength)
      : '';
  const pageUrl =
    typeof (body as { pageUrl?: unknown })?.pageUrl === 'string'
      ? (body as { pageUrl: string }).pageUrl.trim().slice(0, GDPR_DSAR_PROBE.maxPageUrlLength)
      : null;
  const locale =
    typeof (body as { locale?: unknown })?.locale === 'string'
      ? (body as { locale: string }).locale.trim().slice(0, GDPR_DSAR_PROBE.maxLocaleLength)
      : null;
  return { type: typeRaw, message: messageRaw, email, walletAddress, pageUrl, locale };
}

export function buildGdprDsarMessage(
  body: GdprDsarPostBody,
  type: GdprDsarType,
  user: { id: string; walletAddress: string } | null,
): string {
  return [
    'DSAR request',
    `type: ${type}`,
    user ? `userId: ${user.id}` : null,
    user ? `wallet: ${user.walletAddress}` : body.walletAddress ? `wallet: ${body.walletAddress}` : null,
    body.email ? `email: ${body.email}` : null,
    '',
    body.message,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, GDPR_DSAR_PROBE.maxMessageBodyLength);
}