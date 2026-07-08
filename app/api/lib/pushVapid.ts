export const PUSH_VAPID_PATH = '/api/push/vapid';
export const PUSH_VAPID_METHODS = 'GET, OPTIONS';

export const PUSH_VAPID_PROBE = {
  path: PUSH_VAPID_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  notConfiguredStatus: 500,
  notConfiguredError: 'Push not configured' as const,
};