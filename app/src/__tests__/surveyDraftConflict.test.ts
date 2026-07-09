import { describe, expect, it } from 'vitest';

import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import {
  buildDraftPayload,
  createDraftVersionVector,
  detectDraftConflicts,
  mergePhotoNames,
  mergeSurveyDrafts,
  resolveConflictChoice,
} from '@/lib/surveyDraftConflict';

const baseForm: SurveyFormData = {
  clientName: 'Ion',
  clientAddress: 'Str. 1',
  clientCity: 'Cluj',
  clientPostal: '400001',
  clientPhone: '0700000000',
  clientEmail: 'ion@test.com',
  jurisdictionCode: '',
  siteLatitude: null,
  siteLongitude: null,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 30,
  usableAreaM2: 40,
  annualConsumptionKwh: 5000,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: '',
  premium: false,
  checklist: {
    struct: 'pass',
    electric: 'pass',
    shading: 'pass',
    access: 'pass',
    docs: 'pass',
    compliance: 'pass',
  },
};

const installer: InstallerProfile = {
  installerId: 'INST-1',
  installerName: 'Tech',
  company: 'Solaris',
};

function payload(
  form: SurveyFormData,
  fieldClocks: Record<string, number>,
  deviceId = 'device-a',
): ReturnType<typeof buildDraftPayload> {
  const version = createDraftVersionVector(deviceId);
  version.fieldClocks = fieldClocks;
  version.clock = Math.max(0, ...Object.values(fieldClocks), 1);
  return buildDraftPayload(form, installer, [], version, '2026-07-09T12:00:00.000Z');
}

describe('surveyDraftConflict', () => {
  it('auto-merges non-overlapping field edits by lamport clock', () => {
    const localForm = { ...baseForm, clientCity: 'Cluj' };
    const remoteForm = { ...baseForm, clientPhone: '0711111111' };

    const local = payload(localForm, { 'form.clientCity': 2 });
    const remote = payload(remoteForm, { 'form.clientPhone': 3 });

    const merged = mergeSurveyDrafts(local, remote);
    expect(merged.resolution).toBe('auto_merged');
    expect(merged.conflicts).toHaveLength(0);
    expect(merged.form.clientCity).toBe('Cluj');
    expect(merged.form.clientPhone).toBe('0711111111');
  });

  it('detects conflict when same field edited on two devices', () => {
    const localForm = { ...baseForm, clientCity: 'Cluj' };
    const remoteForm = { ...baseForm, clientCity: 'București' };

    const local = payload(localForm, { 'form.clientCity': 4 });
    const remote = payload(remoteForm, { 'form.clientCity': 5 });

    const conflicts = detectDraftConflicts(local, remote);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].path).toBe('form.clientCity');

    const merged = mergeSurveyDrafts(local, remote);
    expect(merged.resolution).toBe('conflict');
  });

  it('union photo names without loss', () => {
    expect(mergePhotoNames(['a.jpg', 'b.jpg'], ['b.jpg', 'c.jpg'])).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('resolveConflictChoice applies local or remote pick', () => {
    const localForm = { ...baseForm, clientCity: 'Cluj' };
    const remoteForm = { ...baseForm, clientCity: 'București' };
    const local = payload(localForm, { 'form.clientCity': 4 });
    const remote = payload(remoteForm, { 'form.clientCity': 5 });
    const merged = mergeSurveyDrafts(local, remote);

    const resolved = resolveConflictChoice(merged, 'form.clientCity', 'remote', local, remote);
    expect(resolved.form.clientCity).toBe('București');
    expect(resolved.conflicts).toHaveLength(0);
  });
});