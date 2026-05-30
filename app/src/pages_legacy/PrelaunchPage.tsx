import { CalendarClock, Check, Download, Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/hooks/useLanguage'
import { mktConversion, mktEvent } from '@/lib/marketing'

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

export default function PrelaunchPage() {
  const { lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(true)
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })
  const downloadHref = useMemo(() => '/lead-magnets/defi-ton-guide.md', [])
  const utm = useMemo(() => parseUtmFromLocation(), [])

  useEffect(() => {
    mktEvent('lp_view', { lp: 'prelaunch' })
  }, [])

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
          utm: { ...(utm ?? {}), campaign: 'prelaunch' },
        }),
        cache: 'no-store',
      })
      if (!res.ok) {
        const txt = await res.text()
        setState({ kind: 'error', message: txt ? `Eroare: ${txt.slice(0, 140)}` : 'Eroare la înscriere.' })
        return
      }
      setState({ kind: 'sent' })
      mktConversion('Lead', { source: 'prelaunch', campaign: 'prelaunch' })
    } catch {
      setState({ kind: 'error', message: 'Rețea indisponibilă. Încearcă din nou.' })
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-5xl mx-auto w-full pt-24 pb-16">
        <h1 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight">Pre-lansare: înscriere + ghid gratuit</h1>
        <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-2xl">
          Primești confirmare email (double opt-in), apoi o secvență scurtă cu resurse: tokenizare pe TON, CET AI și cum să folosești airdrop/referrals.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-white font-semibold">Înscriere prin email</div>
          <div className="mt-4 grid gap-3">
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
                id="prelaunch-consent"
              />
              <label htmlFor="prelaunch-consent" className="text-xs text-white/70 leading-relaxed">
                Sunt de acord să primesc emailuri (resurse + update-uri produs). Unsubscribe oricând.
              </label>
            </div>

            {state.kind === 'sent' ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100 flex items-center gap-2">
                <Check className="h-4 w-4" /> Verifică inbox-ul pentru confirmare.
              </div>
            ) : (
              <Button
                onClick={() => void submit()}
                disabled={state.kind === 'submitting'}
                className="rounded-xl bg-solaris-gold text-solaris-dark font-semibold hover:bg-solaris-gold/90"
              >
                Înscrie-mă
              </Button>
            )}

            {state.kind === 'error' ? <div className="text-xs text-red-300/90">{state.message}</div> : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-white font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-solaris-gold" /> Lead magnet
            </div>
            <p className="mt-2 text-sm text-white/70">Ghid DeFi pe TON (versiune text). Poți înlocui cu PDF când e gata.</p>
            <div className="mt-4">
              <a href={downloadHref} className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                Descarcă <Arrow />
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-white font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-solaris-cyan" /> Webinarii + calendar
            </div>
            <p className="mt-2 text-sm text-white/70">Lista de evenimente + sync calendar (ICS) sunt integrate în platformă.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/evenimente" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                Vezi evenimente
              </a>
              <a href="/api/events/calendar" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                Sync calendar (ICS)
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a href="/thanks" className="text-sm text-white/70 hover:text-white underline underline-offset-4">
            Pagina de mulțumire
          </a>
        </div>
      </div>
    </main>
  )
}

function Arrow() {
  return <span aria-hidden>→</span>
}

