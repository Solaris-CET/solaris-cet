export const TELEGRAM_LINK_CODE_PATH = '/api/telegram/link-code';
export const TELEGRAM_LINK_CODE_METHODS = 'POST, OPTIONS';

export const TELEGRAM_LINK_CODE_PROBE = {
  path: TELEGRAM_LINK_CODE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  allowHeaders: 'Content-Type, Authorization' as const,
  ttlMs: 10 * 60 * 1000,
  codeLength: 10,
};

export function buildTelegramLinkCodeExpiry(now = Date.now()): Date {
  return new Date(now + TELEGRAM_LINK_CODE_PROBE.ttlMs);
}

export function buildTelegramLinkCodeResponse(code: string, expiresAt: Date) {
  return { code, expiresAt };
}

export function normalizeTelegramLinkCode(raw: string): string {
  return raw.toUpperCase();
}