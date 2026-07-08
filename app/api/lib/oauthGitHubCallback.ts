export const OAUTH_GITHUB_CALLBACK_PATH = '/api/auth/oauth/github/callback';
export const OAUTH_GITHUB_CALLBACK_METHODS = 'GET';

export const OAUTH_GITHUB_CALLBACK_PROBE = {
  path: OAUTH_GITHUB_CALLBACK_PATH,
  methods: ['GET'] as const,
  authRequired: false,
  provider: 'github' as const,
  clientIdEnv: 'GITHUB_OAUTH_CLIENT_ID' as const,
  clientSecretEnv: 'GITHUB_OAUTH_CLIENT_SECRET' as const,
  callbackPath: '/api/auth/oauth/github/callback',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userUrl: 'https://api.github.com/user',
};