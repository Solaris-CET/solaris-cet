import { Globe2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { SocialProofToasts } from '@/components/SocialProofToasts'
import WalletConnect from '@/components/WalletConnect'
import { useLanguage } from '@/hooks/useLanguage'
import { usePresenceCount } from '@/hooks/usePresenceCount'
import { mktEvent } from '@/lib/marketing'

type Props = {
  countryCode: string
}

function countryName(locale: string, cc: string): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'region' })
    return dn.of(cc.toUpperCase()) || cc.toUpperCase()
  } catch {
    return cc.toUpperCase()
  }
}

export default function CountryLandingPage({ countryCode }: Props) {
  const { lang } = useLanguage()
  const { count } = usePresenceCount(true)
  const name = useMemo(() => countryName(lang, countryCode), [countryCode, lang])

  useEffect(() => {
    mktEvent('lp_view', { lp: 'country', country: countryCode.toUpperCase() })
  }, [countryCode])

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <Globe2 className="w-5 h-5 text-solaris-gold" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Solaris CET — {name}</h1>
        </div>
        <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-2xl">
          Landing localizat pe limbă ({lang.toUpperCase()}) pentru campanii țintite. Conținutul rămâne verificabil și consistent, iar tracking-ul respectă consimțământul.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-white font-semibold">Start rapid</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/lp/paid" className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold">CET AI landing</a>
              <a href="/prelaunch" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">Prelaunch</a>
              <a href="/airdrop" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">Airdrop</a>
            </div>
            <div className="mt-4 text-sm text-white/70">
              {typeof count === 'number' ? `${count} utilizatori conectați acum` : 'Contor live în curs de conectare…'}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-white font-semibold">Conectează wallet</div>
            <p className="mt-2 text-sm text-white/70">Autentificare prin TON proof.</p>
            <div className="mt-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>

      <SocialProofToasts enabled connectedCount={count} />
    </main>
  )
}

