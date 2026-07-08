// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TwinFeedPanel } from '@/components/survey/TwinFeedPanel';
import type { TwinFeed } from '@/lib/twinFeed';

const fetchTwinFeedMock = vi.fn();

vi.mock('@/lib/surveyApi', () => ({
  fetchTwinFeed: (...args: unknown[]) => fetchTwinFeedMock(...args),
}));

const sampleFeed: TwinFeed = {
  schema: 'solaris-twin-feed-v1',
  feed_version: 2,
  generated_at: '2026-07-07T10:00:00.000Z',
  report_id: 'SOL-TWIN-1',
  site: {
    client_name: 'Client Test',
    city: 'Cluj-Napoca',
    latitude: 46.77,
    longitude: 23.59,
  },
  system: {
    capacity_kwp: 8,
    annual_kwh: 12000,
    suitability_score: 88,
    premium_tier: false,
  },
  low_confidence_count: 1,
  corrections_count: 2,
  corrections_recent: [],
};

describe('TwinFeedPanel', () => {
  beforeEach(() => {
    fetchTwinFeedMock.mockResolvedValue(sampleFeed);
  });

  afterEach(() => {
    cleanup();
    fetchTwinFeedMock.mockReset();
  });

  it('loads and displays twin feed summary', async () => {
    render(<TwinFeedPanel reportId="SOL-TWIN-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Client Test/)).toBeTruthy();
    });
    expect(screen.getByText(/8 kWp/)).toBeTruthy();
    expect(screen.getByText(/1 finding\(uri\) cu încredere scăzută/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Hartă Cluj-Napoca/ })).toHaveAttribute(
      'href',
      expect.stringContaining('openstreetmap.org'),
    );
    expect(fetchTwinFeedMock).toHaveBeenCalledWith('SOL-TWIN-1');
  });

  it('shows error when feed fetch fails', async () => {
    fetchTwinFeedMock.mockRejectedValue(new Error('Feed offline'));

    render(<TwinFeedPanel reportId="SOL-TWIN-1" />);

    await waitFor(() => {
      expect(screen.getByText('Feed offline')).toBeTruthy();
    });
  });

  it('reloads feed when refresh is clicked', async () => {
    const user = userEvent.setup();
    render(<TwinFeedPanel reportId="SOL-TWIN-1" />);

    await waitFor(() => expect(fetchTwinFeedMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Reîmprospătează feed-ul Digital Twin' }));

    await waitFor(() => expect(fetchTwinFeedMock).toHaveBeenCalledTimes(2));
  });
});