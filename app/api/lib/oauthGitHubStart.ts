export const OAUTH_GITHUB_START_PATH = '/api/auth/oauth/github/start';
export const OAUTH_GITHUB_START_METHODS = 'POST, OPTIONS';

export const OAUTH_GITHUB_START_PROBE = {
  path: OAUTH_GITHUB_START_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  provider: 'github' as const,
  clientIdEnv: 'GITHUB_OAUTH_CLIENT_ID' as const,
  notConfiguredError: 'Not configured' as const,
  authorizeHost: 'https://github.com/login/oauth/authorize',
  callbackPath: '/api/auth/oauth/github/callback',
  scope: 'read:user user:email',
};