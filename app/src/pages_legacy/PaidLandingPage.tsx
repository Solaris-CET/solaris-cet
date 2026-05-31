import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { ExitIntentOffer } from '@/components/ExitIntentOffer'
import { SocialProofToasts } from '@/components/SocialProofToasts'
import SocialShare from '@/components/SocialShare'
import WalletConnect from '@/components/WalletConnect'
import { usePresenceCount } from '@/hooks/usePresenceCount'
import { mktEvent } from '@/lib/marketing'

export default function PaidLandingPage() {
  const { count } = usePresenceCount(true)
  const downloadHref = useMemo(() => '/lead-magnets/defi-ton-guide.md', [])

  useEffect(() => {
    mktEvent('lp_view', { lp: 'paid' })
  }, [])

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-solaris-gold" />
              Landing pentru campanii plătite
            </div>
            <h1 className="mt-4 text-white text-3xl sm:text-4xl font-semibold tracking-tight">
              Solaris CET: RWA + AI pe TON, cu UX sigur și verificabil
            </h1>
            <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-xl">
              Conectează wallet-ul, testează CET AI și intră în fluxul de airdrop/referral. Evenimentele de conversie sunt configurate pentru retargeting.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/cet-ai" className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
                Deschide CET AI <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/airdrop" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                Vezi airdrop
              </a>
              <a href={downloadHref} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                Ghid gratuit (download)
              </a>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="h-4 w-4 text-solaris-cyan" /> Consent + tracking
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Pixel-urile se încarcă doar cu consimțământ marketing. Evenimentele de conversie sunt trimise fără PII.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Users className="h-4 w-4 text-solaris-gold" /> Live
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {typeof count === 'number' ? `${count} utilizatori conectați acum` : 'Contor live în curs de conectare…'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white font-semibold">Conectează wallet</div>
              <p className="mt-2 text-sm text-white/70">Autentificare prin TON proof + referral tracking.</p>
              <div className="mt-4">
                <WalletConnect />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white font-semibold">Trimite la un prieten</div>
              <p className="mt-2 text-sm text-white/70">Share rapid pe X/LinkedIn sau copiază link-ul.</p>
              <div className="mt-4">
                <SocialShare variant="compact" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExitIntentOffer enabled campaign="lp_paid_exit" downloadHref={downloadHref} thankYouHref="/thanks" />
      <SocialProofToasts enabled connectedCount={count} />
    </main>
  )
}
