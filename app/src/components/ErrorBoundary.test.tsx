import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('../hooks/useLanguage', () => ({
  getActiveLangSync: () => 'en',
}));

describe('ErrorBoundary', () => {
  it('renders fallback UI when child throws', () => {
    function Boom(): ReactElement {
      throw new Error('boom');
    }

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    const sovereign = document.querySelector('a[href="/sovereign/"]');
    expect(sovereign).not.toBeNull();
  });

  it('retries in-place', async () => {
    let shouldThrow = true;

    function Flaky() {
      if (shouldThrow) {
        throw new Error('flaky');
      }
      return <div>ok</div>;
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );

    const retry = screen.getByRole('button', { name: /try again/i });
    shouldThrow = false;
    retry.click();
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });
});
