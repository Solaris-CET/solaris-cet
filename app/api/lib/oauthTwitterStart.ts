export const OAUTH_TWITTER_START_PATH = '/api/auth/oauth/twitter/start';
export const OAUTH_TWITTER_START_METHODS = 'POST, OPTIONS';

export const OAUTH_TWITTER_START_PROBE = {
  path: OAUTH_TWITTER_START_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  provider: 'twitter' as const,
  clientIdEnv: 'TWITTER_OAUTH_CLIENT_ID' as const,
  notConfiguredError: 'Not configured' as const,
  authorizeHost: 'https://twitter.com/i/oauth2/authorize',
  callbackPath: '/api/auth/oauth/twitter/callback',
  scope: 'tweet.read users.read offline.access',
};