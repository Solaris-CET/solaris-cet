export const ADMIN_INSTALLERS_PATH = '/api/admin/installers';
export const ADMIN_INSTALLERS_METHODS = 'GET, OPTIONS';

export const ADMIN_INSTALLERS_PROBE = {
  path: ADMIN_INSTALLERS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  fetchTimeoutMs: 8000,
  platform: 'solaris-cet' as const,
};

export function surveyEngineBaseUrl(): string {
  return (process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export function installersUpstreamUrl(): string {
  return `${surveyEngineBaseUrl()}/installers`;
}