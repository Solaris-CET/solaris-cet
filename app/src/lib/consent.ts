export type CookieConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'solaris_cookie_consent';
const EVENT_NAME = 'solaris:cookie-consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object';
}

function normalizeConsent(input: unknown): CookieConsentState {
  if (!isRecord(input)) return defaultConsent();
  const updatedAt = typeof input.updatedAt === 'string' && input.updatedAt ? input.updatedAt : new Date().toISOString();
  return {
    essential: true,
    analytics: Boolean(input.analytics),
    marketing: Boolean(input.marketing),
    updatedAt,
  };
}

function readCookieConsent(): CookieConsentState | null {
  if (typeof document === 'undefined') return null;
  try {
    const pairs = document.cookie.split(';').map((part) => part.trim());
    const raw = pairs.find((part) => part.startsWith(`${STORAGE_KEY}=`));
    if (!raw) return null;
    const encoded = raw.slice(STORAGE_KEY.length + 1);
    if (!encoded) return null;
    return normalizeConsent(JSON.parse(decodeURIComponent(encoded)));
  } catch {
    return null;
  }
}

function writeCookieConsent(value: CookieConsentState) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    void 0;
  }
}

function clearCookieConsent() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    void 0;
  }
}

export function defaultConsent(): CookieConsentState {
  return { essential: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
}

export function readStoredConsent(): CookieConsentState {
  if (typeof window === 'undefined') return defaultConsent();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeConsent(JSON.parse(raw));
  } catch {
    void 0;
  }
  return readCookieConsent() ?? defaultConsent();
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
  writeCookieConsent(value);
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
  clearCookieConsent();
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
  } catch {
    void 0;
  }
  return value;
}

export function hasStoredConsentDecision(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(STORAGE_KEY)) return true;
  } catch {
    void 0;
  }
  return readCookieConsent() !== null;
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
