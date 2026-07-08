import { describe, expect, it } from 'vitest';

import {
  buildSurveyOfflineManifest,
  DEFAULT_DRAFT_AUTOSAVE_MS,
  DEFAULT_MAX_QUEUE_ITEMS,
  isSurveyOfflineManifest,
  manifestPrefetchCount,
  offlineShellUrl,
  SURVEY_INDEXEDDB_NAME,
  SURVEY_OFFLINE_PREFETCH_URLS,
  SURVEY_OFFLINE_SCHEMA,
} from '@/lib/surveyOfflineManifest';

describe('surveyOfflineManifest', () => {
  it('builds default manifest', () => {
    const m = buildSurveyOfflineManifest();
    expect(m.schema).toBe(SURVEY_OFFLINE_SCHEMA);
    expect(m.queue_supported).toBe(true);
    expect(m.prefetch_urls).toContain('/survey');
    expect(m.indexeddb_schema).toBe(SURVEY_INDEXEDDB_NAME);
    expect(m.draft_autosave_ms).toBe(DEFAULT_DRAFT_AUTOSAVE_MS);
    expect(m.max_queue_items).toBe(DEFAULT_MAX_QUEUE_ITEMS);
  });

  it('prefetch urls include offline shell', () => {
    expect(SURVEY_OFFLINE_PREFETCH_URLS).toContain('/offline-ro.html');
    expect(offlineShellUrl()).toBe('/offline-ro.html');
  });

  it('merges engine hints without mutating defaults', () => {
    const m = buildSurveyOfflineManifest({ max_queue_items: 5, draft_autosave_ms: 900 });
    expect(m.max_queue_items).toBe(5);
    expect(m.draft_autosave_ms).toBe(900);
    expect(buildSurveyOfflineManifest().max_queue_items).toBe(DEFAULT_MAX_QUEUE_ITEMS);
  });

  it('isSurveyOfflineManifest validates shape', () => {
    const valid = buildSurveyOfflineManifest();
    expect(isSurveyOfflineManifest(valid)).toBe(true);
    expect(isSurveyOfflineManifest({ ...valid, schema: 'other' })).toBe(false);
    expect(isSurveyOfflineManifest(null)).toBe(false);
  });

  it('manifestPrefetchCount reports prefetch list size', () => {
    const m = buildSurveyOfflineManifest();
    expect(manifestPrefetchCount(m)).toBe(SURVEY_OFFLINE_PREFETCH_URLS.length);
  });
});