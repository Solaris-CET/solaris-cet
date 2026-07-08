export const OAUTH_TWITTER_CALLBACK_PATH = '/api/auth/oauth/twitter/callback';
export const OAUTH_TWITTER_CALLBACK_METHODS = 'GET';

export const OAUTH_TWITTER_CALLBACK_PROBE = {
  path: OAUTH_TWITTER_CALLBACK_PATH,
  methods: ['GET'] as const,
  authRequired: false,
  provider: 'twitter' as const,
  clientIdEnv: 'TWITTER_OAUTH_CLIENT_ID' as const,
  clientSecretEnv: 'TWITTER_OAUTH_CLIENT_SECRET' as const,
  callbackPath: '/api/auth/oauth/twitter/callback',
  tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  userUrl: 'https://api.twitter.com/2/users/me',
};