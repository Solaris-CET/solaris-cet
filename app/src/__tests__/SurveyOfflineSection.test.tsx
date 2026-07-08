// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SurveyOfflineSection } from '@/admin/sections/SurveyOfflineSection';

const useAdminSessionMock = vi.fn();

vi.mock('@/admin/useAdminSession', () => ({
  useAdminSession: () => useAdminSessionMock(),
}));

describe('SurveyOfflineSection', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    useAdminSessionMock.mockReturnValue({ token: 'admin-tok' });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    useAdminSessionMock.mockReset();
  });

  it('renders manifest prefetch urls on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        manifest: {
          schema: 'solaris-survey-offline-v1',
          prefetch_urls: ['/api/survey/context', '/offline-shell'],
          queue_supported: true,
          indexeddb_schema: 'survey-queue-v1',
        },
      }),
    });

    render(<SurveyOfflineSection />);

    await waitFor(() => {
      expect(screen.getByText('solaris-survey-offline-v1')).toBeTruthy();
    });
    expect(screen.getByText('/api/survey/context')).toBeTruthy();
    expect(screen.getByText(/Coadă:\s*da/)).toBeTruthy();
  });

  it('shows API error message when manifest fetch fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Service unavailable' }),
    });

    render(<SurveyOfflineSection />);

    await waitFor(() => {
      expect(screen.getByText('Service unavailable')).toBeTruthy();
    });
  });

  it('reloads manifest when refresh is clicked', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        manifest: {
          schema: 'solaris-survey-offline-v1',
          prefetch_urls: ['/api/survey/context'],
          queue_supported: false,
          indexeddb_schema: 'survey-queue-v1',
        },
      }),
    });

    render(<SurveyOfflineSection />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Reîmprospătează manifestul offline' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});