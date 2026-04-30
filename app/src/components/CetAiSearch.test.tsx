import { fireEvent,render, screen } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import CetAiSearch from './CetAiSearch';

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
}

describe('CetAiSearch', () => {
  const fetchSnapshot = globalThis.fetch;

  beforeEach(() => {
    setMatchMedia(true);
    localStorage.removeItem('cet-ai-chat-history');
    globalThis.fetch = (vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url === '/api/ai/ask') {
        return new Response(
          JSON.stringify({
            response:
              '[DIAGNOSTIC INTERN]\nReason.\n\n[DECODARE ORACOL]\nAct.\n\n[DIRECTIVĂ DE ACȚIUNE]\nObserve.',
            sources: [
              {
                id: 'SRC_001',
                title: 'TON Docs',
                url: 'https://docs.ton.org/',
                snippet: 'TON documentation entry point.',
              },
            ],
            modelUsed: 'gemini',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cet-Ai-Source': 'live' },
          },
        );
      }
      return new Response(null, { status: 404 });
    }) as unknown) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchSnapshot;
    vi.clearAllMocks();
  });

  it('submits to /api/ai/ask and renders the live response + sources list', async () => {
    render(<CetAiSearch />);
    const input = screen.getByTestId('cet-ai-hero-query');
    fireEvent.change(input, { target: { value: 'Explain RAV.' } });
    fireEvent.submit(input.closest('form')!);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/ai/ask',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );

    expect(await screen.findByText('Reason.', {}, { timeout: 4000 })).toBeInTheDocument();
    const sources = await screen.findByTestId('cet-ai-sources', {}, { timeout: 4000 });
    expect(sources).toBeInTheDocument();
    expect(screen.getByText('TON Docs')).toBeInTheDocument();
  });
});
