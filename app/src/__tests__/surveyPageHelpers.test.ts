// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  canGenerateSurvey,
  checklistStatusLabel,
  isSurveyTab,
  scoreRingColor,
  SURVEY_PAGE_MESSAGES,
  SURVEY_PAGE_TITLE,
  surveyTabLabel,
  toSurveyPageError,
} from '@/lib/surveyPageHelpers';

describe('surveyPageHelpers', () => {
  it('canGenerateSurvey requires photos and client fields', () => {
    expect(canGenerateSurvey('Ion', 'Cluj', 1)).toBe(true);
    expect(canGenerateSurvey('I', 'Cluj', 1)).toBe(false);
    expect(canGenerateSurvey('Ion', 'C', 1)).toBe(false);
    expect(canGenerateSurvey('Ion', 'Cluj', 0)).toBe(false);
  });

  it('checklistStatusLabel and surveyTabLabel return Romanian labels', () => {
    expect(checklistStatusLabel('warning')).toBe('Atenție');
    expect(surveyTabLabel('dashboard')).toBe('Dashboard');
  });

  it('scoreRingColor maps score bands', () => {
    expect(scoreRingColor(80)).toBe('#22c55e');
    expect(scoreRingColor(60)).toBe('#fbbf24');
    expect(scoreRingColor(30)).toBe('#f87171');
  });

  it('toSurveyPageError prefers Error message', () => {
    expect(toSurveyPageError(new Error('fail'), 'fallback')).toBe('fail');
    expect(toSurveyPageError('x', 'fallback')).toBe('fallback');
  });

  it('isSurveyTab narrows tab ids', () => {
    expect(isSurveyTab('report')).toBe(true);
    expect(isSurveyTab('settings')).toBe(false);
  });

  it('exports page copy constants', () => {
    expect(SURVEY_PAGE_TITLE).toContain('șantier');
    expect(SURVEY_PAGE_MESSAGES.calcPrefillNote).toContain('calculator');
  });
});