/** Bridge copy — keep aligned with `app/src/lib/surveyOfflineManifest.ts`. */

import { resolveSurveyEngineUrl, SURVEY_HEALTH_PROBE } from './surveyHealth';

export const SURVEY_OFFLINE_MANIFEST_PATH = '/api/survey/offline-manifest';
export const SURVEY_OFFLINE_MANIFEST_METHODS = 'GET, OPTIONS';

export const SURVEY_OFFLINE_MANIFEST_PROBE = {
  path: SURVEY_OFFLINE_MANIFEST_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  cacheControl: 'public, max-age=300' as const,
  offlineHintsPath: '/offline-hints' as const,
  fetchTimeoutMs: 5000,
};

export const SURVEY_OFFLINE_SCHEMA = 'solaris-survey-offline-v1';

export const SURVEY_OFFLINE_PREFETCH_URLS = [
  '/survey',
  '/offline-ro.html',
  '/offline-image.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
] as const;

export type SurveyOfflineManifest = {
  schema: string;
  prefetch_urls: string[];
  queue_supported: boolean;
  indexeddb_schema: string;
  draft_autosave_ms: number;
  max_queue_items: number;
};

export function buildSurveyOfflineManifest(
  engineHints?: Partial<SurveyOfflineManifest>,
): SurveyOfflineManifest {
  return {
    schema: SURVEY_OFFLINE_SCHEMA,
    prefetch_urls: [...SURVEY_OFFLINE_PREFETCH_URLS],
    queue_supported: true,
    indexeddb_schema: 'solaris-survey-v1',
    draft_autosave_ms: 600,
    max_queue_items: 20,
    ...engineHints,
  };
}

export function resolveSurveyOfflineManifestEngineUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveSurveyEngineUrl(env);
}

export function buildSurveyOfflineHintsEngineUrl(engineUrl: string): string {
  return `${engineUrl.replace(/\/$/, '')}${SURVEY_OFFLINE_MANIFEST_PROBE.offlineHintsPath}`;
}

export function buildSurveyOfflineManifestResponse(manifest: SurveyOfflineManifest) {
  return {
    platform: SURVEY_HEALTH_PROBE.platform,
    manifest,
  };
}

export async function fetchSurveyOfflineEngineHints(
  engineUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<Partial<SurveyOfflineManifest> | undefined> {
  try {
    const res = await fetchFn(buildSurveyOfflineHintsEngineUrl(engineUrl), {
      signal: AbortSignal.timeout(SURVEY_OFFLINE_MANIFEST_PROBE.fetchTimeoutMs),
    });
    if (!res.ok) return undefined;
    const engineHints = (await res.json()) as Record<string, unknown>;
    return engineHints.schema ? (engineHints as Partial<SurveyOfflineManifest>) : undefined;
  } catch {
    return undefined;
  }
}