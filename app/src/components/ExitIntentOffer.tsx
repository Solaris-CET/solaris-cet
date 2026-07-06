import { Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription,DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/hooks/useLanguage'
import { mktConversion, mktEvent } from '@/lib/marketing'

type Props = {
  enabled: boolean
  campaign: string
  downloadHref: string
  thankYouHref: string
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string }

function parseUtmFromLocation(): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'li_fat_id']
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = url.searchParams.get(k)
    if (v && v.trim()) out[k] = v.trim()
  }
  return Object.keys(out).length ? out : null
}

export function ExitIntentOffer({ enabled, campaign, downloadHref, thankYouHref }: Props) {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(true)
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  const utm = useMemo(() => parseUtmFromLocation(), [])

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    const key = `solaris_exit_offer_seen:${campaign}`
    const isSeen = (() => {
      try {
        return sessionStorage.getItem(key) === '1'
      } catch {
        return false
      }
    })()
    if (isSeen) return

    const onLeave = (e: MouseEvent) => {
      if (!enabled) return
      if (open) return
      const y = typeof e.clientY === 'number' ? e.clientY : 999
      if (y > 0) return
      try {
        sessionStorage.setItem(key, '1')
      } catch {
        void 0
      }
      setOpen(true)
      mktEvent('exit_intent_shown', { campaign })
    }

    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [campaign, enabled, open])

  const submit = async () => {
    const e = email.trim()
    if (!consent) {
      setState({ kind: 'error', message: 'Confirmă consimțământul pentru email.' })
      return
    }
    if (!e || !e.includes('@')) {
      setState({ kind: 'error', message: 'Email invalid.' })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/marketing/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          locale: lang,
          consent: true,
          newsletter: true,
          pageUrl: typeof window === 'undefined' ? null : window.location.href,
          utm: { ...(utm ?? {}), campaign },
        }),
        cache: 'no-store',
      })
      if (!res.ok) {
        const txt = await res.text()
        setState({ kind: 'error', message: txt ? `Eroare: ${txt.slice(0, 140)}` : 'Eroare la trimitere.' })
        return
      }
      setState({ kind: 'sent' })
      mktConversion('Lead', { source: 'exit_intent', campaign })
    } catch {
      setState({ kind: 'error', message: 'Rețea indisponibilă. Încearcă din nou.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogContent className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Ghid gratuit: DeFi pe TON</DialogTitle>
          <DialogDescription className="text-white/70">
            Îți trimitem un email de confirmare (double opt-in), apoi primești link-ul de descărcare.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state.kind !== 'idle') setState({ kind: 'idle' })
              }}
              placeholder="email@exemplu.com"
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-white/40"
              inputMode="email"
              autoComplete="email"
              disabled={state.kind === 'submitting' || state.kind === 'sent'}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              checked={consent}
              onCheckedChange={(v: boolean | 'indeterminate') => {
                setConsent(Boolean(v))
                if (state.kind !== 'idle') setState({ kind: 'idle' })
              }}
              id={`exit-offer-consent-${campaign}`}
            />
            <label htmlFor={`exit-offer-consent-${campaign}`} className="text-xs text-white/70 leading-relaxed">
              Sunt de acord să primesc emailuri despre produs și resurse educaționale.
            </label>
          </div>

          {state.kind === 'sent' ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Trimitem emailul de confirmare. Între timp, poți descărca ghidul.
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={downloadHref} className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold">
                  Descarcă ghidul
                </a>
                <a href={thankYouHref} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                  Pagina de mulțumire
                </a>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => void submit()}
              disabled={state.kind === 'submitting'}
              className="rounded-xl bg-solaris-gold text-solaris-dark font-semibold hover:bg-solaris-gold/90"
            >
              Trimite
            </Button>
          )}

          {state.kind === 'error' ? <div className="text-xs text-red-300/90">{state.message}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

