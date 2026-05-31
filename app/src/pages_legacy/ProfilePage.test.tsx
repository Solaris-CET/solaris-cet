import { render, screen,waitFor } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import ProfilePage from './ProfilePage'

vi.mock('@tonconnect/ui-react', () => ({
  useTonWallet: () => ({ account: { address: 'EQ_WALLET_ADDRESS' } }),
}))

vi.mock('@/hooks/useJwtSession', () => ({
  useJwtSession: () => ({ token: 'jwt-test', isAuthenticated: true }),
}))

vi.mock('@/hooks/useTonNetwork', () => ({
  useTonNetwork: () => ({ network: 'mainnet', tonscanBaseUrl: 'https://tonscan.org', tonapiBaseUrl: 'https://tonapi.io', setNetwork: () => undefined }),
}))

describe('ProfilePage', () => {
  const fetchSnapshot = globalThis.fetch

  beforeEach(() => {
    window.history.pushState({}, '', '/profile/EQ_PROFILE_ADDR')
    globalThis.fetch = (vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/account/profile') {
        return new Response(
          JSON.stringify({
            ok: true,
            email: null,
            user: { walletAddress: 'EQ_PROFILE_ADDR', role: 'user' },
            preferences: { marketingNewsletter: false, priceAlertsEmail: true, pushEnabled: false },
            newsletter: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.startsWith('/api/ton/indexed-txs?')) {
        return new Response(
          JSON.stringify({
            ok: true,
            items: [{ txHash: 'TX_HASH_1', occurredAt: '2026-01-01T00:00:00.000Z', kind: 'transfer' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ ok: false }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }) as unknown) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = fetchSnapshot
    vi.clearAllMocks()
  })

  it('renders profile header and loads indexed transactions', async () => {
    render(<ProfilePage />)
    expect(screen.getByText('Profil')).toBeTruthy()

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as unknown[][]
    const urls = calls.map((c) => String(c[0] ?? ''))
    expect(urls.some((u) => u.startsWith('/api/ton/indexed-txs?address=EQ_PROFILE_ADDR'))).toBe(true)
    expect(screen.getByText('transfer')).toBeTruthy()
  })
})

