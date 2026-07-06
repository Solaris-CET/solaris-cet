import { useCallback, useMemo, useState } from 'react';

import type { AdminSession } from './adminClient';

const KEY = 'solaris_admin_jwt';

function resolveInitial(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function useAdminSession() {
  const [token, setTokenState] = useState<string | null>(resolveInitial);
  const [admin, setAdmin] = useState<AdminSession['admin'] | null>(null);

  const setToken = useCallback((next: string | null) => {
    setTokenState(next);
    try {
      if (!next) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      void 0;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, [setToken]);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  return { token, setToken, admin, setAdmin, isAuthenticated, logout };
}

