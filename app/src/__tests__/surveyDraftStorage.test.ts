// @vitest-environment node
import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearSurveyDraft,
  createPendingReportId,
  DEFAULT_PHOTO_NAME,
  DEFAULT_PHOTO_TYPE,
  DRAFT_STORE,
  enqueuePendingReport,
  isPendingReportStatus,
  listPendingReports,
  loadSurveyDraft,
  photosToStored,
  queueStatusLabel,
  QUEUE_STORE,
  removePendingReport,
  saveSurveyDraft,
  storedToPhotos,
  SURVEY_DB_NAME,
  SURVEY_DRAFT_KEY,
  SURVEY_DRAFT_SCHEMA,
  updatePendingReport,
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

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(SURVEY_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

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

  it('applies default photo name and type', () => {
    const file = new File(['x'], '', { type: '' });
    const stored = photosToStored([file]);
    expect(stored[0]?.name).toBe(DEFAULT_PHOTO_NAME);
    expect(stored[0]?.type).toBe(DEFAULT_PHOTO_TYPE);
  });

  it('createPendingReportId is deterministic with injected timestamp', () => {
    expect(createPendingReportId(1_700_000_000_000)).toBe('pending-1700000000000');
  });

  it('isPendingReportStatus narrows valid queue statuses', () => {
    expect(isPendingReportStatus('pending')).toBe(true);
    expect(isPendingReportStatus('syncing')).toBe(true);
    expect(isPendingReportStatus('unknown')).toBe(false);
  });

  it('queueStatusLabel returns Romanian labels for screen readers', () => {
    expect(queueStatusLabel('pending')).toBe('În așteptare');
    expect(queueStatusLabel('failed')).toBe('Eșuat');
  });

  it('exports schema aligned with offline manifest', () => {
    expect(SURVEY_DRAFT_SCHEMA).toBe('solaris-survey-draft-v1');
    expect(SURVEY_DRAFT_KEY).toBe('current');
    expect(DRAFT_STORE).toBe('drafts');
    expect(QUEUE_STORE).toBe('queue');
  });
});

describe('surveyDraftStorage IndexedDB', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('saveSurveyDraft and loadSurveyDraft round-trip draft record', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' });
    const photos = [new File([blob], 'site.jpg', { type: 'image/jpeg' })];

    await saveSurveyDraft(SAMPLE_FORM, SAMPLE_INSTALLER, photos);
    const loaded = await loadSurveyDraft();

    expect(loaded).not.toBeNull();
    expect(loaded?.key).toBe(SURVEY_DRAFT_KEY);
    expect(loaded?.form.clientName).toBe('Ion Popescu');
    expect(loaded?.installer.installerId).toBe('INST-001');
    expect(loaded?.photos).toHaveLength(1);
    expect(loaded?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('clearSurveyDraft removes saved draft', async () => {
    await saveSurveyDraft(SAMPLE_FORM, SAMPLE_INSTALLER, []);
    await clearSurveyDraft();
    expect(await loadSurveyDraft()).toBeNull();
  });

  it('enqueuePendingReport, list, update, and remove manage queue', async () => {
    const id = await enqueuePendingReport(SAMPLE_FORM, SAMPLE_INSTALLER, [], 'pending-test-1');
    expect(id).toBe('pending-test-1');

    let items = await listPendingReports();
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('pending');
    expect(items[0]?.retryCount).toBe(0);

    await updatePendingReport(id, { status: 'failed', retryCount: 2, lastError: 'timeout' });
    items = await listPendingReports();
    expect(items[0]?.status).toBe('failed');
    expect(items[0]?.retryCount).toBe(2);
    expect(items[0]?.lastError).toBe('timeout');

    await removePendingReport(id);
    expect(await listPendingReports()).toHaveLength(0);
  });

  it('updatePendingReport is a no-op for missing ids', async () => {
    await updatePendingReport('missing-id', { status: 'failed' });
    expect(await listPendingReports()).toHaveLength(0);
  });

  it('listPendingReports returns empty array when queue read fails', async () => {
    await resetDb();
    expect(await listPendingReports()).toEqual([]);
  });
});