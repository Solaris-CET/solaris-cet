export type CookieConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'solaris_cookie_consent';
const EVENT_NAME = 'solaris:cookie-consent';

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object';
}

export function defaultConsent(): CookieConsentState {
  return { essential: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
}

export function readStoredConsent(): CookieConsentState {
  if (typeof window === 'undefined') return defaultConsent();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConsent();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultConsent();
    const updatedAt = typeof parsed.updatedAt === 'string' && parsed.updatedAt ? parsed.updatedAt : new Date().toISOString();
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt,
    };
  } catch {
    return defaultConsent();
  }
}

export function writeStoredConsent(next: Omit<CookieConsentState, 'essential' | 'updatedAt'> & { updatedAt?: string }): CookieConsentState {
  const value: CookieConsentState = {
    essential: true,
    analytics: Boolean(next.analytics),
    marketing: Boolean(next.marketing),
    updatedAt: next.updatedAt?.trim() ? String(next.updatedAt).trim() : new Date().toISOString(),
  };
  if (typeof window === 'undefined') return value;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    void 0;
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
  } catch {
    void 0;
  }
  return value;
}

export function clearStoredConsent(): CookieConsentState {
  const value = defaultConsent();
  if (typeof window === 'undefined') return value;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
  } catch {
    void 0;
  }
  return value;
}

export function onConsentChange(cb: (consent: CookieConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => void 0;
  const onLocal = (event: Event) => {
    const ce = event as CustomEvent;
    const detail = ce.detail as unknown;
    if (!isRecord(detail)) {
      cb(readStoredConsent());
      return;
    }
    cb({
      essential: true,
      analytics: Boolean(detail.analytics),
      marketing: Boolean(detail.marketing),
      updatedAt: typeof detail.updatedAt === 'string' && detail.updatedAt ? detail.updatedAt : new Date().toISOString(),
    });
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cb(readStoredConsent());
  };

  window.addEventListener(EVENT_NAME, onLocal);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onLocal);
    window.removeEventListener('storage', onStorage);
  };
}
