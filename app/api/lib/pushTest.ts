export const PUSH_TEST_PATH = '/api/push/test';
export const PUSH_TEST_METHODS = 'POST, OPTIONS';

export const PUSH_TEST_PROBE = {
  path: PUSH_TEST_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  subscriptionLimit: 5,
  title: 'Solaris CET' as const,
  body: 'Test push — notificările funcționează.' as const,
  url: '/app' as const,
};

export function buildPushTestNotification() {
  return {
    title: PUSH_TEST_PROBE.title,
    body: PUSH_TEST_PROBE.body,
    url: PUSH_TEST_PROBE.url,
  };
}