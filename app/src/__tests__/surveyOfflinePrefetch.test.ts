// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  isProbeSurveyShellResult,
  MAX_PREFETCH_URLS,
  mergePrefetchUrls,
  PREFETCH_MESSAGE_TYPE,
  PROBE_SURVEY_SHELL_RESULT_TYPE,
  PROBE_SURVEY_SHELL_TIMEOUT_MS,
  PROBE_SURVEY_SHELL_TYPE,
} from '@/lib/surveyOfflinePrefetch';
import { SURVEY_OFFLINE_PREFETCH_URLS } from '@/lib/surveyOfflineManifest';

describe('surveyOfflinePrefetch', () => {
  it('mergePrefetchUrls caps at MAX_PREFETCH_URLS', () => {
    const extras = Array.from({ length: 80 }, (_, i) => `/extra-${i}`);
    const merged = mergePrefetchUrls(extras);
    expect(merged.length).toBe(MAX_PREFETCH_URLS);
    expect(merged[0]).toBe(SURVEY_OFFLINE_PREFETCH_URLS[0]);
  });

  it('exports stable SW message types', () => {
    expect(PREFETCH_MESSAGE_TYPE).toBe('PREFETCH_URLS');
    expect(PROBE_SURVEY_SHELL_TYPE).toBe('PROBE_SURVEY_SHELL');
    expect(PROBE_SURVEY_SHELL_RESULT_TYPE).toBe('PROBE_SURVEY_SHELL_RESULT');
    expect(PROBE_SURVEY_SHELL_TIMEOUT_MS).toBe(4000);
  });

  it('isProbeSurveyShellResult validates probe payload', () => {
    expect(isProbeSurveyShellResult({ type: PROBE_SURVEY_SHELL_RESULT_TYPE, ok: true })).toBe(true);
    expect(isProbeSurveyShellResult({ type: 'OTHER' })).toBe(false);
    expect(isProbeSurveyShellResult(null)).toBe(false);
  });
});