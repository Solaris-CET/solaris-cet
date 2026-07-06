import { describe, expect, it } from 'vitest';

import {
  SURVEY_OFFLINE_PREFETCH_URLS,
  SURVEY_OFFLINE_SCHEMA,
  buildSurveyOfflineManifest,
} from '@/lib/surveyOfflineManifest';

describe('surveyOfflineManifest', () => {
  it('builds default manifest', () => {
    const m = buildSurveyOfflineManifest();
    expect(m.schema).toBe(SURVEY_OFFLINE_SCHEMA);
    expect(m.queue_supported).toBe(true);
    expect(m.prefetch_urls).toContain('/survey');
  });

  it('prefetch urls include offline shell', () => {
    expect(SURVEY_OFFLINE_PREFETCH_URLS).toContain('/offline-ro.html');
  });
});