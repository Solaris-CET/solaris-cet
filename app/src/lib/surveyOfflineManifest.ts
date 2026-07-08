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

export const DEFAULT_DRAFT_AUTOSAVE_MS = 600;
export const DEFAULT_MAX_QUEUE_ITEMS = 20;

export type SurveyOfflineManifest = {
  schema: string;
  prefetch_urls: string[];
  queue_supported: boolean;
  indexeddb_schema: string;
  draft_autosave_ms: number;
  max_queue_items: number;
};

export function isSurveyOfflineManifest(value: unknown): value is SurveyOfflineManifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as SurveyOfflineManifest;
  return (
    m.schema === SURVEY_OFFLINE_SCHEMA &&
    Array.isArray(m.prefetch_urls) &&
    m.prefetch_urls.length > 0 &&
    typeof m.queue_supported === 'boolean' &&
    m.indexeddb_schema === SURVEY_INDEXEDDB_NAME &&
    typeof m.draft_autosave_ms === 'number' &&
    typeof m.max_queue_items === 'number'
  );
}

export function offlineShellUrl(): string {
  return '/offline-ro.html';
}

export function manifestPrefetchCount(manifest: SurveyOfflineManifest): number {
  return manifest.prefetch_urls.length;
}

export function buildSurveyOfflineManifest(engineHints?: Partial<SurveyOfflineManifest>): SurveyOfflineManifest {
  return {
    schema: SURVEY_OFFLINE_SCHEMA,
    prefetch_urls: [...SURVEY_OFFLINE_PREFETCH_URLS],
    queue_supported: true,
    indexeddb_schema: SURVEY_INDEXEDDB_NAME,
    draft_autosave_ms: DEFAULT_DRAFT_AUTOSAVE_MS,
    max_queue_items: DEFAULT_MAX_QUEUE_ITEMS,
    ...engineHints,
  };
}