// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TwinRuntimePanel } from '@/components/survey/TwinRuntimePanel';
import type { TwinFeed } from '@/lib/twinFeed';
import type { TwinEvent } from '@/lib/twinRuntime';

const useTwinStreamMock = vi.fn();
const reconnectMock = vi.fn();

const sampleFeed: TwinFeed = {
  schema: 'solaris-twin-feed-v1',
  feed_version: 1,
  generated_at: '2026-07-07T10:00:00.000Z',
  report_id: 'SOL-RUN-1',
  site: {
    client_name: 'Client Runtime',
    city: 'Brașov',
    latitude: 45.65,
    longitude: 25.61,
  },
  system: {
    capacity_kwp: 10,
    annual_kwh: 14000,
    suitability_score: 91,
    premium_tier: true,
  },
  low_confidence_count: 0,
  corrections_count: 0,
  corrections_recent: [],
};

const sampleEvents: TwinEvent[] = [
  {
    schema: 'solaris-twin-event-v1',
    runtime_version: 1,
    event_id: 'ev-1',
    report_id: 'SOL-RUN-1',
    event_type: 'twin_ready',
    payload: {},
    timestamp: '2026-07-07T10:05:00.000Z',
  },
];

vi.mock('@/hooks/useTwinStream', () => ({
  useTwinStream: (...args: unknown[]) => useTwinStreamMock(...args),
}));

vi.mock('@/components/survey/Twin3DViewer', () => ({
  Twin3DViewer: () => <div data-testid="twin-3d-view">3D</div>,
}));

vi.mock('@/components/survey/TwinMapViewer', () => ({
  TwinMapViewer: () => <div data-testid="twin-map-view">Map</div>,
}));

describe('TwinRuntimePanel', () => {
  beforeEach(() => {
    useTwinStreamMock.mockReturnValue({
      feed: null,
      events: [],
      ready: false,
      connected: false,
      heartbeats: 0,
      error: '',
      loading: false,
      reconnect: reconnectMock,
    });
  });

  afterEach(() => {
    cleanup();
    useTwinStreamMock.mockReset();
    reconnectMock.mockReset();
  });

  it('shows loading message while stream has no feed', () => {
    render(<TwinRuntimePanel reportId="SOL-RUN-1" />);
    expect(screen.getByText(/Se încarcă stream SSE persistent/)).toBeTruthy();
    expect(useTwinStreamMock).toHaveBeenCalledWith('SOL-RUN-1');
  });

  it('renders 3D view and feed summary when connected', () => {
    useTwinStreamMock.mockReturnValue({
      feed: sampleFeed,
      events: sampleEvents,
      ready: true,
      connected: true,
      heartbeats: 2,
      error: '',
      loading: false,
      reconnect: reconnectMock,
    });

    render(<TwinRuntimePanel reportId="SOL-RUN-1" />);

    expect(screen.getByTestId('twin-3d-view')).toBeTruthy();
    expect(screen.getByText(/Client Runtime/)).toBeTruthy();
    expect(screen.getByText(/10 kWp/)).toBeTruthy();
    expect(screen.getByText(/twin_ready/)).toBeTruthy();
  });

  it('switches to map view and reconnects stream', async () => {
    const user = userEvent.setup();
    useTwinStreamMock.mockReturnValue({
      feed: sampleFeed,
      events: [],
      ready: true,
      connected: true,
      heartbeats: 1,
      error: '',
      loading: false,
      reconnect: reconnectMock,
    });

    render(<TwinRuntimePanel reportId="SOL-RUN-1" />);

    await user.click(screen.getByRole('button', { name: 'Afișează harta site-ului' }));
    expect(screen.getByTestId('twin-map-view')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Reconectează stream-ul Twin runtime' }));
    expect(reconnectMock).toHaveBeenCalledTimes(1);
  });
});