import { createContext, useContext } from 'react';

export type AuthUser = {
  id: string;
  role: string;
  displayName: string | null;
  walletAddress: string | null;
  locale: string;
  theme: string;
  telegramNotificationsEnabled: boolean;
  mfaEnabled: boolean;
};

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'unauthenticated'; user: null };

export type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}

