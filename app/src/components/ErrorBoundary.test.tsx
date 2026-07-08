import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
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
    expect(screen.getByRole('link', { name: /pagina principală/i })).toHaveAttribute('href', '/');
  });

  it('offers reload control after an error', () => {
    function Boom(): ReactElement {
      throw new Error('flaky');
    }

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /reîncarcă pagina/i })).toBeInTheDocument();
  });
});