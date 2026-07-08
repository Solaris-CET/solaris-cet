import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_INSTALLER_ME_PATH = '/api/survey/installer/me';
export const SURVEY_INSTALLER_ME_METHODS = 'GET, OPTIONS';

export const SURVEY_INSTALLER_ME_PROBE = {
  path: SURVEY_INSTALLER_ME_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'private, no-store' as const,
  installerKeyHeader: 'X-Installer-Key' as const,
  allowHeaders: 'Content-Type, X-Installer-Key' as const,
  unreachableError: 'survey-engine unreachable' as const,
  unavailableError: 'Installer profile unavailable' as const,
  fetchTimeoutMs: 8000,
  unauthorizedStatus: 401,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

export function resolveSurveyInstallerMeEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyInstallerMeEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}/installer/me`;
}

export function buildSurveyInstallerMeHeaders(installerKey: string): HeadersInit {
  return installerKey ? { [SURVEY_INSTALLER_ME_PROBE.installerKeyHeader]: installerKey } : {};
}

export function buildSurveyInstallerMeSuccessPayload(data: Record<string, unknown>) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    ...data,
  };
}

export function surveyInstallerMeHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_INSTALLER_ME_PROBE.unauthorizedStatus
    ? SURVEY_INSTALLER_ME_PROBE.unauthorizedStatus
    : SURVEY_INSTALLER_ME_PROBE.engineErrorStatus;
}

export function surveyInstallerMeErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
    return (data as { detail: string }).detail;
  }
  return SURVEY_INSTALLER_ME_PROBE.unavailableError;
}