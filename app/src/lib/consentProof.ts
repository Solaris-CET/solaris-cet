import type { CookieConsentState } from '@/lib/consent';

import { LEGAL_DIGESTS } from '@/generated/legalDigests';

const CONSENT_KEY_STORAGE = 'solaris_consent_key';

function resolveCookiePolicyDigest(locale?: string): { version: string; sha256: string | null } {
  const fallback = LEGAL_DIGESTS.cookies.en;
  const raw = (locale ?? '').trim().slice(0, 2).toLowerCase();
  const byLocale = (LEGAL_DIGESTS.cookies as Record<string, { version: string; sha256: string }>)[raw];
  const entry = byLocale ?? fallback;
  const version = entry?.version?.trim().slice(0, 40) || new Date().toISOString().slice(0, 10);
  const sha256 = entry?.sha256?.trim() ? entry.sha256.trim().slice(0, 128) : null;
  return { version, sha256 };
}

export function getConsentKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(CONSENT_KEY_STORAGE);
    if (existing && existing.trim()) return existing.trim().slice(0, 120);
    const next = crypto.randomUUID();
    localStorage.setItem(CONSENT_KEY_STORAGE, next);
    return next;
  } catch {
    return '';
  }
}

export async function recordConsentProof(input: {
  consent: CookieConsentState;
  source: string;
  locale?: string;
  token?: string | null;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  const consentKey = getConsentKey();
  if (!consentKey) return;

  const source = input.source.trim() ? input.source.trim().slice(0, 60) : 'unknown';
  const locale = (input.locale ?? '').trim().slice(0, 10) || undefined;
  const digest = resolveCookiePolicyDigest(locale);

  try {
    await fetch('/api/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
      },
      body: JSON.stringify({
        consentKey,
        consent: { analytics: input.consent.analytics, marketing: input.consent.marketing },
        policyVersion: digest.version,
        policyHash: digest.sha256,
        source,
        meta: {
          updatedAt: input.consent.updatedAt,
          pathname: window.location.pathname,
          locale,
        },
      }),
    });
  } catch {
    void 0;
  }
}
