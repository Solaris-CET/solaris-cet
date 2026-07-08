export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_DEFAULT_RETURN_TO = '/login';
export const OAUTH_MAX_RETURN_TO_LENGTH = 200;

export function parseOAuthReturnTo(body: unknown): string {
  const raw =
    typeof body === 'object' && body !== null && 'returnTo' in body && typeof (body as { returnTo?: unknown }).returnTo === 'string'
      ? (body as { returnTo: string }).returnTo.trim().slice(0, OAUTH_MAX_RETURN_TO_LENGTH)
      : OAUTH_DEFAULT_RETURN_TO;
  return raw || OAUTH_DEFAULT_RETURN_TO;
}

export function safeOAuthRedirect(to: string): string {
  const trimmed = String(to ?? '').trim();
  if (!trimmed.startsWith('/')) return OAUTH_DEFAULT_RETURN_TO;
  if (trimmed.startsWith('//')) return OAUTH_DEFAULT_RETURN_TO;
  return trimmed;
}

export type OAuthCallbackParams = {
  state: string;
  code: string;
  error: string;
};

export function parseOAuthCallbackParams(searchParams: URLSearchParams): OAuthCallbackParams {
  return {
    state: (searchParams.get('state') ?? '').trim(),
    code: (searchParams.get('code') ?? '').trim(),
    error: (searchParams.get('error') ?? '').trim(),
  };
}

export function oauthErrorRedirect(error: string, allowedOrigin: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${OAUTH_DEFAULT_RETURN_TO}#oauth_error=${encodeURIComponent(error)}`,
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}