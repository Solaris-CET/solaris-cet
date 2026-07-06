// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildGenerateFormData, type InstallerProfile, type SurveyFormData } from '@/lib/surveyApi';

const form: SurveyFormData = {
  clientName: 'Maria',
  clientAddress: 'Str 1',
  clientCity: 'Cluj',
  clientPostal: '400001',
  clientPhone: '+40722123456',
  clientEmail: 'maria@test.ro',
  jurisdictionCode: 'RO-CJ',
  siteLatitude: 46.77,
  siteLongitude: 23.59,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 35,
  usableAreaM2: 42,
  annualConsumptionKwh: 4800,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: 'OK',
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

const installer: InstallerProfile = {
  installerId: 'INST-42',
  installerName: 'Alex',
  company: 'Solaris CET',
};

describe('surveyApi', () => {
  it('buildGenerateFormData maps fields for multipart upload', () => {
    const file = new File(['x'], 'roof.jpg', { type: 'image/jpeg' });
    const fd = buildGenerateFormData([file], form, installer);
    expect(fd.get('client_name')).toBe('Maria');
    expect(fd.get('installer_id')).toBe('INST-42');
    expect(fd.get('jurisdiction_code')).toBe('RO-CJ');
    expect(fd.get('site_latitude')).toBe('46.77');
    expect(fd.get('site_longitude')).toBe('23.59');
    expect(fd.get('chk_shading')).toBe('warning');
    expect(fd.get('photos')).toBeInstanceOf(File);
  });
});