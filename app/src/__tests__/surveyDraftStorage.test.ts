// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  photosToStored,
  storedToPhotos,
  type StoredPhoto,
} from '@/lib/surveyDraftStorage';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';

const SAMPLE_FORM: SurveyFormData = {
  clientName: 'Ion Popescu',
  clientAddress: 'Str. Soarelui 1',
  clientCity: 'Iași',
  clientPostal: '700001',
  clientPhone: '0722000000',
  clientEmail: 'ion@example.com',
  jurisdictionCode: '',
  siteLatitude: null,
  siteLongitude: null,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 35,
  usableAreaM2: 42,
  annualConsumptionKwh: 4800,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: 'Structură OK',
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

const SAMPLE_INSTALLER: InstallerProfile = {
  installerId: 'INST-001',
  installerName: 'Alex P.',
  company: 'Solaris CET',
};

describe('surveyDraftStorage helpers', () => {
  it('round-trips photos through stored format', () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const file = new File([blob], 'roof.jpg', { type: 'image/jpeg' });
    const stored = photosToStored([file]);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.name).toBe('roof.jpg');
    expect(stored[0]?.type).toBe('image/jpeg');

    const restored = storedToPhotos(stored as StoredPhoto[]);
    expect(restored[0]?.name).toBe('roof.jpg');
    expect(restored[0]?.type).toBe('image/jpeg');
    expect(restored[0]?.size).toBe(blob.size);
  });

  it('preserves form and installer shapes for queue payloads', () => {
    const payload = {
      form: SAMPLE_FORM,
      installer: SAMPLE_INSTALLER,
    };
    expect(payload.form.clientName).toBe('Ion Popescu');
    expect(payload.installer.installerId).toBe('INST-001');
  });
});