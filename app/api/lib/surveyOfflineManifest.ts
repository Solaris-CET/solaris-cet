/** Bridge copy — keep aligned with `app/src/lib/surveyOfflineManifest.ts`. */

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