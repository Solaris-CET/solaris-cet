const STORAGE_KEY = 'solaris_auth_token';
const EVENT_NAME = 'solaris-auth-token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function emitTokenEvent() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    void 0;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    void 0;
  }
  emitTokenEvent();
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
  emitTokenEvent();
}

