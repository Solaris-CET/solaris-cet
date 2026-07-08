// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SurveyOfflinePanel } from '@/components/survey/SurveyOfflinePanel';

afterEach(() => {
  cleanup();
});

describe('SurveyOfflinePanel', () => {
  it('shows offline badge when navigator is offline', () => {
    render(
      <SurveyOfflinePanel
        online={false}
        draftSavedAt="2026-07-07T10:00:00.000Z"
        stats={{ total: 0, pending: 0, failed: 0, oldestAt: null }}
        syncing={false}
        onSync={() => void 0}
      />,
    );

    expect(screen.getByText(/Offline — draft salvat local/)).toBeTruthy();
    expect(screen.getByText(/Draft:/)).toBeTruthy();
  });

  it('shows queue summary and sync button when items are queued', async () => {
    const user = userEvent.setup();
    const onSync = vi.fn();

    render(
      <SurveyOfflinePanel
        online
        draftSavedAt={null}
        stats={{ total: 2, pending: 1, failed: 1, oldestAt: null }}
        syncing={false}
        onSync={onSync}
      />,
    );

    expect(screen.getByText(/2 raport\(e\) în coadă/)).toBeTruthy();
    expect(screen.getByText(/1 eșuate/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Sincronizează rapoartele din coada offline' }));
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('disables sync while offline or syncing', () => {
    const { rerender } = render(
      <SurveyOfflinePanel
        online={false}
        draftSavedAt={null}
        stats={{ total: 1, pending: 1, failed: 0, oldestAt: null }}
        syncing={false}
        onSync={() => void 0}
      />,
    );

    expect(screen.getByRole('button', { name: 'Sincronizează rapoartele din coada offline' })).toHaveProperty(
      'disabled',
      true,
    );

    rerender(
      <SurveyOfflinePanel
        online
        draftSavedAt={null}
        stats={{ total: 1, pending: 1, failed: 0, oldestAt: null }}
        syncing
        onSync={() => void 0}
      />,
    );

    expect(screen.getByRole('button', { name: 'Sincronizează rapoartele din coada offline' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});