import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { Copy, LogOut } from 'lucide-react'
import { useMemo, useState } from 'react'

import WalletConnect from '@/components/WalletConnect'
import { useJwtSession } from '@/hooks/useJwtSession'
import { useTonNetwork } from '@/hooks/useTonNetwork'

function shortAddress(a: string) {
  const s = a.trim()
  if (s.length <= 16) return s
  return `${s.slice(0, 6)}…${s.slice(-6)}`
}

export default function AuthPage() {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const { token, setToken, isAuthenticated } = useJwtSession()
  const { network } = useTonNetwork()
  const address = wallet?.account?.address?.trim() ?? ''
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const canCopy = useMemo(() => Boolean(address), [address])

  const handleCopy = async () => {
    if (!canCopy) return
    try {
      await navigator.clipboard.writeText(address)
      setMsg('Adresă copiată.')
    } catch {
      setMsg('Nu pot copia adresa în clipboard.')
    }
  }

  const handleLogout = async () => {
    if (!token) {
      try {
        await tonConnectUI.disconnect()
      } catch {
        void 0
      }
      setToken(null)
      return
    }

    setBusy(true)
    setMsg(null)
    try {
      await fetch('/api/auth', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    } catch {
      void 0
    } finally {
      setBusy(false)
      setToken(null)
      try {
        await tonConnectUI.disconnect()
      } catch {
        void 0
      }
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Autentificare</h1>
        <p className="mt-3 text-white/70 text-sm">
          Conectează wallet-ul și confirmă semnarea unei dovezi (ton_proof). Rețea: <span className="font-mono">{network}</span>.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-white/60 font-mono">Wallet</div>
                <div className="mt-1 text-white font-mono text-sm">{address ? shortAddress(address) : 'Neconectat'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={handleCopy}
                  disabled={!canCopy}
                  aria-label="Copiază adresa"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                  onClick={() => void handleLogout()}
                  disabled={busy}
                >
                  <LogOut className="w-4 h-4" aria-hidden />
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={isAuthenticated ? 'text-emerald-300 font-mono' : 'text-white/60 font-mono'}>
                {isAuthenticated ? 'JWT: activ' : 'JWT: inactiv'}
              </span>
              {msg ? <span className="text-white/60">{msg}</span> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/60 font-mono">Conectare</div>
            <div className="mt-2">
              <WalletConnect />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/wallet" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
              Mergi la Wallet
            </a>
            <a href="/settings" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Setări
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

