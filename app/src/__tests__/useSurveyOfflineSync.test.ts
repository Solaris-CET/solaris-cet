// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSurveyOfflineSync } from '@/hooks/useSurveyOfflineSync';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import type { SurveyDraftRecord } from '@/lib/surveyDraftStorage';

const form: SurveyFormData = {
  clientName: 'Test Client',
  clientAddress: 'Str. 1',
  clientCity: 'Cluj',
  clientPostal: '400001',
  clientPhone: '0700000000',
  clientEmail: 'test@example.com',
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

const draft: SurveyDraftRecord = {
  key: 'draft-1',
  form,
  installer,
  photos: [],
  updatedAt: '2026-07-07T08:00:00.000Z',
};

const getSurveyQueueStatsMock = vi.fn();
const loadSurveyDraftMock = vi.fn();
const saveSurveyDraftMock = vi.fn();
const enqueuePendingReportMock = vi.fn();
const listPendingReportsMock = vi.fn();
const updatePendingReportMock = vi.fn();
const removePendingReportMock = vi.fn();
const clearSurveyDraftMock = vi.fn();
const generateSurveyReportMock = vi.fn();
const prefetchSurveyOfflineAssetsMock = vi.fn();
const storedToPhotosMock = vi.fn();

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}));

vi.mock('@/lib/surveyOfflineQueue', () => ({
  getSurveyQueueStats: (...args: unknown[]) => getSurveyQueueStatsMock(...args),
}));

vi.mock('@/lib/surveyDraftStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/surveyDraftStorage')>();
  return {
    ...actual,
    loadSurveyDraft: (...args: unknown[]) => loadSurveyDraftMock(...args),
    saveSurveyDraft: (...args: unknown[]) => saveSurveyDraftMock(...args),
    enqueuePendingReport: (...args: unknown[]) => enqueuePendingReportMock(...args),
    listPendingReports: (...args: unknown[]) => listPendingReportsMock(...args),
    updatePendingReport: (...args: unknown[]) => updatePendingReportMock(...args),
    removePendingReport: (...args: unknown[]) => removePendingReportMock(...args),
    clearSurveyDraft: (...args: unknown[]) => clearSurveyDraftMock(...args),
    storedToPhotos: (...args: unknown[]) => storedToPhotosMock(...args),
  };
});

vi.mock('@/lib/surveyApi', () => ({
  generateSurveyReport: (...args: unknown[]) => generateSurveyReportMock(...args),
}));

vi.mock('@/lib/surveyOfflinePrefetch', () => ({
  prefetchSurveyOfflineAssets: (...args: unknown[]) => prefetchSurveyOfflineAssetsMock(...args),
}));

vi.mock('@/lib/surveyDraftSyncClient', () => ({
  fetchServerSurveyDraft: vi.fn().mockResolvedValue({ draft: null }),
  pushSurveyDraftSync: vi.fn().mockResolvedValue({ status: 'accepted', schema: 'v1' }),
}));

describe('useSurveyOfflineSync', () => {
  beforeEach(() => {
    getSurveyQueueStatsMock.mockResolvedValue({
      total: 0,
      pending: 0,
      failed: 0,
      oldestAt: null,
    });
    loadSurveyDraftMock.mockResolvedValue(draft);
    saveSurveyDraftMock.mockImplementation(async () => ({
      ...draft,
      updatedAt: new Date().toISOString(),
      draftId: 'inst-1:test',
      version: { deviceId: 'dev-test', clock: 1, fieldClocks: {} },
    }));
    enqueuePendingReportMock.mockResolvedValue(undefined);
    listPendingReportsMock.mockResolvedValue([]);
    updatePendingReportMock.mockResolvedValue(undefined);
    removePendingReportMock.mockResolvedValue(undefined);
    clearSurveyDraftMock.mockResolvedValue(undefined);
    generateSurveyReportMock.mockResolvedValue({ report_id: 'SOL-1' });
    storedToPhotosMock.mockReturnValue([]);
    prefetchSurveyOfflineAssetsMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads draft on mount and exposes online status', async () => {
    const onDraftLoaded = vi.fn();

    const { result } = renderHook(() =>
      useSurveyOfflineSync({
        form,
        installer,
        photos: [],
        onDraftLoaded,
      }),
    );

    await waitFor(() => {
      expect(result.current.draftReady).toBe(true);
    });

    expect(onDraftLoaded).toHaveBeenCalledWith(draft);
    expect(result.current.draftSavedAt).toBe(draft.updatedAt);
    expect(result.current.online).toBe(true);
    expect(prefetchSurveyOfflineAssetsMock).toHaveBeenCalled();
  });

  it('autosaves draft after debounce when draft is ready', async () => {
    renderHook(() =>
      useSurveyOfflineSync({
        form,
        installer,
        photos: [],
      }),
    );

    await waitFor(
      () => {
        expect(saveSurveyDraftMock).toHaveBeenCalled();
        const last = saveSurveyDraftMock.mock.calls.at(-1);
        expect(last?.[0]).toEqual(form);
        expect(last?.[1]).toEqual(installer);
        expect(last?.[2]).toEqual([]);
      },
      { timeout: 3000 },
    );
  });

  it('enqueues offline report and refreshes stats', async () => {
    getSurveyQueueStatsMock.mockResolvedValue({
      total: 1,
      pending: 1,
      failed: 0,
      oldestAt: '2026-07-07T09:00:00.000Z',
    });

    const { result } = renderHook(() =>
      useSurveyOfflineSync({
        form,
        installer,
        photos: [],
      }),
    );

    await waitFor(() => expect(result.current.draftReady).toBe(true));

    await act(async () => {
      await result.current.enqueueOffline();
    });

    expect(enqueuePendingReportMock).toHaveBeenCalledWith(form, installer, []);
    expect(result.current.stats.total).toBe(1);
  });

  it('syncs pending reports when syncPending is called', async () => {
    const onSynced = vi.fn();
    const pendingItem = {
      id: 'q1',
      form,
      installer,
      photos: [],
      createdAt: '2026-07-07T09:00:00.000Z',
      status: 'pending' as const,
      retryCount: 0,
    };

    listPendingReportsMock.mockResolvedValue([pendingItem]);

    const { result } = renderHook(() =>
      useSurveyOfflineSync({
        form,
        installer,
        photos: [],
        onSynced,
      }),
    );

    await waitFor(() => expect(result.current.draftReady).toBe(true));

    await act(async () => {
      await result.current.syncPending();
    });

    expect(generateSurveyReportMock).toHaveBeenCalled();
    expect(removePendingReportMock).toHaveBeenCalledWith('q1');
    expect(clearSurveyDraftMock).toHaveBeenCalled();
    expect(onSynced).toHaveBeenCalledWith(1);
  });
});