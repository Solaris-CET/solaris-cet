import { isValidEmail } from './http';

export const ACCOUNT_PROFILE_PATH = '/api/account/profile';
export const ACCOUNT_PROFILE_METHODS = 'GET, POST, OPTIONS';

export const ACCOUNT_PROFILE_PROBE = {
  path: ACCOUNT_PROFILE_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
};

export type ProfilePreferences = {
  marketingNewsletter: boolean;
  priceAlertsEmail: boolean;
  pushEnabled: boolean;
};

export type ProfileUpdateInput = {
  email: string;
  marketingNewsletter: boolean;
  priceAlertsEmail: boolean;
  pushEnabled: boolean;
};

export function parseProfileUpdateBody(body: unknown): ProfileUpdateInput | { error: string } {
  if (!body || typeof body !== 'object') {
    return { email: '', marketingNewsletter: false, priceAlertsEmail: false, pushEnabled: false };
  }

  const emailRaw =
    typeof (body as { email?: unknown }).email === 'string' ? (body as { email: string }).email.trim() : '';
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  if (email && !isValidEmail(email)) return { error: 'Invalid email' };

  return {
    email,
    marketingNewsletter: Boolean((body as { marketingNewsletter?: unknown }).marketingNewsletter),
    priceAlertsEmail: Boolean((body as { priceAlertsEmail?: unknown }).priceAlertsEmail),
    pushEnabled: Boolean((body as { pushEnabled?: unknown }).pushEnabled),
  };
}