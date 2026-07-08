import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_FILES_PATH = '/api/survey/files';
export const SURVEY_FILES_METHODS = 'GET, OPTIONS';

export const SURVEY_FILES_PROBE = {
  path: SURVEY_FILES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  fileParam: 'file' as const,
  invalidFileError: 'Invalid file parameter' as const,
  notFoundError: 'File not found' as const,
  unreachableError: 'survey-engine unreachable' as const,
  fetchTimeoutMs: 30_000,
  cacheControl: 'private, max-age=3600' as const,
  pdfMediaType: 'application/pdf' as const,
  jsonMediaType: 'application/json' as const,
  notFoundStatus: 404,
  unreachableStatus: 503,
  engineErrorStatus: 502,
};

const SAFE_FILE_REGEX = /^[A-Za-z0-9._/-]+$/;

export function safeSurveyFilePath(raw: string | null | undefined): string | null {
  const name = (raw ?? '').trim().replace(/\\/g, '/');
  if (!name || name.includes('..') || name.startsWith('/')) return null;
  if (!SAFE_FILE_REGEX.test(name)) return null;
  return name;
}

export function resolveSurveyFilesEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyFilesEngineUrl(engineUrl: string, file: string): string {
  const enginePath = file.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${engineUrl.replace(/\/$/, '')}/files/${enginePath}`;
}

export function surveyFileMediaType(file: string): string {
  return file.toLowerCase().endsWith('.pdf')
    ? SURVEY_FILES_PROBE.pdfMediaType
    : SURVEY_FILES_PROBE.jsonMediaType;
}

export function buildSurveyFilesUnreachablePayload(engineUrl: string) {
  return {
    error: SURVEY_FILES_PROBE.unreachableError,
    engine_url: engineUrl,
    platform: SURVEY_HEALTH_PROBE.platform,
  };
}

export function surveyFilesHttpStatus(engineStatus: number): number {
  return engineStatus === SURVEY_FILES_PROBE.notFoundStatus
    ? SURVEY_FILES_PROBE.notFoundStatus
    : SURVEY_FILES_PROBE.engineErrorStatus;
}