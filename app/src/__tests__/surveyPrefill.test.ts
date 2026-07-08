import { describe, expect, it } from 'vitest';

import {
  applySurveyPrefill,
  buildCalculatorSurveyUrl,
  calculatorRoofToSurvey,
  DEFAULT_SURVEY_ROOF_TYPE,
  hasSurveyPrefill,
  isSurveyPrefillSource,
  KWP_TO_AREA_FACTOR,
  parseSurveySearchParams,
  SURVEY_PREFILL_PATH,
} from '@/lib/surveyPrefill';
import type { SurveyFormData } from '@/lib/surveyApi';

const baseForm: SurveyFormData = {
  clientName: '',
  clientAddress: '',
  clientCity: '',
  clientPostal: '',
  clientPhone: '',
  clientEmail: '',
  jurisdictionCode: '',
  siteLatitude: null,
  siteLongitude: null,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 35,
  usableAreaM2: 40,
  annualConsumptionKwh: 4800,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: '',
  premium: false,
  checklist: {
    struct: 'pass',
    electric: 'pass',
    shading: 'warning',
    access: 'pass',
    docs: 'pass',
    compliance: 'warning',
  },
};

describe('surveyPrefill', () => {
  it('parseSurveySearchParams ignores non-calculator', () => {
    expect(parseSurveySearchParams('?from=survey&city=Cluj')).toEqual({});
    expect(parseSurveySearchParams('')).toEqual({});
  });

  it('parseSurveySearchParams maps calculator params', () => {
    const p = parseSurveySearchParams('?from=calculator&judet=Vaslui&consum=400&putere=6&roof=tigla');
    expect(p.source).toBe('calculator');
    expect(p.clientCity).toBe('Vaslui');
    expect(p.annualConsumptionKwh).toBe(4800);
    expect(p.usableAreaM2).toBe(6 * KWP_TO_AREA_FACTOR);
    expect(p.roofType).toBe('tile');
  });

  it('parseSurveySearchParams accepts city and acoperis aliases', () => {
    const p = parseSurveySearchParams('?from=calculator&city=Cluj&acoperis=membrana&suprafata=55');
    expect(p.clientCity).toBe('Cluj');
    expect(p.usableAreaM2).toBe(55);
    expect(p.roofType).toBe('flat');
  });

  it('applySurveyPrefill merges into form', () => {
    const merged = applySurveyPrefill(baseForm, {
      source: 'calculator',
      clientCity: 'Iași',
      annualConsumptionKwh: 6000,
    });
    expect(merged.clientCity).toBe('Iași');
    expect(merged.annualConsumptionKwh).toBe(6000);
  });

  it('applySurveyPrefill returns original form when prefill is empty', () => {
    expect(applySurveyPrefill(baseForm, { source: 'calculator' })).toBe(baseForm);
    expect(hasSurveyPrefill({ source: 'calculator' })).toBe(false);
  });

  it('calculatorRoofToSurvey maps known roofs and defaults unknown', () => {
    expect(calculatorRoofToSurvey('membrana')).toBe('flat');
    expect(calculatorRoofToSurvey('tabla-plata')).toBe('metal');
    expect(calculatorRoofToSurvey('necunoscut')).toBe(DEFAULT_SURVEY_ROOF_TYPE);
  });

  it('isSurveyPrefillSource narrows valid sources', () => {
    expect(isSurveyPrefillSource('calculator')).toBe(true);
    expect(isSurveyPrefillSource('contact')).toBe(true);
    expect(isSurveyPrefillSource('other')).toBe(false);
  });

  it('buildCalculatorSurveyUrl encodes params on canonical survey path', () => {
    const url = buildCalculatorSurveyUrl({ judet: 'București', consumKwhMonth: 350, putereKwp: 5 });
    expect(url.startsWith(`${SURVEY_PREFILL_PATH}?`)).toBe(true);
    expect(url).toContain('from=calculator');
    expect(url).toContain('judet=');
    expect(url).toContain('consum=350');
    expect(url).toContain('putere=5');
  });
});