import { render, screen,waitFor } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import ContractPage from './ContractPage'

vi.mock('@/hooks/useTonNetwork', () => ({
  useTonNetwork: () => ({ network: 'mainnet', tonscanBaseUrl: 'https://tonscan.org', tonapiBaseUrl: 'https://tonapi.io', setNetwork: () => undefined }),
}))

describe('ContractPage', () => {
  const fetchSnapshot = globalThis.fetch

  beforeEach(() => {
    window.history.pushState({}, '', '/contract/EQ_CONTRACT_ADDR')
    globalThis.fetch = (vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('/api/ton/indexed-txs?')) {
        return new Response(
          JSON.stringify({
            ok: true,
            items: [{ txHash: 'TX_HASH_2', occurredAt: '2026-01-02T00:00:00.000Z', kind: 'contract' }],
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

  it('renders contract header and loads indexed transactions', async () => {
    render(<ContractPage />)
    expect(screen.getByText('Contract')).toBeTruthy()

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as unknown[][]
    const urls = calls.map((c) => String(c[0] ?? ''))
    expect(urls.some((u) => u.startsWith('/api/ton/indexed-txs?address=EQ_CONTRACT_ADDR'))).toBe(true)
    expect(screen.getByText('contract')).toBeTruthy()
  })
})

