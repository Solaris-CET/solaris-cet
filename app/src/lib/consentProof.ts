import matter from 'gray-matter';

import cookiesRo from '@/content/legal/ro/cookies.md?raw';
import type { CookieConsentState } from '@/lib/consent';

const CONSENT_KEY_STORAGE = 'solaris_consent_key';

function safePolicyVersion(): string {
  try {
    const parsed = matter(cookiesRo);
    const v = (parsed.data as Record<string, unknown>).lastUpdated;
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 40);
    if (typeof v === 'number' && Number.isFinite(v)) return String(v).slice(0, 40);
    return new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const COOKIE_POLICY_VERSION = safePolicyVersion();

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
        policyVersion: COOKIE_POLICY_VERSION,
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

