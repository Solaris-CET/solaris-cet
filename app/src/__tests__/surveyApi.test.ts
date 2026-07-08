// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  API_ERRORS,
  apiErrorMessage,
  buildBatchFormData,
  buildGenerateFormData,
  fetchJurisdictions,
  fetchTwinFeed,
  generateSurveyReport,
  type InstallerProfile,
  type SurveyFormData,
} from '@/lib/surveyApi';

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

describe('surveyApi helpers', () => {
  it('apiErrorMessage prefers error then detail then fallback', () => {
    expect(apiErrorMessage({ error: 'Eroare API' }, API_ERRORS.generate)).toBe('Eroare API');
    expect(apiErrorMessage({ detail: 'Detaliu' }, API_ERRORS.generate)).toBe('Detaliu');
    expect(apiErrorMessage({}, API_ERRORS.generate)).toBe(API_ERRORS.generate);
  });

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

  it('buildGenerateFormData omits optional GPS and jurisdiction when empty', () => {
    const fd = buildGenerateFormData(
      [],
      {
        ...form,
        jurisdictionCode: '',
        siteLatitude: null,
        siteLongitude: null,
      },
      installer,
    );
    expect(fd.get('jurisdiction_code')).toBeNull();
    expect(fd.get('site_latitude')).toBeNull();
    expect(fd.get('site_longitude')).toBeNull();
  });

  it('buildBatchFormData serializes manifest and photos', () => {
    const photo = new File(['p'], 'batch.jpg', { type: 'image/jpeg' });
    const fd = buildBatchFormData(
      [{ job_id: 'j1', client_name: 'Batch Client' }],
      [photo],
    );
    expect(JSON.parse(String(fd.get('manifest')))).toEqual([
      { job_id: 'j1', client_name: 'Batch Client' },
    ]);
    expect(fd.get('photos')).toBeInstanceOf(File);
  });
});

describe('surveyApi fetch clients', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('fetchJurisdictions returns list on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ jurisdictions: [{ code: 'RO-CJ', name: 'Cluj', grid_operator: 'EON' }] }),
    });

    const rows = await fetchJurisdictions();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.code).toBe('RO-CJ');
  });

  it('fetchJurisdictions throws localized error on failure', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(fetchJurisdictions()).rejects.toThrow(API_ERRORS.jurisdictions);
  });

  it('generateSurveyReport sends installer key and parses success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ report_id: 'SOL-99', score: 80 }),
    });

    const result = await generateSurveyReport(
      [],
      form,
      { ...installer, installerApiKey: 'secret-key' },
    );

    expect(result.report_id).toBe('SOL-99');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['X-Installer-Key']).toBe('secret-key');
  });

  it('generateSurveyReport throws API error message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Budget depășit' }),
    });

    await expect(generateSurveyReport([], form, installer)).rejects.toThrow('Budget depășit');
  });

  it('fetchTwinFeed returns feed payload', async () => {
    const feed = {
      schema: 'solaris-twin-feed-v1',
      feed_version: 1,
      generated_at: '2026-01-01',
      report_id: 'SOL-1',
      site: { client_name: 'A', city: 'B', latitude: 1, longitude: 2 },
      system: { capacity_kwp: 6, annual_kwh: 1, suitability_score: 80, premium_tier: false },
      low_confidence_count: 0,
      corrections_count: 0,
      corrections_recent: [],
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ feed }),
    });

    const result = await fetchTwinFeed('SOL-1');
    expect(result.report_id).toBe('SOL-1');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('report_id=SOL-1');
  });

  it('fetchTwinFeed throws when feed missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(fetchTwinFeed('SOL-1')).rejects.toThrow(API_ERRORS.twinFeedMissing);
  });
});