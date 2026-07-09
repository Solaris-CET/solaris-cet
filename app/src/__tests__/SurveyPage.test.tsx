// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SurveyPage from '@/pages/SurveyPage';
import { SURVEY_PAGE_MESSAGES, SURVEY_PAGE_TITLE } from '@/lib/surveyPageHelpers';

const fetchSurveyHealthMock = vi.fn();
const fetchJurisdictionsMock = vi.fn();
const fetchSurveyDashboardMock = vi.fn();

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: <T,>(_key: string, defaultValue: T) => [defaultValue, vi.fn()] as const,
}));

vi.mock('@/hooks/useSurveyOfflineSync', () => ({
  useSurveyOfflineSync: () => ({
    online: true,
    draftSavedAt: null,
    draftReady: true,
    stats: { total: 0, pending: 0, failed: 0, oldestAt: null },
    syncing: false,
    draftConflicts: [],
    enqueueOffline: vi.fn(),
    syncPending: vi.fn(),
    refreshStats: vi.fn(),
    resolveDraftConflict: vi.fn(),
  }),
}));

vi.mock('@/lib/surveyApi', () => ({
  fetchSurveyHealth: (...args: unknown[]) => fetchSurveyHealthMock(...args),
  fetchJurisdictions: (...args: unknown[]) => fetchJurisdictionsMock(...args),
  fetchSurveyDashboard: (...args: unknown[]) => fetchSurveyDashboardMock(...args),
  fetchOrchestration: vi.fn(),
  generateDemoReport: vi.fn(),
  generateSurveyReport: vi.fn(),
  runSurveyBatch: vi.fn(),
  permitPackUrl: (id: string) => `/api/survey/permit-pack?report_id=${id}`,
  submitSurveyCorrection: vi.fn(),
  submitSurveyToCrm: vi.fn(),
}));

vi.mock('@/lib/surveyDraftStorage', () => ({
  clearSurveyDraft: vi.fn(),
  storedToPhotos: () => [],
}));

vi.mock('@/components/company/SolarisFooter', () => ({
  SolarisFooter: () => <footer data-testid="solaris-footer" />,
}));

vi.mock('@/components/survey/SurveyOfflinePanel', () => ({
  SurveyOfflinePanel: () => <div data-testid="survey-offline-panel" />,
}));

vi.mock('@/components/survey/TwinAgentPanel', () => ({
  TwinAgentPanel: () => null,
}));

vi.mock('@/components/survey/TwinRuntimePanel', () => ({
  TwinRuntimePanel: () => null,
}));

describe('SurveyPage', () => {
  beforeEach(() => {
    fetchSurveyHealthMock.mockResolvedValue({ engine: { ok: true, cost_budget: { alert: false, exceeded: false } } });
    fetchJurisdictionsMock.mockResolvedValue([]);
    fetchSurveyDashboardMock.mockResolvedValue(null);
    window.history.replaceState({}, '', '/survey');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders page title and survey tabs', () => {
    render(<SurveyPage />);

    expect(screen.getByRole('heading', { level: 1, name: SURVEY_PAGE_TITLE })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Raport nou' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Batch' })).toBeTruthy();
  });

  it('disables generate button until photos and client fields are ready', () => {
    render(<SurveyPage />);

    const generateBtn = screen.getByRole('button', { name: 'Generează raport PDF' });
    expect(generateBtn).toHaveProperty('disabled', true);
  });

  it('switches to dashboard tab', async () => {
    const user = userEvent.setup();
    render(<SurveyPage />);

    await user.click(screen.getByRole('tab', { name: 'Dashboard' }));
    expect(screen.getByText(/Dashboard indisponibil/)).toBeTruthy();
    expect(fetchSurveyDashboardMock).toHaveBeenCalled();
  });

  it('shows calculator prefill note from URL params', () => {
    window.history.replaceState({}, '', '/survey?from=calculator&judet=Cluj&consum=400&putere=6&roof=tigla');
    render(<SurveyPage />);

    expect(screen.getByText(SURVEY_PAGE_MESSAGES.calcPrefillNote)).toBeTruthy();
  });

  it('tablist exposes selected state for a11y', () => {
    render(<SurveyPage />);

    const tablist = screen.getByRole('tablist', { name: 'Secțiuni survey' });
    const reportTab = within(tablist).getByRole('tab', { name: 'Raport nou' });
    expect(reportTab.getAttribute('aria-selected')).toBe('true');
  });
});