import { SURVEY_ROUTE_IDS, surveyBridgePath } from './surveyOpenApi';

export const SERVER_OPENAPI_SURVEY_PATH = '/api/openapi/survey';

export const SERVER_ADMIN_SURVEY_PATHS = [
  '/api/admin/survey-insights',
  '/api/admin/installers',
] as const;

export function expectedSurveyBridgePaths(): string[] {
  return SURVEY_ROUTE_IDS.map(surveyBridgePath);
}

export function missingPathsInSource(source: string, paths: readonly string[]): string[] {
  return paths.filter((path) => !source.includes(path));
}

/** Extract `/api/...` keys from `server/index.cjs` SURVEY_ROUTES tuples. */
export function parseServerSurveyRoutePaths(source: string): string[] {
  const paths: string[] = [];
  const pattern = /\['(\/api\/[^']+)',\s*'api\/[^']+'\]/g;
  for (const match of source.matchAll(pattern)) {
    const path = match[1];
    if (path?.startsWith('/api/survey/') || path === SERVER_OPENAPI_SURVEY_PATH) {
      paths.push(path);
    }
  }
  return paths;
}

export function duplicatePaths(paths: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const path of paths) {
    if (seen.has(path)) dupes.push(path);
    seen.add(path);
  }
  return dupes;
}