import { useJwtSession } from './useJwtSession';

export function useAuthToken(): string | null {
  const { token } = useJwtSession();
  return token;
}

