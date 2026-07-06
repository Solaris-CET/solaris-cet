import { describe, expect, it } from 'vitest';

import {
  applySurveyPrefill,
  buildCalculatorSurveyUrl,
  calculatorRoofToSurvey,
  parseSurveySearchParams,
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
  });

  it('parseSurveySearchParams maps calculator params', () => {
    const p = parseSurveySearchParams('?from=calculator&judet=Vaslui&consum=400&putere=6&roof=tigla');
    expect(p.source).toBe('calculator');
    expect(p.clientCity).toBe('Vaslui');
    expect(p.annualConsumptionKwh).toBe(4800);
    expect(p.usableAreaM2).toBe(42);
    expect(p.roofType).toBe('tile');
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

  it('calculatorRoofToSurvey maps known roofs', () => {
    expect(calculatorRoofToSurvey('membrana')).toBe('flat');
    expect(calculatorRoofToSurvey('tabla-plata')).toBe('metal');
  });

  it('buildCalculatorSurveyUrl encodes params', () => {
    const url = buildCalculatorSurveyUrl({ judet: 'București', consumKwhMonth: 350, putereKwp: 5 });
    expect(url).toContain('from=calculator');
    expect(url).toContain('judet=');
    expect(url).toContain('consum=350');
    expect(url).toContain('putere=5');
  });
});