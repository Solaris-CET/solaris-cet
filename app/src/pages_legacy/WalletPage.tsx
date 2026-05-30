import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { ExternalLink, LogOut, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { CopyButton } from '@/components/CopyButton'
import { TokenStatsCard } from '@/components/TokenStatsCard'
import WalletBalance from '@/components/WalletBalance'
import WalletConnect from '@/components/WalletConnect'
import { CET_JETTON_MASTER_ADDRESS } from '@/constants/token'
import { useJwtSession } from '@/hooks/useJwtSession'
import { useTonDnsBackresolve } from '@/hooks/useTonDns'
import { useTonNetwork } from '@/hooks/useTonNetwork'

function shortAddress(a: string) {
  const s = a.trim()
  if (s.length <= 16) return s
  return `${s.slice(0, 6)}…${s.slice(-6)}`
}

export default function WalletPage() {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const { token, setToken } = useJwtSession()
  const { network, tonscanBaseUrl } = useTonNetwork()
  const address = wallet?.account?.address?.trim() ?? ''
  const { primary: dnsName } = useTonDnsBackresolve(address)

  const explorerHref = useMemo(() => {
    if (!address) return ''
    return `${tonscanBaseUrl}/${encodeURIComponent(address)}`
  }, [address, tonscanBaseUrl])

  const handleDisconnect = async () => {
    if (token) {
      try {
        await fetch('/api/auth', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      } catch {
        void 0
      }
    }
    setToken(null)
    try {
      await tonConnectUI.disconnect()
    } catch {
      void 0
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Wallet</h1>
            <p className="mt-2 text-white/70 text-sm">
              Rețea: <span className="font-mono">{network}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/auth"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Auth
            </a>
            <a
              href="/settings"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Setări
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/60 font-mono">Adresă</div>
                <div className="mt-1 text-white font-mono text-sm">
                  {dnsName ? dnsName : address ? shortAddress(address) : 'Neconectat'}
                </div>
                {dnsName && address ? (
                  <div className="mt-1 text-xs text-white/55 font-mono">{shortAddress(address)}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={address} ariaLabel="Copiază adresa" />
                <a
                  href={explorerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    address
                      ? 'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10'
                      : 'pointer-events-none opacity-50 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5'
                  }
                  aria-label="Deschide în TONScan"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden />
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                  onClick={() => void handleDisconnect()}
                  disabled={!wallet}
                >
                  <LogOut className="w-4 h-4" aria-hidden />
                  Disconnect
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <WalletBalance />
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                Refresh
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60 font-mono">Conectare</div>
            <div className="mt-2">
              <WalletConnect />
            </div>

            <div className="mt-6">
              <TokenStatsCard />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-white/60 font-mono">Contract CET</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-mono text-xs text-white break-all">{CET_JETTON_MASTER_ADDRESS}</div>
                <CopyButton text={CET_JETTON_MASTER_ADDRESS} ariaLabel="Copiază adresa contractului" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/defi" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                DeFi Lab
              </a>
              <a href="/nfts" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                NFT Gallery
              </a>
              <a href="/airdrop" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Airdrop
              </a>
              <a href="/tx-history" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Istoric
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
