/** Canonical precache + offline manifest for survey technician PWA. */

export const SURVEY_OFFLINE_SCHEMA = 'solaris-survey-offline-v1';

export const SURVEY_OFFLINE_PREFETCH_URLS = [
  '/survey',
  '/offline-ro.html',
  '/offline-image.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
] as const;

export const SURVEY_INDEXEDDB_NAME = 'solaris-survey-v1';

export type SurveyOfflineManifest = {
  schema: string;
  prefetch_urls: string[];
  queue_supported: boolean;
  indexeddb_schema: string;
  draft_autosave_ms: number;
  max_queue_items: number;
};

export function buildSurveyOfflineManifest(engineHints?: Partial<SurveyOfflineManifest>): SurveyOfflineManifest {
  return {
    schema: SURVEY_OFFLINE_SCHEMA,
    prefetch_urls: [...SURVEY_OFFLINE_PREFETCH_URLS],
    queue_supported: true,
    indexeddb_schema: SURVEY_INDEXEDDB_NAME,
    draft_autosave_ms: 600,
    max_queue_items: 20,
    ...engineHints,
  };
}