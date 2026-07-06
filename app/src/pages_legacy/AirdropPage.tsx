import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTonNetwork } from '@/hooks/useTonNetwork'

type ProofResponse = {
  ok: boolean
  eligible: boolean
  wallet: string
  amountNanoCET?: string
  merkleRoot?: string
  proof?: string[]
  index?: number
  expiresAt?: string
  error?: string
}

export default function AirdropPage() {
  const wallet = useTonWallet()
  const address = wallet?.account?.address?.trim() ?? ''
  const [tonConnectUI] = useTonConnectUI()
  const { network, tonscanBaseUrl } = useTonNetwork()
  const [data, setData] = useState<ProofResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'prepared' | 'sent' | 'confirmed' | 'failed'>('idle')
  const sentAtSecRef = useRef<number | null>(null)

  useEffect(() => {
    if (!address) return
    let alive = true
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/airdrop/proof?wallet=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = (await res.json()) as ProofResponse
        if (!alive) return
        setData(json)
      } catch {
        if (!alive) return
        setData({ ok: false, eligible: false, wallet: address, error: 'unavailable' })
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [address, network])

  const expiresLabel = useMemo(() => {
    if (!data?.expiresAt) return null
    const d = new Date(data.expiresAt)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString()
  }, [data?.expiresAt])

  const handleClaim = async () => {
    if (!data?.eligible) return
    setStatus('prepared')
    setTxHash(null)

    try {
      const res = await fetch('/api/airdrop/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, network }),
      })
      const json = (await res.json()) as { ok?: unknown; to?: unknown; amountNanoTon?: unknown; payload?: unknown; error?: unknown }
      if (!res.ok || json.ok !== true) {
        setStatus('failed')
        return
      }
      const to = typeof json.to === 'string' ? json.to : ''
      const amount = typeof json.amountNanoTon === 'string' ? json.amountNanoTon : '0'
      const payload = typeof json.payload === 'string' ? json.payload : undefined
      if (!to) {
        setStatus('failed')
        return
      }

      setStatus('prepared')
      const sentAt = Math.floor(Date.now() / 1000)
      sentAtSecRef.current = sentAt
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{ address: to, amount, payload }],
      })
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  useEffect(() => {
    if (status !== 'sent') return
    if (!address) return
    const sentAt = sentAtSecRef.current
    if (!sentAt) return

    let alive = true
    const controller = new AbortController()
    const started = Date.now()
    const maxMs = 45_000

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/ton/txs?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}&type=all`,
          { cache: 'no-store', signal: controller.signal },
        )
        const json = (await res.json()) as { ok?: unknown; items?: unknown }
        if (!alive) return
        if (!res.ok || json.ok !== true || !Array.isArray(json.items)) return
        const items = json.items as Array<{ hash?: unknown; now?: unknown }>
        const hit = items.find((it) => {
          const now = typeof it.now === 'string' ? Number(it.now) : 0
          if (!Number.isFinite(now) || now <= 0) return false
          return now >= sentAt
        })
        if (hit && typeof hit.hash === 'string' && hit.hash) {
          setTxHash(hit.hash)
          setStatus('confirmed')
          return
        }
      } catch {
        void 0
      }
    }

    const id = window.setInterval(() => {
      if (!alive) return
      if (Date.now() - started > maxMs) {
        setStatus('failed')
        return
      }
      void poll()
    }, 3000)

    void poll()
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
    }
  }, [address, network, status])

  const txLink = useMemo(() => {
    if (!txHash) return null
    return `${tonscanBaseUrl}/tx/${encodeURIComponent(txHash)}`
  }, [tonscanBaseUrl, txHash])

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Airdrop Claim</h1>
            <p className="mt-2 text-white/70 text-sm">Verifică eligibilitatea și inițiază tranzacția de claim.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/wallet" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Wallet</a>
            <a href="/settings" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">Setări</a>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-xs text-white/60 font-mono">Wallet</div>
          <div className="mt-1 text-sm text-white font-mono break-all">{address ? address : 'Neconectat'}</div>
          <div className="mt-3 text-xs text-white/60">Rețea: <span className="font-mono">{network}</span></div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/60 font-mono">Eligibilitate</div>
              <div className="mt-2 text-sm text-white/80">
                {loading ? 'Verific…' : data?.ok ? (data.eligible ? 'Eligibil' : 'Neeligibil') : 'Indisponibil'}
              </div>
              {expiresLabel ? (
                <div className="mt-2 text-xs text-white/60">Expiră: <span className="font-mono">{expiresLabel}</span></div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {data?.ok && data.eligible ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-300" aria-hidden />
              ) : (
                <AlertCircle className="w-6 h-6 text-white/30" aria-hidden />
              )}
            </div>
          </div>

          {data?.ok && data.eligible ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-white/60 font-mono">Merkle</div>
              <div className="mt-2 text-[11px] font-mono text-white/70 break-all">Root: {data.merkleRoot ?? '—'}</div>
              <div className="mt-2 text-[11px] font-mono text-white/70">Proof elements: {Array.isArray(data.proof) ? data.proof.length : 0}</div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-50"
              onClick={() => void handleClaim()}
              disabled={!data?.ok || !data.eligible}
            >
              Claim
            </button>
            <div className="text-xs text-white/60 font-mono">Status: {status}</div>
            {txLink ? (
              <a href={txLink} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-200 underline">
                TONScan
              </a>
            ) : null}
          </div>

          {data?.error ? <div className="mt-4 text-sm text-white/70">Eroare: {data.error}</div> : null}
        </div>
      </div>
    </main>
  )
}
