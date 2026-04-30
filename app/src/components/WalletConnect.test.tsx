import { render, waitFor } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import WalletConnect from './WalletConnect';

const sendTransactionMock = vi.fn(async () => undefined);

vi.mock('@tonconnect/ui-react', () => ({
  TonConnectButton: (props: Record<string, unknown>) => (
    <button type="button" data-testid="tonconnect-btn" {...props}>
      Connect
    </button>
  ),
  useTonConnectUI: () => [{ connected: true, sendTransaction: sendTransactionMock }],
  useTonWallet: () => ({ account: { address: 'EQ_TEST_ADDRESS' } }),
}));

describe('WalletConnect', () => {
  const fetchSnapshot = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = (vi.fn(async () => new Response(null, { status: 200 })) as unknown) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchSnapshot;
    vi.clearAllMocks();
  });

  it('renders TonConnect button and syncs wallet address to /api/auth', async () => {
    render(<WalletConnect />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as unknown[][];
    const urls = calls.map((c) => String(c[0] ?? ''));
    expect(urls.some((u) => u.startsWith('/api/auth/challenge?network='))).toBe(true);

    const verifyCall = calls.find((c) => String(c[0]) === '/api/auth/verify');
    expect(verifyCall).toBeTruthy();
    const init = (verifyCall?.[1] ?? {}) as { method?: unknown; body?: unknown };
    expect(init.method).toBe('POST');
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
    expect(body?.walletAddress).toBe('EQ_TEST_ADDRESS');
  });
});
