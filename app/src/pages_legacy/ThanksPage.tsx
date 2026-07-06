import { CheckCircle2, Download, Mail } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import SocialShare from '@/components/SocialShare'
import { mktConversion } from '@/lib/marketing'

export default function ThanksPage() {
  const downloadHref = useMemo(() => '/lead-magnets/defi-ton-guide.md', [])

  useEffect(() => {
    mktConversion('Subscribe', { source: 'thanks' })
  }, [])

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-4xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Mulțumim!</h1>
        </div>
        <p className="mt-3 text-white/70 text-sm leading-relaxed">
          Dacă ai confirmat emailul, ești înscris. Dacă nu, verifică inbox-ul pentru mesajul de confirmare.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Download className="h-4 w-4 text-solaris-gold" /> Descarcă ghidul
            </div>
            <p className="mt-2 text-sm text-white/70">Lead magnet: DeFi pe TON (versiune text).</p>
            <div className="mt-4">
              <a href={downloadHref} className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold">
                Descarcă
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Mail className="h-4 w-4 text-solaris-cyan" /> Trimite la un prieten
            </div>
            <p className="mt-2 text-sm text-white/70">Ajută-ne să ajungem la oamenii potriviți.</p>
            <div className="mt-4">
              <SocialShare />
            </div>
          </div>

          <div className="text-sm text-white/70">
            <a href="/" className="underline underline-offset-4 hover:text-white">Înapoi acasă</a>
          </div>
        </div>
      </div>
    </main>
  )
}
