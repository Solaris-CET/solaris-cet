// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  buildSurveyContactUrl,
  buildSurveyQuoteMessage,
  extractSurveyReportId,
  kwpToPowerOption,
  parseContactSearchParams,
  surveyRoofToContactRoof,
} from '@/lib/contactPrefill';

describe('contactPrefill', () => {
  it('maps kWp to power tiers', () => {
    expect(kwpToPowerOption(3)).toBe('sub-5kw');
    expect(kwpToPowerOption(7)).toBe('5-10kw');
    expect(kwpToPowerOption(25)).toBe('10-50kw');
    expect(kwpToPowerOption(60)).toBe('peste-50kw');
  });

  it('builds survey contact URL with report context', () => {
    const url = buildSurveyContactUrl({
      reportId: 'SOL-2026-0042',
      clientName: 'Ion Popescu',
      clientPhone: '0722000000',
      clientCity: 'Iași',
      capacityKwp: 6.5,
      score: 82,
      roofType: 'tile',
      pdfFilename: 'report.pdf',
    });
    expect(url).toContain('/contact?');
    expect(url).toContain('from=survey');
    expect(url).toContain('report_id=SOL-2026-0042');
    expect(url).toContain('name=Ion');
  });

  it('parses survey query into form prefill', () => {
    const prefill = parseContactSearchParams(
      '?from=survey&report_id=SOL-1&name=Maria&city=Vaslui&kwp=8&score=75&roof=metal&phone=0722111111',
    );
    expect(prefill.source).toBe('survey');
    expect(prefill.name).toBe('Maria');
    expect(prefill.locality).toBe('Vaslui');
    expect(prefill.serviceType).toBe('fotovoltaic-rezidential');
    expect(prefill.power).toBe('5-10kw');
    expect(prefill.roofType).toBe('tabla-plata');
    expect(prefill.message).toContain('SOL-1');
  });

  it('parses calculator query params', () => {
    const prefill = parseContactSearchParams('?service=fotovoltaice&consum=400&judet=Vaslui&putere=6&pret=12000');
    expect(prefill.source).toBe('calculator');
    expect(prefill.locality).toBe('Vaslui');
    expect(prefill.power).toBe('5-10kw');
    expect(prefill.message).toContain('400');
  });

  it('maps survey roof types', () => {
    expect(surveyRoofToContactRoof('tile')).toBe('tigla');
    expect(surveyRoofToContactRoof('flat')).toBe('membrana');
  });

  it('builds quote message from survey metadata', () => {
    const msg = buildSurveyQuoteMessage({ reportId: 'SOL-9', score: 90, capacityKwp: 10, pdfFilename: 'x.pdf' });
    expect(msg).toContain('SOL-9');
    expect(msg).toContain('90/100');
    expect(msg).toContain('x.pdf');
  });

  it('extracts survey report id from quote message', () => {
    const msg = buildSurveyQuoteMessage({ reportId: 'SOL-2026-0042', score: 80, capacityKwp: 6 });
    expect(extractSurveyReportId(msg)).toBe('SOL-2026-0042');
    expect(extractSurveyReportId('fără legătură')).toBeNull();
  });
});